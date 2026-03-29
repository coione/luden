<script setup lang="ts">
import { computed, onMounted } from 'vue';
import confetti from 'canvas-confetti';
import { router } from '@inertiajs/vue3';

const props = defineProps<{
    attempts: number;
    elapsed: number;
}>();

const formattedTime = computed(() => {
    const m = Math.floor(props.elapsed / 60);
    const s = props.elapsed % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
});

function playAgain(): void {
    router.visit(route('games.memo-test.index'));
}

function fireConfetti(): void {
    const burst = (origin: { x: number; y: number }) => {
        confetti({
            particleCount: 80,
            spread: 70,
            origin,
            colors: ['#6366f1', '#ec4899', '#f59e0b', '#10b981'],
        });
    };

    burst({ x: 0.3, y: 0.6 });
    setTimeout(() => burst({ x: 0.7, y: 0.6 }), 300);
    setTimeout(() => burst({ x: 0.5, y: 0.4 }), 600);
}

onMounted(() => {
    fireConfetti();
});
</script>

<template>
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
        <div class="mx-4 max-w-sm rounded-2xl bg-white p-8 text-center shadow-2xl">
            <div class="mb-4 text-6xl">🎉</div>
            <h2 class="mb-2 text-3xl font-bold text-gray-800">¡Ganaste!</h2>
            <p class="mb-6 text-gray-500">{{ attempts }} intentos · {{ formattedTime }}</p>
            <button
                type="button"
                class="w-full rounded-xl bg-indigo-600 px-6 py-3 text-lg font-semibold text-white transition-colors hover:bg-indigo-700"
                @click="playAgain"
            >
                Jugar de nuevo
            </button>
        </div>
    </div>
</template>
