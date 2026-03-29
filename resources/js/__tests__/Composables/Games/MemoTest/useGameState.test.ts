import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { effectScope } from 'vue';
import { useGameState } from '@/Composables/Games/MemoTest/useGameState';
import type { ThemeConfig, UseGameStateOptions } from '@/types/memo-test';

const mockTheme: ThemeConfig = {
    slug: 'test',
    name: 'Test',
    icon: '🧪',
    images: ['cat', 'dog', 'elephant', 'giraffe', 'lion', 'monkey'],
    basePath: '/images/test',
    extension: '.webp',
};

function makeOptions(overrides: Partial<UseGameStateOptions> = {}): UseGameStateOptions {
    return {
        theme: mockTheme,
        pairCount: 3,
        ...overrides,
    };
}

describe('useGameState', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    // 1. Deck initialization
    it('initializes 6 cards for 3 pairs', () => {
        const scope = effectScope();
        const { cards } = scope.run(() => useGameState(makeOptions({ pairCount: 3 })))!;
        expect(cards.value).toHaveLength(6);
        scope.stop();
    });

    it('initializes 8 cards for 4 pairs', () => {
        const scope = effectScope();
        const { cards } = scope.run(() => useGameState(makeOptions({ pairCount: 4 })))!;
        expect(cards.value).toHaveLength(8);
        scope.stop();
    });

    it('initializes 12 cards for 6 pairs', () => {
        const scope = effectScope();
        const { cards } = scope.run(() =>
            useGameState(makeOptions({ pairCount: 6, theme: mockTheme })),
        )!;
        expect(cards.value).toHaveLength(12);
        scope.stop();
    });

    // 2. Each imageSlug appears exactly twice
    it('creates exactly 2 cards per imageSlug', () => {
        const scope = effectScope();
        const { cards } = scope.run(() => useGameState(makeOptions({ pairCount: 3 })))!;

        const slugCounts = new Map<string, number>();
        for (const card of cards.value) {
            slugCounts.set(card.imageSlug, (slugCounts.get(card.imageSlug) ?? 0) + 1);
        }

        for (const count of slugCounts.values()) {
            expect(count).toBe(2);
        }

        scope.stop();
    });

    // 3. Shuffle: not always the same order
    it('shuffles cards into random order', () => {
        const orders = new Set<string>();

        for (let i = 0; i < 10; i++) {
            const scope = effectScope();
            const { cards } = scope.run(() => useGameState(makeOptions({ pairCount: 3 })))!;
            orders.add(cards.value.map((c) => c.imageSlug).join(','));
            scope.stop();
        }

        // With 6 cards and shuffling, it's astronomically unlikely all 10 runs produce the same order
        expect(orders.size).toBeGreaterThan(1);
    });

    // 4. Initial state
    it('starts with all cards face-down and not matched, status idle, attempts 0', () => {
        const scope = effectScope();
        const { cards, status, attempts, isWon } = scope.run(() => useGameState(makeOptions()))!;

        expect(status.value).toBe('idle');
        expect(attempts.value).toBe(0);
        expect(isWon.value).toBe(false);

        for (const card of cards.value) {
            expect(card.isFaceUp).toBe(false);
            expect(card.isMatched).toBe(false);
        }

        scope.stop();
    });

    // 5. flipCard — first card: status becomes 'playing', card is face-up, onFlip called
    it('flipping first card sets status to playing and calls onFlip', () => {
        const onFlip = vi.fn();
        const scope = effectScope();
        const { cards, status, flipCard } = scope.run(() => useGameState(makeOptions({ onFlip })))!;

        const firstCard = cards.value[0];
        flipCard(firstCard.id);

        expect(status.value).toBe('playing');
        expect(firstCard.isFaceUp).toBe(true);
        expect(onFlip).toHaveBeenCalledOnce();

        scope.stop();
    });

    // 6. flipCard — face-up guard: flipping same card again is no-op
    it('flipping the same face-up card again is a no-op', () => {
        const onFlip = vi.fn();
        const scope = effectScope();
        const { cards, flipCard } = scope.run(() => useGameState(makeOptions({ onFlip })))!;

        const firstCard = cards.value[0];
        flipCard(firstCard.id);
        flipCard(firstCard.id);

        expect(onFlip).toHaveBeenCalledOnce();

        scope.stop();
    });

    // 7. flipCard — matched card guard
    it('flipping a matched card is a no-op', () => {
        const onFlip = vi.fn();
        const scope = effectScope();
        const { cards, flipCard } = scope.run(() => useGameState(makeOptions({ onFlip })))!;

        // Find a pair
        const slug = cards.value[0].imageSlug;
        const pair = cards.value.filter((c) => c.imageSlug === slug);
        flipCard(pair[0].id);
        flipCard(pair[1].id);

        onFlip.mockClear();

        // Try to flip a matched card
        flipCard(pair[0].id);
        expect(onFlip).not.toHaveBeenCalled();

        scope.stop();
    });

    // 8. flipCard — tap-lock guard
    it('flipping during tap-lock is a no-op', () => {
        const onFlip = vi.fn();
        const scope = effectScope();
        const { cards, flipCard } = scope.run(() => useGameState(makeOptions({ onFlip })))!;

        // Flip two mismatched cards
        const slugGroups = new Map<string, typeof cards.value>();
        for (const card of cards.value) {
            const group = slugGroups.get(card.imageSlug) ?? [];
            group.push(card);
            slugGroups.set(card.imageSlug, group);
        }

        const slugEntries = [...slugGroups.entries()];
        const [slugA] = slugEntries[0];
        const [slugB] = slugEntries[1];

        const cardA1 = cards.value.find((c) => c.imageSlug === slugA)!;
        const cardB1 = cards.value.find((c) => c.imageSlug === slugB)!;

        flipCard(cardA1.id);
        flipCard(cardB1.id);

        onFlip.mockClear();

        // Now tapLocked is true, try to flip a third card
        const unflipped = cards.value.find((c) => !c.isFaceUp && !c.isMatched);
        if (unflipped) {
            flipCard(unflipped.id);
            expect(onFlip).not.toHaveBeenCalled();
        }

        scope.stop();
    });

    // 9. Match: both cards isMatched=true, flippedIds empty (indirectly via canFlip), attempts=1, onMatch called
    it('matching a pair marks both cards matched and calls onMatch', () => {
        const onMatch = vi.fn();
        const scope = effectScope();
        const { cards, attempts, canFlip, flipCard } = scope.run(() =>
            useGameState(makeOptions({ onMatch })),
        )!;

        const slug = cards.value[0].imageSlug;
        const pair = cards.value.filter((c) => c.imageSlug === slug);

        flipCard(pair[0].id);
        flipCard(pair[1].id);

        expect(pair[0].isMatched).toBe(true);
        expect(pair[1].isMatched).toBe(true);
        expect(attempts.value).toBe(1);
        expect(onMatch).toHaveBeenCalledOnce();
        // flippedIds cleared → canFlip should be true (< 2 face-up non-matched)
        expect(canFlip.value).toBe(true);

        scope.stop();
    });

    // 10. Mismatch: tapLocked after second flip; after 1000ms both face-down, tapLocked=false, attempts=1
    it('mismatched pair locks tap, then flips back after 1000ms', () => {
        const scope = effectScope();
        const { cards, attempts, canFlip, flipCard } = scope.run(() =>
            useGameState(makeOptions()),
        )!;

        // Find two different slugs
        const slugGroups = new Map<string, (typeof cards.value)[0][]>();
        for (const card of cards.value) {
            const group = slugGroups.get(card.imageSlug) ?? [];
            group.push(card);
            slugGroups.set(card.imageSlug, group);
        }

        const entries = [...slugGroups.entries()];
        const cardA = entries[0][1][0];
        const cardB = entries[1][1][0];

        flipCard(cardA.id);
        flipCard(cardB.id);

        expect(attempts.value).toBe(1);
        expect(canFlip.value).toBe(false); // tapLocked

        vi.advanceTimersByTime(1000);

        expect(cardA.isFaceUp).toBe(false);
        expect(cardB.isFaceUp).toBe(false);
        expect(canFlip.value).toBe(true);

        scope.stop();
    });

    // 11. Win: flip all pairs → isWon=true, status='won', onWin called
    it('flipping all pairs wins the game', () => {
        const onWin = vi.fn();
        const scope = effectScope();
        const { cards, status, isWon, flipCard } = scope.run(() =>
            useGameState(makeOptions({ pairCount: 3, onWin })),
        )!;

        const slugGroups = new Map<string, (typeof cards.value)[0][]>();
        for (const card of cards.value) {
            const group = slugGroups.get(card.imageSlug) ?? [];
            group.push(card);
            slugGroups.set(card.imageSlug, group);
        }

        for (const [, pair] of slugGroups) {
            flipCard(pair[0].id);
            flipCard(pair[1].id);
        }

        expect(isWon.value).toBe(true);
        expect(status.value).toBe('won');
        expect(onWin).toHaveBeenCalledOnce();

        scope.stop();
    });

    // 12. reset() returns to initial state
    it('reset returns all state to initial values', () => {
        const scope = effectScope();
        const { cards, status, attempts, isWon, flipCard, reset } = scope.run(() =>
            useGameState(makeOptions()),
        )!;

        // Play a bit
        const slug = cards.value[0].imageSlug;
        const pair = cards.value.filter((c) => c.imageSlug === slug);
        flipCard(pair[0].id);
        flipCard(pair[1].id);

        expect(attempts.value).toBe(1);

        reset();

        expect(status.value).toBe('idle');
        expect(attempts.value).toBe(0);
        expect(isWon.value).toBe(false);
        expect(cards.value).toHaveLength(6);

        for (const card of cards.value) {
            expect(card.isFaceUp).toBe(false);
            expect(card.isMatched).toBe(false);
        }

        scope.stop();
    });

    // 13. canFlip false when won
    it('canFlip is false when status is won', () => {
        const scope = effectScope();
        const { cards, canFlip, flipCard } = scope.run(() =>
            useGameState(makeOptions({ pairCount: 3 })),
        )!;

        const slugGroups = new Map<string, (typeof cards.value)[0][]>();
        for (const card of cards.value) {
            const group = slugGroups.get(card.imageSlug) ?? [];
            group.push(card);
            slugGroups.set(card.imageSlug, group);
        }

        for (const [, pair] of slugGroups) {
            flipCard(pair[0].id);
            flipCard(pair[1].id);
        }

        expect(canFlip.value).toBe(false);

        scope.stop();
    });

    // 14. canFlip false when tapLocked
    it('canFlip is false when tapLocked', () => {
        const scope = effectScope();
        const { cards, canFlip, flipCard } = scope.run(() => useGameState(makeOptions()))!;

        const slugGroups = new Map<string, (typeof cards.value)[0][]>();
        for (const card of cards.value) {
            const group = slugGroups.get(card.imageSlug) ?? [];
            group.push(card);
            slugGroups.set(card.imageSlug, group);
        }

        const entries = [...slugGroups.entries()];
        const cardA = entries[0][1][0];
        const cardB = entries[1][1][0];

        flipCard(cardA.id);
        flipCard(cardB.id);

        expect(canFlip.value).toBe(false);

        scope.stop();
    });

    // 15. canFlip false when 2 face-up non-matched cards
    it('canFlip is false when 2 non-matched cards are face-up', () => {
        const scope = effectScope();
        const { cards, canFlip, flipCard } = scope.run(() => useGameState(makeOptions()))!;

        // We need to simulate 2 face-up cards without triggering the mismatch handler
        // We do this by flipping two different-slug cards; tapLocked makes canFlip false
        // But the canFlip check for "length < 2" fires before the setTimeout
        // So right after second flip but within the same tick, both conditions (tapLocked AND length>=2) apply
        // Let's verify via the intermediate state just after flipping 2 non-matched

        const slugGroups = new Map<string, (typeof cards.value)[0][]>();
        for (const card of cards.value) {
            const group = slugGroups.get(card.imageSlug) ?? [];
            group.push(card);
            slugGroups.set(card.imageSlug, group);
        }

        const entries = [...slugGroups.entries()];
        const cardA = entries[0][1][0];

        // Only flip 1 card first — ensure canFlip is true
        flipCard(cardA.id);
        expect(canFlip.value).toBe(true);

        const cardB = entries[1][1][0];
        flipCard(cardB.id);

        // After 2 mismatched flips: tapLocked=true AND flippedIds.length=2 → canFlip=false
        expect(canFlip.value).toBe(false);

        scope.stop();
    });
});
