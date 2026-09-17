<?php

namespace App\Actions\Tmdb;

use App\Enums\TitleType;
use App\Integrations\TmdbClient;
use Illuminate\Http\Client\ConnectionException;

readonly class GetPopularSeries
{
    public function __construct(private readonly TmdbClient $tmdb) {}

    /**
     * @return array<int, array<string, mixed>>
     *
     * @throws ConnectionException
     */
    public function get(): array
    {
        $series = $this->tmdb->popularSeries();

        $results = $series->get('results');

        if (! is_array($results)) {
            return [];
        }

        return collect($results)
            ->filter(fn (mixed $series): bool => is_array($series))
            ->map(fn (array $series): array => $this->getSeries($series))
            ->values()
            ->all();
    }

    /**
     * @param  array<array-key, mixed>  $data
     * @return array<string, mixed>
     */
    private function getSeries(array $data): array
    {
        return [
            'tmdb_id' => $data['id'],
            'type' => TitleType::Tv,
            'name' => $data['name'],
            'release_year' => $this->releaseYear($data['first_air_date']),
            'overview' => $data['overview'],
            'poster_path' => $data['poster_path'],
            'popularity' => $data['popularity'],
            'vote_average' => $data['vote_average'],
        ];
    }

    private function releaseYear(mixed $releaseDate): ?int
    {
        if (! is_string($releaseDate) || $releaseDate === '') {
            return null;
        }

        return (int) explode('-', $releaseDate)[0];
    }
}
