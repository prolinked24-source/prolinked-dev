<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Models\Job;
use Illuminate\Http\Request;

class ApplicationController extends Controller
{
    // Kandidat bewirbt sich auf einen Job
    public function apply(Request $request, Job $job)
    {
        $user = $request->user();

        if ($user->role !== 'candidate' || ! $user->candidateProfile) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $candidateProfile = $user->candidateProfile;

        // Prüfen, ob schon eine Bewerbung existiert
        $existing = Application::where('candidate_profile_id', $candidateProfile->id)
            ->where('job_id', $job->id)
            ->first();

        if ($existing) {
            return response()->json([
                'message' => 'You have already applied for this job.',
            ], 409);
        }

        $application = Application::create([
            'candidate_profile_id' => $candidateProfile->id,
            'job_id'               => $job->id,
            'status'               => 'submitted',
        ]);

        return response()->json($application, 201);
    }

    // Alle Bewerbungen eines Kandidaten
    public function candidateApplications(Request $request)
    {
        $user = $request->user();

        if ($user->role !== 'candidate' || ! $user->candidateProfile) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $applications = Application::with('job.employer')
            ->where('candidate_profile_id', $user->candidateProfile->id)
            ->orderByDesc('created_at')
            ->get();

        return response()->json($applications);
    }

    // Alle Bewerbungen für einen Job (für Arbeitgeber)
    public function jobApplications(Request $request, Job $job)
    {
        $user = $request->user();

        if ($user->role !== 'employer' || ! $user->employer) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        // Sicherstellen, dass der Job zum Arbeitgeber gehört
        if ($job->employer_id !== $user->employer->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $applications = Application::with('candidateProfile.user')
            ->where('job_id', $job->id)
            ->orderByDesc('created_at')
            ->get();

        return response()->json($applications);
    }
}

