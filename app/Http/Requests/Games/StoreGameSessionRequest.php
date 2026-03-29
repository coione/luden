<?php

namespace App\Http\Requests\Games;

use App\Games\MemoTest\ThemeRegistry;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreGameSessionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'theme' => ['required', 'string', Rule::in(ThemeRegistry::validSlugs())],
            'pairs_count' => ['required', 'integer', Rule::in([3, 4, 6])],
        ];
    }
}
