<script setup lang="ts">
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.vue';
import { Head, Link } from '@inertiajs/vue3';
</script>

<template>
    <Head title="Dashboard" />

    <AuthenticatedLayout>
        <template #header>
            <h2 class="text-xl font-semibold leading-tight text-gray-800">Dashboard</h2>
        </template>

        <div class="py-12">
            <div class="mx-auto max-w-7xl sm:px-6 lg:px-8">
                <div class="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                    <div class="p-6">
                        <h3 class="mb-4 text-lg font-semibold text-gray-800">Games</h3>
                        <div class="flex gap-4">
                            <Link
                                :href="route('games.memo-test.index')"
                                class="flex items-center gap-3 rounded-xl bg-indigo-600 px-6 py-4 text-white transition-colors hover:bg-indigo-700"
                            >
                                <span class="text-3xl">🧩</span>
                                <div>
                                    <p class="font-bold">Memo Test</p>
                                    <p class="text-sm text-indigo-200">Memory matching pairs</p>
                                </div>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </AuthenticatedLayout>
</template>
