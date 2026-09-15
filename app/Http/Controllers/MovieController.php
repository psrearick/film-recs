<?php

namespace App\Http\Controllers;

use App\Actions\Tmdb\GetMovie;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\RequestException;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class MovieController extends Controller
{
    public function __construct(private readonly GetMovie $getMovie) {}

    /**
     * @throws RequestException
     * @throws ConnectionException
     */
    public function show(int $id): Response
    {
        $movie = $this->getMovie->get($id);

        if (! $movie) {
            throw new NotFoundHttpException;
        }

        return Inertia::render('movie', [
            'movie' => $movie,
        ]);
    }
}
