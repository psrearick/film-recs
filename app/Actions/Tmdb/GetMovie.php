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

readonly class GetMovie
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
        $movie = Title::query()->where('tmdb_id', $id)->where('type', TitleType::Movie)->first();

        if (! $movie || $movie->is_stale) {
            $movie = $this->fetchAndSyncMovie($id, $movie);
        }

        return $movie?->load(['genres', 'keywords', 'actors', 'directors', 'producers', 'composers', 'watchProviders']);
    }

    /**
     * Fetch and sync the movie from TMDB even if the local copy is not stale.
     *
     * @throws Throwable
     */
    public function refresh(int $id): ?Title
    {
        $movie = Title::query()->where('tmdb_id', $id)->where('type', TitleType::Movie)->first();

        return $this->fetchAndSyncMovie($id, $movie);
    }

    /**
     * @throws Throwable
     */
    private function fetchAndSyncMovie(int $id, ?Title $movie): ?Title
    {
        try {
            $data = $this->tmdb->movie($id);
        } catch (RequestException $e) {
            if ($e->response->status() === 404) {
                return $movie;
            }

            throw $e;
        }

        if (! is_int($data->get('id'))) {
            return $movie;
        }

        $providersData = $this->tmdb->movieProviders($id);

        return DB::transaction(function () use ($data, $providersData, $movie) {
            $movie = $this->saveMovie($data, $movie);

            $this->syncTitleGenres->sync($movie, $data->get('genres'));
            $this->syncTitleCredits->sync($movie, $data->get('credits'));
            $this->syncTitleKeywords->sync($movie, $data->get('keywords'));
            $this->syncTitleWatchProviders->sync($movie, $providersData);

            return $movie;
        });
    }

    /**
     * @param  Collection<string, mixed>  $data
     */
    private function saveMovie(Collection $data, ?Title $movie): Title
    {
        $attributes = [
            'tmdb_id' => $data->get('id'),
            'type' => TitleType::Movie,
            'name' => $data->get('title'),
            'release_year' => $this->releaseYear($data->get('release_date')),
            'overview' => $data->get('overview'),
            'poster_path' => $data->get('poster_path'),
            'runtime' => $data->get('runtime'),
            'popularity' => $data->get('popularity'),
            'vote_average' => $data->get('vote_average'),
            'metadata_fetched_at' => now(),
        ];

        if ($movie) {
            $movie->update($attributes);

            return $movie;
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
