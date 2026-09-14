<?php

namespace App\Http\Controllers;

use App\Http\Integrations\TmdbClient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SearchController extends Controller
{
    public function __construct(private readonly TmdbClient $tmdb) {}

    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
        ]);

        $query = trim((string) ($validated['search'] ?? ''));

        if ($query === '') {
            return response()->json(['results' => []]);
        }

        $rawResults = $this->tmdb->search($query)->get('results');
        $rawResults = is_array($rawResults) ? $rawResults : [];

        $results = collect($rawResults)
            ->map(fn (mixed $result) => $this->toSearchResult($result))
            ->filter()
            ->take(10)
            ->values();

        return response()->json(['results' => $results]);
    }

    /**
     * @return array{id: int, type: string, label: string, posterPath: ?string, url: string}|null
     */
    private function toSearchResult(mixed $result): ?array
    {
        if (! is_array($result)) {
            return null;
        }

        $id = $result['id'] ?? null;
        $type = $result['media_type'] ?? null;

        if (! is_int($id) || ! in_array($type, ['movie', 'tv', 'person'], true)) {
            return null;
        }

        return match ($type) {
            'movie' => [
                'id' => $id,
                'type' => 'movie',
                'label' => $this->toStringOrDefault($result['title'] ?? $result['original_title'] ?? null, 'Untitled'),
                'posterPath' => $this->toNullableString($result['poster_path'] ?? null),
                'url' => "/movies/{$id}",
            ],
            'tv' => [
                'id' => $id,
                'type' => 'tv',
                'label' => $this->toStringOrDefault($result['name'] ?? $result['original_name'] ?? null, 'Untitled'),
                'posterPath' => $this->toNullableString($result['poster_path'] ?? null),
                'url' => "/tv/{$id}",
            ],
            'person' => [
                'id' => $id,
                'type' => 'person',
                'label' => $this->toStringOrDefault($result['name'] ?? null, 'Unknown'),
                'posterPath' => $this->toNullableString($result['profile_path'] ?? null),
                'url' => "/people/{$id}",
            ],
        };
    }

    private function toStringOrDefault(mixed $value, string $default): string
    {
        if (is_string($value)) {
            return $value;
        }

        if (is_int($value) || is_float($value)) {
            return (string) $value;
        }

        return $default;
    }

    private function toNullableString(mixed $value): ?string
    {
        return is_string($value) ? $value : null;
    }
}
