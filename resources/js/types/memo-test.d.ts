// -- Card State --
export interface Card {
    readonly id: number;
    readonly imageSlug: string;
    readonly imageSrc: string;
    isFaceUp: boolean;
    isMatched: boolean;
}

export type GameStatus = 'idle' | 'playing' | 'won';
export type PairCount = 3 | 4 | 6;

// -- Theme System --
export interface ThemeConfig {
    readonly slug: string;
    readonly name: string;
    readonly icon: string;
    readonly images: readonly string[];
    readonly basePath: string;
    readonly extension: string;
}

// -- Game State Composable --
export interface UseGameStateReturn {
    readonly cards: Readonly<import('vue').Ref<Card[]>>;
    readonly attempts: Readonly<import('vue').Ref<number>>;
    readonly status: Readonly<import('vue').Ref<GameStatus>>;
    readonly isWon: import('vue').ComputedRef<boolean>;
    readonly canFlip: import('vue').ComputedRef<boolean>;
    flipCard: (cardId: number) => void;
    reset: () => void;
}

export interface UseGameStateOptions {
    readonly theme: ThemeConfig;
    readonly pairCount: PairCount;
    readonly onWin?: () => void;
    readonly onFlip?: () => void;
    readonly onMatch?: () => void;
}

// -- Timer --
export interface UseTimerReturn {
    readonly elapsed: Readonly<import('vue').Ref<number>>;
    readonly isRunning: Readonly<import('vue').Ref<boolean>>;
    start: () => void;
    stop: () => void;
    reset: () => void;
}

// -- Audio --
export type SoundName = 'flip' | 'match' | 'win';

export interface UseAudioReturn {
    play: (sound: SoundName) => void;
    preload: () => void;
}

// -- Inertia Page Props --
export interface MemoTestConfigPageProps {
    themes: ReadonlyArray<{ slug: string; name: string; icon: string }>;
    pairCounts: readonly PairCount[];
}

export interface MemoTestPlayPageProps {
    sessionId: string;
    theme: string;
    pairCount: PairCount;
}

export interface MemoTestHistoryPageProps {
    sessions: ReadonlyArray<GameSessionRecord>;
}

export interface GameSessionRecord {
    readonly id: string;
    readonly gameType: string;
    readonly theme: string;
    readonly pairsCount: number;
    readonly attempts: number;
    readonly durationSeconds: number;
    readonly completedAt: string;
}
