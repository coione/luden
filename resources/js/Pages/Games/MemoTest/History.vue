<script setup lang="ts">
import { Head } from '@inertiajs/vue3';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.vue';
import type { MemoTestHistoryPageProps } from '@/types/memo-test';

const props = defineProps<MemoTestHistoryPageProps>();

function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}
</script>

<template>
    <Head title="Game History" />
    <AuthenticatedLayout>
        <template #header>
            <h2 class="text-xl font-semibold leading-tight text-gray-800">Game History</h2>
        </template>

        <div class="py-12">
            <div class="mx-auto max-w-2xl px-4">
                <div v-if="props.sessions.length === 0" class="py-16 text-center text-gray-500">
                    <p class="text-lg">No games played yet!</p>
                </div>

                <div v-else class="space-y-3">
                    <div
                        v-for="session in props.sessions"
                        :key="session.id"
                        class="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100"
                    >
                        <div>
                            <p class="font-semibold capitalize text-gray-800">
                                {{ session.theme }}
                            </p>
                            <p class="text-sm text-gray-500">
                                {{ formatDate(session.completedAt) }}
                            </p>
                        </div>
                        <div class="text-right text-sm text-gray-600">
                            <p>{{ session.pairsCount }} pairs · {{ session.attempts }} tries</p>
                            <p>{{ formatTime(session.durationSeconds) }}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </AuthenticatedLayout>
</template>
