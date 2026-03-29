<?php

namespace App\Http\Controllers\Games;

use App\Games\MemoTest\ThemeRegistry;
use App\Http\Controllers\Controller;
use App\Http\Requests\Games\StoreGameSessionRequest;
use App\Http\Requests\Games\UpdateGameSessionRequest;
use App\Http\Resources\GameSessionResource;
use App\Models\GameSession;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class GameSessionController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Games/MemoTest/Index', [
            'themes' => ThemeRegistry::all(),
            'pairCounts' => [3, 4, 6],
        ]);
    }

    public function store(StoreGameSessionRequest $request): RedirectResponse
    {
        $user = $request->user();
        if (! $user instanceof \App\Models\User) {
            abort(403);
        }

        $theme = $request->validated('theme');
        $pairsCount = $request->validated('pairs_count');

        if (! is_string($theme) || ! is_int($pairsCount)) {
            abort(422);
        }

        $session = GameSession::create([
            'user_id' => $user->id,
            'game_type' => 'memo-test',
            'theme' => $theme,
            'pairs_count' => $pairsCount,
            'status' => 'in_progress',
        ]);

        return redirect()->route('games.memo-test.show', $session);
    }

    public function show(Request $request, GameSession $gameSession): Response
    {
        Gate::authorize('view', $gameSession);

        return Inertia::render('Games/MemoTest/Play', [
            'sessionId' => $gameSession->id,
            'theme' => $gameSession->theme,
            'pairCount' => $gameSession->pairs_count,
        ]);
    }

    public function update(UpdateGameSessionRequest $request, GameSession $gameSession): JsonResponse
    {
        Gate::authorize('update', $gameSession);

        $attempts = $request->validated('attempts');
        $durationSeconds = $request->validated('duration_seconds');
        $completedAt = $request->validated('completed_at');

        if (! is_int($attempts) || ! is_int($durationSeconds) || ! is_string($completedAt)) {
            abort(422);
        }

        $gameSession->update([
            'attempts' => $attempts,
            'duration_seconds' => $durationSeconds,
            'completed_at' => $completedAt,
            'status' => 'completed',
        ]);

        return response()->json(['ok' => true]);
    }

    public function history(Request $request): Response
    {
        $user = $request->user();
        if (! $user instanceof \App\Models\User) {
            abort(403);
        }

        $sessions = GameSession::query()
            ->where('user_id', $user->id)
            ->where('status', 'completed')
            ->orderByDesc('completed_at')
            ->get();

        return Inertia::render('Games/MemoTest/History', [
            'sessions' => GameSessionResource::collection($sessions),
        ]);
    }
}
