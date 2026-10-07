<?php

namespace App\Console\Commands;

use App\Actions\Tmdb\GetMovie;
use App\Actions\Tmdb\GetSeries;
use App\Enums\TitleType;
use App\Jobs\UpdateAttributeAffinities;
use App\Models\Title;
use App\Models\User;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Throwable;

#[Signature('titles:refresh-rated')]
#[Description('Re-sync every rated title from TMDB, then recompute the affinities of every user with ratings')]
class RefreshRatedTitlesCommand extends Command
{
    public function handle(GetMovie $getMovie, GetSeries $getSeries): int
    {
        $titles = Title::query()->whereHas('ratings')->get(['id', 'tmdb_id', 'type']);
        $failedTitleCount = 0;

        $this->withProgressBar($titles, function (Title $title) use ($getMovie, $getSeries, &$failedTitleCount) {
            try {
                match ($title->type) {
                    TitleType::Movie => $getMovie->refresh($title->tmdb_id),
                    TitleType::Tv => $getSeries->refresh($title->tmdb_id),
                };
            } catch (Throwable $exception) {
                report($exception);
                $failedTitleCount++;
            }
        });

        $this->newLine();

        User::query()->whereHas('ratings')->lazyById()->each(
            fn (User $user) => UpdateAttributeAffinities::dispatch($user->id),
        );

        if ($failedTitleCount > 0) {
            $this->error("Failed to refresh {$failedTitleCount} of {$titles->count()} titles.");

            return self::FAILURE;
        }

        $this->info("Refreshed {$titles->count()} titles.");

        return self::SUCCESS;
    }
}
