<?php

use Illuminate\Support\Facades\Route;
use Modules\Dashboard\Controllers\DashboardController;

Route::group(['prefix' => 'dashboard', 'middleware' => ['auth.jwt']], function () {
    Route::get('/overview', [DashboardController::class, 'getOverview']);
    Route::post('/proposals/{id}/status', [DashboardController::class, 'updateProposalStatus']);
});
