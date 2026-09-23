<?php

namespace App\Http\Controllers;

use App\Actions\Tmdb\GetPopularMovies;
use App\Actions\Tmdb\GetPopularSeries;
use App\Actions\Tmdb\GetTrendingMovies;
use App\Actions\Tmdb\GetTrendingSeries;
use Illuminate\Http\Client\ConnectionException;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    public function __construct(
        private readonly GetPopularMovies $getPopularMovies,
        private readonly GetPopularSeries $getPopularSeries,
        private readonly GetTrendingMovies $getTrendingMovies,
        private readonly GetTrendingSeries $getTrendingSeries,
    ) {}

    /**
     * @throws ConnectionException
     */
    public function index(): Response
    {
        return Inertia::render('welcome', [
            'popular_movies' => $this->getPopularMovies->get(),
            'popular_series' => $this->getPopularSeries->get(),
            'trending_movies' => $this->getTrendingMovies->get(),
            'trending_series' => $this->getTrendingSeries->get(),
        ]);
    }
}
