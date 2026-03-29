<?php

use App\Models\GameSession;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->withoutVite();
});

// ---------------------------------------------------------------------------
// Auth guard
// ---------------------------------------------------------------------------

test('guest accessing GET /games/memo-test is redirected to login', function () {
    $response = $this->get(route('games.memo-test.index'));

    $response->assertRedirect(route('login'));
});

test('guest POSTing to /games/memo-test is redirected to login', function () {
    $response = $this->post(route('games.memo-test.store'), [
        'theme' => 'animals',
        'pairs_count' => 3,
    ]);

    $response->assertRedirect(route('login'));
});

// ---------------------------------------------------------------------------
// Config page (index)
// ---------------------------------------------------------------------------

test('authenticated user can see config page with themes and pairCounts props', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->get(route('games.memo-test.index'));

    $response->assertOk()->assertInertia(
        fn ($page) => $page
        ->component('Games/MemoTest/Index')
        ->has('themes')
        ->has('pairCounts')
    );
});

// ---------------------------------------------------------------------------
// Store (create session)
// ---------------------------------------------------------------------------

test('valid POST creates game_sessions row and redirects to show', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->post(route('games.memo-test.store'), [
        'theme' => 'animals',
        'pairs_count' => 3,
    ]);

    $this->assertDatabaseHas('game_sessions', [
        'user_id' => $user->id,
        'theme' => 'animals',
        'pairs_count' => 3,
        'status' => 'in_progress',
    ]);

    $session = GameSession::where('user_id', $user->id)->first();

    $response->assertRedirect(route('games.memo-test.show', $session));
});

test('invalid theme returns 422', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)
        ->withHeader('Accept', 'application/json')
        ->post(route('games.memo-test.store'), [
            'theme' => 'invalid-theme',
            'pairs_count' => 3,
        ]);

    $response->assertStatus(422);
});

test('invalid pairs_count returns 422', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)
        ->withHeader('Accept', 'application/json')
        ->post(route('games.memo-test.store'), [
            'theme' => 'animals',
            'pairs_count' => 99,
        ]);

    $response->assertStatus(422);
});

test('missing theme returns 422', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)
        ->withHeader('Accept', 'application/json')
        ->post(route('games.memo-test.store'), [
            'pairs_count' => 3,
        ]);

    $response->assertStatus(422);
});

// ---------------------------------------------------------------------------
// Show (play page)
// ---------------------------------------------------------------------------

test('user can view their own session', function () {
    $user = User::factory()->create();
    $session = GameSession::factory()->for($user)->create();

    $response = $this->actingAs($user)->get(route('games.memo-test.show', $session));

    $response->assertOk()->assertInertia(
        fn ($page) => $page
        ->component('Games/MemoTest/Play')
    );
});

test('user cannot view another user\'s session', function () {
    $owner = User::factory()->create();
    $other = User::factory()->create();
    $session = GameSession::factory()->for($owner)->create();

    $response = $this->actingAs($other)->get(route('games.memo-test.show', $session));

    $response->assertStatus(403);
});

// ---------------------------------------------------------------------------
// Update (save result)
// ---------------------------------------------------------------------------

test('user can PATCH their own in_progress session and gets ok:true', function () {
    $user = User::factory()->create();
    $session = GameSession::factory()->for($user)->create(['status' => 'in_progress']);

    $response = $this->actingAs($user)->patch(route('games.memo-test.update', $session), [
        'attempts' => 10,
        'duration_seconds' => 120,
        'completed_at' => now()->toDateTimeString(),
    ]);

    $response->assertOk()->assertJson(['ok' => true]);
});

test('session is updated with status completed, attempts, and duration_seconds', function () {
    $user = User::factory()->create();
    $session = GameSession::factory()->for($user)->create(['status' => 'in_progress']);

    $this->actingAs($user)->patch(route('games.memo-test.update', $session), [
        'attempts' => 15,
        'duration_seconds' => 90,
        'completed_at' => now()->toDateTimeString(),
    ]);

    $session->refresh();

    expect($session->status)->toBe('completed')
        ->and($session->attempts)->toBe(15)
        ->and($session->duration_seconds)->toBe(90);
});

test('user cannot update another user\'s session', function () {
    $owner = User::factory()->create();
    $other = User::factory()->create();
    $session = GameSession::factory()->for($owner)->create(['status' => 'in_progress']);

    $response = $this->actingAs($other)->patch(route('games.memo-test.update', $session), [
        'attempts' => 10,
        'duration_seconds' => 60,
        'completed_at' => now()->toDateTimeString(),
    ]);

    $response->assertStatus(403);
});

test('user cannot update already-completed session', function () {
    $user = User::factory()->create();
    $session = GameSession::factory()->for($user)->completed()->create();

    $response = $this->actingAs($user)->patch(route('games.memo-test.update', $session), [
        'attempts' => 10,
        'duration_seconds' => 60,
        'completed_at' => now()->toDateTimeString(),
    ]);

    $response->assertStatus(403);
});

test('update with invalid payload (attempts > 9999) returns 422', function () {
    $user = User::factory()->create();
    $session = GameSession::factory()->for($user)->create(['status' => 'in_progress']);

    $response = $this->actingAs($user)
        ->withHeader('Accept', 'application/json')
        ->patch(route('games.memo-test.update', $session), [
            'attempts' => 10000,
            'duration_seconds' => 60,
            'completed_at' => now()->toDateTimeString(),
        ]);

    $response->assertStatus(422);
});

// ---------------------------------------------------------------------------
// History
// ---------------------------------------------------------------------------

test('history returns only completed sessions for current user', function () {
    $user = User::factory()->create();
    GameSession::factory()->for($user)->completed()->count(3)->create();

    $response = $this->actingAs($user)->get(route('games.memo-test.history'));

    $response->assertOk()->assertInertia(
        fn ($page) => $page
        ->component('Games/MemoTest/History')
        ->has('sessions.data', 3)
    );
});

test('history does not return in_progress sessions', function () {
    $user = User::factory()->create();
    GameSession::factory()->for($user)->completed()->count(2)->create();
    GameSession::factory()->for($user)->create(['status' => 'in_progress']);

    $response = $this->actingAs($user)->get(route('games.memo-test.history'));

    $response->assertOk()->assertInertia(
        fn ($page) => $page
        ->component('Games/MemoTest/History')
        ->has('sessions.data', 2)
    );
});

test('history does not return other users\' sessions', function () {
    $user = User::factory()->create();
    $other = User::factory()->create();
    GameSession::factory()->for($user)->completed()->count(2)->create();
    GameSession::factory()->for($other)->completed()->count(3)->create();

    $response = $this->actingAs($user)->get(route('games.memo-test.history'));

    $response->assertOk()->assertInertia(
        fn ($page) => $page
        ->component('Games/MemoTest/History')
        ->has('sessions.data', 2)
    );
});

test('history is ordered by completed_at descending', function () {
    $user = User::factory()->create();

    $oldest = GameSession::factory()->for($user)->completed()->create([
        'completed_at' => now()->subHours(2),
    ]);
    $newest = GameSession::factory()->for($user)->completed()->create([
        'completed_at' => now()->subMinutes(10),
    ]);
    $middle = GameSession::factory()->for($user)->completed()->create([
        'completed_at' => now()->subHour(),
    ]);

    $response = $this->actingAs($user)->get(route('games.memo-test.history'));

    $response->assertOk()->assertInertia(
        fn ($page) => $page
        ->component('Games/MemoTest/History')
        ->has('sessions.data', 3)
        ->where('sessions.data.0.id', $newest->id)
        ->where('sessions.data.1.id', $middle->id)
        ->where('sessions.data.2.id', $oldest->id)
    );
});
