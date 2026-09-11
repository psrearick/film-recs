<?php

use App\Models\User;

test('registration screen can be rendered', function () {
    $response = $this->get(route('register'));

    $response->assertOk();
});

test('new users can register', function () {
    $response = $this->post(route('register.store'), [
        'name' => 'Test User',
        'email' => 'test@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    $this->assertAuthenticated();
    $this->assertDatabaseHas('users', [
        'name' => 'Test User',
        'email' => 'test@example.com',
    ]);
    $response->assertRedirect(route('home'));
});

test('registration requires name, email, and password', function () {
    $response = $this->post(route('register.store'), []);

    $response->assertSessionHasErrors(['name', 'email', 'password']);
    $this->assertGuest();
});

test('registration requires a unique email', function () {
    $existing = User::factory()->create();

    $response = $this->post(route('register.store'), [
        'name' => 'Test User',
        'email' => $existing->email,
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    $response->assertSessionHasErrors('email');
    $this->assertGuest();
});

test('registration requires a matching password confirmation', function () {
    $response = $this->post(route('register.store'), [
        'name' => 'Test User',
        'email' => 'test@example.com',
        'password' => 'password',
        'password_confirmation' => 'not-matching',
    ]);

    $response->assertSessionHasErrors('password');
    $this->assertGuest();
});
