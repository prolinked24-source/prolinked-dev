<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CandidateProfileController;
use App\Http\Controllers\Api\JobController;
use App\Http\Controllers\Api\ApplicationController;
use App\Http\Controllers\DocumentController;
use App\Http\Controllers\ReviewController;

Route::get('/ping', function () {
    return response()->json(['message' => 'pong']);
});

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/admin/reviews/{candidateUserId}', [ReviewController::class, 'index']);
    Route::post('/admin/reviews', [ReviewController::class, 'store']);
});

Route::prefix('v1')->group(function () {
    // DocController
    Route::middleware('auth:sanctum')->group(function () {
    Route::get('/candidate/documents', [DocumentController::class, 'index']);
    Route::post('/candidate/documents', [DocumentController::class, 'upload']);
    Route::delete('/candidate/documents/{id}', [DocumentController::class, 'destroy']);

    // Auth
    Route::post('/auth/register-candidate', [AuthController::class, 'registerCandidate']);
    Route::post('/auth/register-employer', [AuthController::class, 'registerEmployer']);
    Route::post('/auth/login', [AuthController::class, 'login']);

    // Öffentliche Job-Liste + Detail
    Route::get('/jobs', [JobController::class, 'index']);
    Route::get('/jobs/{job}', [JobController::class, 'show']);

    // Geschützte Routen
    Route::middleware('auth:sanctum')->group(function () {

        Route::get('/auth/me', [AuthController::class, 'me']);
        Route::post('/auth/logout', [AuthController::class, 'logout']);

        // Candidate profile
        Route::post('/candidate/profile', [CandidateProfileController::class, 'updateProfile']);
        Route::post('/candidate/cv', [CandidateProfileController::class, 'uploadCv']);

        // Employer: eigene Jobs verwalten
        Route::get('/employer/jobs', [JobController::class, 'employerJobs']);
        Route::post('/employer/jobs', [JobController::class, 'store']);

        // Candidate: Bewerbungen
        Route::post('/jobs/{job}/apply', [ApplicationController::class, 'apply']);
        Route::get('/candidate/applications', [ApplicationController::class, 'candidateApplications']);

        // Employer: Bewerbungen für einen Job sehen
        Route::get('/employer/jobs/{job}/applications', [ApplicationController::class, 'jobApplications']);
    });
});
