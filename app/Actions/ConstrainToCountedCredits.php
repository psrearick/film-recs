<?php

namespace App\Actions;

use App\Enums\CreditType;
use App\Enums\TitleType;
use Illuminate\Database\Query\Builder;
use Illuminate\Support\Facades\Config;

/**
 * Limit a query joined to `person_title` and `titles` to the credits that count
 * toward person affinities: all crew, but only top-billed cast, and for series
 * only cast who appear in enough of the episodes to be main cast.
 */
class ConstrainToCountedCredits
{
    public function apply(Builder $query): Builder
    {
        return $query->where(fn (Builder $query) => $query
            ->where('person_title.credit_type', '!=', CreditType::Cast->value)
            ->orWhere(fn (Builder $query) => $query
                ->where('person_title.billing_order', '<', Config::integer('recommendations.top_billed_cast'))
                ->where(fn (Builder $query) => $query
                    ->where('titles.type', TitleType::Movie->value)
                    ->orWhereRaw(
                        'person_title.episode_count >= titles.episode_count * ?',
                        [Config::float('recommendations.minimum_series_episode_share')],
                    ))));
    }
}
