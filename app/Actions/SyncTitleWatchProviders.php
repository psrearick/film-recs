<?php

namespace App\Actions;

use App\Enums\AccessType;
use App\Models\Title;
use App\Models\WatchProvider;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class SyncTitleWatchProviders
{
    private const string REGION = 'US';

    /** @var array<string, AccessType> */
    private const array WATCH_PROVIDER_ACCESS_TYPES = [
        'flatrate' => AccessType::Subscription,
        'rent' => AccessType::Rent,
        'buy' => AccessType::Buy,
    ];

    /**
     * @param  Collection<string, mixed>  $providersData
     */
    public function sync(Title $title, Collection $providersData): void
    {
        $regionData = $providersData->get('results');
        $regionData = is_array($regionData) ? ($regionData[self::REGION] ?? []) : [];
        $regionData = is_array($regionData) ? $regionData : [];

        $rows = collect(self::WATCH_PROVIDER_ACCESS_TYPES)
            ->flatMap(function (AccessType $accessType, string $key) use ($regionData, $title) {
                $entries = is_array($regionData[$key] ?? null) ? $regionData[$key] : [];

                return collect($entries)
                    ->map(fn (mixed $entry) => $this->watchProviderRow($entry, $accessType, $title));
            })
            ->filter();

        DB::table('title_watch_provider')
            ->where('title_id', $title->id)
            ->where('region', self::REGION)
            ->delete();

        if ($rows->isNotEmpty()) {
            DB::table('title_watch_provider')->insert($rows->all());
        }
    }

    /**
     * @return array{title_id: int, watch_provider_id: int, region: string, access_type: string, fetched_at: CarbonImmutable, created_at: CarbonImmutable, updated_at: CarbonImmutable}|null
     */
    private function watchProviderRow(mixed $entry, AccessType $accessType, Title $title): ?array
    {
        if (! is_array($entry) || ! isset($entry['provider_id'], $entry['provider_name'])) {
            return null;
        }

        $provider = WatchProvider::query()->firstOrCreate(
            ['tmdb_id' => $entry['provider_id']],
            ['name' => $entry['provider_name'], 'logo_path' => $entry['logo_path'] ?? null],
        );

        return [
            'title_id' => $title->id,
            'watch_provider_id' => $provider->id,
            'region' => self::REGION,
            'access_type' => $accessType->value,
            'fetched_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ];
    }
}
