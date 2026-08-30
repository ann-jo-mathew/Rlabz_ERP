<?php

use Illuminate\Support\Facades\Route;
use Modules\Dashboard\Controllers\DashboardController;
use Modules\Auth\Middleware\JwtMiddleware;

Route::group(['prefix' => 'dashboard', 'middleware' => [JwtMiddleware::class]], function () {
    Route::get('/overview', [DashboardController::class, 'getOverview']);
    Route::get('/projects', [DashboardController::class, 'getProjects']);
    Route::post('/proposals/{id}/status', [DashboardController::class, 'updateProposalStatus']);
    Route::get('/audit-logs', [DashboardController::class, 'getAuditLogs']);
    Route::get('/faculties', [DashboardController::class, 'getFaculties']);
    Route::post('/projects/{id}/assign-faculty', [DashboardController::class, 'assignFaculty']);
});
