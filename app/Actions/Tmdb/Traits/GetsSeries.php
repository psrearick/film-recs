<?php

namespace App\Actions\Tmdb\Traits;

use App\Enums\TitleType;
use Illuminate\Support\Collection;

trait GetsSeries
{
    /**
     * @param  Collection<string, mixed>  $series
     * @return array<int, array<string, mixed>>
     */
    public function getSeries(Collection $series): array
    {
        $results = $series->get('results');

        if (! is_array($results)) {
            return [];
        }

        return collect($results)
            ->filter(fn (mixed $series): bool => is_array($series))
            ->map(fn (array $series): array => $this->getSeriesData($series))
            ->values()
            ->all();
    }

    /**
     * @param  array<array-key, mixed>  $data
     * @return array<string, mixed>
     */
    private function getSeriesData(array $data): array
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
