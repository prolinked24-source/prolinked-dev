<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CandidateController;
use App\Http\Controllers\EmployerController;
use App\Http\Controllers\JobController;
use App\Http\Controllers\ApplicationController;
use App\Http\Controllers\DocumentController;
use App\Http\Controllers\ReviewController;
use App\Http\Controllers\AdminCandidateController;

/*
|--------------------------------------------------------------------------
| API Routes (v1)
|--------------------------------------------------------------------------
|
| Hier liegen alle API-Routen für die PROLINKED-Plattform.
| Basis-Prefix wird in bootstrap/app.php mit "api/v1" gesetzt.
|
*/

Route::prefix('v1')->group(function () {

    /*
    |--------------------------------------------------------------------------
    | Public Auth Routes
    |--------------------------------------------------------------------------
    */
    Route::post('/auth/register-candidate', [AuthController::class, 'registerCandidate']);
    Route::post('/auth/register-employer', [AuthController::class, 'registerEmployer']);
    Route::post('/auth/login', [AuthController::class, 'login']);

    /*
    |--------------------------------------------------------------------------
    | Public Job Routes
    |--------------------------------------------------------------------------
    */
    Route::get('/jobs', [JobController::class, 'index']);

    /*
    |--------------------------------------------------------------------------
    | Protected Routes (auth:sanctum)
    |--------------------------------------------------------------------------
    */
    Route::middleware('auth:sanctum')->group(function () {

        // Auth / User
        Route::get('/auth/me', [AuthController::class, 'me']);
        Route::post('/auth/logout', [AuthController::class, 'logout']);

        // Candidate: eigene Bewerbungen + CV-Upload
        Route::get('/candidate/applications', [CandidateController::class, 'applications']);
        Route::post('/candidate/cv', [CandidateController::class, 'uploadCv']);

        // Candidate: Dokumentenmanagement (neu)
        Route::get('/candidate/documents', [DocumentController::class, 'index']);
        Route::post('/candidate/documents', [DocumentController::class, 'upload']);
        Route::delete('/candidate/documents/{id}', [DocumentController::class, 'destroy']);

        // Employer: Jobs verwalten
        Route::get('/employer/jobs', [EmployerController::class, 'jobs']);
        Route::post('/employer/jobs', [EmployerController::class, 'store']);

        // Employer: Bewerbungen für einen Job sehen
        Route::get('/employer/jobs/{job}/applications', [ApplicationController::class, 'jobApplications']);

        // Candidate: auf Job bewerben
        Route::post('/jobs/{job}/apply', [ApplicationController::class, 'apply']);

        // Admin: Kandidaten-Status setzen (Neu → Geprüft → Vermittelbar)
        Route::patch(
            '/admin/candidates/{candidateUserId}/status',
            [AdminCandidateController::class, 'updateStatus']
        );

        // Admin: Reviews/Bewertungen verwalten
        Route::get('/admin/reviews/{candidateUserId}', [ReviewController::class, 'index']);
        Route::post('/admin/reviews', [ReviewController::class, 'store']);
    });
});
