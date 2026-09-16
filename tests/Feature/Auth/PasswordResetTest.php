<?php

use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;

test('a password reset link is emailed to an existing user', function () {
    Notification::fake();

    $user = User::factory()->create();

    $response = $this->post(route('password.email'), ['email' => $user->email]);

    $response->assertSessionHasNoErrors();
    Notification::assertSentTo($user, ResetPassword::class);
});

test('requesting a reset link for an unknown email fails validation', function () {
    Notification::fake();

    $response = $this->post(route('password.email'), ['email' => 'missing@example.com']);

    $response->assertSessionHasErrors('email');
    Notification::assertNothingSent();
});

test('a password can be reset with a valid token', function () {
    Notification::fake();

    $user = User::factory()->create();

    $this->post(route('password.email'), ['email' => $user->email]);

    Notification::assertSentTo($user, ResetPassword::class, function (ResetPassword $notification) use ($user) {
        $response = $this->post(route('password.update'), [
            'token' => $notification->token,
            'email' => $user->email,
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
        ]);

        $response->assertRedirect(route('login'));
        $response->assertSessionHasNoErrors();

        return true;
    });

    expect(Hash::check('new-password', $user->fresh()->password))->toBeTrue();
});

test('a password reset fails with an invalid token', function () {
    $user = User::factory()->create();

    $response = $this->post(route('password.update'), [
        'token' => 'invalid-token',
        'email' => $user->email,
        'password' => 'new-password',
        'password_confirmation' => 'new-password',
    ]);

    $response->assertSessionHasErrors('email');
    expect(Hash::check('password', $user->fresh()->password))->toBeTrue();
});

test('a password reset requires a matching confirmation', function () {
    Notification::fake();

    $user = User::factory()->create();

    $this->post(route('password.email'), ['email' => $user->email]);

    Notification::assertSentTo($user, ResetPassword::class, function (ResetPassword $notification) use ($user) {
        $response = $this->post(route('password.update'), [
            'token' => $notification->token,
            'email' => $user->email,
            'password' => 'new-password',
            'password_confirmation' => 'not-matching',
        ]);

        $response->assertSessionHasErrors('password');

        return true;
    });

    expect(Hash::check('password', $user->fresh()->password))->toBeTrue();
});
