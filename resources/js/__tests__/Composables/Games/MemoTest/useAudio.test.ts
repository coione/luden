import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useAudio } from '@/Composables/Games/MemoTest/useAudio';

describe('useAudio', () => {
    const mockPlay = vi.fn();
    let instances: Array<{ preload: string; currentTime: number; play: typeof mockPlay }>;

    beforeEach(() => {
        mockPlay.mockResolvedValue(undefined);
        instances = [];

        function AudioMock(
            this: { preload: string; currentTime: number; play: typeof mockPlay },
            src: string,
        ) {
            void src;
            this.preload = '';
            this.currentTime = 0;
            this.play = mockPlay;
            instances.push(this);
        }

        vi.stubGlobal('Audio', AudioMock);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.clearAllMocks();
    });

    it('preload creates 3 Audio instances', () => {
        const { preload } = useAudio();
        preload();
        expect(instances).toHaveLength(3);
    });

    it('preload uses correct sound paths', () => {
        const srcs: string[] = [];
        function AudioCapture(
            this: { preload: string; currentTime: number; play: typeof mockPlay },
            src: string,
        ) {
            srcs.push(src);
            this.preload = '';
            this.currentTime = 0;
            this.play = mockPlay;
        }
        vi.stubGlobal('Audio', AudioCapture);

        const { preload } = useAudio();
        preload();
        expect(srcs).toEqual(['/sounds/flip.mp3', '/sounds/match.mp3', '/sounds/win.mp3']);
    });

    it('play calls audio.play()', () => {
        const { preload, play } = useAudio();
        preload();
        play('flip');
        expect(mockPlay).toHaveBeenCalledTimes(1);
    });

    it('play catches errors silently', async () => {
        mockPlay.mockRejectedValue(new Error('NotAllowedError'));
        const { preload, play } = useAudio();
        preload();
        await expect(async () => play('flip')).not.toThrow();
    });

    it('play resets currentTime to 0 before playing', () => {
        const { preload, play } = useAudio();
        preload();
        instances[0]!.currentTime = 5;
        play('flip');
        expect(instances[0]!.currentTime).toBe(0);
    });
});
