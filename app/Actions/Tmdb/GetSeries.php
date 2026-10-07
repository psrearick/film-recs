<?php

namespace App\Actions\Tmdb;

use App\Actions\SyncTitleCredits;
use App\Actions\SyncTitleGenres;
use App\Actions\SyncTitleKeywords;
use App\Actions\SyncTitleWatchProviders;
use App\Enums\TitleType;
use App\Integrations\TmdbClient;
use App\Models\Title;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Throwable;

readonly class GetSeries
{
    public function __construct(
        private TmdbClient $tmdb,
        private SyncTitleGenres $syncTitleGenres,
        private SyncTitleCredits $syncTitleCredits,
        private SyncTitleKeywords $syncTitleKeywords,
        private SyncTitleWatchProviders $syncTitleWatchProviders
    ) {}

    /**
     * @throws Throwable
     */
    public function get(int $id): ?Title
    {
        $series = Title::query()->where('tmdb_id', $id)->where('type', TitleType::Tv)->first();

        if (! $series || $series->is_stale) {
            $series = $this->fetchAndSyncSeries($id, $series);
        }

        return $series?->load(['genres', 'keywords', 'actors', 'directors', 'producers', 'composers', 'watchProviders']);
    }

    /**
     * Fetch and sync the series from TMDB even if the local copy is not stale.
     *
     * @throws Throwable
     */
    public function refresh(int $id): ?Title
    {
        $series = Title::query()->where('tmdb_id', $id)->where('type', TitleType::Tv)->first();

        return $this->fetchAndSyncSeries($id, $series);
    }

    /**
     * @throws Throwable
     */
    private function fetchAndSyncSeries(int $id, ?Title $series): ?Title
    {
        try {
            $data = $this->tmdb->series($id);
        } catch (RequestException $e) {
            if ($e->response->status() === 404) {
                return $series;
            }

            throw $e;
        }

        if (! is_int($data->get('id'))) {
            return $series;
        }

        $providersData = $this->tmdb->seriesProviders($id);

        return DB::transaction(function () use ($data, $providersData, $series) {
            $series = $this->saveSeries($data, $series);

            $this->syncTitleGenres->sync($series, $data->get('genres'));
            $this->syncTitleCredits->sync($series, $data->get('aggregate_credits'));
            $this->syncTitleKeywords->sync($series, $data->get('keywords'));
            $this->syncTitleWatchProviders->sync($series, $providersData);

            return $series;
        });
    }

    /**
     * @param  Collection<string, mixed>  $data
     */
    private function saveSeries(Collection $data, ?Title $series): Title
    {
        $attributes = [
            'tmdb_id' => $data->get('id'),
            'type' => TitleType::Tv,
            'name' => $data->get('name'),
            'release_year' => $this->releaseYear($data->get('first_air_date')),
            'overview' => $data->get('overview'),
            'poster_path' => $data->get('poster_path'),
            'episode_count' => $data->get('number_of_episodes'),
            'popularity' => $data->get('popularity'),
            'vote_average' => $data->get('vote_average'),
            'metadata_fetched_at' => now(),
        ];

        if ($series) {
            $series->update($attributes);

            return $series;
        }

        return Title::create($attributes);
    }

    private function releaseYear(mixed $releaseDate): ?int
    {
        if (! is_string($releaseDate) || $releaseDate === '') {
            return null;
        }

        return (int) explode('-', $releaseDate)[0];
    }
}
