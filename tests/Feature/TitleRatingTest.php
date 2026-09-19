<?php

use App\Models\Rating;
use App\Models\Title;
use App\Models\User;

test('a guest cannot submit a rating', function () {
    $title = Title::factory()->create();

    $response = $this->post(route('rating', $title), ['score' => 8]);

    $response->assertRedirect(route('login'));
    expect(Rating::query()->count())->toBe(0);
});

test('an authenticated user can rate a title', function () {
    $title = Title::factory()->create();
    $user = User::factory()->create();

    $response = $this->actingAs($user)->post(route('rating', $title), ['score' => 8]);

    $response->assertRedirect();
    expect(Rating::query()->where([
        'user_id' => $user->id,
        'title_id' => $title->id,
        'score' => 8,
    ])->exists())->toBeTrue();
});

test('rating a title again updates the existing score instead of duplicating it', function () {
    $title = Title::factory()->create();
    $user = User::factory()->create();
    Rating::factory()->for($title)->for($user)->create(['score' => 4]);

    $this->actingAs($user)->post(route('rating', $title), ['score' => 9]);

    expect(Rating::query()->where(['user_id' => $user->id, 'title_id' => $title->id])->count())->toBe(1);
    expect(Rating::query()->where(['user_id' => $user->id, 'title_id' => $title->id])->value('score'))->toBe(9);
});

test('a score outside the valid range is rejected', function () {
    $title = Title::factory()->create();
    $user = User::factory()->create();

    $response = $this->actingAs($user)->post(route('rating', $title), ['score' => 11]);

    $response->assertInvalid(['score']);
    expect(Rating::query()->count())->toBe(0);
});

test('a score is required', function () {
    $title = Title::factory()->create();
    $user = User::factory()->create();

    $response = $this->actingAs($user)->post(route('rating', $title), []);

    $response->assertInvalid(['score']);
});

test('a guest cannot clear a rating', function () {
    $title = Title::factory()->create();
    $rating = Rating::factory()->for($title)->create();

    $response = $this->delete(route('rating.destroy', $title));

    $response->assertRedirect(route('login'));
    expect(Rating::query()->whereKey($rating->id)->exists())->toBeTrue();
});

test('an authenticated user can clear their rating', function () {
    $title = Title::factory()->create();
    $user = User::factory()->create();
    Rating::factory()->for($title)->for($user)->create();

    $response = $this->actingAs($user)->delete(route('rating.destroy', $title));

    $response->assertRedirect();
    expect(Rating::query()->where(['user_id' => $user->id, 'title_id' => $title->id])->exists())->toBeFalse();
});

test('clearing a rating does not affect other users\' ratings for the same title', function () {
    $title = Title::factory()->create();
    $user = User::factory()->create();
    $otherUser = User::factory()->create();
    Rating::factory()->for($title)->for($otherUser)->create();

    $this->actingAs($user)->delete(route('rating.destroy', $title));

    expect(Rating::query()->where(['user_id' => $otherUser->id, 'title_id' => $title->id])->exists())->toBeTrue();
});

test('clearing a rating that does not exist is a no-op', function () {
    $title = Title::factory()->create();
    $user = User::factory()->create();

    $response = $this->actingAs($user)->delete(route('rating.destroy', $title));

    $response->assertRedirect();
    expect(Rating::query()->count())->toBe(0);
});
