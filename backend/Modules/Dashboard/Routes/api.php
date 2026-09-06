<?php

use Illuminate\Support\Facades\Route;
use Modules\Dashboard\Controllers\DashboardController;
use Modules\Auth\Middleware\JwtMiddleware;

Route::group(['prefix' => 'dashboard', 'middleware' => [JwtMiddleware::class]], function () {
    Route::get('/overview', [DashboardController::class, 'getOverview']);
    Route::get('/projects', [DashboardController::class, 'getProjects']);
    Route::get('/proposals', [DashboardController::class, 'getProposals']);
    Route::get('/finance', [DashboardController::class, 'getFinanceSummary']);
    Route::get('/audit-logs', [DashboardController::class, 'getAuditLogs']);
    Route::get('/faculties', [DashboardController::class, 'getFaculties']);
    Route::get('/client-requirements', [DashboardController::class, 'getClientRequirements']);
    Route::get('/students', [DashboardController::class, 'getStudents']);
    Route::post('/proposals/{proposalId}/status', [DashboardController::class, 'updateProposalStatus']);
    Route::post('/projects/{projectId}/assign-faculty', [DashboardController::class, 'assignFaculty']);
});
