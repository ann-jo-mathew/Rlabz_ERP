<?php

use Illuminate\Support\Facades\Route;
use Modules\Faculty\Http\Controllers\FacultyController;

Route::prefix('faculty')->group(function () {
    Route::get('/dashboard', [FacultyController::class, 'getDashboardData']);
    Route::get('/profile', [FacultyController::class, 'getProfile']);
    Route::get('/projects', [FacultyController::class, 'getProjects']);
    Route::get('/projects/{id}/report', [FacultyController::class, 'getProjectReport']);
    Route::get('/projects/{id}/modules-tasks', [FacultyController::class, 'getProjectModulesAndTasks']);
    Route::post('/projects/{id}/modules', [FacultyController::class, 'createModule']);
    Route::get('/modules/{id}/students', [FacultyController::class, 'getModuleStudents']);
    Route::post('/tasks', [FacultyController::class, 'createTask']);
    Route::post('/tasks/{id}/verify', [FacultyController::class, 'verifyTask']);
    Route::get('/projects/{id}/work-logs', [FacultyController::class, 'getProjectWorkLogs']);
    Route::post('/work-logs/{id}/approve', [FacultyController::class, 'approveWorkLog']);
    Route::get('/students', [FacultyController::class, 'getStudents']);
    Route::get('/meetings', [FacultyController::class, 'getMeetings']);
    Route::post('/meetings', [FacultyController::class, 'createMeeting']);
    Route::post('/meetings/{id}/status', [FacultyController::class, 'updateMeetingStatus']);
    Route::get('/sprints', [FacultyController::class, 'getSprints']);
    Route::get('/reports', [FacultyController::class, 'getReports']);
    Route::post('/reports/{id}/review', [FacultyController::class, 'reviewReport']);
    Route::get('/reports/{id}/download', [FacultyController::class, 'downloadReportFile']);
    Route::post('/feedback', [FacultyController::class, 'sendFeedback']);
    Route::delete('/modules/{moduleId}/students/{studentId}', [FacultyController::class, 'removeStudentFromModule']);
    Route::get('/notifications', [FacultyController::class, 'getNotifications']);
    Route::post('/github-repositories/{id}/verify', [FacultyController::class, 'verifyGithubRepository']);
});
