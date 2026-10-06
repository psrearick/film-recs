<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\WatchProvider;
use Illuminate\Container\Attributes\CurrentUser;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class WatchProviderController extends Controller
{
    public function index(#[CurrentUser] User $user): Response
    {
        return Inertia::render('watch-providers', [
            'providers' => WatchProvider::query()
                ->orderBy('name')
                ->get(['id', 'name', 'logo_path']),
            'userProviderIds' => $user->watchProviders()->pluck('watch_providers.id'),
        ]);
    }

    public function store(#[CurrentUser] User $user, WatchProvider $watchProvider): RedirectResponse
    {
        $user->watchProviders()->syncWithoutDetaching($watchProvider);

        return back();
    }

    public function destroy(#[CurrentUser] User $user, WatchProvider $watchProvider): RedirectResponse
    {
        $user->watchProviders()->detach($watchProvider);

        return back();
    }
}
