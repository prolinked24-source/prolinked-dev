<?php

namespace App\Http\Controllers;

use App\Models\Document;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class DocumentController extends Controller
{
    // Liste aller eigenen Dokumente
    public function index(Request $request)
    {
        $user = $request->user();

        $docs = Document::where('user_id', $user->id)->get();

        return response()->json($docs);
    }

    // Neues Dokument hochladen
    public function upload(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'file' => ['required', 'file', 'max:10240'], // 10MB
            'type' => ['required', Rule::in(['cv', 'certificate', 'reference', 'other'])],
        ]);

        $file = $validated['file'];

        // Ablage im Storage (z.B. storage/app/public/documents)
        $path = $file->store('documents/'.$user->id, 'public');

        $doc = Document::create([
            'user_id'       => $user->id,
            'type'          => $validated['type'],
            'original_name' => $file->getClientOriginalName(),
            'path'          => $path,
            'mime_type'     => $file->getClientMimeType(),
            'size'          => $file->getSize(),
        ]);

        return response()->json([
            'message'  => 'Dokument erfolgreich hochgeladen.',
            'document' => $doc,
        ], 201);
    }

    // Dokument löschen (nur eigenes)
    public function destroy(Request $request, int $id)
    {
        $user = $request->user();

        $doc = Document::where('id', $id)
            ->where('user_id', $user->id)
            ->firstOrFail();

        // Datei im Storage löschen
        if ($doc->path && Storage::disk('public')->exists($doc->path)) {
            Storage::disk('public')->delete($doc->path);
        }

        $doc->delete();

        return response()->json(['message' => 'Dokument gelöscht.']);
    }
}
