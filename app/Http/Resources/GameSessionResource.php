<?php

namespace App\Http\Resources;

use App\Models\GameSession;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin GameSession */
class GameSessionResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'gameType' => $this->game_type,
            'theme' => $this->theme,
            'pairsCount' => $this->pairs_count,
            'attempts' => $this->attempts,
            'durationSeconds' => $this->duration_seconds,
            'completedAt' => $this->completed_at?->toIso8601String(),
        ];
    }
}
