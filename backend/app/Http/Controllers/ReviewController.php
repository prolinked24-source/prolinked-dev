<?php

namespace App\Http\Controllers;

use App\Models\CandidateReview;
use App\Models\User;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    // Liste Reviews für einen Kandidaten (Admin only)
    public function index(Request $request, int $candidateUserId)
    {
        $user = $request->user();

        if ($user->role !== 'admin') {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $candidate = User::where('id', $candidateUserId)
            ->where('role', 'candidate')
            ->firstOrFail();

        $reviews = CandidateReview::with('reviewer')
            ->where('candidate_user_id', $candidate->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($reviews);
    }

    // Review speichern (Admin only)
    public function store(Request $request)
    {
        $user = $request->user();

        if ($user->role !== 'admin') {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $validated = $request->validate([
            'candidate_user_id' => ['required', 'exists:users,id'],
            'score'             => ['nullable', 'integer', 'min:1', 'max:5'],
            'notes'             => ['nullable', 'string'],
        ]);

        $candidate = User::where('id', $validated['candidate_user_id'])
            ->where('role', 'candidate')
            ->firstOrFail();

        $review = CandidateReview::create([
            'candidate_user_id' => $candidate->id,
            'reviewer_id'       => $user->id,
            'score'             => $validated['score'] ?? null,
            'notes'             => $validated['notes'] ?? null,
        ]);

        return response()->json([
            'message' => 'Review gespeichert.',
            'review'  => $review->load('reviewer'),
        ], 201);
    }
}
