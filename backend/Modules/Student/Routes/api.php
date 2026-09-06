<?php

use Illuminate\Support\Facades\Route;
use Modules\Student\Controllers\StudentController;

Route::group(['prefix' => 'student', 'middleware' => ['auth.jwt']], function () {
    Route::get('/projects', [StudentController::class, 'getProjects']);
    Route::get('/sprints', [StudentController::class, 'getSprints']);
    Route::post('/sprints', [StudentController::class, 'saveSprint']);
    Route::get('/reports', [StudentController::class, 'getReports']);
    Route::post('/reports', [StudentController::class, 'saveReport']);
    Route::get('/work-logs', [StudentController::class, 'getWorkLogs']);
    Route::post('/work-logs', [StudentController::class, 'saveWorkLog']);
    Route::get('/github', [StudentController::class, 'getGithub']);
    Route::post('/github', [StudentController::class, 'saveGithubUrl']);
    Route::get('/certificates', [StudentController::class, 'getCertificates']);
    Route::get('/meetings', [StudentController::class, 'getMeetings']);
    Route::get('/notifications', [StudentController::class, 'getNotifications']);
    Route::get('/profile', [StudentController::class, 'getProfile']);
    Route::get('/chats/{projectId}', [StudentController::class, 'getChatMessages']);
    Route::post('/chats/{projectId}/messages', [StudentController::class, 'saveChatMessage']);
});
