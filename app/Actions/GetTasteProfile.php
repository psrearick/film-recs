<?php

namespace App\Actions;

use App\Enums\AttributeType;
use App\Enums\CreditType;
use App\Models\AttributeAffinity;
use App\Models\Genre;
use App\Models\Keyword;
use App\Models\Person;
use App\Models\Rating;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;

/**
 * @phpstan-type Affinity array{id: int|null, label: string, affinity_score: float, confidence: float, weighted_score: float, sample_size: int, is_low_confidence: bool}
 * @phpstan-type PersonAffinity array{id: int|null, label: string, affinity_score: float, confidence: float, weighted_score: float, sample_size: int, is_low_confidence: bool, tmdb_id: int, profile_path: string|null}
 */
class GetTasteProfile
{
    private const int KEYWORD_LIMIT = 10;

    private const int PERSON_LIMIT = 6;

    /**
     * Low-confidence affinities are left out unless asked for, so every list and the
     * summary built from them only reflect well-supported results by default.
     *
     * @return array{
     *     includeLowConfidence: bool,
     *     minimumConfidentSampleSize: int,
     *     hiddenCounts: array{genres: int, decades: int},
     *     ratingCount: int,
     *     minimumRatingCount: int,
     *     averageScore: float|null,
     *     scoreDistribution: array<int, array{score: int, count: int}>,
     *     typeBreakdown: array<int, array{type: string, count: int, average_score: float}>,
     *     updatedAt: string|null,
     *     genres: array<int, Affinity>,
     *     decades: array<int, Affinity>,
     *     keywords: array{favored: array<int, Affinity>, disfavored: array<int, Affinity>},
     *     people: array<int, array{role: string, favored: array<int, PersonAffinity>, disfavored: array<int, PersonAffinity>}>,
     * }
     */
    public function get(User $user, bool $includeLowConfidence = false): array
    {
        $allAffinities = AttributeAffinity::query()->where('user_id', $user->id)->get();
        $affinities = $includeLowConfidence
            ? $allAffinities
            : $allAffinities->reject(fn (AttributeAffinity $affinity) => $affinity->isLowConfidence());
        $hiddenAffinities = $allAffinities->diff($affinities);
        $averageScore = $user->ratings()->avg('score');

        return [
            'includeLowConfidence' => $includeLowConfidence,
            'minimumConfidentSampleSize' => $this->minimumConfidentSampleSize(),
            'hiddenCounts' => [
                'genres' => $hiddenAffinities->where('attribute_type', AttributeType::Genre)->count(),
                'decades' => $hiddenAffinities->where('attribute_type', AttributeType::Decade)->count(),
            ],
            'ratingCount' => $user->ratings()->count(),
            'minimumRatingCount' => Config::integer('recommendations.minimum_profile_ratings'),
            'averageScore' => is_numeric($averageScore) ? round((float) $averageScore, 1) : null,
            'scoreDistribution' => $this->scoreDistribution($user),
            'typeBreakdown' => $this->typeBreakdown($user),
            'updatedAt' => $allAffinities->sortByDesc('updated_at')->first()?->updated_at?->toIso8601String(),
            'genres' => $this->genreAffinities($affinities),
            'decades' => $this->decadeAffinities($affinities),
            'keywords' => $this->keywordAffinities($affinities),
            'people' => $this->personAffinities($affinities),
        ];
    }

    /**
     * The fewest rated titles an affinity needs to reach the minimum confidence,
     * from solving n / (n + k) >= minimum for n. Rounded before taking the ceiling
     * so floating point error can't push an exact answer up a whole title.
     */
    private function minimumConfidentSampleSize(): int
    {
        $minimumConfidence = Config::float('recommendations.minimum_confidence');
        $shrinkage = Config::float('recommendations.shrinkage_k');

        return (int) ceil(round($minimumConfidence * $shrinkage / (1 - $minimumConfidence), 6));
    }

    /**
     * The number of ratings at each score from 1 to 10, including scores with none.
     *
     * @return array<int, array{score: int, count: int}>
     */
    private function scoreDistribution(User $user): array
    {
        $countsByScore = $user->ratings()->get(['score'])->countBy(fn (Rating $rating) => $rating->score);

        return array_map(
            fn (int $score) => ['score' => $score, 'count' => $countsByScore->get($score) ?? 0],
            range(1, 10),
        );
    }

    /**
     * @return array<int, array{type: string, count: int, average_score: float}>
     */
    private function typeBreakdown(User $user): array
    {
        return DB::table('ratings')
            ->join('titles', 'titles.id', '=', 'ratings.title_id')
            ->where('ratings.user_id', $user->id)
            ->groupBy('titles.type')
            ->orderBy('titles.type')
            ->selectRaw('titles.type, COUNT(*) as rating_count, AVG(ratings.score) as average_score')
            ->get()
            ->map(fn (object $row) => [
                'type' => (string) $row->type,
                'count' => (int) $row->rating_count,
                'average_score' => round((float) $row->average_score, 1),
            ])
            ->all();
    }

    /**
     * @param  Collection<int, AttributeAffinity>  $affinities
     * @return array<int, Affinity>
     */
    private function genreAffinities(Collection $affinities): array
    {
        $genreAffinities = $affinities->where('attribute_type', AttributeType::Genre);
        $genres = Genre::query()->whereIn('id', $genreAffinities->pluck('attribute_id'))->get(['id', 'name'])->keyBy('id');

        return collect($this->labeledAffinities($genreAffinities, $genres))
            ->sortByDesc('weighted_score')
            ->values()
            ->all();
    }

    /**
     * @param  Collection<int, AttributeAffinity>  $affinities
     * @return array<int, Affinity>
     */
    private function decadeAffinities(Collection $affinities): array
    {
        return $affinities
            ->where('attribute_type', AttributeType::Decade)
            ->sortBy('attribute_value')
            ->map(fn (AttributeAffinity $affinity) => $this->affinity($affinity, "{$affinity->attribute_value}s"))
            ->values()
            ->all();
    }

    /**
     * @param  Collection<int, AttributeAffinity>  $affinities
     * @return array{favored: array<int, Affinity>, disfavored: array<int, Affinity>}
     */
    private function keywordAffinities(Collection $affinities): array
    {
        [$favored, $disfavored] = $this->strongestAffinities(
            $affinities->where('attribute_type', AttributeType::Keyword),
            self::KEYWORD_LIMIT,
        );
        $keywords = Keyword::query()
            ->whereIn('id', $favored->merge($disfavored)->pluck('attribute_id'))
            ->get(['id', 'name'])
            ->keyBy('id');

        return [
            'favored' => $this->labeledAffinities($favored, $keywords),
            'disfavored' => $this->labeledAffinities($disfavored, $keywords),
        ];
    }

    /**
     * The strongest favored and disfavored people in each role, in credit type order,
     * leaving out roles with no affinities.
     *
     * @param  Collection<int, AttributeAffinity>  $affinities
     * @return array<int, array{role: string, favored: array<int, PersonAffinity>, disfavored: array<int, PersonAffinity>}>
     */
    private function personAffinities(Collection $affinities): array
    {
        $personAffinities = $affinities->where('attribute_type', AttributeType::Person);

        $strongestByRole = collect(CreditType::cases())
            ->mapWithKeys(fn (CreditType $role) => [$role->value => $this->strongestAffinities(
                $personAffinities->where('attribute_value', $role->value),
                self::PERSON_LIMIT,
            )]);

        $people = Person::query()
            ->whereIn('id', $strongestByRole->flatMap(fn (array $strongest) => $strongest[0]->merge($strongest[1]))->pluck('attribute_id'))
            ->get(['id', 'tmdb_id', 'name', 'profile_path'])
            ->keyBy('id');

        return $strongestByRole
            ->map(fn (array $strongest, string $role) => [
                'role' => $role,
                'favored' => $this->personAffinitiesWithDetails($strongest[0], $people),
                'disfavored' => $this->personAffinitiesWithDetails($strongest[1], $people),
            ])
            ->filter(fn (array $roleAffinities) => $roleAffinities['favored'] !== [] || $roleAffinities['disfavored'] !== [])
            ->values()
            ->all();
    }

    /**
     * Label each affinity with its genre or keyword name, dropping any whose
     * attribute no longer exists.
     *
     * @param  Collection<int, AttributeAffinity>  $affinities
     * @param  Collection<array-key, Genre>|Collection<array-key, Keyword>  $attributes
     * @return array<int, Affinity>
     */
    private function labeledAffinities(Collection $affinities, Collection $attributes): array
    {
        return $affinities
            ->map(function (AttributeAffinity $affinity) use ($attributes) {
                $attribute = $attributes->get($affinity->attribute_id);

                return $attribute ? $this->affinity($affinity, $attribute->name) : null;
            })
            ->filter()
            ->values()
            ->all();
    }

    /**
     * @param  Collection<int, AttributeAffinity>  $affinities
     * @param  Collection<array-key, Person>  $people
     * @return array<int, PersonAffinity>
     */
    private function personAffinitiesWithDetails(Collection $affinities, Collection $people): array
    {
        return $affinities
            ->map(function (AttributeAffinity $affinity) use ($people) {
                $person = $people->get($affinity->attribute_id);

                return $person ? [
                    ...$this->affinity($affinity, $person->name),
                    'tmdb_id' => $person->tmdb_id,
                    'profile_path' => $person->profile_path,
                ] : null;
            })
            ->filter()
            ->values()
            ->all();
    }

    /**
     * Split affinities into the most favored and most disfavored, ranked by score
     * weighted by confidence so small samples don't crowd out well-supported ones.
     *
     * @param  Collection<int, AttributeAffinity>  $affinities
     * @return array{0: Collection<int, AttributeAffinity>, 1: Collection<int, AttributeAffinity>}
     */
    private function strongestAffinities(Collection $affinities, int $limit): array
    {
        $weightedScore = fn (AttributeAffinity $affinity) => $affinity->affinity_score * $affinity->confidence;

        return [
            $affinities->filter(fn (AttributeAffinity $affinity) => $weightedScore($affinity) > 0)
                ->sortByDesc($weightedScore)
                ->take($limit)
                ->values(),
            $affinities->filter(fn (AttributeAffinity $affinity) => $weightedScore($affinity) < 0)
                ->sortBy($weightedScore)
                ->take($limit)
                ->values(),
        ];
    }

    /**
     * @return Affinity
     */
    private function affinity(AttributeAffinity $affinity, string $label): array
    {
        return [
            'id' => $affinity->attribute_id,
            'label' => $label,
            'affinity_score' => round($affinity->affinity_score, 2),
            'confidence' => round($affinity->confidence, 2),
            'weighted_score' => round($affinity->affinity_score * $affinity->confidence, 2),
            'sample_size' => $affinity->sample_size,
            'is_low_confidence' => $affinity->isLowConfidence(),
        ];
    }
}
