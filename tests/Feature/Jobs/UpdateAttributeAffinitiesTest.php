<?php

use App\Actions\ConstrainToCountedCredits;
use App\Enums\AttributeType;
use App\Enums\CreditType;
use App\Enums\TitleType;
use App\Jobs\UpdateAttributeAffinities;
use App\Models\AttributeAffinity;
use App\Models\Genre;
use App\Models\Keyword;
use App\Models\Person;
use App\Models\Rating;
use App\Models\Title;
use App\Models\User;
use Illuminate\Support\Facades\Queue;

beforeEach(function () {
    Queue::fake([UpdateAttributeAffinities::class]);
    config([
        'recommendations.minimum_sample_size' => 2,
        'recommendations.top_billed_cast' => 10,
        'recommendations.minimum_series_episode_share' => 0.25,
    ]);
});

function createRatedTitle(User $user, int $score, array $attributes = []): Title
{
    $title = Title::factory()->movie()->create($attributes);
    Rating::factory()->for($user)->for($title)->create(['score' => $score]);

    return $title;
}

/**
 * @return array<int, array{attribute_id: int|null, attribute_value: string|null, affinity_score: float, sample_size: int}>
 */
function affinitiesOfType(User $user, AttributeType $attributeType): array
{
    return AttributeAffinity::query()
        ->where('user_id', $user->id)
        ->where('attribute_type', $attributeType)
        ->orderBy('attribute_id')
        ->orderBy('attribute_value')
        ->get()
        ->map(fn (AttributeAffinity $affinity) => [
            'attribute_id' => $affinity->attribute_id,
            'attribute_value' => $affinity->attribute_value,
            'affinity_score' => $affinity->affinity_score,
            'sample_size' => $affinity->sample_size,
        ])
        ->all();
}

test('genre affinities score each genre\'s mean rating against the user\'s mean rating', function () {
    $user = User::factory()->create();
    $sciFi = Genre::factory()->create();
    $drama = Genre::factory()->create();
    createRatedTitle($user, 10)->genres()->attach($sciFi);
    createRatedTitle($user, 8)->genres()->attach($sciFi);
    createRatedTitle($user, 4)->genres()->attach($drama);
    createRatedTitle($user, 2)->genres()->attach($drama);

    new UpdateAttributeAffinities($user->id)->handle(new ConstrainToCountedCredits);

    expect(affinitiesOfType($user, AttributeType::Genre))->toBe([
        ['attribute_id' => $sciFi->id, 'attribute_value' => null, 'affinity_score' => 3.0, 'sample_size' => 2],
        ['attribute_id' => $drama->id, 'attribute_value' => null, 'affinity_score' => -3.0, 'sample_size' => 2],
    ]);
});

test('attributes on fewer rated titles than the minimum sample size get no affinity', function () {
    $user = User::factory()->create();
    $genre = Genre::factory()->create();
    createRatedTitle($user, 9)->genres()->attach($genre);
    createRatedTitle($user, 3);

    new UpdateAttributeAffinities($user->id)->handle(new ConstrainToCountedCredits);

    expect(affinitiesOfType($user, AttributeType::Genre))->toBe([]);
});

test('keyword affinities score each keyword\'s mean rating against the user\'s mean rating', function () {
    $user = User::factory()->create();
    $keyword = Keyword::factory()->create();
    createRatedTitle($user, 9)->keywords()->attach($keyword);
    createRatedTitle($user, 7)->keywords()->attach($keyword);
    createRatedTitle($user, 2);

    new UpdateAttributeAffinities($user->id)->handle(new ConstrainToCountedCredits);

    expect(affinitiesOfType($user, AttributeType::Keyword))->toBe([
        ['attribute_id' => $keyword->id, 'attribute_value' => null, 'affinity_score' => 2.0, 'sample_size' => 2],
    ]);
});

test('a person gets a separate affinity for each role they are credited in', function () {
    $user = User::factory()->create();
    $person = Person::factory()->create();
    $actedAndDirected = createRatedTitle($user, 10);
    $actedAndDirected->people()->attach($person, ['credit_type' => CreditType::Cast, 'billing_order' => 0]);
    $actedAndDirected->people()->attach($person, ['credit_type' => CreditType::Director]);
    createRatedTitle($user, 6)->people()->attach($person, ['credit_type' => CreditType::Cast, 'billing_order' => 0]);
    createRatedTitle($user, 2)->people()->attach($person, ['credit_type' => CreditType::Director]);

    new UpdateAttributeAffinities($user->id)->handle(new ConstrainToCountedCredits);

    expect(affinitiesOfType($user, AttributeType::Person))->toBe([
        ['attribute_id' => $person->id, 'attribute_value' => 'cast', 'affinity_score' => 2.0, 'sample_size' => 2],
        ['attribute_id' => $person->id, 'attribute_value' => 'director', 'affinity_score' => 0.0, 'sample_size' => 2],
    ]);
});

test('cast billed outside the top-billed cutoff get no affinity', function () {
    $user = User::factory()->create();
    $lead = Person::factory()->create();
    $extra = Person::factory()->create();
    foreach ([9, 5] as $score) {
        $title = createRatedTitle($user, $score);
        $title->people()->attach($lead, ['credit_type' => CreditType::Cast, 'billing_order' => 9]);
        $title->people()->attach($extra, ['credit_type' => CreditType::Cast, 'billing_order' => 10]);
    }

    new UpdateAttributeAffinities($user->id)->handle(new ConstrainToCountedCredits);

    expect(affinitiesOfType($user, AttributeType::Person))->toBe([
        ['attribute_id' => $lead->id, 'attribute_value' => 'cast', 'affinity_score' => 0.0, 'sample_size' => 2],
    ]);
});

test('series cast who appear in less than the minimum share of episodes get no affinity', function () {
    $user = User::factory()->create();
    $mainCast = Person::factory()->create();
    $guestStar = Person::factory()->create();
    foreach ([9, 5] as $score) {
        $series = createRatedTitle($user, $score, ['type' => TitleType::Tv, 'episode_count' => 100]);
        $series->people()->attach($mainCast, ['credit_type' => CreditType::Cast, 'billing_order' => 0, 'episode_count' => 25]);
        $series->people()->attach($guestStar, ['credit_type' => CreditType::Cast, 'billing_order' => 1, 'episode_count' => 24]);
    }

    new UpdateAttributeAffinities($user->id)->handle(new ConstrainToCountedCredits);

    expect(affinitiesOfType($user, AttributeType::Person))->toBe([
        ['attribute_id' => $mainCast->id, 'attribute_value' => 'cast', 'affinity_score' => 0.0, 'sample_size' => 2],
    ]);
});

test('decade affinities group titles by release decade and skip titles without a release year', function () {
    $user = User::factory()->create();
    createRatedTitle($user, 10, ['release_year' => 1994]);
    createRatedTitle($user, 8, ['release_year' => 1999]);
    createRatedTitle($user, 3, ['release_year' => 2010]);
    createRatedTitle($user, 3, ['release_year' => null]);

    new UpdateAttributeAffinities($user->id)->handle(new ConstrainToCountedCredits);

    expect(affinitiesOfType($user, AttributeType::Decade))->toBe([
        ['attribute_id' => null, 'attribute_value' => '1990', 'affinity_score' => 3.0, 'sample_size' => 2],
    ]);
});

test('recomputing replaces the user\'s previous affinities', function () {
    $user = User::factory()->create();
    $staleAffinity = AttributeAffinity::factory()->for($user)->create();
    createRatedTitle($user, 5);

    new UpdateAttributeAffinities($user->id)->handle(new ConstrainToCountedCredits);

    expect(AttributeAffinity::query()->whereKey($staleAffinity->id)->exists())->toBeFalse();
});

test('other users\' ratings and affinities are left out of the recompute', function () {
    $user = User::factory()->create();
    $otherUser = User::factory()->create();
    $otherUsersAffinity = AttributeAffinity::factory()->for($otherUser)->create();
    $genre = Genre::factory()->create();
    createRatedTitle($user, 8)->genres()->attach($genre);
    createRatedTitle($user, 6)->genres()->attach($genre);
    createRatedTitle($otherUser, 1)->genres()->attach($genre);

    new UpdateAttributeAffinities($user->id)->handle(new ConstrainToCountedCredits);

    expect(affinitiesOfType($user, AttributeType::Genre))->toBe([
        ['attribute_id' => $genre->id, 'attribute_value' => null, 'affinity_score' => 0.0, 'sample_size' => 2],
    ]);
    expect(AttributeAffinity::query()->whereKey($otherUsersAffinity->id)->exists())->toBeTrue();
});

test('a user with no ratings is left with no affinities', function () {
    $user = User::factory()->create();
    AttributeAffinity::factory()->for($user)->create();

    new UpdateAttributeAffinities($user->id)->handle(new ConstrainToCountedCredits);

    expect(AttributeAffinity::query()->where('user_id', $user->id)->exists())->toBeFalse();
});
