<?php

namespace App\Actions\Tmdb;

use App\Actions\Tmdb\Traits\GetsMovies;
use App\Integrations\TmdbClient;
use Illuminate\Http\Client\ConnectionException;

readonly class GetTrendingMovies
{
    use GetsMovies;

    public function __construct(private TmdbClient $tmdb) {}

    /**
     * @return array<int, array<string, mixed>>
     *
     * @throws ConnectionException
     */
    public function get(): array
    {
        return $this->getMovies($this->tmdb->trendingMovies());
    }
}
