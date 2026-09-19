<?php

namespace App\Http\Controllers;

use App\Models\Rating;
use App\Models\Title;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class TitleRatingController extends Controller
{
    public function store(Request $request, Title $title): RedirectResponse
    {
        $validated = $request->validate([
            'score' => ['required', 'integer', 'between:1,10'],
        ]);

        Rating::query()->updateOrCreate(
            ['user_id' => Auth::id(), 'title_id' => $title->id],
            ['score' => $validated['score']],
        );

        return back();
    }

    public function destroy(Title $title): RedirectResponse
    {
        Rating::query()
            ->where(['user_id' => Auth::id(), 'title_id' => $title->id])
            ->delete();

        return back();
    }
}
