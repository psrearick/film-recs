<?php

use App\Models\Rating;
use App\Models\Title;
use App\Models\User;

test('a guest is redirected to login', function () {
    $response = $this->get(route('ratings'));

    $response->assertRedirect(route('login'));
});

test('an authenticated user sees their rating along with the title', function () {
    $user = User::factory()->create();
    $title = Title::factory()->create(['name' => 'The Matrix']);
    $rating = Rating::factory()->for($title)->for($user)->create(['score' => 8]);

    $response = $this->actingAs($user)->get(route('ratings'));

    $response->assertInertia(fn ($page) => $page
        ->component('ratings')
        ->has('ratings', 1)
        ->where('ratings.0.id', $rating->id)
        ->where('ratings.0.score', 8)
        ->where('ratings.0.title.id', $title->id)
        ->where('ratings.0.title.name', 'The Matrix'));
});

test('ratings are ordered from most to least recently rated', function () {
    $user = User::factory()->create();
    $older = Rating::factory()->for($user)->create(['created_at' => now()->subDay()]);
    $newer = Rating::factory()->for($user)->create(['created_at' => now()]);

    $response = $this->actingAs($user)->get(route('ratings'));

    $response->assertInertia(fn ($page) => $page
        ->where('ratings.0.id', $newer->id)
        ->where('ratings.1.id', $older->id));
});

test('a user does not see another user\'s ratings', function () {
    $user = User::factory()->create();
    $otherUser = User::factory()->create();
    Rating::factory()->for($otherUser)->create();

    $response = $this->actingAs($user)->get(route('ratings'));

    $response->assertInertia(fn ($page) => $page->has('ratings', 0));
});
