<?php

use App\Jobs\UpdateAttributeAffinities;
use App\Models\Rating;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Queue;

test('creating a rating queues an affinity recompute for the rating\'s user', function () {
    $user = User::factory()->create();
    Queue::fake([UpdateAttributeAffinities::class]);

    Rating::factory()->for($user)->create();

    Queue::assertPushed(
        UpdateAttributeAffinities::class,
        fn (UpdateAttributeAffinities $job) => $job->userId === $user->id,
    );
});

test('changing a rating\'s score queues an affinity recompute', function () {
    $rating = Rating::factory()->create(['score' => 4]);
    Queue::fake([UpdateAttributeAffinities::class]);

    $rating->update(['score' => 9]);

    Queue::assertPushed(
        UpdateAttributeAffinities::class,
        fn (UpdateAttributeAffinities $job) => $job->userId === $rating->user_id,
    );
});

test('saving a rating without changing its score does not queue an affinity recompute', function () {
    $rating = Rating::factory()->create(['score' => 7]);
    Queue::fake([UpdateAttributeAffinities::class]);

    $rating->update(['score' => 7]);

    Queue::assertNotPushed(UpdateAttributeAffinities::class);
});

test('deleting a rating queues an affinity recompute', function () {
    $rating = Rating::factory()->create();
    Queue::fake([UpdateAttributeAffinities::class]);

    $rating->delete();

    Queue::assertPushed(
        UpdateAttributeAffinities::class,
        fn (UpdateAttributeAffinities $job) => $job->userId === $rating->user_id,
    );
});

test('a rating saved in a rolled back transaction does not queue an affinity recompute', function () {
    $user = User::factory()->create();
    Queue::fake([UpdateAttributeAffinities::class]);

    try {
        DB::transaction(function () use ($user) {
            Rating::factory()->for($user)->create();

            throw new RuntimeException('Roll back');
        });
    } catch (RuntimeException) {
        //
    }

    Queue::assertNotPushed(UpdateAttributeAffinities::class);
});
