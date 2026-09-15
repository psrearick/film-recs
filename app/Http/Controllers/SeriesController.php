<?php

namespace App\Http\Controllers;

use App\Actions\Tmdb\GetSeries;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Throwable;

class SeriesController extends Controller
{
    public function __construct(private readonly GetSeries $getSeries) {}

    /**
     * @throws Throwable
     */
    public function show(int $id): Response
    {
        $series = $this->getSeries->get($id);

        if (! $series) {
            throw new NotFoundHttpException;
        }

        return Inertia::render('series', [
            'series' => $series,
        ]);
    }
}
