<?php

namespace App\Observers;

use App\Jobs\UpdateAttributeAffinities;
use App\Models\Rating;
use Illuminate\Contracts\Events\ShouldHandleEventsAfterCommit;

class RatingObserver implements ShouldHandleEventsAfterCommit
{
    public function created(Rating $rating): void
    {
        UpdateAttributeAffinities::dispatch($rating->user_id);
    }

    public function updated(Rating $rating): void
    {
        if (! $rating->wasChanged('score')) {
            return;
        }

        UpdateAttributeAffinities::dispatch($rating->user_id);
    }

    public function deleted(Rating $rating): void
    {
        UpdateAttributeAffinities::dispatch($rating->user_id);
    }
}
