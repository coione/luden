# Luden

An educational gaming platform for young children, built as a portfolio-quality monolith using Laravel + Vue 3 + Inertia.js. The first game is a memory-matching card game designed for toddlers.

## Stack

| Layer | Technology |
|-------|-----------|
| Backend | PHP 8.3+, Laravel 13 |
| Frontend | Vue 3, TypeScript, Inertia.js 2 |
| Styling | Tailwind CSS 4 |
| Database | MySQL 8.4 (dev), SQLite in-memory (tests) |
| Cache / Queue | Redis |
| Build | Vite 8, vue-tsc |
| Testing | Pest 4 (backend), Vitest 4 (frontend) |
| Static Analysis | PHPStan level max, ESLint, Prettier |
| DevOps | Laravel Sail (Docker), GitHub Actions CI |

## Prerequisites

- Docker Desktop (no local PHP or Node required — everything runs in containers)

## Setup

```bash
# 1. Clone the repository
git clone https://github.com/coione/luden.git
cd luden

# 2. Install Composer dependencies via Docker
docker run --rm -u "$(id -u):$(id -g)" \
  -v "$(pwd):/var/www/html" \
  -w /var/www/html \
  laravelsail/php85-composer:latest \
  composer install --ignore-platform-reqs

# 3. Copy environment file and generate app key
cp .env.example .env
./vendor/bin/sail artisan key:generate

# 4. Start all services
./vendor/bin/sail up -d

# 5. Run database migrations
./vendor/bin/sail artisan migrate

# 6. Install Node dependencies and start Vite
./vendor/bin/sail npm install
./vendor/bin/sail npm run dev
```

The app is available at **http://localhost**.

## Commands

```bash
# Development
sail up -d                          # Start Docker services (detached)
sail down                           # Stop all services
sail npm run dev                    # Start Vite dev server with HMR

# Database
sail artisan migrate                # Run pending migrations
sail artisan migrate:fresh --seed   # Reset database and seed

# Testing
sail test                           # Run Pest PHP tests
sail npm test                       # Run Vitest frontend tests
sail npm run test:watch             # Vitest in watch mode

# Code Quality
sail artisan pint                   # Fix PHP code style (PSR-12)
sail artisan pint --test            # Check PHP style without fixing
sail vendor/bin/phpstan analyse     # Static analysis (level max)
sail npm run lint                   # ESLint
sail npm run lint:fix               # ESLint with auto-fix
sail npm run format                 # Prettier
sail npm run format:check           # Prettier check only

# Production
sail npm run build                  # Type-check + compile assets
```

## Project Structure

```
luden/
├── app/
│   ├── Games/MemoTest/              # Game domain: ThemeRegistry
│   ├── Http/
│   │   ├── Controllers/Games/       # GameSessionController
│   │   ├── Requests/Games/          # StoreGameSessionRequest, UpdateGameSessionRequest
│   │   └── Resources/               # GameSessionResource (response normalization)
│   ├── Models/                      # User, GameSession (ULID primary keys)
│   └── Policies/                    # GameSessionPolicy (ownership gates)
├── resources/js/
│   ├── Components/Games/MemoTest/   # GameCard, GameBoard, GameHeader, WinCelebration
│   ├── Composables/Games/MemoTest/  # useGameState, useTimer, useAudio
│   ├── Games/MemoTest/themes/       # Theme system (animals — extensible)
│   ├── Pages/Games/MemoTest/        # Index (config), Play, History
│   └── types/                       # TypeScript interfaces
├── public/images/
│   ├── themes/animals/              # SVG card illustrations (8 animals)
│   └── card-back.svg                # Card back design
├── tests/Feature/Games/             # Pest integration tests
└── .github/workflows/ci.yml         # CI pipeline
```

## Games

### Memo Test — `/games/memo-test`

A classic memory card-matching game.

**Game flow:**
1. Parent authenticates and opens the config screen
2. Selects a theme (Animals) and pair count (3, 4, or 6)
3. A `GameSession` record is created (`status: in_progress`)
4. The play screen renders the shuffled board
5. Cards flip with a 3D animation; matching pairs stay revealed
6. On win, the result is persisted (`status: completed`, attempts, duration)
7. Game history is available at `/games/memo-test/history`

**Extending themes:** Add a `ThemeConfig` entry to the frontend theme registry and a matching slug to the backend `ThemeRegistry`. No other changes required.

## Documentation

- [Architecture](docs/architecture.md) — system design, backend, frontend, database schema, data flow
- [Design Decisions](docs/design.md) — rationale behind key engineering choices and patterns

## CI

GitHub Actions runs two parallel jobs on every push and PR to `main`:

| Job | Steps |
|-----|-------|
| Backend | Pint → PHPStan (level max) → Pest |
| Frontend | ESLint → Prettier → vue-tsc → Vitest |

## License

MIT
