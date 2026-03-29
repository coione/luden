import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
    plugins: [vue()],
    test: {
        environment: 'happy-dom',
        include: ['resources/js/**/*.{test,spec}.{ts,tsx}'],
    },
    resolve: {
        alias: {
            '@': resolve(__dirname, 'resources/js'),
        },
    },
});
