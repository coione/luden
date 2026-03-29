<script setup lang="ts">
import { computed } from 'vue';
import type { Card } from '@/types/memo-test';
import GameCard from './GameCard.vue';

const props = defineProps<{
    cards: Card[];
    canFlip: boolean;
}>();

const emit = defineEmits<{
    flip: [cardId: number];
}>();

const columns = computed(() => {
    if (props.cards.length <= 6) return 3;
    return 4;
});
</script>

<template>
    <div class="mx-auto w-full max-w-lg px-4">
        <div
            class="grid gap-3"
            :style="{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }"
            style="touch-action: manipulation"
        >
            <GameCard
                v-for="card in cards"
                :key="card.id"
                :card="card"
                :can-flip="canFlip"
                card-back-src="/images/card-back.webp"
                @flip="emit('flip', card.id)"
            />
        </div>
    </div>
</template>
