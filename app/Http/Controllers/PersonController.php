<?php

namespace App\Http\Controllers;

use App\Actions\Tmdb\GetPerson;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class PersonController extends Controller
{
    public function __construct(private readonly GetPerson $getPerson) {}

    public function show(int $id): Response
    {
        $result = $this->getPerson->get($id);

        if (! $result) {
            throw new NotFoundHttpException;
        }

        return Inertia::render('person', [
            'person' => $result['person'],
            'credits' => $result['credits'],
        ]);
    }
}
