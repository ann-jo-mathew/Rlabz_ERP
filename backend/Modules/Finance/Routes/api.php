<?php

use Illuminate\Support\Facades\Route;
use Modules\Finance\Controllers\FinanceController;
use Modules\Finance\Http\Controllers\PaymentController;

Route::group(['prefix' => 'finance', 'middleware' => ['auth.jwt']], function () {
    Route::get('/dashboard', [FinanceController::class, 'getDashboard']);
    Route::get('/projects', [FinanceController::class, 'getProjects']);
    Route::get('/projects/{id}', [FinanceController::class, 'getProjectDetails']);
    Route::post('/projects/{id}/allocations', [FinanceController::class, 'updateAllocations']);
    
    // Payments
    Route::post('/client-payments', [PaymentController::class, 'recordClientPayment']); 
    Route::post('/student-payments', [PaymentController::class, 'recordStudentPayment']); 
    Route::post('/faculty-payments', [PaymentController::class, 'recordFacultyPayment']);
    Route::post('/hosting-charges', [PaymentController::class, 'recordHostingCharge']);
    Route::post('/maintenance-charges', [PaymentController::class, 'recordMaintenanceCharge']);
    Route::post('/invoices', [PaymentController::class, 'createInvoice']);

    Route::get('/student-payments', [FinanceController::class, 'getStudentPayments']);
    Route::get('/faculty-payments', [FinanceController::class, 'getFacultyPayments']);
    Route::get('/invoices', [FinanceController::class, 'getInvoices']);
    Route::get('/transactions', [FinanceController::class, 'getTransactions']);

    Route::get('/student-hourly-rate/history', [FinanceController::class, 'getStudentHourlyRateHistory']);
    Route::post('/student-hourly-rate', [FinanceController::class, 'updateStudentHourlyRate']);
    Route::get('/ssl-renewal-history', [FinanceController::class, 'getSslRenewalHistory']);
    Route::post('/hosting-charges/{id}/renew', [FinanceController::class, 'renewSsl']);
});
