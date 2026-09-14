<?php

namespace Database\Factories;

use App\Enums\TitleType;
use App\Models\Title;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Title>
 */
class TitleFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'tmdb_id' => fake()->unique()->numberBetween(1, 900000),
            'type' => fake()->randomElement(TitleType::cases()),
            'name' => fake()->sentence(3),
            'release_year' => fake()->numberBetween(1950, 2026),
            'overview' => fake()->paragraph(),
            'poster_path' => '/'.fake()->lexify('??????????').'.jpg',
            'runtime' => fake()->numberBetween(80, 180),
            'popularity' => fake()->randomFloat(3, 0, 500),
            'vote_average' => fake()->randomFloat(1, 0, 10),
            'metadata_fetched_at' => now(),
        ];
    }

    /**
     * Indicate that the title is a movie.
     */
    public function movie(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => TitleType::Movie,
        ]);
    }

    /**
     * Indicate that the title is a TV show.
     */
    public function tv(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => TitleType::Tv,
        ]);
    }
}
