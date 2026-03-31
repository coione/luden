# Architecture

## System Overview

Luden is a full-stack monolith. Laravel handles routing, authentication, authorization, and database persistence. Vue 3 handles all UI rendering. Inertia.js acts as the bridge — there is no separate API, no token management, no client-side router. Laravel renders the initial HTML, Inertia hydrates the Vue app, and subsequent navigation happens via XHR without a full page reload.

```
Browser
  │
  ├── GET /games/memo-test        ← Inertia initial load (HTML + props)
  │     └── Vue app hydrates
  │
  ├── POST /games/memo-test       ← Inertia form submission (XHR)
  │     └── Laravel creates GameSession, redirects to /play/:id
  │
  ├── GET /games/memo-test/:id    ← Inertia page visit (XHR)
  │     └── Vue renders Play page with props
  │
  └── PATCH /games/memo-test/:id  ← Axios (plain XHR, not Inertia)
        └── Laravel saves result, returns { ok: true }
```

Redis is used for sessions and cache. MySQL stores all persistent data. Vite serves frontend assets in development; compiled bundles are served by Nginx in production.

---

## Backend

### Routing

All routes are in `routes/web.php`. Game routes are grouped under `/games/memo-test` with the `auth` middleware — no unauthenticated access is possible.

```
GET    /games/memo-test          → GameSessionController@index
POST   /games/memo-test          → GameSessionController@store
GET    /games/memo-test/history  → GameSessionController@history
GET    /games/memo-test/{id}     → GameSessionController@show
PATCH  /games/memo-test/{id}     → GameSessionController@update
```

### Controllers

**`GameSessionController`** is the only game controller. It handles the full lifecycle of a game session:

- `index()` — Returns the config page with available themes and pair counts. Props come from `ThemeRegistry::all()`.
- `store()` — Validates input via `StoreGameSessionRequest`, creates a `GameSession` with `status: in_progress`, redirects to the play page.
- `show()` — Authorizes ownership via `Gate::authorize('view', $session)`, returns the play page with session props.
- `update()` — Authorizes via `Gate::authorize('update', $session)` (also blocks completed sessions), validates via `UpdateGameSessionRequest`, persists result.
- `history()` — Returns completed sessions for the authenticated user, ordered by `completed_at` DESC, transformed through `GameSessionResource`.

### Models

**`GameSession`**

```
game_sessions
├── id              ULID (primary key)
├── user_id         FK → users.id (CASCADE DELETE)
├── game_type       string  e.g. 'memo-test'
├── theme           string  e.g. 'animals'
├── pairs_count     tinyint (3 | 4 | 6)
├── attempts        smallint (null until completed)
├── duration_seconds smallint (null until completed)
├── status          string  'in_progress' | 'completed'
├── completed_at    timestamp (null until completed)
├── created_at      timestamp
└── updated_at      timestamp

Index: (user_id, game_type)
```

ULIDs are used instead of auto-increment integers to avoid enumerable IDs in URLs. A user cannot access another user's session by guessing sequential IDs.

### Validation

`StoreGameSessionRequest` validates against `ThemeRegistry::validSlugs()` — submitting an unknown theme slug returns 422. `UpdateGameSessionRequest` enforces bounds on attempts and duration to prevent data corruption from invalid client payloads.

### Authorization

`GameSessionPolicy` defines two gates:

- `view`: `$session->user_id === $user->id`
- `update`: `$session->user_id === $user->id && $session->status === 'in_progress'`

The `update` gate blocks re-submission on already-completed sessions. Both are enforced with `Gate::authorize()` before any business logic runs, returning HTTP 403 on violation.

### API Resources

`GameSessionResource` normalizes the Eloquent model for the frontend:
- `pairs_count` → `pairsCount`
- `duration_seconds` → `durationSeconds`
- `completed_at` → ISO 8601 string

This keeps the frontend free of snake_case database conventions.

### ThemeRegistry

`app/Games/MemoTest/ThemeRegistry.php` is the backend source of truth for valid theme slugs. It is the only place that needs to change when a new theme is added. The frontend has its own parallel `ThemeConfig` registry (see below).

---

## Frontend

### Inertia Pages

Pages live in `resources/js/Pages/`. Each page receives typed props from its controller via `defineProps<PageProps>()`. There is no client-side data fetching on page load — all data arrives as Inertia props.

The play page is the exception: after the game ends, results are submitted via a direct `axios.patch()` call (not an Inertia visit) to avoid navigating away from the win celebration screen.

### Component Tree (Play screen)

```
Play.vue
├── AuthenticatedLayout.vue
│   └── [slot: header]
│       └── h2 "Memo Test"
├── GameHeader.vue           ← attempts counter + timer display
├── GameBoard.vue            ← grid layout
│   └── GameCard.vue × N    ← 3D flip card (face-down / face-up)
└── WinCelebration.vue       ← confetti + stats overlay (v-if)
```

### Game Logic: `useGameState`

All game mechanics live in `resources/js/Composables/Games/MemoTest/useGameState.ts`. The component layer has zero game logic — it only calls `flipCard(id)` and reads reactive state.

**Deck initialization:**
1. Shuffle available image slugs
2. Take the first `pairCount` slugs
3. Create two `Card` objects per slug (pairs)
4. Fisher-Yates shuffle the full deck

**Flip handling:**
1. Guard: `isFaceUp`, `isMatched`, `tapLocked`, `canFlip` — abort if any is true
2. Flip card face up, push to `flippedIds`
3. If two cards flipped:
   - **Match**: mark both `isMatched`, clear `flippedIds`, fire `onMatch`
   - **Mismatch**: set `tapLocked = true`, wait 1000ms, flip both back, clear lock
4. If all cards matched: set `status = 'won'`, fire `onWin`

The `canFlip` computed blocks any interaction while `tapLocked` is true, preventing race conditions from fast tapping.

### Card Component: `GameCard`

The 3D flip effect is pure CSS — no JS animation library.

```
┌─────────────────────────────────────────┐
│  <div style="perspective: 1000px">      │
│    <div style="transform-style: preserve-3d; │
│               transform: rotateY(0 or 180deg)"> │
│      <!-- Face: card-back.svg (rotateY: 0) -->  │
│      <!-- Back: animal image (rotateY: 180deg) --> │
│    </div>                               │
│  </div>                                 │
└─────────────────────────────────────────┘
```

Both faces are `position: absolute; inset: 0` with `backface-visibility: hidden`. The container rotates 180deg when `card.isFaceUp` is true. Transition is `400ms ease-in-out`.

Touch events use `@touchstart.prevent` to prevent the 300ms tap delay on iOS. `-webkit-tap-highlight-color: transparent` removes the mobile tap flash.

### Theme System

**Frontend** (`resources/js/Games/MemoTest/themes/`):

```typescript
interface ThemeConfig {
    slug: string       // matches backend ThemeRegistry slug
    name: string       // display name
    icon: string       // emoji for the selector UI
    images: string[]   // image filenames (without extension)
    basePath: string   // public path prefix
    extension: string  // file extension (.svg, .webp, etc.)
}
```

`index.ts` exports a `THEMES` array and a `getTheme(slug)` lookup. The play page falls back to a generic config if the slug is unknown (defensive — should never happen via normal flow).

**Backend** (`app/Games/MemoTest/ThemeRegistry.php`):

Separate but intentionally mirrors the frontend. The backend only needs slugs for validation; it does not need image paths.

Adding a new theme requires:
1. Add images to `public/images/themes/{slug}/`
2. Add `ThemeConfig` to `resources/js/Games/MemoTest/themes/`
3. Register the slug in `ThemeRegistry::all()`

No migrations, no model changes, no controller changes.

---

## Database Schema

```sql
CREATE TABLE users (
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    email       VARCHAR(255) UNIQUE NOT NULL,
    password    VARCHAR(255) NOT NULL,
    created_at  TIMESTAMP,
    updated_at  TIMESTAMP
);

CREATE TABLE game_sessions (
    id               CHAR(26) PRIMARY KEY,           -- ULID
    user_id          BIGINT UNSIGNED NOT NULL,
    game_type        VARCHAR(255) NOT NULL,
    theme            VARCHAR(255) NOT NULL,
    pairs_count      TINYINT UNSIGNED NOT NULL,
    attempts         SMALLINT UNSIGNED NULL,
    duration_seconds SMALLINT UNSIGNED NULL,
    status           VARCHAR(255) NOT NULL DEFAULT 'in_progress',
    completed_at     TIMESTAMP NULL,
    created_at       TIMESTAMP,
    updated_at       TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_game (user_id, game_type)
);
```

---

## Data Flow: Complete Game Lifecycle

```
1. GET /games/memo-test
   Controller → ThemeRegistry::all() + pair counts
   Inertia response → Index.vue rendered with props

2. POST /games/memo-test { theme: 'animals', pairs_count: 4 }
   StoreGameSessionRequest validates
   GameSession::create({ user_id, game_type, theme, pairs_count, status: 'in_progress' })
   Redirect → GET /games/memo-test/{ulid}

3. GET /games/memo-test/{ulid}
   Gate::authorize('view', $session)
   Inertia response → Play.vue with { sessionId, theme, pairCount }
   useGameState initializes deck client-side
   useTimer starts on first flip

4. PATCH /games/memo-test/{ulid}
   { attempts, duration_seconds, completed_at }
   Gate::authorize('update', $session)  ← also checks status !== 'completed'
   UpdateGameSessionRequest validates
   $session->update({ status: 'completed', attempts, duration_seconds, completed_at })
   Returns { ok: true }
   (3 retries with exponential backoff on client side)

5. GET /games/memo-test/history
   GameSession::where(user_id, status: 'completed')->latest('completed_at')
   GameSessionResource collection → History.vue
```

---

## Testing Strategy

### Backend — Pest

Integration tests in `tests/Feature/Games/GameSessionTest.php` cover the full HTTP layer: auth guards, validation, authorization, response shapes, and database state after mutations. Tests use `RefreshDatabase` with SQLite in-memory — each test starts with a clean database. `withoutVite()` disables the Vite client to keep tests fast.

### Frontend — Vitest

Unit tests in `resources/js/__tests__/Composables/Games/MemoTest/` test composables in isolation:

- `useGameState` — 15 scenarios covering deck initialization, flip mechanics, match/mismatch logic, win detection, and edge cases (tap-lock, already-flipped card)
- `useTimer` — start/stop/reset, elapsed counter, cleanup on scope disposal
- `useAudio` — preloading, playback, silent error handling

`vi.useFakeTimers()` controls the 1000ms mismatch delay without waiting in real time. `effectScope()` wraps composables for proper Vue reactivity lifecycle in tests.

### Quality Gates (CI)

| Tool | Scope | Threshold |
|------|-------|-----------|
| PHPStan | `app/` | Level max (no errors) |
| Pint | `app/` | PSR-12 (fail on diff) |
| ESLint | `resources/js/` | Zero warnings |
| Prettier | `resources/js/` | Fail on diff |
| vue-tsc | Full project | Zero type errors |
