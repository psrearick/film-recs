<?php

namespace Database\Factories;

use App\Enums\AttributeType;
use App\Models\AttributeAffinity;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<AttributeAffinity>
 */
class AttributeAffinityFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'attribute_type' => AttributeType::Genre,
            'attribute_id' => fake()->numberBetween(1, 10000),
            'attribute_value' => null,
            'affinity_score' => fake()->randomFloat(2, -5, 5),
            'sample_size' => fake()->numberBetween(2, 20),
        ];
    }
}
