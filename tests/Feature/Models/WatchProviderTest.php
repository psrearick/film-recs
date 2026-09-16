<?php

use App\Enums\AccessType;
use App\Models\Title;
use App\Models\User;
use App\Models\WatchProvider;

test('titles returns the titles offering the watch provider', function () {
    $provider = WatchProvider::factory()->create();
    $title = Title::factory()->create();

    $title->watchProviders()->attach($provider, [
        'region' => 'US',
        'access_type' => AccessType::Subscription,
        'fetched_at' => now(),
    ]);

    $related = $provider->titles()->first();

    expect($related->id)->toBe($title->id);
    expect($related->pivot->region)->toBe('US');
});

test('users returns the users who selected the watch provider', function () {
    $provider = WatchProvider::factory()->create();
    $user = User::factory()->create();
    $user->watchProviders()->attach($provider);

    expect($provider->users()->pluck('id')->all())->toBe([$user->id]);
});
