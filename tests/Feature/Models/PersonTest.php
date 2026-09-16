<?php

use App\Models\Person;
use App\Models\Title;

test('titles returns the titles a person is credited on', function () {
    $person = Person::factory()->create();
    $title = Title::factory()->create();
    $title->people()->attach($person->id, ['credit_type' => 'cast', 'character' => 'Neo']);

    expect($person->titles()->pluck('id')->all())->toBe([$title->id]);
});

test('is_stale is true when credits have never been fetched', function () {
    $person = Person::factory()->create(['credits_fetched_at' => null]);

    expect($person->is_stale)->toBeTrue();
});

test('is_stale is true once the metadata ttl has passed', function () {
    $ttlDays = config('services.tmdb.metadata_ttl_days', 30);

    $person = Person::factory()->create([
        'credits_fetched_at' => now()->subDays($ttlDays + 1),
    ]);

    expect($person->is_stale)->toBeTrue();
});

test('is_stale is false while credits are within the metadata ttl', function () {
    $person = Person::factory()->create(['credits_fetched_at' => now()]);

    expect($person->is_stale)->toBeFalse();
});
