<?php

use App\Models\User;
use Illuminate\Support\Facades\Hash;

test('guests cannot update their password', function () {
    $response = $this->put(route('user-password.update'), [
        'current_password' => 'password',
        'password' => 'new-password',
        'password_confirmation' => 'new-password',
    ]);

    $response->assertRedirect(route('login'));
});

test('updating the password requires the correct current password', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->put(route('user-password.update'), [
        'current_password' => 'wrong-password',
        'password' => 'new-password',
        'password_confirmation' => 'new-password',
    ]);

    $response->assertSessionHasErrors('current_password', errorBag: 'updatePassword');
    expect(Hash::check('password', $user->fresh()->password))->toBeTrue();
});

test('updating the password requires a matching confirmation', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->put(route('user-password.update'), [
        'current_password' => 'password',
        'password' => 'new-password',
        'password_confirmation' => 'not-matching',
    ]);

    $response->assertSessionHasErrors('password', errorBag: 'updatePassword');
    expect(Hash::check('password', $user->fresh()->password))->toBeTrue();
});

test('a user can update their password', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->put(route('user-password.update'), [
        'current_password' => 'password',
        'password' => 'new-password',
        'password_confirmation' => 'new-password',
    ]);

    $response->assertSessionHasNoErrors();

    expect(Hash::check('new-password', $user->fresh()->password))->toBeTrue();
});
