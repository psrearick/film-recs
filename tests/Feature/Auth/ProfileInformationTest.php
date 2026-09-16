<?php

use App\Models\User;

test('guests cannot update profile information', function () {
    $response = $this->put(route('user-profile-information.update'), [
        'name' => 'New Name',
        'email' => 'new@example.com',
    ]);

    $response->assertRedirect(route('login'));
});

test('profile information requires a name and a valid email', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->put(route('user-profile-information.update'), [
        'name' => '',
        'email' => 'not-an-email',
    ]);

    $response->assertSessionHasErrors(['name', 'email'], errorBag: 'updateProfileInformation');
});

test('profile information requires a unique email', function () {
    $user = User::factory()->create();
    $other = User::factory()->create();

    $response = $this->actingAs($user)->put(route('user-profile-information.update'), [
        'name' => $user->name,
        'email' => $other->email,
    ]);

    $response->assertSessionHasErrors('email', errorBag: 'updateProfileInformation');
});

test('a user can keep their own email when updating their name', function () {
    $user = User::factory()->create(['name' => 'Old Name']);

    $response = $this->actingAs($user)->put(route('user-profile-information.update'), [
        'name' => 'New Name',
        'email' => $user->email,
    ]);

    $response->assertSessionHasNoErrors();

    expect($user->fresh()->name)->toBe('New Name');
});

test('a user can update their profile information', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->put(route('user-profile-information.update'), [
        'name' => 'New Name',
        'email' => 'updated@example.com',
    ]);

    $response->assertSessionHasNoErrors();

    $user->refresh();
    expect($user->name)->toBe('New Name');
    expect($user->email)->toBe('updated@example.com');
});
