<?php

use App\Http\Controllers\Games\GameSessionController;
use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

Route::middleware(['auth', 'verified'])->prefix('games')->name('games.')->group(function () {
    Route::get('memo-test', [GameSessionController::class, 'index'])
        ->name('memo-test.index');
    Route::post('memo-test', [GameSessionController::class, 'store'])
        ->name('memo-test.store');
    Route::get('memo-test/history', [GameSessionController::class, 'history'])
        ->name('memo-test.history');
    Route::get('memo-test/{gameSession}', [GameSessionController::class, 'show'])
        ->name('memo-test.show');
    Route::patch('memo-test/{gameSession}', [GameSessionController::class, 'update'])
        ->name('memo-test.update');
});

require __DIR__.'/auth.php';
