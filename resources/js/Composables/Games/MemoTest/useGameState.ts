import { ref, computed } from 'vue';
import type { Ref } from 'vue';
import type { Card, GameStatus, UseGameStateOptions, UseGameStateReturn } from '@/types/memo-test';

export function useGameState(options: UseGameStateOptions): UseGameStateReturn {
    const cards: Ref<Card[]> = ref([]);
    const attempts: Ref<number> = ref(0);
    const status: Ref<GameStatus> = ref('idle');
    const flippedIds: Ref<number[]> = ref([]);
    const tapLocked: Ref<boolean> = ref(false);

    const isWon = computed(() => cards.value.length > 0 && cards.value.every((c) => c.isMatched));

    const canFlip = computed(
        () => !tapLocked.value && flippedIds.value.length < 2 && status.value !== 'won',
    );

    function initializeDeck(): void {
        const { theme, pairCount } = options;

        const shuffledImages = [...theme.images].sort(() => Math.random() - 0.5);
        const selectedSlugs = shuffledImages.slice(0, pairCount);

        const deck: Card[] = [];
        selectedSlugs.forEach((slug) => {
            deck.push({
                id: deck.length,
                imageSlug: slug,
                imageSrc: `${theme.basePath}/${slug}${theme.extension}`,
                isFaceUp: false,
                isMatched: false,
            });
            deck.push({
                id: deck.length,
                imageSlug: slug,
                imageSrc: `${theme.basePath}/${slug}${theme.extension}`,
                isFaceUp: false,
                isMatched: false,
            });
        });

        // Fisher-Yates shuffle
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }

        cards.value = deck;
    }

    function flipCard(cardId: number): void {
        if (status.value === 'won') return;
        if (tapLocked.value) return;

        const card = cards.value.find((c) => c.id === cardId);
        if (!card || card.isFaceUp || card.isMatched) return;

        card.isFaceUp = true;
        flippedIds.value.push(cardId);

        if (status.value === 'idle') {
            status.value = 'playing';
        }

        options.onFlip?.();

        if (flippedIds.value.length === 2) {
            attempts.value += 1;

            const [firstId, secondId] = flippedIds.value;
            const firstCard = cards.value.find((c) => c.id === firstId)!;
            const secondCard = cards.value.find((c) => c.id === secondId)!;

            if (firstCard.imageSlug === secondCard.imageSlug) {
                firstCard.isMatched = true;
                secondCard.isMatched = true;
                flippedIds.value = [];

                options.onMatch?.();

                if (isWon.value) {
                    status.value = 'won';
                    options.onWin?.();
                }
            } else {
                tapLocked.value = true;
                setTimeout(() => {
                    firstCard.isFaceUp = false;
                    secondCard.isFaceUp = false;
                    flippedIds.value = [];
                    tapLocked.value = false;
                }, 1000);
            }
        }
    }

    function reset(): void {
        attempts.value = 0;
        status.value = 'idle';
        flippedIds.value = [];
        tapLocked.value = false;
        initializeDeck();
    }

    initializeDeck();

    return { cards, attempts, status, isWon, canFlip, flipCard, reset };
}
