<?php

namespace App\Http\Controllers;

use App\Actions\GetAffinityTitles;
use App\Enums\AttributeType;
use App\Enums\CreditType;
use App\Models\User;
use Illuminate\Container\Attributes\CurrentUser;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class TasteProfileTitlesController extends Controller
{
    /**
     * The user's rated titles behind one affinity, or every title they gave a score.
     */
    public function index(Request $request, #[CurrentUser] User $user, GetAffinityTitles $getAffinityTitles): JsonResponse
    {
        $validated = $request->validate([
            'type' => ['required', Rule::in([...array_column(AttributeType::cases(), 'value'), 'score'])],
            'id' => ['required_if:type,genre,keyword,person', 'nullable', 'integer'],
            'value' => [
                'required_if:type,person,decade,score',
                'nullable',
                Rule::when($request->input('type') === 'person', [Rule::enum(CreditType::class)]),
                Rule::when($request->input('type') === 'decade', ['integer', 'multiple_of:10']),
                Rule::when($request->input('type') === 'score', ['integer', 'between:1,10']),
            ],
        ]);

        $titles = $validated['type'] === 'score'
            ? $getAffinityTitles->forScore($user, (int) $validated['value'])
            : $getAffinityTitles->forAttribute(
                $user,
                AttributeType::from($validated['type']),
                isset($validated['id']) ? (int) $validated['id'] : null,
                isset($validated['value']) ? (string) $validated['value'] : null,
            );

        return response()->json(['titles' => $titles]);
    }
}
