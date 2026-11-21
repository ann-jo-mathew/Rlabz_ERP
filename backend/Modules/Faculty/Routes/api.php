<?php

use Illuminate\Support\Facades\Route;
use Modules\Faculty\Http\Controllers\FacultyController;

Route::prefix('faculty')->group(function () {
    Route::get('/dashboard', [FacultyController::class, 'getDashboardData']);
    Route::get('/profile', [FacultyController::class, 'getProfile']);
    Route::put('/profile', [FacultyController::class, 'updateProfile']);
    Route::post('/profile', [FacultyController::class, 'updateProfile']);
    Route::post('/profile/photo', [FacultyController::class, 'uploadProfilePhoto']);
    Route::delete('/profile/photo', [FacultyController::class, 'deleteProfilePhoto']);
    Route::post('/change-password', [FacultyController::class, 'changePassword']);
    Route::get('/projects', [FacultyController::class, 'getProjects']);
    Route::get('/projects/{id}/report', [FacultyController::class, 'getProjectReport']);
    Route::get('/projects/{id}/modules-tasks', [FacultyController::class, 'getProjectModulesAndTasks']);
    Route::post('/projects/{id}/modules', [FacultyController::class, 'createModule']);
    Route::get('/modules/{id}/students', [FacultyController::class, 'getModuleStudents']);
    Route::post('/tasks', [FacultyController::class, 'createTask']);
    Route::post('/tasks/{id}/verify', [FacultyController::class, 'verifyTask']);
    Route::get('/projects/{id}/work-logs', [FacultyController::class, 'getProjectWorkLogs']);
    Route::get('/projects/{id}/work-logs/download', [FacultyController::class, 'downloadProjectWorkLogs']);
    Route::get('/projects/{id}/student-reports/download', [FacultyController::class, 'downloadProjectStudentReports']);
    Route::get('/projects/{id}/students/{studentId}/reports', [FacultyController::class, 'getStudentReportsForFaculty']);
    Route::post('/work-logs/{id}/approve', [FacultyController::class, 'approveWorkLog']);
    Route::post('/work-logs/{id}/rate', [FacultyController::class, 'rateWorkLog']);
    Route::post('/work-logs/{id}/notify-coordinator', [FacultyController::class, 'notifyCoordinator']);
    Route::get('/projects/{id}/client-requirements', [FacultyController::class, 'getProjectClientRequirements']);
    Route::get('/projects/{id}/requirement-changes', [FacultyController::class, 'getProjectRequirementChanges']);
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

    // Chat routes
    Route::get('/chat/projects/{projectId}/group', [FacultyController::class, 'getGroupChatMessages']);
    Route::post('/chat/projects/{projectId}/group/messages', [FacultyController::class, 'saveGroupChatMessage']);
    Route::get('/chat/projects/{projectId}/students', [FacultyController::class, 'getProjectChatStudents']);
    Route::get('/chat/projects/{projectId}/individual/{studentId}', [FacultyController::class, 'getIndividualChatMessages']);
    Route::post('/chat/projects/{projectId}/individual/{studentId}/messages', [FacultyController::class, 'saveIndividualChatMessage']);
});
