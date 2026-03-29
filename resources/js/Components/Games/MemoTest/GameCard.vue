<script setup lang="ts">
import type { Card } from '@/types/memo-test';

const props = defineProps<{
    card: Card;
    canFlip: boolean;
    cardBackSrc: string;
}>();

const emit = defineEmits<{
    flip: [];
}>();

function onTap(): void {
    if (props.card.isFaceUp || props.card.isMatched || !props.canFlip) {
        return;
    }
    emit('flip');
}

function onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src =
        'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="80"%3E%3Crect width="80" height="80" fill="%23e5e7eb"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%236b7280" font-size="12"%3E?%3C/text%3E%3C/svg%3E';
}
</script>

<template>
    <div
        :style="{ perspective: '1000px' }"
        :class="[
            'cursor-pointer select-none',
            card.isMatched && 'ring-2 ring-green-400 rounded-lg',
        ]"
        style="
            min-width: 80px;
            aspect-ratio: 1;
            touch-action: manipulation;
            -webkit-tap-highlight-color: transparent;
        "
        @click="onTap"
        @touchstart.prevent="onTap"
    >
        <div
            :style="{
                transformStyle: 'preserve-3d',
                transition: 'transform 400ms ease-in-out',
                transform: card.isFaceUp ? 'rotateY(180deg)' : 'rotateY(0deg)',
                position: 'relative',
                width: '100%',
                height: '100%',
            }"
        >
            <!-- Front face: card back image -->
            <div
                :style="{
                    backfaceVisibility: 'hidden',
                    WebkitBackfaceVisibility: 'hidden',
                    position: 'absolute',
                    inset: '0',
                }"
                class="flex items-center justify-center rounded-lg bg-indigo-600 overflow-hidden"
            >
                <img
                    :src="cardBackSrc"
                    alt="Card back"
                    class="w-full h-full object-cover"
                    @error="onImageError"
                />
            </div>

            <!-- Back face: card content image -->
            <div
                :style="{
                    backfaceVisibility: 'hidden',
                    WebkitBackfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)',
                    position: 'absolute',
                    inset: '0',
                }"
                class="flex items-center justify-center rounded-lg bg-white overflow-hidden"
            >
                <img
                    :src="card.imageSrc"
                    :alt="card.imageSlug"
                    class="w-full h-full object-cover"
                    @error="onImageError"
                />
            </div>
        </div>
    </div>
</template>
