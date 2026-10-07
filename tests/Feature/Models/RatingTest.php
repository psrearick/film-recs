<?php

use App\Jobs\UpdateAttributeAffinities;
use App\Models\Rating;
use App\Models\Title;
use App\Models\User;
use Illuminate\Support\Facades\Queue;

beforeEach(function () {
    Queue::fake([UpdateAttributeAffinities::class]);
});

test('score is cast to an integer', function () {
    $rating = Rating::factory()->create(['score' => '9']);

    expect($rating->score)->toBeInt()->toBe(9);
});

test('user returns the user who made the rating', function () {
    $user = User::factory()->create();
    $rating = Rating::factory()->for($user)->create();

    expect($rating->user->id)->toBe($user->id);
});

test('title returns the rated title', function () {
    $title = Title::factory()->create();
    $rating = Rating::factory()->for($title)->create();

    expect($rating->title->id)->toBe($title->id);
});
