<?php

namespace App\Http\Requests\Games;

use Illuminate\Foundation\Http\FormRequest;

class UpdateGameSessionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'attempts' => ['required', 'integer', 'min:0', 'max:9999'],
            'duration_seconds' => ['required', 'integer', 'min:0', 'max:86400'],
            'completed_at' => ['required', 'date'],
        ];
    }
}
