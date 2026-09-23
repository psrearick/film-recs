<?php

namespace App\Actions\Tmdb\Traits;

use App\Enums\TitleType;
use Illuminate\Support\Collection;

trait GetsMovies
{
    /**
     * @param  Collection<string, mixed>  $movies
     * @return array<int, array<string, mixed>>
     */
    public function getMovies(Collection $movies): array
    {
        $results = $movies->get('results');

        if (! is_array($results)) {
            return [];
        }

        return collect($results)
            ->filter(fn (mixed $movie): bool => is_array($movie) && ($movie['adult'] ?? false) !== true)
            ->map(fn (array $movie): array => $this->getMovieData($movie))
            ->values()
            ->all();
    }

    /**
     * @param  array<array-key, mixed>  $data
     * @return array<string, mixed>
     */
    private function getMovieData(array $data): array
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
