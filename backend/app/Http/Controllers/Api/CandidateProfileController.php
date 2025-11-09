<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class CandidateProfileController extends Controller
{
    public function updateProfile(Request $request)
    {
        $user = $request->user();

        if ($user->role !== 'candidate') {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $data = $request->validate([
            'country_of_origin'  => 'nullable|string|max:255',
            'target_country'     => 'nullable|string|max:255',
            'primary_language'   => 'nullable|string|max:255',
            'secondary_language' => 'nullable|string|max:255',
            'current_position'   => 'nullable|string|max:255',
            'desired_position'   => 'nullable|string|max:255',
            'summary'            => 'nullable|string',
        ]);

        $profile = $user->candidateProfile;
        $profile->update($data);

        return response()->json($profile);
    }

    public function uploadCv(Request $request)
    {
        $user = $request->user();

        if ($user->role !== 'candidate') {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $request->validate([
            'cv' => 'required|file|mimes:pdf,doc,docx|max:5120',
        ]);

        $path = $request->file('cv')->store('cvs', 'public');

        $profile = $user->candidateProfile;
        $profile->cv_path = $path;
        $profile->save();

        return response()->json([
            'message' => 'CV uploaded successfully',
            'cv_path' => $path,
        ]);
    }
}

