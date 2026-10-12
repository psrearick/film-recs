<?php

namespace App\Jobs;

use App\Actions\Tmdb\GetMovie;
use App\Actions\Tmdb\GetPopularMovies;
use App\Actions\Tmdb\GetPopularSeries;
use App\Actions\Tmdb\GetSeries;
use App\Models\GenericPoolTitle;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\DB;
use Throwable;

class FetchGenericCandidatePool implements ShouldQueue
{
    use Queueable;

    private const int PAGES = 5;

    /**
     * The first run syncs every popular title from TMDB, which takes far longer than
     * the default timeout. Must stay below the queue connection's retry_after.
     */
    public int $timeout = 600;

    /**
     * Sync every popular title before touching the pool, so the pool is only replaced
     * once all of them were fetched and is never left empty by a failed run.
     *
     * @throws Throwable
     */
    public function handle(GetPopularSeries $getPopularSeries, GetPopularMovies $getPopularMovies, GetMovie $getMovie, GetSeries $getSeries): void
    {
        $titleIds = collect();

        for ($page = 1; $page <= self::PAGES; $page++) {
            foreach ($getPopularMovies->get($page) as $movieData) {
                $titleIds->push($this->syncedTitleId($getMovie, $movieData['tmdb_id']));
            }

            foreach ($getPopularSeries->get($page) as $seriesData) {
                $titleIds->push($this->syncedTitleId($getSeries, $seriesData['tmdb_id']));
            }
        }

        $poolTitles = $titleIds->filter()->unique()->map(fn (int $titleId): array => ['title_id' => $titleId])->values()->all();

        DB::transaction(function () use ($poolTitles) {
            GenericPoolTitle::query()->delete();
            GenericPoolTitle::query()->insert($poolTitles);
        });
    }

    /**
     * @throws Throwable
     */
    private function syncedTitleId(GetMovie|GetSeries $getTitle, mixed $tmdbId): ?int
    {
        return is_int($tmdbId) ? $getTitle->get($tmdbId)?->id : null;
    }
}
