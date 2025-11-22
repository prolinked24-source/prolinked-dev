<?php

namespace App\Http\Controllers;

use App\Models\CvTemplate;
use App\Models\Document;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Barryvdh\DomPDF\Facade\Pdf;

class CvGeneratorController extends Controller
{
    // Liste verfügbarer Templates (optional Filter nach Branche / Sprache)
    public function templates(Request $request)
    {
        $query = CvTemplate::query();

        if ($industry = $request->query('industry')) {
            $query->where('industry', $industry);
        }

        if ($language = $request->query('language')) {
            $query->where('language', $language);
        }

        $templates = $query->orderBy('name')->get();

        return response()->json($templates);
    }

    // CV generieren und als Dokument speichern
    public function generate(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'template_id' => ['required', 'exists:cv_templates,id'],
            // optionale Overrides für später:
            'headline'    => ['nullable', 'string', 'max:255'],
            'summary'     => ['nullable', 'string'],
        ]);

        $template = CvTemplate::findOrFail($validated['template_id']);

        $profile = $user->candidateProfile;

        if (!$profile) {
            return response()->json([
                'message' => 'Kein Kandidatenprofil vorhanden. Bitte Profil zuerst ausfüllen.',
            ], 422);
        }

        $experiences = $profile->experiences()->orderByDesc('start_date')->get();
        $educations  = $profile->educations()->orderByDesc('start_date')->get();
        $skills      = $profile->skills()->get();
        $languages   = $profile->languages()->get();

        // Daten für das Template
        $fullName = trim(($profile->first_name ?? '') . ' ' . ($profile->last_name ?? ''));

        $headline = $validated['headline'] ?? $profile->headline ?? 'Berufliches Profil';
        $summary  = $validated['summary']  ?? $profile->summary  ?? '';

        // HTML generieren (MVP: generisch, später per Template differenzierbar)
        $html = view('cv.templates.default', [
            'user'        => $user,
            'profile'     => $profile,
            'fullName'    => $fullName,
            'headline'    => $headline,
            'summary'     => $summary,
            'experiences' => $experiences,
            'educations'  => $educations,
            'skills'      => $skills,
            'languages'   => $languages,
            'template'    => $template,
        ])->render();

        // PDF generieren
        $pdf = Pdf::loadHTML($html);
        $pdf->setPaper('a4', 'portrait');

        $fileName = 'CV_' . $template->slug . '_' . now()->format('Ymd_His') . '.pdf';
        $path     = 'cv_generated/' . $user->id . '/' . $fileName;

        // Im Storage ablegen
        Storage::disk('public')->put($path, $pdf->output());

        // Document-Eintrag
        $doc = Document::create([
            'user_id'       => $user->id,
            'type'          => 'cv',
            'original_name' => $fileName,
            'path'          => $path,
            'mime_type'     => 'application/pdf',
            'size'          => Storage::disk('public')->size($path),
        ]);

        return response()->json([
            'message'  => 'CV erfolgreich generiert und im Dokumenten-Center gespeichert.',
            'document' => $doc,
        ], 201);
    }
}
