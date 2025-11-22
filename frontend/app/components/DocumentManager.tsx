"use client";

import { useEffect, useState, ChangeEvent } from "react";
import { Upload, Trash2 } from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL as string;

interface DocumentItem {
  id: number;
  file_name: string;
  file_path: string;
  created_at: string;
}

export default function DocumentManager() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // 📌 Dokumente laden
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
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDocs();
  }, []);

  // 📌 Datei-Auswahl
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setSuccess(null);
    setSelectedFile(e.target.files?.[0] || null);
  };

  // 📌 Datei Upload
  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Bitte zuerst eine Datei auswählen.");
      return;
    }

    setError(null);
    setSuccess(null);

    try {
      setUploading(true);
      const token = localStorage.getItem("prolinked_token");
      const formData = new FormData();
      formData.append("document", selectedFile);

      const res = await fetch(`${API_BASE_URL}/candidate/documents`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Upload fehlgeschlagen.");
      }

      const newDoc = await res.json();
      setDocuments((prev) => [...prev, newDoc]);
      setSelectedFile(null);
      setSuccess("Dokument erfolgreich hochgeladen.");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  // 📌 Dokument löschen
  const handleDelete = async (id: number) => {
    if (!confirm("Dokument wirklich löschen?")) return;

    try {
      const token = localStorage.getItem("prolinked_token");
      const res = await fetch(`${API_BASE_URL}/candidate/documents/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Löschen fehlgeschlagen.");

      setDocuments((prev) => prev.filter((doc) => doc.id !== id));
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-4">
      {/* SUCCESS / ERROR */}
      {success && (
        <div className="text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded">
          {success}
        </div>
      )}
      {error && (
        <div className="text-sm text-red-800 bg-red-50 border border-red-200 px-3 py-2 rounded">
          {error}
        </div>
      )}

      {/* UPLOAD SECTION */}
      <div className="border border-slate-200 rounded-lg p-4 bg-white shadow-sm">
        <h3 className="font-semibold text-slate-900 mb-2">Dokument hochladen</h3>
        <p className="text-xs text-slate-600 mb-3">
          Erlaubte Formate: PDF, JPG, PNG, DOC, DOCX
        </p>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <input
            id="dmFile"
            type="file"
            onChange={handleFileChange}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => document.getElementById("dmFile")?.click()}
            className="flex items-center gap-2 px-4 py-2 rounded bg-sky-900 text-white hover:bg-sky-800 focus:ring-2 focus:ring-[#5BE1E6]"
          >
            <Upload className="w-4 h-4" />
            {selectedFile ? "Andere Datei auswählen" : "Datei auswählen"}
          </button>

          {selectedFile && (
            <span className="text-xs text-slate-700 truncate max-w-[220px]">
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

      {/* DOCUMENT LIST */}
      <div className="border border-slate-200 rounded-lg bg-white shadow-sm">
        <h3 className="font-semibold text-slate-900 p-4 pb-2">Meine Dokumente</h3>

        {loading ? (
          <p className="text-sm text-slate-700 p-4">Lade Dokumente...</p>
        ) : documents.length === 0 ? (
          <p className="text-sm text-slate-600 p-4">Noch keine Dokumente vorhanden.</p>
        ) : (
          <ul className="divide-y divide-slate-200">
            {documents.map((doc) => (
              <li key={doc.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm font-medium text-slate-900">{doc.file_name}</p>
                  <p className="text-xs text-slate-500">
                    Upload: {new Date(doc.created_at).toLocaleString()}
                  </p>
                </div>

                <button
                  onClick={() => handleDelete(doc.id)}
                  className="text-red-600 hover:text-red-800 focus:ring-2 focus:ring-red-300 p-1 rounded"
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
