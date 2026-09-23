<?php

namespace App\Actions\Tmdb;

use App\Actions\Tmdb\Traits\GetsSeries;
use App\Integrations\TmdbClient;
use Illuminate\Http\Client\ConnectionException;

readonly class GetPopularSeries
{
    use GetsSeries;

    public function __construct(private readonly TmdbClient $tmdb) {}

    /**
     * @return array<int, array<string, mixed>>
     *
     * @throws ConnectionException
     */
    public function get(): array
    {
        return $this->getSeries($this->tmdb->popularSeries());
    }
}
