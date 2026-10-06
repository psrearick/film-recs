<?php

use App\Models\User;
use App\Models\WatchProvider;

test('a guest is redirected to login', function () {
    $response = $this->get(route('watch-providers'));

    $response->assertRedirect(route('login'));
});

test('an authenticated user sees all providers ordered by name and the ids they have access to', function () {
    $user = User::factory()->create();
    $netflix = WatchProvider::factory()->create(['name' => 'Netflix']);
    $hulu = WatchProvider::factory()->create(['name' => 'Hulu']);
    WatchProvider::factory()->create(['name' => 'Apple TV']);
    $user->watchProviders()->attach($hulu);

    $response = $this->actingAs($user)->get(route('watch-providers'));

    $response->assertInertia(fn ($page) => $page
        ->component('watch-providers')
        ->has('providers', 3)
        ->where('providers.0.name', 'Apple TV')
        ->where('providers.1.name', 'Hulu')
        ->where('providers.2.id', $netflix->id)
        ->where('userProviderIds', [$hulu->id]));
});

test('a user does not see another user\'s providers as their own', function () {
    $user = User::factory()->create();
    $otherUser = User::factory()->create();
    $otherUser->watchProviders()->attach(WatchProvider::factory()->create());

    $response = $this->actingAs($user)->get(route('watch-providers'));

    $response->assertInertia(fn ($page) => $page->where('userProviderIds', []));
});

test('a guest cannot add a watch provider', function () {
    $provider = WatchProvider::factory()->create();

    $response = $this->post(route('watch-providers.store', $provider));

    $response->assertRedirect(route('login'));
    expect($provider->users()->count())->toBe(0);
});

test('an authenticated user can add a watch provider', function () {
    $user = User::factory()->create();
    $provider = WatchProvider::factory()->create();

    $response = $this->actingAs($user)->post(route('watch-providers.store', $provider));

    $response->assertRedirect();
    expect($user->watchProviders()->pluck('watch_providers.id')->all())->toBe([$provider->id]);
});

test('adding a watch provider the user already has does not duplicate it', function () {
    $user = User::factory()->create();
    $provider = WatchProvider::factory()->create();
    $user->watchProviders()->attach($provider);

    $this->actingAs($user)->post(route('watch-providers.store', $provider))->assertRedirect();

    expect($user->watchProviders()->count())->toBe(1);
});

test('an authenticated user can remove a watch provider', function () {
    $user = User::factory()->create();
    $provider = WatchProvider::factory()->create();
    $kept = WatchProvider::factory()->create();
    $user->watchProviders()->attach([$provider->id, $kept->id]);

    $response = $this->actingAs($user)->delete(route('watch-providers.destroy', $provider));

    $response->assertRedirect();
    expect($user->watchProviders()->pluck('watch_providers.id')->all())->toBe([$kept->id]);
});

test('removing a watch provider does not affect other users', function () {
    $user = User::factory()->create();
    $otherUser = User::factory()->create();
    $provider = WatchProvider::factory()->create();
    $otherUser->watchProviders()->attach($provider);

    $this->actingAs($user)->delete(route('watch-providers.destroy', $provider))->assertRedirect();

    expect($otherUser->watchProviders()->count())->toBe(1);
});

test('adding a nonexistent watch provider returns not found', function () {
    $user = User::factory()->create();

    $this->actingAs($user)->post(route('watch-providers.store', 999))->assertNotFound();
});
