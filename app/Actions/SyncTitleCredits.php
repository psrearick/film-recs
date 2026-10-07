<?php

namespace App\Actions;

use App\Enums\CreditType;
use App\Models\Person;
use App\Models\Title;
use Illuminate\Support\Facades\DB;

class SyncTitleCredits
{
    /** @var array<string, CreditType> */
    private const array CREW_CREDIT_TYPES = [
        'Director' => CreditType::Director,
        'Producer' => CreditType::Producer,
        'Original Music Composer' => CreditType::Composer,
    ];

    public function sync(Title $title, mixed $credits): void
    {
        $credits = is_array($credits) ? $credits : [];
        $cast = is_array($credits['cast'] ?? null) ? $credits['cast'] : [];
        $crew = is_array($credits['crew'] ?? null) ? $credits['crew'] : [];

        $rows = collect($cast)
            ->map(fn (mixed $member) => $this->castCreditRow($member))
            ->filter()
            ->merge(collect($crew)->flatMap(fn (mixed $member) => $this->crewCreditRows($member)))
            ->unique(fn (array $row) => $row['person_id'].'-'.$row['credit_type'])
            ->map(fn (array $row) => [...$row, 'title_id' => $title->id]);

        DB::table('person_title')->where('title_id', $title->id)->delete();

        if ($rows->isNotEmpty()) {
            DB::table('person_title')->insert($rows->all());
        }
    }

    /**
     * @return array{person_id: int, credit_type: string, character: string|null, billing_order: int|null, episode_count: int|null}|null
     */
    private function castCreditRow(mixed $member): ?array
    {
        if (! is_array($member)) {
            return null;
        }

        return $this->creditRow(
            $member,
            CreditType::Cast,
            $this->characterFor($member),
            is_int($member['order'] ?? null) ? $member['order'] : null,
            is_int($member['total_episode_count'] ?? null) ? $member['total_episode_count'] : null,
        );
    }

    /**
     * TV aggregate credits report a character on each of a cast member's `roles`
     * rather than directly on the member, since a person may play multiple
     * named characters across a series.
     *
     * @param  array<array-key, mixed>  $member
     */
    private function characterFor(array $member): ?string
    {
        if (is_string($member['character'] ?? null)) {
            return $member['character'];
        }

        if (! is_array($member['roles'] ?? null)) {
            return null;
        }

        $characters = collect($member['roles'])
            ->map(fn (mixed $role) => is_array($role) && is_string($role['character'] ?? null) ? $role['character'] : null)
            ->filter()
            ->unique()
            ->values();

        return $characters->isEmpty() ? null : $characters->implode(' / ');
    }

    /**
     * @return array<int, array{person_id: int, credit_type: string, character: string|null, billing_order: int|null, episode_count: int|null}>
     */
    private function crewCreditRows(mixed $member): array
    {
        if (! is_array($member)) {
            return [];
        }

        return collect($this->jobsFor($member))
            ->map(fn (string $job) => self::CREW_CREDIT_TYPES[$job] ?? null)
            ->filter()
            ->unique()
            ->map(fn (CreditType $creditType) => $this->creditRow($member, $creditType))
            ->filter()
            ->values()
            ->all();
    }

    /**
     * Movie credits report a single `job` per crew entry. TV aggregate credits
     * report a `jobs` array instead, since a person may hold multiple jobs
     * across a series.
     *
     * @param  array<array-key, mixed>  $member
     * @return array<int, string>
     */
    private function jobsFor(array $member): array
    {
        if (is_string($member['job'] ?? null)) {
            return [$member['job']];
        }

        if (! is_array($member['jobs'] ?? null)) {
            return [];
        }

        return collect($member['jobs'])
            ->map(fn (mixed $job) => is_array($job) && is_string($job['job'] ?? null) ? $job['job'] : null)
            ->filter()
            ->values()
            ->all();
    }

    /**
     * @return array{person_id: int, credit_type: string, character: string|null, billing_order: int|null, episode_count: int|null}|null
     */
    private function creditRow(
        mixed $member,
        CreditType $creditType,
        ?string $character = null,
        ?int $billingOrder = null,
        ?int $episodeCount = null,
    ): ?array {
        if (! is_array($member) || ! isset($member['id'], $member['name'])) {
            return null;
        }

        $person = Person::query()->firstOrCreate(
            ['tmdb_id' => $member['id']],
            ['name' => $member['name'], 'profile_path' => $member['profile_path'] ?? null],
        );

        return [
            'person_id' => $person->id,
            'credit_type' => $creditType->value,
            'character' => $character,
            'billing_order' => $billingOrder,
            'episode_count' => $episodeCount,
        ];
    }
}
