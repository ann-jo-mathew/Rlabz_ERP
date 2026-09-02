<?php

use Illuminate\Support\Facades\Route;
use Modules\Project\Controllers\ProjectController;
use Modules\Project\Controllers\ProjectAssignmentController;
use Modules\Project\Controllers\ClientRequirementController;
use Modules\Project\Controllers\ProjectTaskController;
use Modules\Auth\Middleware\JwtMiddleware;

Route::group(['prefix' => 'projects', 'middleware' => [JwtMiddleware::class]], function () {
    Route::get('/', [ProjectController::class, 'index']);
    Route::post('/', [ProjectController::class, 'store']);
    Route::get('/{id}', [ProjectController::class, 'show']);
    Route::post('/{id}/close', [ProjectController::class, 'close']);

    Route::post('/{id}/faculty', [ProjectAssignmentController::class, 'assignFaculty']);
    Route::post('/{id}/students', [ProjectAssignmentController::class, 'assignStudent']);

    Route::get('/{id}/requirements', [ClientRequirementController::class, 'index']);
    Route::post('/{id}/requirements', [ClientRequirementController::class, 'store']);
    Route::put('/requirements/{id}', [ClientRequirementController::class, 'update']);

    Route::post('/{id}/modules', [ProjectTaskController::class, 'storeModule']);
    Route::post('/modules/{id}/tasks', [ProjectTaskController::class, 'storeTask']);
    Route::patch('/tasks/{id}/status', [ProjectTaskController::class, 'updateTaskStatus']);
});
