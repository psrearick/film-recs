<?php

namespace App\Actions\Tmdb\Traits;

use Illuminate\Support\Collection;

trait MapsProviders
{
    /**
     * @param  Collection<string, mixed>  $providers
     * @return array<int, array{name: mixed, tmdb_id: mixed, logo_path: mixed}>
     */
    public function mapProviders(Collection $providers): array
    {
        $results = $providers->get('results');

        if (! is_array($results) || empty($results)) {
            return [];
        }

        return collect($results)
            ->filter(fn (mixed $provider): bool => is_array($provider))
            ->map(fn (array $provider): array => [
                'name' => $provider['provider_name'] ?? null,
                'tmdb_id' => $provider['provider_id'] ?? null,
                'logo_path' => $provider['logo_path'] ?? null,
            ])
            ->values()
            ->all();
    }
}
