import type { UseAudioReturn, SoundName } from '@/types/memo-test';

export function useAudio(): UseAudioReturn {
    const sounds: Partial<Record<SoundName, HTMLAudioElement>> = {};

    function preload(): void {
        const names: SoundName[] = ['flip', 'match', 'win'];
        for (const name of names) {
            const audio = new Audio(`/sounds/${name}.mp3`);
            audio.preload = 'auto';
            sounds[name] = audio;
        }
    }

    function play(sound: SoundName): void {
        const audio = sounds[sound];
        if (!audio) return;
        audio.currentTime = 0;
        audio.play().catch(() => {});
    }

    return { preload, play };
}
