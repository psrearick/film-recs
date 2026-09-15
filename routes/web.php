<?php

use App\Http\Controllers\MovieController;
use App\Http\Controllers\SearchController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::get('/search', [SearchController::class, 'index'])->name('search');
Route::get('/movies/{id}', [MovieController::class, 'show'])->name('movie');
