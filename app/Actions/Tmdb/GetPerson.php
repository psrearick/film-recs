<?php

namespace App\Actions\Tmdb;

use App\Enums\CreditType;
use App\Enums\TitleType;
use App\Integrations\TmdbClient;
use App\Jobs\SyncPersonCredits;
use App\Models\Person;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;

class GetPerson
{
    public function __construct(private TmdbClient $tmdb) {}

    /**
     * @return array{person: array<string, mixed>, credits: array<int, array<string, mixed>>}|null
     *
     * @throws RequestException
     * @throws ConnectionException
     */
    public function get(int $id): ?array
    {
        $existingPerson = Person::query()->where('tmdb_id', $id)->first();

        $isStale = ! $existingPerson || $existingPerson->is_stale;

        try {
            $personData = $isStale
                ? $this->tmdb->person($id)
                : collect(Cache::remember(
                    "tmdb-person-{$id}",
                    now()->addDays(Config::integer('services.tmdb.metadata_ttl_days', 30)),
                    fn () => $this->tmdb->person($id)->all(),
                ));
        } catch (RequestException $e) {
            if ($e->response->status() !== 404) {
                throw $e;
            }

            return $this->fallbackResponse($existingPerson);
        }

        if ($personData->isEmpty()) {
            return $this->fallbackResponse($existingPerson);
        }

        $person = $this->savePerson($personData, $existingPerson);

        $movieCredits = $personData->get('movie_credits', []);
        $movieCredits = is_array($movieCredits) ? $movieCredits : [];

        $tvCredits = $personData->get('tv_credits', []);
        $tvCredits = is_array($tvCredits) ? $tvCredits : [];

        if ($isStale) {
            SyncPersonCredits::dispatch($person->id, $this->creditIds($movieCredits), $this->creditIds($tvCredits));
        }

        $credits = $this->creditRows($movieCredits, TitleType::Movie)
            ->merge($this->creditRows($tvCredits, TitleType::Tv))
            ->all();

        $personArray = [...$person->toArray(), 'vote_averages' => $this->averageVoteAverage($credits)];

        return ['person' => $personArray, 'credits' => $credits];
    }

    /**
     * Falls back to whatever we already know about this person locally when
     * TMDB has nothing to give us right now (a 404, or an empty payload).
     *
     * @return array{person: array<string, mixed>, credits: array<int, array<string, mixed>>}|null
     */
    private function fallbackResponse(?Person $person): ?array
    {
        if (! $person) {
            return null;
        }

        $credits = $this->localCredits($person);

        return [
            'person' => [...$person->toArray(), 'vote_averages' => $this->averageVoteAverage($credits)],
            'credits' => $credits,
        ];
    }

    /**
     * @return array<int, array{tmdb_id: int, media_type: string, title: string, poster_path: ?string, release_year: ?int, character: ?string, job: ?string, vote_average: ?float}>
     */
    private function localCredits(Person $person): array
    {
        return DB::table('person_title')
            ->join('titles', 'titles.id', '=', 'person_title.title_id')
            ->where('person_title.person_id', $person->id)
            ->select([
                'titles.tmdb_id',
                'titles.type',
                'titles.name',
                'titles.poster_path',
                'titles.release_year',
                'titles.vote_average',
                'person_title.credit_type',
                'person_title.character',
            ])
            ->get()
            ->map(function (object $row) {
                $isCast = $row->credit_type === CreditType::Cast->value;

                return [
                    'tmdb_id' => (int) $row->tmdb_id,
                    'media_type' => (string) $row->type,
                    'title' => (string) $row->name,
                    'poster_path' => is_string($row->poster_path) ? $row->poster_path : null,
                    'release_year' => $row->release_year !== null ? (int) $row->release_year : null,
                    'character' => $isCast && is_string($row->character) ? $row->character : null,
                    'job' => ! $isCast ? ucfirst((string) $row->credit_type) : null,
                    'vote_average' => $row->vote_average !== null ? (float) $row->vote_average : null,
                ];
            })
            ->all();
    }

    /**
     * @param  array<int, array{tmdb_id: int, media_type: string, title: string, poster_path: ?string, release_year: ?int, character: ?string, job: ?string, vote_average: ?float}>  $credits
     * @return array<int, array{vote_average: ?float, job: string, count: int}>
     */
    private function averageVoteAverage(array $credits): array
    {
        $creditsCollection = collect($credits)->filter(fn (array $credit) => $credit['vote_average'] !== null && $credit['vote_average'] > 0);

        $votes = $creditsCollection
            ->unique(fn (array $credit) => $credit['media_type'].'-'.$credit['tmdb_id'])
            ->pluck('vote_average')
            ->filter(fn (mixed $vote): bool => $vote !== null && $vote !== '' && $vote > 0);

        return $creditsCollection
            ->map(function (array $credit) {
                $credit['job'] = $credit['job'] ?? 'Actor';

                return $credit;
            })->mapToGroups(function (array $credit) {
                return [$credit['job'] => $credit['vote_average']];
            })->map(function (Collection $creditGroup): array {
                return [
                    'vote_average' => $creditGroup->isEmpty() ? null : (float) $creditGroup->average(),
                    'count' => $creditGroup->count(),
                ];
            })
            ->map(fn (array $jobAverage, string $job): array => [
                'vote_average' => $jobAverage['vote_average'],
                'job' => $job,
                'count' => $jobAverage['count'],
            ])
            ->push([
                'vote_average' => $votes->isEmpty() ? null : round((float) $votes->average(), 1),
                'job' => 'Average',
                'count' => $creditsCollection->count(),
            ])
            ->values()
            ->all();
    }

    /**
     * @param  array<array-key, mixed>  $credits
     * @return array<int, int>
     */
    private function creditIds(array $credits): array
    {
        $cast = is_array($credits['cast'] ?? null) ? $credits['cast'] : [];
        $crew = is_array($credits['crew'] ?? null) ? $credits['crew'] : [];

        return collect($cast)
            ->merge($crew)
            ->pluck('id')
            ->map(fn (mixed $id): int => is_numeric($id) ? (int) $id : 0)
            ->unique()
            ->values()
            ->all();
    }

    /**
     * @param  array<array-key, mixed>  $credits
     * @return Collection<int, array{tmdb_id: int, media_type: string, title: string, poster_path: ?string, release_year: ?int, character: ?string, job: ?string, vote_average: ?float}>
     */
    private function creditRows(array $credits, TitleType $mediaType): Collection
    {
        $cast = is_array($credits['cast'] ?? null) ? $credits['cast'] : [];
        $crew = is_array($credits['crew'] ?? null) ? $credits['crew'] : [];

        $castRows = collect($cast)->map(fn (mixed $member) => $this->creditRow(
            $member,
            $mediaType,
            character: is_array($member) ? ($member['character'] ?? null) : null,
        ));

        $crewRows = collect($crew)->map(fn (mixed $member) => $this->creditRow(
            $member,
            $mediaType,
            job: is_array($member) ? ($member['job'] ?? null) : null,
        ));

        return $castRows->merge($crewRows)->filter()->values();
    }

    /**
     * @return array{tmdb_id: int, media_type: string, title: string, poster_path: ?string, release_year: ?int, character: ?string, job: ?string, vote_average: ?float}|null
     */
    private function creditRow(mixed $member, TitleType $mediaType, mixed $character = null, mixed $job = null): ?array
    {
        if (! is_array($member) || ! is_numeric($member['id'] ?? null)) {
            return null;
        }

        $title = $member[$mediaType === TitleType::Movie ? 'title' : 'name'] ?? null;

        if (! is_string($title)) {
            return null;
        }

        $releaseDate = $member[$mediaType === TitleType::Movie ? 'release_date' : 'first_air_date'] ?? null;

        return [
            'tmdb_id' => (int) $member['id'],
            'media_type' => $mediaType->value,
            'title' => $title,
            'poster_path' => is_string($member['poster_path'] ?? null) ? $member['poster_path'] : null,
            'release_year' => $this->releaseYear($releaseDate),
            'character' => is_string($character) ? $character : null,
            'job' => is_string($job) ? $job : null,
            'vote_average' => is_numeric($member['vote_average'] ?? null) ? (float) $member['vote_average'] : null,
        ];
    }

    private function releaseYear(mixed $releaseDate): ?int
    {
        if (! is_string($releaseDate) || $releaseDate === '') {
            return null;
        }

        return (int) explode('-', $releaseDate)[0];
    }

    /**
     * @param  Collection<string, mixed>  $data
     */
    private function savePerson(Collection $data, ?Person $person): Person
    {
        $attributes = [
            'tmdb_id' => $data->get('id'),
            'biography' => $data->get('biography'),
            'name' => $data->get('name'),
            'profile_path' => $data->get('profile_path'),
        ];

        if ($person) {
            $person->update($attributes);

            return $person;
        }

        return Person::create($attributes);
    }
}
