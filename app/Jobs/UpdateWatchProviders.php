<?php

namespace App\Jobs;

use App\Actions\Tmdb\GetAllMovieProviders;
use App\Actions\Tmdb\GetAllSeriesProviders;
use App\Models\WatchProvider;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Http\Client\ConnectionException;

class UpdateWatchProviders implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new job instance.
     */
    public function __construct()
    {
        //
    }

    /**
     * @throws ConnectionException
     */
    public function handle(GetAllMovieProviders $getAllMovieProviders, GetAllSeriesProviders $getAllSeriesProviders): void
    {
        $movieProviders = $getAllMovieProviders->get();
        $seriesProviders = $getAllSeriesProviders->get();

        $providers = collect([...$movieProviders, ...$seriesProviders])->unique('tmdb_id')->toArray();

        WatchProvider::upsert($providers, uniqueBy: ['tmdb_id'], update: ['name', 'logo_path']);
    }
}
