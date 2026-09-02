<?php

use Illuminate\Support\Facades\Route;
use Modules\Coordinator\Http\Controllers\CoordinatorController;

Route::group(['prefix' => 'coordinator', 'middleware' => ['auth.jwt']], function () {
    Route::get('/projects', [CoordinatorController::class, 'index']);
    Route::post('/projects', [CoordinatorController::class, 'store']);
    Route::get('/projects/{project}', [CoordinatorController::class, 'show']);

    Route::post('/projects/{project}/students', [CoordinatorController::class, 'assignStudent']);
    Route::delete('/projects/{project}/students/{studentId}', [CoordinatorController::class, 'removeStudent']);

    Route::post('/projects/{project}/faculty', [CoordinatorController::class, 'assignFaculty']);
    Route::delete('/projects/{project}/faculty/{facultyId}', [CoordinatorController::class, 'removeFaculty']);

    Route::get('/projects/{project}/requirements', [CoordinatorController::class, 'requirements']);
    Route::post('/projects/{project}/requirements', [CoordinatorController::class, 'storeRequirement']);

    Route::get('/projects/{project}/requirement-changes', [CoordinatorController::class, 'requirementChanges']);
    Route::post('/projects/{project}/requirement-changes', [CoordinatorController::class, 'storeRequirementChange']);

    Route::get('/students', [CoordinatorController::class, 'students']);
    Route::post('/students', [CoordinatorController::class, 'storeStudent']);

    Route::get('/faculty', [CoordinatorController::class, 'faculty']);

    Route::get('/meetings', [CoordinatorController::class, 'meetings']);
    Route::post('/meetings', [CoordinatorController::class, 'storeMeeting']);

    Route::post('/projects/{project}/close', [CoordinatorController::class, 'close']);
});
