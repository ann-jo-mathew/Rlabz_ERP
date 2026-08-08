<?php

use Illuminate\Support\Facades\Route;
use Modules\Auth\Controllers\AuthController;

/*
|--------------------------------------------------------------------------
| API Routes for Auth Module
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your module. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group.
|
*/

Route::group(['prefix' => 'auth'], function () {
    Route::post('register', [AuthController::class, 'register']);
    Route::post('login', [AuthController::class, 'login']);
    
    // Protected routes
    Route::group(['middleware' => ['auth.jwt']], function () {
        Route::post('logout', [AuthController::class, 'logout']);
        Route::post('refresh', [AuthController::class, 'refresh']);
        
        // Example of a route protected by both JWT and our custom Permission middleware
        Route::get('me', function () {
            // MOCK: In reality this would return auth()->user();
            return response()->json(['message' => 'This is a protected route. User is authenticated.']);
        })->middleware('permission:view-dashboard');
    });
});
