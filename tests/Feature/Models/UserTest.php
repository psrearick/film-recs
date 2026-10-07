<?php

use App\Jobs\UpdateAttributeAffinities;
use App\Models\Rating;
use App\Models\Title;
use App\Models\User;
use App\Models\WatchProvider;
use Illuminate\Support\Facades\Queue;

beforeEach(function () {
    Queue::fake([UpdateAttributeAffinities::class]);
});

test('ratings returns the ratings a user has made', function () {
    $user = User::factory()->create();
    $rating = Rating::factory()->for($user)->create();

    expect($user->ratings()->pluck('id')->all())->toBe([$rating->id]);
});

test('titles returns the rated titles with the pivot score', function () {
    $user = User::factory()->create();
    $title = Title::factory()->create();
    Rating::factory()->for($user)->for($title)->create(['score' => 7]);

    $rated = $user->titles()->first();

    expect($rated->id)->toBe($title->id);
    expect($rated->pivot->score)->toBe(7);
});

test('watchProviders returns the providers a user has selected', function () {
    $user = User::factory()->create();
    $provider = WatchProvider::factory()->create();
    $user->watchProviders()->attach($provider);

    expect($user->watchProviders()->pluck('id')->all())->toBe([$provider->id]);
});
