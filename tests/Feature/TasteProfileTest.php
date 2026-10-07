<?php

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
        'recommendations.shrinkage_k' => 5.0,
        'recommendations.minimum_profile_ratings' => 5,
        'recommendations.minimum_confidence' => 0.5,
    ]);
});

test('a guest is redirected to login', function () {
    $response = $this->get(route('taste-profile'));

    $response->assertRedirect(route('login'));
});

test('the rating summary covers the user\'s count, average, score distribution and title types', function () {
    $user = User::factory()->create();
    Rating::factory()->for($user)->for(Title::factory()->movie())->create(['score' => 8]);
    Rating::factory()->for($user)->for(Title::factory()->movie())->create(['score' => 8]);
    Rating::factory()->for($user)->for(Title::factory()->tv())->create(['score' => 5]);

    $response = $this->actingAs($user)->get(route('taste-profile'));

    $response->assertInertia(fn ($page) => $page
        ->component('taste-profile')
        ->where('ratingCount', 3)
        ->where('minimumRatingCount', 5)
        ->where('averageScore', 7)
        ->where('scoreDistribution', [
            ['score' => 1, 'count' => 0],
            ['score' => 2, 'count' => 0],
            ['score' => 3, 'count' => 0],
            ['score' => 4, 'count' => 0],
            ['score' => 5, 'count' => 1],
            ['score' => 6, 'count' => 0],
            ['score' => 7, 'count' => 0],
            ['score' => 8, 'count' => 2],
            ['score' => 9, 'count' => 0],
            ['score' => 10, 'count' => 0],
        ])
        ->where('typeBreakdown', [
            ['type' => TitleType::Movie->value, 'count' => 2, 'average_score' => 8],
            ['type' => TitleType::Tv->value, 'count' => 1, 'average_score' => 5],
        ]));
});

test('genres are named and ranked by affinity weighted by confidence', function () {
    $user = User::factory()->create();
    $drama = Genre::factory()->create(['name' => 'Drama']);
    $sciFi = Genre::factory()->create(['name' => 'Science Fiction']);
    AttributeAffinity::factory()->for($user)->create([
        'attribute_id' => $drama->id,
        'affinity_score' => -1.4,
        'sample_size' => 2,
    ]);
    AttributeAffinity::factory()->for($user)->create([
        'attribute_id' => $sciFi->id,
        'affinity_score' => 2.0,
        'sample_size' => 5,
    ]);

    $response = $this->actingAs($user)->get(route('taste-profile', ['include_low_confidence' => 1]));

    $response->assertInertia(fn ($page) => $page->where('genres', [
        [
            'id' => $sciFi->id,
            'label' => 'Science Fiction',
            'affinity_score' => 2,
            'confidence' => 0.5,
            'weighted_score' => 1,
            'sample_size' => 5,
            'is_low_confidence' => false,
        ],
        [
            'id' => $drama->id,
            'label' => 'Drama',
            'affinity_score' => -1.4,
            'confidence' => 0.29,
            'weighted_score' => -0.4,
            'sample_size' => 2,
            'is_low_confidence' => true,
        ],
    ]));
});

test('low-confidence affinities are hidden by default and the hidden genres and decades are counted', function () {
    $user = User::factory()->create();
    $confidentGenre = Genre::factory()->create();
    $thinGenre = Genre::factory()->create();
    $thinKeyword = Keyword::factory()->create();
    AttributeAffinity::factory()->for($user)->create(['attribute_id' => $confidentGenre->id, 'sample_size' => 5]);
    AttributeAffinity::factory()->for($user)->create(['attribute_id' => $thinGenre->id, 'sample_size' => 4]);
    AttributeAffinity::factory()->for($user)->create([
        'attribute_type' => AttributeType::Decade,
        'attribute_id' => null,
        'attribute_value' => '1970',
        'sample_size' => 2,
    ]);
    AttributeAffinity::factory()->for($user)->create([
        'attribute_type' => AttributeType::Keyword,
        'attribute_id' => $thinKeyword->id,
        'affinity_score' => 3.0,
        'sample_size' => 3,
    ]);

    $response = $this->actingAs($user)->get(route('taste-profile'));

    $response->assertInertia(fn ($page) => $page
        ->where('includeLowConfidence', false)
        ->where('minimumConfidentSampleSize', 5)
        ->where('hiddenCounts', ['genres' => 1, 'decades' => 1])
        ->has('genres', 1)
        ->where('genres.0.id', $confidentGenre->id)
        ->where('genres.0.is_low_confidence', false)
        ->where('decades', [])
        ->where('keywords.favored', []));
});

test('including low-confidence affinities shows them all and hides nothing', function () {
    $user = User::factory()->create();
    $thinGenre = Genre::factory()->create();
    AttributeAffinity::factory()->for($user)->create(['attribute_id' => $thinGenre->id, 'sample_size' => 4]);

    $response = $this->actingAs($user)->get(route('taste-profile', ['include_low_confidence' => 1]));

    $response->assertInertia(fn ($page) => $page
        ->where('includeLowConfidence', true)
        ->where('hiddenCounts', ['genres' => 0, 'decades' => 0])
        ->where('genres.0.id', $thinGenre->id)
        ->where('genres.0.is_low_confidence', true));
});

test('decades are labeled and listed chronologically', function () {
    $user = User::factory()->create();
    foreach (['2000', '1980', '1990'] as $decade) {
        AttributeAffinity::factory()->for($user)->create([
            'attribute_type' => AttributeType::Decade,
            'attribute_id' => null,
            'attribute_value' => $decade,
            'sample_size' => 10,
        ]);
    }

    $response = $this->actingAs($user)->get(route('taste-profile'));

    $response->assertInertia(fn ($page) => $page
        ->where('decades.0.label', '1980s')
        ->where('decades.1.label', '1990s')
        ->where('decades.2.label', '2000s'));
});

test('keywords are split into the strongest favored and disfavored, up to ten of each', function () {
    $user = User::factory()->create();
    $favoredKeywords = Keyword::factory()->count(11)->create();
    foreach ($favoredKeywords as $index => $keyword) {
        AttributeAffinity::factory()->for($user)->create([
            'attribute_type' => AttributeType::Keyword,
            'attribute_id' => $keyword->id,
            'affinity_score' => $index + 1,
            'sample_size' => 5,
        ]);
    }
    $disfavoredKeyword = Keyword::factory()->create(['name' => 'time loop']);
    AttributeAffinity::factory()->for($user)->create([
        'attribute_type' => AttributeType::Keyword,
        'attribute_id' => $disfavoredKeyword->id,
        'affinity_score' => -2.0,
        'sample_size' => 5,
    ]);

    $response = $this->actingAs($user)->get(route('taste-profile'));

    $response->assertInertia(fn ($page) => $page
        ->has('keywords.favored', 10)
        ->where('keywords.favored.0.id', $favoredKeywords->last()->id)
        ->where('keywords.favored.9.id', $favoredKeywords[1]->id)
        ->has('keywords.disfavored', 1)
        ->where('keywords.disfavored.0.label', 'time loop'));
});

test('people are grouped by role in credit type order, leaving out roles without affinities', function () {
    $user = User::factory()->create();
    $composer = Person::factory()->create(['name' => 'Hans Zimmer', 'tmdb_id' => 947, 'profile_path' => '/hans.jpg']);
    $director = Person::factory()->create(['name' => 'Christopher Nolan', 'tmdb_id' => 525]);
    AttributeAffinity::factory()->for($user)->create([
        'attribute_type' => AttributeType::Person,
        'attribute_id' => $composer->id,
        'attribute_value' => CreditType::Composer->value,
        'affinity_score' => -1.0,
        'sample_size' => 5,
    ]);
    AttributeAffinity::factory()->for($user)->create([
        'attribute_type' => AttributeType::Person,
        'attribute_id' => $director->id,
        'attribute_value' => CreditType::Director->value,
        'affinity_score' => 2.0,
        'sample_size' => 5,
    ]);

    $response = $this->actingAs($user)->get(route('taste-profile'));

    $response->assertInertia(fn ($page) => $page
        ->has('people', 2)
        ->where('people.0.role', 'director')
        ->where('people.0.favored.0.label', 'Christopher Nolan')
        ->where('people.0.favored.0.tmdb_id', 525)
        ->where('people.0.disfavored', [])
        ->where('people.1.role', 'composer')
        ->where('people.1.favored', [])
        ->where('people.1.disfavored.0.label', 'Hans Zimmer')
        ->where('people.1.disfavored.0.profile_path', '/hans.jpg'));
});

test('another user\'s ratings and affinities are left out of the profile', function () {
    $user = User::factory()->create();
    $otherUser = User::factory()->create();
    Rating::factory()->for($otherUser)->create();
    AttributeAffinity::factory()->for($otherUser)->create(['attribute_id' => Genre::factory()->create()->id]);

    $response = $this->actingAs($user)->get(route('taste-profile'));

    $response->assertInertia(fn ($page) => $page
        ->where('ratingCount', 0)
        ->where('averageScore', null)
        ->where('typeBreakdown', [])
        ->where('genres', [])
        ->where('updatedAt', null));
});

function rateTitleForProfile(User $user, int $score, array $attributes = []): Title
{
    $title = Title::factory()->movie()->create($attributes);
    Rating::factory()->for($user)->for($title)->create(['score' => $score]);

    return $title;
}

describe('titles', function () {
    test('a guest cannot list the titles behind an affinity', function () {
        $response = $this->getJson(route('taste-profile.titles', ['type' => 'genre', 'id' => 1]));

        $response->assertUnauthorized();
    });

    test('genre titles are the user\'s rated titles with that genre, highest rated first', function () {
        $user = User::factory()->create();
        $genre = Genre::factory()->create();
        $okTitle = rateTitleForProfile($user, 6, ['name' => 'Arrival', 'release_year' => 2016, 'poster_path' => '/arrival.jpg']);
        $bestTitle = rateTitleForProfile($user, 9, ['name' => 'Dune']);
        $okTitle->genres()->attach($genre);
        $bestTitle->genres()->attach($genre);
        rateTitleForProfile($user, 10);
        $otherUsersTitle = rateTitleForProfile(User::factory()->create(), 3);
        $otherUsersTitle->genres()->attach($genre);

        $response = $this->actingAs($user)->getJson(route('taste-profile.titles', ['type' => 'genre', 'id' => $genre->id]));

        $response->assertOk()->assertExactJson(['titles' => [
            [
                'id' => $bestTitle->id,
                'tmdb_id' => $bestTitle->tmdb_id,
                'type' => 'movie',
                'name' => 'Dune',
                'release_year' => $bestTitle->release_year,
                'poster_path' => $bestTitle->poster_path,
                'score' => 9,
            ],
            [
                'id' => $okTitle->id,
                'tmdb_id' => $okTitle->tmdb_id,
                'type' => 'movie',
                'name' => 'Arrival',
                'release_year' => 2016,
                'poster_path' => '/arrival.jpg',
                'score' => 6,
            ],
        ]]);
    });

    test('keyword titles are the user\'s rated titles with that keyword', function () {
        $user = User::factory()->create();
        $keyword = Keyword::factory()->create();
        $title = rateTitleForProfile($user, 8);
        $title->keywords()->attach($keyword);
        rateTitleForProfile($user, 5);

        $response = $this->actingAs($user)->getJson(route('taste-profile.titles', ['type' => 'keyword', 'id' => $keyword->id]));

        $response->assertOk()->assertJsonPath('titles.*.id', [$title->id]);
    });

    test('person titles match the role and only include credits that count toward the affinity', function () {
        $user = User::factory()->create();
        $person = Person::factory()->create();
        $leadRole = rateTitleForProfile($user, 9);
        $leadRole->people()->attach($person, ['credit_type' => CreditType::Cast, 'billing_order' => 0]);
        $bitPart = rateTitleForProfile($user, 7);
        $bitPart->people()->attach($person, ['credit_type' => CreditType::Cast, 'billing_order' => 40]);
        $directed = rateTitleForProfile($user, 5);
        $directed->people()->attach($person, ['credit_type' => CreditType::Director]);

        $response = $this->actingAs($user)->getJson(route('taste-profile.titles', [
            'type' => 'person',
            'id' => $person->id,
            'value' => 'cast',
        ]));

        $response->assertOk()->assertJsonPath('titles.*.id', [$leadRole->id]);
    });

    test('decade titles span the ten release years starting at the decade', function () {
        $user = User::factory()->create();
        $first = rateTitleForProfile($user, 9, ['release_year' => 1990]);
        $last = rateTitleForProfile($user, 8, ['release_year' => 1999]);
        rateTitleForProfile($user, 7, ['release_year' => 2000]);
        rateTitleForProfile($user, 7, ['release_year' => 1989]);

        $response = $this->actingAs($user)->getJson(route('taste-profile.titles', ['type' => 'decade', 'value' => '1990']));

        $response->assertOk()->assertJsonPath('titles.*.id', [$first->id, $last->id]);
    });

    test('score titles are every title the user gave that score', function () {
        $user = User::factory()->create();
        $title = rateTitleForProfile($user, 7, ['name' => 'Alien']);
        $anotherTitle = rateTitleForProfile($user, 7, ['name' => 'Blade Runner']);
        rateTitleForProfile($user, 8);

        $response = $this->actingAs($user)->getJson(route('taste-profile.titles', ['type' => 'score', 'value' => 7]));

        $response->assertOk()->assertJsonPath('titles.*.id', [$title->id, $anotherTitle->id]);
    });

    test('an unknown type or a person without a role is rejected', function (array $query, string $invalidField) {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->getJson(route('taste-profile.titles', $query));

        $response->assertUnprocessable()->assertJsonValidationErrors([$invalidField]);
    })->with([
        'unknown type' => [['type' => 'studio', 'id' => 1], 'type'],
        'person without a role' => [['type' => 'person', 'id' => 1], 'value'],
        'person with an unknown role' => [['type' => 'person', 'id' => 1, 'value' => 'grip'], 'value'],
        'score out of range' => [['type' => 'score', 'value' => 11], 'value'],
    ]);
});
