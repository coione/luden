# Design Decisions

This document explains the reasoning behind key architectural and engineering choices in Luden. Each decision has tradeoffs — this captures what was chosen and why.

---

## Laravel + Inertia.js over a decoupled SPA

**Decision:** Single monolith with Inertia.js, not a Laravel API + separate Vue SPA.

**Why:** A separate frontend SPA would require token-based authentication (Sanctum SPA auth or JWT), a client-side router, duplicated route definitions, and a separate deployment pipeline. For a project of this scope, that overhead delivers no real benefit. Inertia gives the developer experience of a SPA (no full page reloads, reactive components) with the simplicity of server-side routing and Laravel's built-in session auth.

**Tradeoff accepted:** A native mobile app could not reuse the backend as a standard REST API without refactoring the controllers to return JSON unconditionally. If that need arises, the controllers are thin enough to extract.

---

## ULID Primary Keys for GameSession

**Decision:** `GameSession.id` uses ULID instead of auto-increment integer.

**Why:** Auto-increment IDs in URLs are enumerable — a user could guess `/games/memo-test/3` and attempt to access session 3. ULIDs are 128-bit, time-sortable, and URL-safe. The policy gates add a second layer of protection, but ULIDs eliminate the enumeration surface entirely.

**Tradeoff accepted:** Slightly larger primary key storage and less readable URLs. Neither matters at this scale.

---

## Game Logic in a Composable, Not in the Component

**Decision:** All memo-test game mechanics live in `useGameState`. Components only call `flipCard(id)` and read reactive state.

**Why:** Components that contain business logic are difficult to test, difficult to reuse, and tend to grow unbounded. `useGameState` is a pure function — it takes options and returns reactive state. This makes it trivially testable with Vitest without mounting a component, and it keeps `Play.vue` as a thin orchestration layer. The timer and audio follow the same pattern.

**Tradeoff accepted:** An extra layer of indirection. For a simple game, this feels like more structure than necessary — but the tests validate this pays off immediately.

---

## No Vuex / Pinia

**Decision:** No global state store. Each page composes its own local state via composables.

**Why:** The app has no cross-page shared state. The game state is local to the play screen, the timer is local, audio is local. A global store would add overhead (setup, devtools, boilerplate) with zero benefit. If a future feature requires shared state (e.g., a user profile with preferences), Pinia can be added incrementally.

---

## SVG Images Over Raster (WebP/PNG)

**Decision:** Animal card illustrations are SVG files served from `public/`.

**Why:** SVGs are resolution-independent — they look crisp on any screen density, from phone to tablet to high-DPI desktop. This matters for a kids' app likely run on mixed-quality devices. SVGs have no HTTP overhead from format negotiation, and they are served as static files by Nginx without any build pipeline involvement. The illustrations are custom flat-style vector art that can be edited without losing quality.

**Tradeoff accepted:** SVGs are not suitable for photographic content. For a future theme using real photos, switching to WebP per-theme is trivial (each `ThemeConfig` has an `extension` field).

---

## 3D Flip Animation in Pure CSS

**Decision:** Card flip uses CSS `transform: rotateY()` with `perspective` and `backface-visibility`, not a JavaScript animation library.

**Why:** A JavaScript animation library (GSAP, Anime.js) would add bundle weight and a dependency for a single animation. CSS transforms are GPU-accelerated, composited off the main thread, and performed natively by the browser. The result is smooth at 60fps with zero JS execution during animation.

**Tradeoff accepted:** The CSS approach is slightly less flexible — parameterizing duration or easing requires inline styles. Acceptable given the current scope.

---

## Tap-Lock vs. Throttle for Mismatch Prevention

**Decision:** A `tapLocked` boolean blocks all flips for 1000ms after a mismatch, rather than debouncing or throttling individual clicks.

**Why:** The requirement is that a child sees both mismatched cards before they flip back. Debounce would allow partial flips during the cooldown. Throttle could allow a third card to flip before the mismatch resolves. A hard lock is the simplest, most predictable mechanism: no new flip is possible while two non-matching cards are showing.

---

## Exponential Backoff on Result Save

**Decision:** The `PATCH` to save game results retries up to 3 times with exponential backoff (1s, 2s, 4s). Failure is silent — the win celebration remains visible.

**Why:** A child finishing a game on a mobile device over a flaky connection should not lose their win state due to a transient network error. The celebration screen stays up regardless of whether the save succeeded. Three retries cover most transient failures without creating a long wait.

**Tradeoff accepted:** The game result may not be persisted if all three retries fail. This is acceptable — the game is not competitive, and the parent can see the celebration directly.

---

## ThemeRegistry Duplication (Backend + Frontend)

**Decision:** Theme slugs exist in both `app/Games/MemoTest/ThemeRegistry.php` and `resources/js/Games/MemoTest/themes/`. They are intentionally separate.

**Why:** The backend only needs slugs for validation. The frontend needs full `ThemeConfig` objects (paths, images, extensions, icons). Merging them would require either exposing file-system paths in an API response or making the frontend depend on a backend endpoint to know its own asset paths. Duplication here is the least surprising approach — a new theme requires two small additions, each in the right layer.

---

## PHPStan Level Max + Strict TypeScript

**Decision:** PHPStan is configured at level max. TypeScript is configured with `strict: true`. Both are enforced in CI.

**Why:** This is a portfolio project. The goal is to demonstrate professional-grade engineering. Strict static analysis catches real bugs at zero runtime cost, documents intent through types, and makes refactoring safer. The discipline of maintaining max-level analysis from day one is far cheaper than retrofitting it later onto a large codebase.

**Tradeoff accepted:** Occasionally verbose type annotations. Worth it.

---

## Pest PHP over PHPUnit Directly

**Decision:** Tests are written with Pest syntax (`it()`, `test()`, expectations) rather than raw PHPUnit.

**Why:** Pest produces dramatically more readable test output and test code. Pest is built on PHPUnit and is fully compatible with the Laravel ecosystem. The expressiveness of `expect($session->status)->toBe('completed')` over `$this->assertEquals('completed', $session->status)` compounds across hundreds of test cases.

---

## Game Session Status as String Enum ('in_progress' | 'completed')

**Decision:** `status` is stored as a string, not a boolean `is_completed` or a numeric enum.

**Why:** A boolean only represents two states. The status field is designed to accommodate future states without a migration — for example, `'abandoned'` for sessions where the player left mid-game. A string with a defined set of valid values (enforced at the application layer) is more expressive and future-proof than a boolean.
