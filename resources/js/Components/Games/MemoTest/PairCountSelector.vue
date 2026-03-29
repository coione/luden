<script setup lang="ts">
const props = defineProps<{
    options: readonly number[];
    modelValue: number;
}>();

const emit = defineEmits<{
    'update:modelValue': [count: number];
}>();

function selectCount(count: number): void {
    emit('update:modelValue', count);
}
</script>

<template>
    <div class="flex flex-row gap-3">
        <button
            v-for="option in props.options"
            :key="option"
            type="button"
            :class="[
                'flex-1 rounded-lg border-2 px-4 font-semibold transition-colors',
                'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2',
                props.modelValue === option
                    ? 'border-indigo-600 bg-indigo-600 text-white'
                    : 'border-indigo-300 bg-white text-indigo-700 hover:border-indigo-500 hover:bg-indigo-50',
            ]"
            style="min-height: 48px"
            @click="selectCount(option)"
        >
            {{ option }} pairs
        </button>
    </div>
</template>
