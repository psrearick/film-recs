<?php

namespace App\Actions;

use App\Enums\AttributeType;
use App\Models\User;
use Illuminate\Database\Query\Builder;
use Illuminate\Support\Facades\DB;
use stdClass;

/**
 * The user's rated titles behind an affinity or a score, highest rated first.
 *
 * @phpstan-type RatedTitle array{id: int, tmdb_id: int, type: string, name: string, release_year: int|null, poster_path: string|null, score: int}
 */
class GetAffinityTitles
{
    public function __construct(private ConstrainToCountedCredits $constrainToCountedCredits) {}

    /**
     * @return array<int, RatedTitle>
     */
    public function forAttribute(User $user, AttributeType $attributeType, ?int $attributeId, ?string $attributeValue): array
    {
        $query = $this->ratedTitles($user);

        match ($attributeType) {
            AttributeType::Genre => $query
                ->join('genre_title', 'genre_title.title_id', '=', 'titles.id')
                ->where('genre_title.genre_id', $attributeId),
            AttributeType::Keyword => $query
                ->join('keyword_title', 'keyword_title.title_id', '=', 'titles.id')
                ->where('keyword_title.keyword_id', $attributeId),
            AttributeType::Person => $this->constrainToCountedCredits->apply($query
                ->join('person_title', 'person_title.title_id', '=', 'titles.id')
                ->where('person_title.person_id', $attributeId)
                ->where('person_title.credit_type', $attributeValue)),
            AttributeType::Decade => $query
                ->whereBetween('titles.release_year', [(int) $attributeValue, (int) $attributeValue + 9]),
        };

        return $this->toRatedTitles($query);
    }

    /**
     * @return array<int, RatedTitle>
     */
    public function forScore(User $user, int $score): array
    {
        return $this->toRatedTitles($this->ratedTitles($user)->where('ratings.score', $score));
    }

    private function ratedTitles(User $user): Builder
    {
        return DB::table('ratings')
            ->join('titles', 'titles.id', '=', 'ratings.title_id')
            ->where('ratings.user_id', $user->id)
            ->select([
                'titles.id',
                'titles.tmdb_id',
                'titles.type',
                'titles.name',
                'titles.release_year',
                'titles.poster_path',
                'ratings.score',
            ])
            ->orderByDesc('ratings.score')
            ->orderBy('titles.name');
    }

    /**
     * @return array<int, RatedTitle>
     */
    private function toRatedTitles(Builder $query): array
    {
        return $query->get()
            ->map(fn (stdClass $title) => [
                'id' => (int) $title->id,
                'tmdb_id' => (int) $title->tmdb_id,
                'type' => (string) $title->type,
                'name' => (string) $title->name,
                'release_year' => $title->release_year === null ? null : (int) $title->release_year,
                'poster_path' => $title->poster_path === null ? null : (string) $title->poster_path,
                'score' => (int) $title->score,
            ])
            ->all();
    }
}
