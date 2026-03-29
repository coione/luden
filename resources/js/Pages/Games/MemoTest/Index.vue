<script setup lang="ts">
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.vue';
import ThemeSelector from '@/Components/Games/MemoTest/ThemeSelector.vue';
import PairCountSelector from '@/Components/Games/MemoTest/PairCountSelector.vue';
import { useForm, Head } from '@inertiajs/vue3';
import type { MemoTestConfigPageProps } from '@/types/memo-test';

const props = defineProps<MemoTestConfigPageProps>();

const form = useForm({
    theme: 'animals',
    pairs_count: 3,
});

function submit(): void {
    form.post(route('games.memo-test.store'));
}
</script>

<template>
    <Head title="Memo Test" />
    <AuthenticatedLayout>
        <template #header>
            <h2 class="text-xl font-semibold leading-tight text-gray-800">Memo Test</h2>
        </template>

        <div class="py-12">
            <div class="mx-auto max-w-md px-4">
                <form class="space-y-8" @submit.prevent="submit">
                    <!-- Theme selection -->
                    <div>
                        <label class="mb-3 block text-lg font-semibold text-gray-700">Theme</label>
                        <ThemeSelector v-model="form.theme" :themes="props.themes" />
                        <p v-if="form.errors.theme" class="mt-1 text-sm text-red-600">
                            {{ form.errors.theme }}
                        </p>
                    </div>

                    <!-- Pair count -->
                    <div>
                        <label class="mb-3 block text-lg font-semibold text-gray-700"
                            >Number of pairs</label
                        >
                        <PairCountSelector v-model="form.pairs_count" :options="props.pairCounts" />
                        <p v-if="form.errors.pairs_count" class="mt-1 text-sm text-red-600">
                            {{ form.errors.pairs_count }}
                        </p>
                    </div>

                    <button
                        type="submit"
                        :disabled="form.processing"
                        class="w-full rounded-xl bg-indigo-600 px-6 py-4 text-xl font-bold text-white transition-colors hover:bg-indigo-700 disabled:opacity-60"
                    >
                        🎮 Start!
                    </button>
                </form>
            </div>
        </div>
    </AuthenticatedLayout>
</template>
