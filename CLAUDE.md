# CLAUDE.md

This file provides guidance for AI assistants working in this repository.

## Project Overview

**Luden** is a Laravel 13 + Vue 3 + Inertia.js educational gaming platform for young children. Currently implements a memory-matching card game ("Memo Test"). It is a portfolio-quality monolith — no separate API, no microservices.

**Stack:** PHP 8.3+ / Laravel 13 · Vue 3 / TypeScript · Inertia.js 2 · Tailwind CSS 4 · Vite 8 · MySQL 8.4 (dev) / SQLite in-memory (tests)

---

## Development Commands

### Backend (PHP/Laravel)

```bash
php artisan serve              # Local dev server
php artisan migrate            # Run migrations
php artisan test               # Run all Pest tests
./vendor/bin/pest              # Run Pest directly
./vendor/bin/pint              # Auto-fix PHP code style (PSR-12)
./vendor/bin/pint --test       # Check style without fixing
./vendor/bin/phpstan analyse   # Static analysis (level max)
```

### Frontend (Node/Vue)

```bash
npm run dev           # Start Vite dev server with HMR
npm run build         # vue-tsc type check + Vite build
npm test              # Run Vitest once
npm run test:watch    # Vitest in watch mode
npm run lint          # ESLint check
npm run lint:fix      # ESLint auto-fix
npm run format        # Prettier format
npm run format:check  # Prettier check only
```

### Docker / Laravel Sail

```bash
sail up -d                    # Start all services (app, MySQL, Redis)
sail down                     # Stop services
sail artisan migrate          # Run migrations in container
sail npm run build            # Build frontend in container
sail test                     # Run PHP tests in container
```

---

## CI Pipeline

GitHub Actions runs on every push/PR to `main`. Both jobs must pass:

**Backend job:** Pint (format) → PHPStan (level max) → Pest (tests)

**Frontend job:** ESLint → Prettier check → vue-tsc (type check) → Vitest

All checks are required with zero tolerance for errors.

---

## Code Style & Conventions

### PHP

- **Standard:** PSR-12 (enforced by Laravel Pint)
- **Static analysis:** PHPStan at level max with Larastan; `app/` must be error-free
- **Formatting:** Run `./vendor/bin/pint` before committing

### TypeScript / Vue

- **Strict TypeScript:** `"strict": true` in tsconfig.json
- **Prettier config:** 4-space indentation, single quotes, semicolons, trailing commas, 100-char line width
- **ESLint:** Flat config format; Vue 3 recommended + TypeScript recommended rules
- **Path alias:** `@/` resolves to `resources/js/`
- **Vue single-file components:** Script setup syntax (`<script setup lang="ts">`)

### General

- **Line endings:** LF, UTF-8
- **Indentation:** 4 spaces everywhere (2 spaces for YAML files)
- **Final newline:** Always present

---

## Architecture

### Backend Structure

```
app/
├── Games/MemoTest/ThemeRegistry.php   # Backend source of truth for valid theme slugs
├── Http/Controllers/Games/            # GameSessionController (5 endpoints)
├── Http/Requests/Games/               # StoreGameSessionRequest, UpdateGameSessionRequest
├── Http/Resources/                    # GameSessionResource (snake_case → camelCase)
├── Models/                            # GameSession (ULID PK), User
└── Policies/                          # GameSessionPolicy (ownership + status guards)
```

**Routing:** All game routes are under `/games/memo-test` with `auth` middleware (`routes/web.php`).

**Controller endpoints (GameSessionController):**
- `index` — config screen (themes, valid pair counts)
- `store` — create new game session
- `show` — load game to play
- `update` — save completed game results
- `history` — list completed sessions for current user

**Data flow:** Config screen → `store` (creates `in_progress` session) → Play screen → `update` (saves results, status → `completed`) → History

### Frontend Structure

```
resources/js/
├── Pages/Games/MemoTest/         # Index.vue, Play.vue, History.vue (Inertia pages)
├── Components/Games/MemoTest/    # GameCard, GameBoard, GameHeader, WinCelebration, etc.
├── Composables/Games/MemoTest/   # useGameState, useTimer, useAudio
├── Games/MemoTest/themes/        # Theme definitions (animals.ts, index.ts, types.ts)
├── types/memo-test.d.ts          # All TypeScript interfaces
├── Layouts/                      # Page layouts
└── app.ts                        # Vue app entry point
```

**Key design principle:** Game logic lives in composables (`useGameState`, `useTimer`, `useAudio`), not in components. This makes logic independently testable without mounting Vue components.

### Database

**game_sessions table:**
- `id` — ULID (26-char, URL-safe, time-sortable, non-enumerable)
- `user_id` — FK → users (cascade delete)
- `game_type` — e.g. `'memo-test'`
- `theme` — e.g. `'animals'`
- `pairs_count` — `3 | 4 | 6`
- `attempts` — nullable until completed
- `duration_seconds` — nullable until completed
- `status` — `'in_progress'` | `'completed'` (no regressions)
- `completed_at` — nullable timestamp
- Index on `(user_id, game_type)`

---

## Key Patterns

### Validation Bounds
- `pairs_count`: must be in `[3, 4, 6]` (not arbitrary integers)
- `attempts`: 0–9999
- `duration_seconds`: 0–86400

### Authorization
- **View:** User must own the game session (`GameSessionPolicy::view`)
- **Update:** User must own it AND status must be `in_progress` (`GameSessionPolicy::update`)
- Completed sessions are immutable

### Theme System
- **Frontend** (`resources/js/Games/MemoTest/themes/`): holds SVG card image paths, display names, icons
- **Backend** (`ThemeRegistry`): holds valid theme slugs for validation
- These are intentionally duplicated — the frontend has display config, backend has validation. When adding a new theme, update both.

### API Resources
`GameSessionResource` transforms DB fields from `snake_case` to `camelCase` for the frontend. Never access raw model attributes from Inertia props — always go through the resource.

### Save with Retry
`Play.vue` uses exponential backoff (3 retries) when saving game results. Silent failure on final retry is intentional — the game experience is not blocked by a save failure.

### Tap-Lock Mechanism
`useGameState` uses a hard boolean lock (`isTapLocked`) during card-flip evaluation to prevent race conditions. This is intentional — do not replace with debounce/throttle.

---

## Testing

### Backend Tests (Pest)
- Location: `tests/Feature/Games/GameSessionTest.php`
- Uses SQLite in-memory + `RefreshDatabase` trait
- Tests cover: auth guards, form validation, authorization, Inertia response shape, DB mutations
- Run: `php artisan test` or `./vendor/bin/pest`

### Frontend Tests (Vitest)
- Location: `resources/js/__tests__/Composables/Games/MemoTest/`
- Covers `useGameState`, `useTimer`, `useAudio` composables directly (no component mounting)
- Uses `vi.useFakeTimers()` for controlling async delays
- Environment: happy-dom
- Run: `npm test`

### Test Environment Config (phpunit.xml)
- SQLite in-memory database
- Bcrypt rounds: 4 (faster)
- Sync queue, array cache
- Pulse/Telescope disabled

---

## Environment Setup

Copy `.env.example` to `.env`, then:

```bash
composer install
php artisan key:generate
php artisan migrate
npm install
npm run dev
```

Default `.env.example` uses SQLite. For Docker (Sail), MySQL 8.4 and Redis are provided via `compose.yaml`.

**Required environment variables:**
- `APP_KEY` — generated by `artisan key:generate`
- `DB_CONNECTION` — `sqlite` (dev) or `mysql` (Docker)
- All other defaults from `.env.example` work out of the box for local dev

---

## Adding a New Game

1. Create `app/Games/<GameName>/ThemeRegistry.php` (if theme-based)
2. Add controller under `app/Http/Controllers/Games/`
3. Add routes in `routes/web.php` under `auth` middleware
4. Create form requests under `app/Http/Requests/Games/`
5. Create a policy and register it in `AuthServiceProvider`
6. Add Inertia pages under `resources/js/Pages/Games/<GameName>/`
7. Add composables under `resources/js/Composables/Games/<GameName>/`
8. Add theme definitions under `resources/js/Games/<GameName>/themes/`
9. Write Pest feature tests and Vitest composable tests

---

## Adding a New Theme to Memo Test

1. Add SVG card images to `public/images/themes/<theme-slug>/`
2. Create `resources/js/Games/MemoTest/themes/<theme-slug>.ts` (follow `animals.ts` pattern)
3. Export it from `resources/js/Games/MemoTest/themes/index.ts`
4. Add the slug to `app/Games/MemoTest/ThemeRegistry.php`

Both frontend and backend must be updated — they are intentionally separate.

---

## Documentation

- `README.md` — Setup guide and command reference
- `docs/architecture.md` — System design, data flow, component tree
- `docs/design.md` — Design decisions and rationale (ULID PKs, tap-lock, etc.)
