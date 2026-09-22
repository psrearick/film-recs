<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;

class RatingsController extends Controller
{
    public function index(): Response
    {
        $ratings = auth()->user()?->ratings()->with('title')->orderByDesc('created_at')->get();

        return Inertia::render('ratings', ['ratings' => $ratings]);
    }
}
