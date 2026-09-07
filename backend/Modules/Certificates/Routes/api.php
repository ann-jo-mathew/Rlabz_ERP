<?php

use Illuminate\Support\Facades\Route;
use Modules\Certificates\Http\Controllers\CertificatesController;

Route::group(['prefix' => 'certificates', 'middleware' => ['auth.jwt']], function () {
    Route::get('/', [CertificatesController::class, 'index']);
    Route::get('/{certificate}', [CertificatesController::class, 'show']);
    Route::get('/projects/{project}', [CertificatesController::class, 'projectCertificates']);
    Route::get('/students/{student}', [CertificatesController::class, 'studentCertificates']);
    Route::get('/modules/{module}/eligible-students', [CertificatesController::class, 'moduleEligibleStudents']);
    Route::post('/', [CertificatesController::class, 'store']);
});
