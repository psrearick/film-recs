<?php

namespace App\Actions\Tmdb;

use App\Integrations\TmdbClient;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Collection;
use Stringable;

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
                'label' => $this->toLabel($result['title'] ?? null, $result['original_title'] ?? null, $result['release_date'] ?? null),
                'posterPath' => $this->toNullableString($result['poster_path'] ?? null),
                'url' => "/movies/$id",
            ],
            'tv' => [
                'id' => $id,
                'type' => 'tv',
                'label' => $this->toLabel($result['name'] ?? null, $result['original_name'] ?? null, $result['first_air_date'] ?? null),
                'posterPath' => $this->toNullableString($result['poster_path'] ?? null),
                'url' => "/series/$id",
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

        if (is_scalar($value) || $value instanceof Stringable) {
            return (string) $value;
        }

        return $default;
    }

    private function toNullableString(mixed $value): ?string
    {
        return is_string($value) ? $value : null;
    }

    private function toLabel(mixed $title, mixed $original_title, mixed $date): string
    {
        $title = $this->toStringOrDefault($title ?? $original_title ?? null, '');

        $release_year = $this->releaseYear($date);
        $release_year = $release_year ? "($release_year)" : '';

        $label = trim(implode(' ', [$title, $release_year]));

        return $label ?: 'Untitled';
    }

    private function releaseYear(mixed $releaseDate): ?int
    {
        if (! is_string($releaseDate) || $releaseDate === '') {
            return null;
        }

        return (int) explode('-', $releaseDate)[0];
    }
}
