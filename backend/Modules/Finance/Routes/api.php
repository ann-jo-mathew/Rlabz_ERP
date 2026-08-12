<?php

use Illuminate\Support\Facades\Route;
use Modules\Finance\Controllers\FinanceController;

Route::group(['prefix' => 'finance', 'middleware' => ['auth.jwt']], function () {
    Route::get('/dashboard', [FinanceController::class, 'getDashboard']);
    Route::get('/projects', [FinanceController::class, 'getProjects']);
    Route::get('/projects/{id}', [FinanceController::class, 'getProjectDetails']);
    Route::post('/projects/{id}/payments', [FinanceController::class, 'recordClientPayment']); // Mock
    Route::get('/student-payments', [FinanceController::class, 'getStudentPayments']);
    Route::post('/student-payments', [FinanceController::class, 'recordStudentPayment']); // Mock
});
