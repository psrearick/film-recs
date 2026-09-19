<?php

use App\Models\Rating;
use App\Models\Title;
use App\Models\User;

test('user rating is null for a guest', function () {
    $title = Title::factory()->create();
    Rating::factory()->for($title)->create();

    expect($title->user_rating)->toBeNull();
});

test('user rating is null when the authenticated user has not rated the title', function () {
    $title = Title::factory()->create();
    $user = User::factory()->create();

    $this->actingAs($user);

    expect($title->user_rating)->toBeNull();
});

test('user rating returns the authenticated user\'s score for the title', function () {
    $title = Title::factory()->create();
    $user = User::factory()->create();
    Rating::factory()->for($title)->for($user)->create(['score' => 7]);

    $this->actingAs($user);

    expect($title->user_rating)->toBe(7);
});

test('user rating ignores other users\' scores for the title', function () {
    $title = Title::factory()->create();
    $user = User::factory()->create();
    $otherUser = User::factory()->create();
    Rating::factory()->for($title)->for($otherUser)->create(['score' => 3]);

    $this->actingAs($user);

    expect($title->user_rating)->toBeNull();
});
