<?php

namespace App\Http\Controllers;

use App\Actions\Tmdb\GetPopularMovies;
use App\Actions\Tmdb\GetPopularSeries;
use Illuminate\Http\Client\ConnectionException;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    public function __construct(private readonly GetPopularMovies $getPopularMovies, private readonly GetPopularSeries $getPopularSeries) {}

    /**
     * @throws ConnectionException
     */
    public function index(): Response
    {
        return Inertia::render('welcome', [
            'movies' => $this->getPopularMovies->get(),
            'series' => $this->getPopularSeries->get(),
        ]);
    }
}
