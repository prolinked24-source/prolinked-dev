<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\CandidateProfile;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AdminCandidateController extends Controller
{
    /**
     * Liste aller Kandidaten mit Profil-Infos.
     */
    public function index(Request $request)
    {
        $admin = $request->user();

        if ($admin->role !== 'admin') {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        // Kandidaten + Profile laden
        $candidates = User::where('role', 'candidate')
            ->with('candidateProfile') // Relation im User-Model: candidateProfile()
            ->orderBy('created_at', 'desc')
            ->get();

        // Für ein sauberes API-Shape etwas aufbereiten
        $result = $candidates->map(function (User $user) {
            /** @var CandidateProfile|null $profile */
            $profile = $user->candidateProfile;

            return [
                'id'    => $user->id,
                'name'  => $user->name,
                'email' => $user->email,
                'profile' => [
                    'first_name'       => $profile->first_name ?? null,
                    'last_name'        => $profile->last_name ?? null,
                    'country_of_origin'=> $profile->country_of_origin ?? null,
                    'target_country'   => $profile->target_country ?? null,
                    'status'           => $profile->status ?? 'new',
                ],
                'created_at' => $user->created_at,
            ];
        });

        return response()->json($result);
    }

    /**
     * Status eines Kandidaten setzen (new / reviewed / eligible).
     */
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
