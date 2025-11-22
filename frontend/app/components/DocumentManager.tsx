"use client";

import { useEffect, useState, ChangeEvent } from "react";
import { Upload, Trash2, FileText } from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL as string;

interface DocumentItem {
  id: number;
  user_id: number;
  type: "cv" | "certificate" | "reference" | "other" | string;
  original_name: string;
  path: string;
  mime_type: string;
  size: number;
  created_at: string;
  updated_at: string;
}

export default function DocumentManager() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [documentType, setDocumentType] = useState<string>("cv"); // Standard: CV

  // Dokumente laden
  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const token = localStorage.getItem("prolinked_token");
        if (!token) {
          setLoading(false);
          return;
        }

        const res = await fetch(`${API_BASE_URL}/candidate/documents`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          throw new Error("Fehler beim Laden der Dokumente.");
        }

        const data = (await res.json()) as DocumentItem[];
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

  // Hilfsfunktion: Upload eines einzelnen Files
  const uploadFile = async (file: File) => {
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
      // EXAKT wie in DocumentController::upload
      formData.append("file", file);
      formData.append("type", documentType);

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
          // ignore parse errors
        }
        throw new Error(msg);
      }

      const body = (await res.json()) as {
        message: string;
        document: DocumentItem;
      };

      setDocuments((prev) => [...prev, body.document]);
      setSuccess(body.message || "Dokument erfolgreich hochgeladen.");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Upload fehlgeschlagen. Bitte erneut versuchen.");
    } finally {
      setUploading(false);
    }
  };

  // Datei-Auswahl → automatischer Upload
  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // direkt uploaden
    await uploadFile(file);

    // Input resetten, damit man später dieselbe Datei erneut wählen kann
    e.target.value = "";
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
        let msg = "Löschen fehlgeschlagen.";
        try {
          const body = await res.json();
          if (body?.message) msg = body.message;
        } catch {
          // ignore
        }
        throw new Error(msg);
      }

      setDocuments((prev) => prev.filter((doc) => doc.id !== id));
      setSuccess("Dokument gelöscht.");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Löschen fehlgeschlagen.");
    }
  };

  const renderTypeLabel = (type: string) => {
    switch (type) {
      case "cv":
        return "CV";
      case "certificate":
        return "Zertifikat";
      case "reference":
        return "Referenz";
      case "other":
        return "Sonstiges";
      default:
        return type;
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
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
        <h3 className="text-slate-900 font-semibold mb-2">
          Dokument Hochladen
        </h3>
        <p className="text-xs text-slate-600 mb-3">
          Wähle den Dokumententyp und lade passende Unterlagen hoch. <br />
          Erlaubte Formate: PDF, JPG, PNG, DOC, DOCX (max. 10MB)
        </p>

        {/* Typ-Auswahl */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
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

        {/* Datei-Input (hidden) + Button */}
        <input
          id="dmFileInput"
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          className="hidden"
          onChange={handleFileChange}
        />

        <button
          type="button"
          onClick={() =>
            document.getElementById("dmFileInput")?.click()
          }
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-sky-900 hover:bg-sky-800 focus:ring-2 focus:ring-[#5BE1E6]"
        >
          <Upload className="w-4 h-4" />
          Datei hochladen
        </button>

        {/* Fortschrittsbalken */}
        {uploading && (
          <div className="w-full h-1 bg-slate-200 rounded-full mt-3 overflow-hidden">
            <div className="h-full w-1/2 bg-[#5BE1E6] animate-pulse" />
          </div>
        )}
      </div>

      {/* Dokumentliste */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
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
                      {doc.original_name}
                    </p>
                    <p className="text-xs text-slate-500">
                      <span className="inline-flex items-center px-2 py-0.5 mr-2 rounded-full text-[10px] bg-slate-100 text-slate-700 border border-slate-200 uppercase">
                        {renderTypeLabel(doc.type)}
                      </span>
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
