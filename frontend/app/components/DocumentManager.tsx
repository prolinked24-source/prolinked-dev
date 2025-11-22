"use client";

import { useEffect, useState, ChangeEvent } from "react";
import { Upload, Trash2, FileText } from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL as string;

interface DocumentItem {
  id: number;
  file_name: string;
  file_path: string;
  created_at: string;
  type?: string | null; // optional, falls vom Backend geliefert
}

export default function DocumentManager() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<string>("cv"); // Standard: CV

  // Dokumente laden
  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const token = localStorage.getItem("prolinked_token");
        if (!token) return;

        const res = await fetch(`${API_BASE_URL}/candidate/documents`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Fehler beim Laden der Dokumente.");

        const data = await res.json();
        setDocuments(data);
      } catch (err) {
        console.error(err);
        setError("Dokumente konnten nicht geladen werden.");
      } finally {
        setLoading(false);
      }
    };

    fetchDocs();
  }, []);

  // Datei auswählen
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setSuccess(null);
    setSelectedFile(e.target.files?.[0] || null);
  };

  // Dokument hochladen
  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Bitte zuerst eine Datei auswählen.");
      return;
    }

    try {
      setUploading(true);
      setError(null);
      setSuccess(null);

      const token = localStorage.getItem("prolinked_token");
      if (!token) {
        setError("Nicht eingeloggt. Bitte neu anmelden.");
        return;
      }

      const formData = new FormData();

      // 🔴 WICHTIG: Diese Feldnamen müssen zu deinem Laravel-Controller passen!
      // In DocumentController::upload sollte z.B. stehen:
      // $request->validate(['file' => 'required|file', 'type' => 'nullable|string']);
      formData.append("file", selectedFile);   // <– wenn Backend "document" erwartet: auf "document" ändern
      formData.append("type", documentType);   // <– wenn Backend "document_type" erwartet: anpassen

      const res = await fetch(`${API_BASE_URL}/candidate/documents`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) {
        let msg = "Upload fehlgeschlagen. Bitte erneut versuchen.";
        try {
          const body = await res.json();
          if (body?.message) msg = body.message;
        } catch {
          // ignore JSON parse
        }
        throw new Error(msg);
      }

      const newDoc = await res.json();
      setDocuments((prev) => [...prev, newDoc]);
      setSelectedFile(null);
      setSuccess("Dokument erfolgreich hochgeladen.");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Upload fehlgeschlagen. Bitte erneut versuchen.");
    } finally {
      setUploading(false);
    }
  };

  // Dokument löschen
  const handleDelete = async (id: number) => {
    if (!confirm("Dokument wirklich löschen?")) return;

    try {
      const token = localStorage.getItem("prolinked_token");
      if (!token) {
        setError("Nicht eingeloggt.");
        return;
      }

      const res = await fetch(`${API_BASE_URL}/candidate/documents/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error("Löschen fehlgeschlagen.");
      }

      setDocuments((prev) => prev.filter((doc) => doc.id !== id));
      setSuccess("Dokument gelöscht.");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Löschen fehlgeschlagen.");
    }
  };

  return (
    <div className="space-y-5">
      {/* Erfolg / Fehler */}
      {error && (
        <div className="text-sm text-red-800 bg-red-50 border border-red-200 rounded px-3 py-2">
          {error}
        </div>
      )}
      {success && (
        <div className="text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded px-3 py-2">
          {success}
        </div>
      )}

      {/* Upload-Box */}
      <div className="bg-white rounded-lg shadow border border-slate-200 p-5">
        <h3 className="text-slate-900 font-semibold mb-2">
          Dokument hochladen
        </h3>
        <p className="text-xs text-slate-600 mb-3">
          Wähle den Dokumententyp und lade passende Unterlagen hoch. <br />
          Erlaubte Formate: PDF, JPG, PNG, DOC, DOCX
        </p>

        {/* Typ-Auswahl */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-xs font-medium text-slate-800 mb-1">
              Dokumenttyp
            </label>
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#5BE1E6] focus:border-[#5BE1E6]"
            >
              <option value="cv">CV / Lebenslauf</option>
              <option value="certificate">Zeugnis / Zertifikat</option>
              <option value="reference">Referenz / Empfehlung</option>
              <option value="other">Sonstiges Dokument</option>
            </select>
          </div>
        </div>

        {/* Datei-Auswahl + Upload */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <input
            id="dmFileInput"
            type="file"
            className="hidden"
            onChange={handleFileChange}
          />

          <button
            type="button"
            onClick={() =>
              document.getElementById("dmFileInput")?.click()
            }
            className="flex items-center gap-2 px-4 py-2 rounded bg-sky-900 text-white hover:bg-sky-800 focus:ring-2 focus:ring-[#5BE1E6]"
          >
            <Upload className="w-4 h-4" />
            {selectedFile ? "Datei ändern" : "Datei auswählen"}
          </button>

          {selectedFile && (
            <span className="text-xs text-slate-700 truncate max-w-[260px]">
              {selectedFile.name}
            </span>
          )}
        </div>

        <button
          onClick={handleUpload}
          disabled={uploading || !selectedFile}
          className="mt-3 px-4 py-2 rounded bg-emerald-600 text-white text-sm hover:bg-emerald-700 disabled:opacity-50 focus:ring-2 focus:ring-[#5BE1E6]"
        >
          {uploading ? "Upload läuft..." : "Dokument hochladen"}
        </button>
      </div>

      {/* Dokumentliste */}
      <div className="bg-white rounded-lg shadow border border-slate-200">
        <h3 className="text-slate-900 font-semibold p-5 pb-3">
          Meine Dokumente
        </h3>

        {loading ? (
          <p className="text-sm text-slate-600 px-5 pb-5">
            Lade Dokumente...
          </p>
        ) : documents.length === 0 ? (
          <p className="text-sm text-slate-600 px-5 pb-5">
            Noch keine Dokumente vorhanden.
          </p>
        ) : (
          <ul className="divide-y divide-slate-200">
            {documents.map((doc) => (
              <li
                key={doc.id}
                className="flex items-center justify-between p-4"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-slate-500" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {doc.file_name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {doc.type && (
                        <span className="mr-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-700 border border-slate-200 uppercase">
                          {doc.type}
                        </span>
                      )}
                      Upload: {new Date(doc.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(doc.id)}
                  className="text-red-600 hover:text-red-800 p-1 rounded focus:ring-2 focus:ring-red-300"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
