<?php

namespace App\Http\Controllers;

use App\Models\Employer;
use App\Models\Job;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class EmployerController extends Controller
{
    /**
     * Liste der Jobs des eingeloggten Employers.
     * GET /api/v1/employer/jobs
     */
    public function jobs(Request $request)
    {
        $user = $request->user();

        if ($user->role !== 'employer') {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        // Employer-Datensatz zum User finden
        $employer = Employer::where('user_id', $user->id)->first();

        if (!$employer) {
            return response()->json([
                'message' => 'Employer-Datensatz für diesen Benutzer wurde nicht gefunden.',
            ], 404);
        }

        $jobs = Job::where('employer_id', $employer->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($jobs);
    }

    /**
     * Neuen Job für den eingeloggten Employer anlegen.
     * POST /api/v1/employer/jobs
     */
    public function store(Request $request)
    {
        $user = $request->user();

        if ($user->role !== 'employer') {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        // Employer-Datensatz zum User finden
        $employer = Employer::where('user_id', $user->id)->first();

        if (!$employer) {
            return response()->json([
                'message' => 'Employer-Datensatz für diesen Benutzer wurde nicht gefunden.',
            ], 404);
        }

        $validated = $request->validate([
            'title'              => 'required|string|max:255',
            'location'           => 'nullable|string|max:255',
            'employment_type'    => 'nullable|string|max:255',
            'description'        => 'required|string',
            'requirements'       => 'nullable|string',
            'language_requirement' => 'nullable|string|max:255',
            'is_active'          => 'sometimes|boolean',
        ]);

        $job = new Job();
        $job->employer_id          = $employer->id;
        $job->title                = $validated['title'];
        $job->location             = $validated['location'] ?? null;
        $job->employment_type      = $validated['employment_type'] ?? null;
        $job->description          = $validated['description'];
        $job->requirements         = $validated['requirements'] ?? null;
        $job->language_requirement = $validated['language_requirement'] ?? null;
        $job->is_active            = $validated['is_active'] ?? true;

        $job->save();

        return response()->json($job, 201);
    }
}
