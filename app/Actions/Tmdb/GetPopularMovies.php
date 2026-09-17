<?php

namespace App\Actions\Tmdb;

use App\Enums\TitleType;
use App\Integrations\TmdbClient;
use Illuminate\Http\Client\ConnectionException;

readonly class GetPopularMovies
{
    public function __construct(private TmdbClient $tmdb) {}

    /**
     * @return array<int, array<string, mixed>>
     *
     * @throws ConnectionException
     */
    public function get(): array
    {
        $movies = $this->tmdb->popularMovies();

        $results = $movies->get('results');

        if (! is_array($results)) {
            return [];
        }

        return collect($results)
            ->filter(fn (mixed $movie): bool => is_array($movie))
            ->map(fn (array $movie): array => $this->getMovie($movie))
            ->values()
            ->all();
    }

    /**
     * @param  array<array-key, mixed>  $data
     * @return array<string, mixed>
     */
    private function getMovie(array $data): array
    {
        return [
            'tmdb_id' => $data['id'],
            'type' => TitleType::Movie,
            'name' => $data['title'],
            'release_year' => $this->releaseYear($data['release_date']),
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
