<?php

namespace App\Models;

use Database\Factories\GameSessionFactory;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property Carbon|null $completed_at
 */
class GameSession extends Model
{
    /** @use HasFactory<GameSessionFactory> */
    use HasFactory;

    use HasUlids;

    protected $fillable = [
        'user_id',
        'game_type',
        'theme',
        'pairs_count',
        'attempts',
        'duration_seconds',
        'status',
        'completed_at',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'pairs_count' => 'integer',
            'attempts' => 'integer',
            'duration_seconds' => 'integer',
            'completed_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
