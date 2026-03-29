import { animals } from './animals';
import type { ThemeConfig } from '@/types/memo-test';

export const THEMES: readonly ThemeConfig[] = [animals];

export function getTheme(slug: string): ThemeConfig | undefined {
    return THEMES.find((t) => t.slug === slug);
}
