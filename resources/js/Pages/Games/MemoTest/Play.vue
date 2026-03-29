<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Head } from '@inertiajs/vue3';
import axios from 'axios';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.vue';
import GameBoard from '@/Components/Games/MemoTest/GameBoard.vue';
import GameHeader from '@/Components/Games/MemoTest/GameHeader.vue';
import WinCelebration from '@/Components/Games/MemoTest/WinCelebration.vue';
import { useGameState } from '@/Composables/Games/MemoTest/useGameState';
import { useTimer } from '@/Composables/Games/MemoTest/useTimer';
import { useAudio } from '@/Composables/Games/MemoTest/useAudio';
import { getTheme } from '@/Games/MemoTest/themes/index';
import type { MemoTestPlayPageProps, ThemeConfig } from '@/types/memo-test';

const props = defineProps<MemoTestPlayPageProps>();

const showCelebration = ref(false);
const audio = useAudio();
const timer = useTimer();

const themeConfig: ThemeConfig = getTheme(props.theme) ?? {
    slug: props.theme,
    name: props.theme,
    icon: '🎮',
    images: [],
    basePath: '/images/themes/' + props.theme,
    extension: '.webp',
};

async function saveResult(attempts: number, elapsed: number): Promise<void> {
    const payload = {
        attempts,
        duration_seconds: elapsed,
        completed_at: new Date().toISOString(),
    };

    for (let i = 0; i < 3; i++) {
        try {
            await axios.patch(route('games.memo-test.update', props.sessionId), payload);
            return;
        } catch {
            if (i < 2) {
                await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, i)));
            }
        }
    }
    // Silent failure — celebration stays visible
}

const { cards, attempts, canFlip, flipCard } = useGameState({
    theme: themeConfig,
    pairCount: props.pairCount,
    onFlip() {
        audio.play('flip');
        if (!timer.isRunning.value) timer.start();
    },
    onMatch() {
        audio.play('match');
    },
    onWin() {
        timer.stop();
        audio.play('win');
        showCelebration.value = true;
        void saveResult(attempts.value, timer.elapsed.value);
    },
});

onMounted(() => {
    audio.preload();
});
</script>

<template>
    <Head title="Memo Test - Play" />
    <AuthenticatedLayout>
        <template #header>
            <h2 class="text-xl font-semibold leading-tight text-gray-800">Memo Test</h2>
        </template>

        <div class="py-6">
            <GameHeader :attempts="attempts" :elapsed="timer.elapsed.value" />
            <GameBoard :cards="cards" :can-flip="canFlip" @flip="flipCard" />
        </div>

        <WinCelebration
            v-if="showCelebration"
            :attempts="attempts"
            :elapsed="timer.elapsed.value"
        />
    </AuthenticatedLayout>
</template>
