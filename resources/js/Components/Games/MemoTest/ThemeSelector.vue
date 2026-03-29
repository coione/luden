<script setup lang="ts">
const props = defineProps<{
    themes: ReadonlyArray<{ slug: string; name: string; icon: string }>;
    modelValue: string;
}>();

const emit = defineEmits<{
    'update:modelValue': [slug: string];
}>();

function selectTheme(slug: string): void {
    emit('update:modelValue', slug);
}
</script>

<template>
    <div class="grid grid-cols-3 gap-3">
        <button
            v-for="theme in props.themes"
            :key="theme.slug"
            type="button"
            :class="[
                'flex flex-col items-center justify-center gap-2 rounded-xl border-2 p-3 transition-colors',
                'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2',
                props.modelValue === theme.slug
                    ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-500'
                    : 'border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-50',
            ]"
            style="min-width: 80px; min-height: 80px"
            @click="selectTheme(theme.slug)"
        >
            <span class="text-3xl">{{ theme.icon }}</span>
            <span
                :class="[
                    'text-sm font-medium',
                    props.modelValue === theme.slug ? 'text-indigo-700' : 'text-gray-700',
                ]"
            >
                {{ theme.name }}
            </span>
        </button>
    </div>
</template>
