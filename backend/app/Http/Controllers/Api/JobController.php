<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Job;
use Illuminate\Http\Request;

class JobController extends Controller
{
    // Öffentliche Job-Liste (mit einfachen Filtern)
    public function index(Request $request)
    {
        $query = Job::with('employer');

        if ($search = $request->query('q')) {
            $query->where('title', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
        }

        if ($location = $request->query('location')) {
            $query->where('location', 'like', "%{$location}%");
        }

        if ($employmentType = $request->query('employment_type')) {
            $query->where('employment_type', $employmentType);
        }

        if ($language = $request->query('language_requirement')) {
            $query->where('language_requirement', $language);
        }

        $query->where('is_active', true);

        return response()->json(
            $query->orderByDesc('created_at')->paginate(10)
        );
    }

    // Einzelnen Job anzeigen
    public function show(Job $job)
    {
        $job->load('employer');
        return response()->json($job);
    }

    // Job anlegen (nur Arbeitgeber)
    public function store(Request $request)
    {
        $user = $request->user();

        if ($user->role !== 'employer' || ! $user->employer) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $data = $request->validate([
            'title'               => 'required|string|max:255',
            'location'            => 'nullable|string|max:255',
            'employment_type'     => 'nullable|string|max:255',
            'description'         => 'required|string',
            'requirements'        => 'nullable|string',
            'language_requirement'=> 'nullable|string|max:255',
            'is_active'           => 'boolean',
        ]);

        $data['employer_id'] = $user->employer->id;
        $data['is_active']   = $data['is_active'] ?? true;

        $job = Job::create($data);

        return response()->json($job, 201);
    }

    // Alle Jobs eines Arbeitgebers
    public function employerJobs(Request $request)
    {
        $user = $request->user();

        if ($user->role !== 'employer' || ! $user->employer) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $jobs = $user->employer->jobs()->orderByDesc('created_at')->get();

        return response()->json($jobs);
    }
}

