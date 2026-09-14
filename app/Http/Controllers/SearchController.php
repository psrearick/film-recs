<?php

namespace App\Http\Controllers;

use App\Actions\Tmdb\Search;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\RequestException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SearchController extends Controller
{
    public function __construct(private readonly Search $search) {}

    /**
     * @throws RequestException
     * @throws ConnectionException
     */
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
        ]);

        $query = trim((string) ($validated['search'] ?? ''));

        if ($query === '') {
            return response()->json(['results' => []]);
        }

        $results = $this->search->search($query);

        return response()->json(['results' => $results]);
    }
}
