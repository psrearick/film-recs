<?php

namespace App\Jobs;

use App\Actions\ConstrainToCountedCredits;
use App\Enums\AttributeType;
use App\Models\AttributeAffinity;
use App\Models\Rating;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Database\Query\Builder;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\Attributes\DebounceFor;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use stdClass;

#[DebounceFor(30, maxWait: 120)]
class UpdateAttributeAffinities implements ShouldQueue
{
    use Queueable;

    public function __construct(public int $userId) {}

    public function debounceId(): string
    {
        return (string) $this->userId;
    }

    /**
     * Replace the user's affinities with one row per attribute carried by at least the
     * minimum sample size of rated titles, scored as that attribute's mean rating minus
     * the user's overall mean rating.
     */
    public function handle(ConstrainToCountedCredits $constrainToCountedCredits): void
    {
        $userMeanScore = Rating::query()->where('user_id', $this->userId)->avg('score');

        DB::transaction(function () use ($userMeanScore, $constrainToCountedCredits) {
            AttributeAffinity::query()->where('user_id', $this->userId)->delete();

            if ($userMeanScore === null) {
                return;
            }

            $now = now();

            collect([
                AttributeType::Genre->value => $this->genreAggregates(),
                AttributeType::Keyword->value => $this->keywordAggregates(),
                AttributeType::Person->value => $this->personAggregates($constrainToCountedCredits),
                AttributeType::Decade->value => $this->decadeAggregates(),
            ])
                ->flatMap(fn (Collection $aggregates, string $attributeType) => $aggregates->map(fn (stdClass $aggregate) => [
                    'user_id' => $this->userId,
                    'attribute_type' => $attributeType,
                    'attribute_id' => $aggregate->attribute_id,
                    'attribute_value' => $aggregate->attribute_value,
                    'affinity_score' => (float) $aggregate->mean_score - (float) $userMeanScore,
                    'sample_size' => (int) $aggregate->sample_size,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]))
                ->chunk(500)
                ->each(fn (Collection $rows) => AttributeAffinity::query()->insert($rows->values()->all()));
        });
    }

    /**
     * @return Collection<int, stdClass>
     */
    private function genreAggregates(): Collection
    {
        return $this->ratingAggregates()
            ->join('genre_title', 'genre_title.title_id', '=', 'ratings.title_id')
            ->addSelect('genre_title.genre_id as attribute_id', DB::raw('NULL as attribute_value'))
            ->groupBy('genre_title.genre_id')
            ->get();
    }

    /**
     * @return Collection<int, stdClass>
     */
    private function keywordAggregates(): Collection
    {
        return $this->ratingAggregates()
            ->join('keyword_title', 'keyword_title.title_id', '=', 'ratings.title_id')
            ->addSelect('keyword_title.keyword_id as attribute_id', DB::raw('NULL as attribute_value'))
            ->groupBy('keyword_title.keyword_id')
            ->get();
    }

    /**
     * Group by role as well as person, so someone who both acts and directs gets a
     * separate affinity for each. Cast only counts when top-billed, and for series
     * only when they appear in enough of the episodes to be main cast.
     *
     * @return Collection<int, stdClass>
     */
    private function personAggregates(ConstrainToCountedCredits $constrainToCountedCredits): Collection
    {
        return $this->ratingAggregates()
            ->join('person_title', 'person_title.title_id', '=', 'ratings.title_id')
            ->join('titles', 'titles.id', '=', 'ratings.title_id')
            ->tap(fn (Builder $query) => $constrainToCountedCredits->apply($query))
            ->addSelect('person_title.person_id as attribute_id', 'person_title.credit_type as attribute_value')
            ->groupBy('person_title.person_id', 'person_title.credit_type')
            ->get();
    }

    /**
     * @return Collection<int, stdClass>
     */
    private function decadeAggregates(): Collection
    {
        $decade = 'CAST(FLOOR(titles.release_year / 10) * 10 AS CHAR)';

        return $this->ratingAggregates()
            ->join('titles', 'titles.id', '=', 'ratings.title_id')
            ->whereNotNull('titles.release_year')
            ->addSelect(DB::raw('NULL as attribute_id'), DB::raw("{$decade} as attribute_value"))
            ->groupByRaw($decade)
            ->get();
    }

    /**
     * The user's ratings with the mean score and sample size columns every attribute
     * shares, limited to groups that meet the minimum sample size.
     */
    private function ratingAggregates(): Builder
    {
        return DB::table('ratings')
            ->where('ratings.user_id', $this->userId)
            ->select(DB::raw('AVG(ratings.score) as mean_score'), DB::raw('COUNT(*) as sample_size'))
            ->havingRaw('COUNT(*) >= ?', [Config::integer('recommendations.minimum_sample_size')]);
    }
}
