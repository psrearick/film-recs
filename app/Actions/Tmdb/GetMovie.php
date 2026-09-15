<?php

namespace App\Actions\Tmdb;

use App\Enums\AccessType;
use App\Enums\CreditType;
use App\Enums\TitleType;
use App\Integrations\TmdbClient;
use App\Models\Genre;
use App\Models\Keyword;
use App\Models\Person;
use App\Models\Title;
use App\Models\WatchProvider;
use Carbon\CarbonImmutable;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;

readonly class GetMovie
{
    private const string REGION = 'US';

    /** @var array<string, CreditType> */
    private const array CREW_CREDIT_TYPES = [
        'Director' => CreditType::Director,
        'Producer' => CreditType::Producer,
        'Original Music Composer' => CreditType::Composer,
    ];

    /** @var array<string, AccessType> */
    private const array WATCH_PROVIDER_ACCESS_TYPES = [
        'flatrate' => AccessType::Subscription,
        'rent' => AccessType::Rent,
        'buy' => AccessType::Buy,
    ];

    public function __construct(private TmdbClient $tmdb) {}

    /**
     * @throws ConnectionException
     * @throws RequestException
     */
    public function get(int $id): ?Title
    {
        $movie = Title::query()->where('tmdb_id', $id)->where('type', TitleType::Movie)->first();

        if (! $movie || $this->isStale($movie)) {
            $movie = $this->fetchAndSyncMovie($id, $movie);
        }

        return $movie?->load(['genres', 'keywords', 'actors', 'directors', 'producers', 'composers', 'watchProviders']);
    }

    private function isStale(Title $movie): bool
    {
        $ttlDays = Config::integer('services.tmdb.metadata_ttl_days', 30);

        return $movie->metadata_fetched_at === null
            || $movie->metadata_fetched_at->lt(now()->subDays($ttlDays));
    }

    private function fetchAndSyncMovie(int $id, ?Title $movie): ?Title
    {
        try {
            $data = $this->tmdb->movie($id);
        } catch (RequestException $e) {
            if ($e->response->status() === 404) {
                return $movie;
            }

            throw $e;
        }

        if (! is_int($data->get('id'))) {
            return $movie;
        }

        $providersData = $this->tmdb->movieProviders($id);

        return DB::transaction(function () use ($data, $providersData, $movie) {
            $movie = $this->saveMovie($data, $movie);

            $this->syncGenres($movie, $data->get('genres'));
            $this->syncCredits($movie, $data->get('credits'));
            $this->syncKeywords($movie, $data->get('keywords'));
            $this->syncWatchProviders($movie, $providersData);

            return $movie;
        });
    }

    /**
     * @param  Collection<string, mixed>  $data
     */
    private function saveMovie(Collection $data, ?Title $movie): Title
    {
        $attributes = [
            'tmdb_id' => $data->get('id'),
            'type' => TitleType::Movie,
            'name' => $data->get('title'),
            'release_year' => $this->releaseYear($data->get('release_date')),
            'overview' => $data->get('overview'),
            'poster_path' => $data->get('poster_path'),
            'runtime' => $data->get('runtime'),
            'popularity' => $data->get('popularity'),
            'vote_average' => $data->get('vote_average'),
            'metadata_fetched_at' => now(),
        ];

        if ($movie) {
            $movie->update($attributes);

            return $movie;
        }

        return Title::create($attributes);
    }

    private function releaseYear(mixed $releaseDate): ?int
    {
        if (! is_string($releaseDate) || $releaseDate === '') {
            return null;
        }

        return (int) explode('-', $releaseDate)[0];
    }

    private function syncGenres(Title $movie, mixed $genres): void
    {
        $genreIds = collect(is_array($genres) ? $genres : [])
            ->filter(fn (mixed $genre) => is_array($genre) && isset($genre['id'], $genre['name']))
            ->map(fn (array $genre) => Genre::query()->firstOrCreate(
                ['tmdb_id' => $genre['id']],
                ['name' => $genre['name']],
            )->id);

        $movie->genres()->sync($genreIds);
    }

    private function syncKeywords(Title $movie, mixed $keywordsResponse): void
    {
        $keywords = is_array($keywordsResponse) ? ($keywordsResponse['keywords'] ?? []) : [];

        $keywordIds = collect(is_array($keywords) ? $keywords : [])
            ->filter(fn (mixed $keyword) => is_array($keyword) && isset($keyword['id'], $keyword['name']))
            ->map(fn (array $keyword) => Keyword::query()->firstOrCreate(
                ['tmdb_id' => $keyword['id']],
                ['name' => $keyword['name']],
            )->id);

        $movie->keywords()->sync($keywordIds);
    }

    private function syncCredits(Title $movie, mixed $credits): void
    {
        $credits = is_array($credits) ? $credits : [];
        $cast = is_array($credits['cast'] ?? null) ? $credits['cast'] : [];
        $crew = is_array($credits['crew'] ?? null) ? $credits['crew'] : [];

        $rows = collect($cast)
            ->map(fn (mixed $member) => $this->castCreditRow($member))
            ->merge(collect($crew)->map(fn (mixed $member) => $this->crewCreditRow($member)))
            ->filter()
            ->unique(fn (array $row) => $row['person_id'].'-'.$row['credit_type'])
            ->map(fn (array $row) => [...$row, 'title_id' => $movie->id]);

        DB::table('person_title')->where('title_id', $movie->id)->delete();

        if ($rows->isNotEmpty()) {
            DB::table('person_title')->insert($rows->all());
        }
    }

    /**
     * @return array{person_id: int, credit_type: string, character: string|null}|null
     */
    private function castCreditRow(mixed $member): ?array
    {
        $character = is_array($member) && is_string($member['character'] ?? null)
            ? $member['character']
            : null;

        return $this->creditRow($member, CreditType::Cast, $character);
    }

    /**
     * @return array{person_id: int, credit_type: string, character: string|null}|null
     */
    private function crewCreditRow(mixed $member): ?array
    {
        if (! is_array($member) || ! is_string($member['job'] ?? null)) {
            return null;
        }

        $creditType = self::CREW_CREDIT_TYPES[$member['job']] ?? null;

        return $creditType ? $this->creditRow($member, $creditType) : null;
    }

    /**
     * @return array{person_id: int, credit_type: string, character: string|null}|null
     */
    private function creditRow(mixed $member, CreditType $creditType, ?string $character = null): ?array
    {
        if (! is_array($member) || ! isset($member['id'], $member['name'])) {
            return null;
        }

        $person = Person::query()->firstOrCreate(
            ['tmdb_id' => $member['id']],
            ['name' => $member['name'], 'profile_path' => $member['profile_path'] ?? null],
        );

        return ['person_id' => $person->id, 'credit_type' => $creditType->value, 'character' => $character];
    }

    /**
     * @param  Collection<string, mixed>  $providersData
     */
    private function syncWatchProviders(Title $movie, Collection $providersData): void
    {
        $regionData = $providersData->get('results');
        $regionData = is_array($regionData) ? ($regionData[self::REGION] ?? []) : [];
        $regionData = is_array($regionData) ? $regionData : [];

        $rows = collect(self::WATCH_PROVIDER_ACCESS_TYPES)
            ->flatMap(function (AccessType $accessType, string $key) use ($regionData, $movie) {
                $entries = is_array($regionData[$key] ?? null) ? $regionData[$key] : [];

                return collect($entries)
                    ->map(fn (mixed $entry) => $this->watchProviderRow($entry, $accessType, $movie));
            })
            ->filter();

        DB::table('title_watch_provider')
            ->where('title_id', $movie->id)
            ->where('region', self::REGION)
            ->delete();

        if ($rows->isNotEmpty()) {
            DB::table('title_watch_provider')->insert($rows->all());
        }
    }

    /**
     * @return array{title_id: int, watch_provider_id: int, region: string, access_type: string, fetched_at: CarbonImmutable, created_at: CarbonImmutable, updated_at: CarbonImmutable}|null
     */
    private function watchProviderRow(mixed $entry, AccessType $accessType, Title $movie): ?array
    {
        if (! is_array($entry) || ! isset($entry['provider_id'], $entry['provider_name'])) {
            return null;
        }

        $provider = WatchProvider::query()->firstOrCreate(
            ['tmdb_id' => $entry['provider_id']],
            ['name' => $entry['provider_name'], 'logo_path' => $entry['logo_path'] ?? null],
        );

        return [
            'title_id' => $movie->id,
            'watch_provider_id' => $provider->id,
            'region' => self::REGION,
            'access_type' => $accessType->value,
            'fetched_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ];
    }
}
