<?php

namespace Database\Factories;

use App\Models\GameSession;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<GameSession>
 */
class GameSessionFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'game_type' => 'memo-test',
            'theme' => 'animals',
            'pairs_count' => $this->faker->randomElement([3, 4, 6]),
            'attempts' => 0,
            'duration_seconds' => null,
            'status' => 'in_progress',
            'completed_at' => null,
        ];
    }

    public function completed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'completed',
            'attempts' => $this->faker->numberBetween(6, 20),
            'duration_seconds' => $this->faker->numberBetween(30, 300),
            'completed_at' => now()->subMinutes($this->faker->numberBetween(1, 60)),
        ]);
    }
}
