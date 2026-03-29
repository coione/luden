<?php

namespace App\Policies;

use App\Models\GameSession;
use App\Models\User;

class GameSessionPolicy
{
    public function view(User $user, GameSession $gameSession): bool
    {
        return $user->id === $gameSession->user_id;
    }

    public function update(User $user, GameSession $gameSession): bool
    {
        return $user->id === $gameSession->user_id
            && $gameSession->status === 'in_progress';
    }
}
