<?php

namespace App\Http\Controllers;

use App\Models\CandidateProfile;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AdminCandidateController extends Controller
{
    public function updateStatus(Request $request, int $candidateUserId)
    {
        $admin = $request->user();

        if ($admin->role !== 'admin') {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $validated = $request->validate([
            'status' => [
                'required',
                Rule::in(['new', 'reviewed', 'eligible']),
            ],
        ]);

        $candidate = User::where('id', $candidateUserId)
            ->where('role', 'candidate')
            ->firstOrFail();

        $profile = CandidateProfile::where('user_id', $candidate->id)->firstOrFail();

        $profile->status = $validated['status'];
        $profile->save();

        return response()->json([
            'message' => 'Status aktualisiert.',
            'status'  => $profile->status,
        ]);
    }
}
