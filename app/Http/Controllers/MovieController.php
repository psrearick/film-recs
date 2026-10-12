<?php

namespace App\Http\Controllers;

use App\Actions\Tmdb\GetMovie;
use App\Models\Title;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Throwable;

class MovieController extends Controller
{
    public function __construct(private readonly GetMovie $getMovie) {}

    /**
     * @throws Throwable
     */
    public function show(int $id): Response
    {
        $movie = $this->getMovie->get($id);

        if (! $movie) {
            throw new NotFoundHttpException;
        }

        return Inertia::render('movie', [
            'movie' => $movie->load(Title::DETAIL_RELATIONS)->append('user_rating'),
        ]);
    }
}
