<?php

namespace App\Http\Controllers;

use App\Actions\GetTasteProfile;
use App\Models\User;
use Illuminate\Container\Attributes\CurrentUser;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TasteProfileController extends Controller
{
    public function index(Request $request, #[CurrentUser] User $user, GetTasteProfile $getTasteProfile): Response
    {
        return Inertia::render('taste-profile', $getTasteProfile->get(
            $user,
            includeLowConfidence: $request->boolean('include_low_confidence'),
        ));
    }
}
