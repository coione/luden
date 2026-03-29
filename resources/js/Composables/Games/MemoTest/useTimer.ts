import { ref, onScopeDispose } from 'vue';
import type { UseTimerReturn } from '@/types/memo-test';

export function useTimer(): UseTimerReturn {
    const elapsed = ref<number>(0);
    const isRunning = ref<boolean>(false);
    let intervalId: ReturnType<typeof setInterval> | null = null;

    function start(): void {
        if (isRunning.value) return;
        isRunning.value = true;
        intervalId = setInterval(() => {
            elapsed.value += 1;
        }, 1000);
    }

    function stop(): void {
        if (intervalId !== null) {
            clearInterval(intervalId);
            intervalId = null;
        }
        isRunning.value = false;
    }

    function reset(): void {
        stop();
        elapsed.value = 0;
    }

    onScopeDispose(() => {
        stop();
    });

    return { elapsed, isRunning, start, stop, reset };
}
