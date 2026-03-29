<script setup lang="ts">
const props = defineProps<{
    attempts: number;
    elapsed: number;
}>();

function formatElapsed(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
}
</script>

<template>
    <div class="flex items-center justify-between px-4 py-3 bg-white rounded-xl shadow-sm">
        <div class="flex flex-col items-center gap-1">
            <span class="text-2xl">🔄</span>
            <span class="text-2xl font-bold text-gray-900">{{ props.attempts }}</span>
            <span class="text-xs font-medium text-gray-500 uppercase tracking-wide">Attempts</span>
        </div>

        <div class="flex flex-col items-center gap-1">
            <span class="text-2xl">⏱</span>
            <span class="text-2xl font-bold text-gray-900">{{ formatElapsed(props.elapsed) }}</span>
            <span class="text-xs font-medium text-gray-500 uppercase tracking-wide">Time</span>
        </div>
    </div>
</template>
