<?php

use App\Enums\TitleType;
use App\Models\Title;
use Illuminate\Support\Facades\Http;

function fakeTmdbSeries(int $id, array $overrides = []): void
{
    Http::fake([
        config('services.tmdb.base_url')."/tv/{$id}?append_to_response=aggregate_credits,keywords" => Http::response(array_merge([
            'id' => $id,
            'name' => 'Lost',
            'first_air_date' => '2004-09-22',
            'overview' => 'The survivors of a plane crash must work together to stay alive.',
            'poster_path' => '/lost.jpg',
            'popularity' => 45.3,
            'vote_average' => 8.0,
            'genres' => [
                ['id' => 9648, 'name' => 'Mystery'],
                ['id' => 18, 'name' => 'Drama'],
            ],
            'aggregate_credits' => [
                'cast' => [
                    [
                        'id' => 6384,
                        'name' => 'Matthew Fox',
                        'profile_path' => '/matthew.jpg',
                        'roles' => [
                            ['character' => 'Jack Shephard', 'episode_count' => 121],
                        ],
                    ],
                    [
                        'id' => 2,
                        'name' => 'Evangeline Lilly',
                        'profile_path' => '/evangeline.jpg',
                        'roles' => [
                            ['character' => 'Kate Austen', 'episode_count' => 118],
                        ],
                    ],
                ],
                'crew' => [
                    [
                        'id' => 10,
                        'name' => 'J.J. Abrams',
                        'profile_path' => null,
                        'department' => 'Directing',
                        'jobs' => [
                            ['job' => 'Director', 'episode_count' => 1],
                            ['job' => 'Executive Producer', 'episode_count' => 121],
                        ],
                    ],
                    [
                        'id' => 12,
                        'name' => 'Carlton Cuse',
                        'profile_path' => null,
                        'department' => 'Production',
                        'jobs' => [
                            ['job' => 'Producer', 'episode_count' => 100],
                        ],
                    ],
                    [
                        'id' => 13,
                        'name' => 'Michael Giacchino',
                        'profile_path' => null,
                        'department' => 'Sound',
                        'jobs' => [
                            ['job' => 'Original Music Composer', 'episode_count' => 121],
                        ],
                    ],
                ],
            ],
            'keywords' => [
                'results' => [
                    ['id' => 83, 'name' => 'island'],
                    ['id' => 1612, 'name' => 'plane crash'],
                ],
            ],
        ], $overrides)),

        config('services.tmdb.base_url')."/tv/{$id}/watch/providers" => Http::response([
            'id' => $id,
            'results' => [
                'US' => [
                    'link' => 'https://www.themoviedb.org/tv/4607-lost/watch',
                    'flatrate' => [
                        ['provider_id' => 15, 'provider_name' => 'Hulu', 'logo_path' => '/hulu.jpg'],
                    ],
                ],
            ],
        ]),
    ]);
}

test('a new series is fetched from tmdb and persisted with its related data', function () {
    fakeTmdbSeries(4607);

    $response = $this->get(route('series', 4607));

    $response->assertOk();

    $series = Title::query()->where('tmdb_id', 4607)->where('type', TitleType::Tv)->firstOrFail();

    expect($series->name)->toBe('Lost');
    expect($series->release_year)->toBe(2004);
    expect($series->metadata_fetched_at)->not->toBeNull();

    expect($series->genres()->pluck('name')->sort()->values()->all())
        ->toBe(['Drama', 'Mystery']);

    expect($series->keywords()->pluck('name')->sort()->values()->all())
        ->toBe(['island', 'plane crash']);

    expect($series->actors()->pluck('name')->sort()->values()->all())
        ->toBe(['Evangeline Lilly', 'Matthew Fox']);

    expect(
        $series->actors()->orderBy('name')->get()->pluck('pivot.character')->all()
    )->toBe(['Kate Austen', 'Jack Shephard']);

    expect($series->directors()->pluck('name')->all())->toBe(['J.J. Abrams']);
    expect($series->producers()->pluck('name')->all())->toBe(['Carlton Cuse']);
    expect($series->composers()->pluck('name')->all())->toBe(['Michael Giacchino']);

    expect($series->watchProviders()->pluck('name')->all())->toBe(['Hulu']);
});
