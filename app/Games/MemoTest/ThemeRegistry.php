<?php

namespace App\Games\MemoTest;

final class ThemeRegistry
{
    /** @return array<int, array{slug: string, name: string, icon: string}> */
    public static function all(): array
    {
        return [
            ['slug' => 'animals', 'name' => 'Animals', 'icon' => '🐾'],
        ];
    }

    /** @return array<int, string> */
    public static function validSlugs(): array
    {
        return array_column(self::all(), 'slug');
    }
}
