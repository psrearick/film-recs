<?php

namespace App\Actions\Tmdb;

use App\Integrations\TmdbClient;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Collection;

readonly class Search
{
    public function __construct(private TmdbClient $tmdb) {}

    /**
     * @return Collection<int, array{id: int, type: string, label: string, posterPath: ?string, url: string}>
     *
     * @throws RequestException
     * @throws ConnectionException
     */
    public function search(string $query): Collection
    {
        $rawResults = $this->tmdb->search($query)->get('results');
        $rawResults = is_array($rawResults) ? $rawResults : [];

        return collect($rawResults)
            ->map(fn (mixed $result) => $this->toSearchResult($result))
            ->filter()
            ->take(10)
            ->values();
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
                'url' => "/movies/$id",
            ],
            'tv' => [
                'id' => $id,
                'type' => 'tv',
                'label' => $this->toStringOrDefault($result['name'] ?? $result['original_name'] ?? null, 'Untitled'),
                'posterPath' => $this->toNullableString($result['poster_path'] ?? null),
                'url' => "/tv/$id",
            ],
            'person' => [
                'id' => $id,
                'type' => 'person',
                'label' => $this->toStringOrDefault($result['name'] ?? null, 'Unknown'),
                'posterPath' => $this->toNullableString($result['profile_path'] ?? null),
                'url' => "/people/$id",
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
