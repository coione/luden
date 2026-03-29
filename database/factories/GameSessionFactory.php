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
            'game_type' => 'memory',
            'theme' => 'default',
            'pairs_count' => $this->faker->numberBetween(4, 16),
            'attempts' => 0,
            'duration_seconds' => null,
            'status' => 'in_progress',
            'completed_at' => null,
        ];
    }
}
