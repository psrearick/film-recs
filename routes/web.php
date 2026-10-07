<?php

use App\Http\Controllers\HomeController;
use App\Http\Controllers\MovieController;
use App\Http\Controllers\PersonController;
use App\Http\Controllers\RatingsController;
use App\Http\Controllers\SearchController;
use App\Http\Controllers\SeriesController;
use App\Http\Controllers\TasteProfileController;
use App\Http\Controllers\TasteProfileTitlesController;
use App\Http\Controllers\TitleRatingController;
use App\Http\Controllers\WatchProviderController;
use Illuminate\Support\Facades\Route;

Route::get('/', [HomeController::class, 'index'])->name('home');
Route::get('/search', [SearchController::class, 'index'])->name('search');
Route::get('/movies/{id}', [MovieController::class, 'show'])->name('movie');
Route::get('/series/{id}', [SeriesController::class, 'show'])->name('series');
Route::get('/people/{id}', [PersonController::class, 'show'])->name('person');
Route::middleware('auth')->group(function () {
    Route::post('/titles/{title}/rating', [TitleRatingController::class, 'store'])->name('rating');
    Route::delete('/titles/{title}/rating', [TitleRatingController::class, 'destroy'])->name('rating.destroy');
    Route::get('/ratings', [RatingsController::class, 'index'])->name('ratings');
    Route::get('/taste-profile', [TasteProfileController::class, 'index'])->name('taste-profile');
    Route::get('/taste-profile/titles', [TasteProfileTitlesController::class, 'index'])->name('taste-profile.titles');
    Route::get('/watch-providers', [WatchProviderController::class, 'index'])->name('watch-providers');
    Route::post('/watch-providers/{watchProvider}', [WatchProviderController::class, 'store'])->name('watch-providers.store');
    Route::delete('/watch-providers/{watchProvider}', [WatchProviderController::class, 'destroy'])->name('watch-providers.destroy');
});
