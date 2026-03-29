import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { effectScope } from 'vue';
import { useTimer } from '@/Composables/Games/MemoTest/useTimer';

describe('useTimer', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('starts incrementing elapsed every second', () => {
        const scope = effectScope();
        const { elapsed, isRunning, start } = scope.run(() => useTimer())!;

        start();
        expect(isRunning.value).toBe(true);

        vi.advanceTimersByTime(3000);
        expect(elapsed.value).toBe(3);

        scope.stop();
    });

    it('stop pauses the timer', () => {
        const scope = effectScope();
        const { elapsed, isRunning, start, stop } = scope.run(() => useTimer())!;

        start();
        vi.advanceTimersByTime(2000);
        stop();

        expect(isRunning.value).toBe(false);
        vi.advanceTimersByTime(2000);
        expect(elapsed.value).toBe(2);

        scope.stop();
    });

    it('reset stops and zeros elapsed', () => {
        const scope = effectScope();
        const { elapsed, isRunning, start, reset } = scope.run(() => useTimer())!;

        start();
        vi.advanceTimersByTime(5000);
        reset();

        expect(elapsed.value).toBe(0);
        expect(isRunning.value).toBe(false);
        vi.advanceTimersByTime(3000);
        expect(elapsed.value).toBe(0);

        scope.stop();
    });

    it('multiple start() calls do not create multiple intervals', () => {
        const scope = effectScope();
        const { elapsed, start } = scope.run(() => useTimer())!;

        start();
        start();
        start();

        vi.advanceTimersByTime(1000);
        expect(elapsed.value).toBe(1);

        scope.stop();
    });

    it('cleans up interval on scope disposal', () => {
        const scope = effectScope();
        const { elapsed, start } = scope.run(() => useTimer())!;

        start();
        vi.advanceTimersByTime(2000);
        scope.stop();

        vi.advanceTimersByTime(5000);
        expect(elapsed.value).toBe(2);
    });
});
