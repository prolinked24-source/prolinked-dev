<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class CandidateController extends Controller
{
    public function applications(Request $request)
    {
        // TODO: echte Logik – vorerst Dummy:
        return response()->json([]);
    }

    public function uploadCv(Request $request)
    {
        $request->validate([
            'cv' => ['required','file','max:10240'], // 10MB
        ]);
        // TODO: Upload-Logik – vorerst Dummy:
        return response()->json(['message' => 'CV hochgeladen (Dummy)']);
    }
}
