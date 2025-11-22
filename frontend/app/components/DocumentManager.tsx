"use client";

import { useEffect, useState, ChangeEvent } from "react";
import { Upload, Trash2, FileText } from "lucide-react";

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
      } catch (err: any) {
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

  // Datei hochladen
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
      const formData = new FormData();
      formData.append("document", selectedFile);

      const res = await fetch(`${API_BASE_URL}/candidate/documents`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) throw new Error("Upload fehlgeschlagen.");

      const newDoc = await res.json();
      setDocuments((prev) => [...prev, newDoc]);
      setSelectedFile(null);
      setSuccess("Dokument erfolgreich hochgeladen.");
    } catch {
      setError("Upload fehlgeschlagen. Bitte erneut versuchen.");
    } finally {
      setUploading(false);
    }
  };

  // Datei löschen
  const handleDelete = async (id: number) => {
    if (!confirm("Dokument wirklich löschen?")) return;

    try {
      const token = localStorage.getItem("prolinked_token");
      const res = await fetch(`${API_BASE_URL}/candidate/documents/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error();

      setDocuments((prev) => prev.filter((doc) => doc.id !== id));
      setSuccess("Dokument gelöscht.");
    } catch {
      setError("Löschen fehlgeschlagen.");
    }
  };

  return (
    <div className="space-y-5">
      
      {/* Erfolg/Fehler Box */}
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
          Erlaubte Formate: PDF, JPG, PNG, DOC, DOCX
        </p>

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
              <li key={doc.id} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-slate-500" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {doc.file_name}
                    </p>
                    <p className
