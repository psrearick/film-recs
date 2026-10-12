<?php

namespace App\Actions\Tmdb;

use App\Actions\Tmdb\Traits\GetsMovies;
use App\Integrations\TmdbClient;
use Illuminate\Http\Client\ConnectionException;

readonly class GetPopularMovies
{
    use GetsMovies;

    public function __construct(private TmdbClient $tmdb) {}

    /**
     * @return array<int, array<string, mixed>>
     *
     * @throws ConnectionException
     */
    public function get(int $page = 1): array
    {
        return $this->getMovies($this->tmdb->popularMovies($page));
    }
}
