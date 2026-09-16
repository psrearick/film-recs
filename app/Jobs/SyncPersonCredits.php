<?php

namespace App\Jobs;

use App\Actions\Tmdb\GetMovie;
use App\Actions\Tmdb\GetSeries;
use App\Models\Person;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Throwable;

class SyncPersonCredits implements ShouldQueue
{
    use Queueable;

    /**
     * @param  array<int, int>  $movieIds
     * @param  array<int, int>  $tvIds
     */
    public function __construct(private int $personId, private array $movieIds, private array $tvIds) {}

    /**
     * Execute the job.
     */
    public function handle(GetMovie $getMovie, GetSeries $getSeries): void
    {
        $failed = false;

        foreach ($this->tvIds as $tvId) {
            try {
                $getSeries->get($tvId);
            } catch (Throwable $e) {
                $failed = true;

                Log::warning('Failed to sync tv credit for person', [
                    'person_id' => $this->personId,
                    'tv_id' => $tvId,
                    'exception' => $e,
                ]);
            }
        }

        foreach ($this->movieIds as $movieId) {
            try {
                $getMovie->get($movieId);
            } catch (Throwable $e) {
                $failed = true;

                Log::warning('Failed to sync movie credit for person', [
                    'person_id' => $this->personId,
                    'movie_id' => $movieId,
                    'exception' => $e,
                ]);
            }
        }

        if (! $failed) {
            Person::whereKey($this->personId)->update(['credits_fetched_at' => now()]);
        }
    }
}
