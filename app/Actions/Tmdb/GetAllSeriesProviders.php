<?php

namespace App\Actions\Tmdb;

use App\Actions\Tmdb\Traits\MapsProviders;
use App\Integrations\TmdbClient;
use Illuminate\Http\Client\ConnectionException;

class GetAllSeriesProviders
{
    use MapsProviders;

    public function __construct(private readonly TmdbClient $tmdb) {}

    /**
     * @return array<array<string, mixed>>
     *
     * @throws ConnectionException
     */
    public function get(): array
    {
        $providers = $this->tmdb->allSeriesProviders();

        return $this->mapProviders($providers);
    }
}
