<?php

use App\Http\Controllers\HomeController;
use App\Http\Controllers\MovieController;
use App\Http\Controllers\PersonController;
use App\Http\Controllers\SearchController;
use App\Http\Controllers\SeriesController;
use Illuminate\Support\Facades\Route;

Route::get('/', [HomeController::class, 'index'])->name('home');
Route::get('/search', [SearchController::class, 'index'])->name('search');
Route::get('/movies/{id}', [MovieController::class, 'show'])->name('movie');
Route::get('/series/{id}', [SeriesController::class, 'show'])->name('series');
Route::get('/people/{id}', [PersonController::class, 'show'])->name('person');
