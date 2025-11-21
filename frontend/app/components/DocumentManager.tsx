"use client";

import React, {
  useState,
  useEffect,
  ChangeEvent,
  FormEvent,
} from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL as string;

type DocumentType = "cv" | "certificate" | "reference" | "other";

interface DocumentItem {
  id: number;
  user_id: number;
  type: DocumentType | string;
  original_name: string;
  path: string;
  mime_type?: string | null;
  size?: number | null;
  created_at: string;
  updated_at: string;
}

const selectClass =
  "w-full rounded-lg border border-slate-400 bg-white px-3 py-2 text-sm " +
  "text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#5BE1E6] focus:border-[#5BE1E6]";

const secondaryButtonClass =
  "flex items-center gap-2 rounded-lg border border-slate-400 bg-white px-3 py-2 text-xs md:text-sm " +
  "text-slate-900 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#5BE1E6]";

const primaryButtonClass =
  "rounded-lg bg-sky-800 text-white text-xs md:text-sm font-medium px-3 py-2 " +
  "hover:bg-sky-900 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#5BE1E6]";

export default function DocumentManager() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [docType, setDocType] = useState<DocumentType>("cv");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);

  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [token, setToken] = useState<string | null>(null);

  // Token laden
  useEffect(() => {
    if (typeof window !== "undefined") {
      const t = localStorage.getItem("prolinked_token");
      setToken(t);
    }
  }, []);

  // Dokumente laden
  const fetchDocuments = async () => {
    if (!API_BASE_URL) return;
    if (!token) return;

    try {
      setLoading(true);
      setLoadError(null);

      const res = await fetch(`${API_BASE_URL}/candidate/documents`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (!res.ok) {
        throw new Error(`Fehler beim Laden der Dokumente (${res.status})`);
      }

      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setDocuments(list);
    } catch (err: any) {
      console.error(err);
      setLoadError(err.message || "Fehler beim Laden der Dokumente.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchDocuments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    setUploadMessage(null);
    const f = e.target.files?.[0] || null;
    setFile(f);
  };

  const handleUpload = async (e: FormEvent) => {
    e.preventDefault();
    setUploadError(null);
    setUploadMessage(null);

    if (!file) {
      setUploadError("Bitte zuerst eine Datei auswählen.");
      return;
    }

    if (!token) {
      setUploadError("Nicht eingeloggt. Bitte erneut einloggen.");
      return;
    }

    try {
      setUploading(true);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", docType);

      const res = await fetch(`${API_BASE_URL}/candidate/documents`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: formData,
      });

      if (!res.ok) {
        let body: any = null;
        try {
          body = await res.json();
        } catch {
          // ignore
        }
        const msg =
          body?.message ||
          `Upload fehlgeschlagen (${res.status.toString()})`;
        throw new Error(msg);
      }

      const data = await res.json();
      setUploadMessage("Dokument erfolgreich hochgeladen.");
      setFile(null);

      // Liste aktualisieren – neuestes Dokument vorn einfügen
      if (data?.document) {
        setDocuments((prev) => [data.document, ...prev]);
      } else {
        // Fallback: komplett neu laden
        fetchDocuments();
      }
    } catch (err: any) {
      console.error(err);
      setUploadError(err.message || "Fehler beim Upload.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!token) return;

    if (!confirm("Dokument wirklich löschen?")) return;

    try {
      setDeletingId(id);

      const res = await fetch(
        `${API_BASE_URL}/candidate/documents/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      if (!res.ok) {
        let body: any = null;
        try {
          body = await res.json();
        } catch {
          // ignore
        }
        const msg =
          body?.message ||
          `Löschen fehlgeschlagen (${res.status.toString()})`;
        throw new Error(msg);
      }

      setDocuments((prev) => prev.filter((d) => d.id !== id));
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Fehler beim Löschen.");
    } finally {
      setDeletingId(null);
    }
  };

  const readableType = (type: string) => {
    switch (type) {
      case "cv":
        return "CV / Lebenslauf";
      case "certificate":
        return "Zertifikat";
      case "reference":
        return "Referenz / Zeugnis";
      default:
        return "Sonstiges";
    }
  };

  const formatSize = (bytes?: number | null) => {
    if (!bytes) return "–";
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(1)} MB`;
  };

  return (
    <section className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
      <h2 className="text-lg font-semibold mb-2 text-slate-900">
        Dokumentenverwaltung
      </h2>
      <p className="text-xs text-slate-700 mb-3">
        Hier kannst du neben deinem CV weitere Dokumente wie{" "}
        <span className="font-semibold">Zertifikate</span>,{" "}
        <span className="font-semibold">Referenzen</span> oder{" "}
        <span className="font-semibold">Zeugnisse</span> hochladen.
      </p>

      {/* Upload-Formular */}
      <form
        onSubmit={handleUpload}
        className="space-y-3 mb-4 border-b border-slate-200 pb-4"
      >
        <div className="grid md:grid-cols-[1.5fr,2fr] gap-3">
          <div>
            <label className="block text-xs font-medium mb-1 text-slate-800">
              Dokumenttyp
            </label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value as DocumentType)}
              className={selectClass}
            >
              <option value="cv">CV / Lebenslauf</option>
              <option value="certificate">Zertifikat</option>
              <option value="reference">Referenz / Zeugnis</option>
              <option value="other">Sonstiges</option>
            </select>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <input
              id="docInput"
              type="file"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() =>
                document.getElementById("docInput")?.click()
              }
              className={secondaryButtonClass}
            >
              {file ? "Datei ändern" : "Datei auswählen"}
            </button>
            {file && (
              <span className="text-xs text-slate-700 truncate max-w-[220px]">
                {file.name}
              </span>
            )}
          </div>
        </div>

        {uploading && (
          <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full w-1/2 bg-[#5BE1E6] animate-pulse" />
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={uploading || !file}
            className={primaryButtonClass}
          >
            {uploading ? "Upload läuft..." : "Dokument hochladen"}
          </button>
        </div>

        {uploadMessage && (
          <p className="text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded px-3 py-2 mt-1">
            {uploadMessage}
          </p>
        )}
        {uploadError && (
          <p className="text-sm text-red-800 bg-red-50 border border-red-200 rounded px-3 py-2 mt-1">
            {uploadError}
          </p>
        )}
      </form>

      {/* Dokumentenliste */}
      <div>
        <h3 className="text-sm font-semibold mb-2 text-slate-900">
          Hochgeladene Dokumente
        </h3>

        {loadError && (
          <p className="text-sm text-red-800 bg-red-50 border border-red-200 rounded px-3 py-2 mb-2">
            {loadError}
          </p>
        )}

        {loading && (
          <p className="text-sm text-slate-600">
            Dokumente werden geladen...
          </p>
        )}

        {!loading && documents.length === 0 && !loadError && (
          <p className="text-sm text-slate-600">
            Noch keine Dokumente hochgeladen.
          </p>
        )}

        {documents.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs md:text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-200">
                  <th className="py-2 pr-3">Typ</th>
                  <th className="py-2 pr-3">Dateiname</th>
                  <th className="py-2 pr-3 hidden md:table-cell">
                    Größe
                  </th>
                  <th className="py-2 pr-3 hidden md:table-cell">
                    Hochgeladen am
                  </th>
                  <th className="py-2 pr-3 text-right">Aktion</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr
                    key={doc.id}
                    className="border-b border-slate-100 last:border-0"
                  >
                    <td className="py-2 pr-3 text-slate-700 whitespace-nowrap">
                      {readableType(doc.type)}
                    </td>
                    <td className="py-2 pr-3 text-slate-800">
                      <span className="truncate inline-block max-w-[220px]">
                        {doc.original_name}
                      </span>
                    </td>
                    <td className="py-2 pr-3 text-slate-500 hidden md:table-cell">
                      {formatSize(doc.size ?? undefined)}
                    </td>
                    <td className="py-2 pr-3 text-slate-500 hidden md:table-cell">
                      {doc.created_at
                        ? new Date(doc.created_at).toLocaleString()
                        : "–"}
                    </td>
                    <td className="py-2 pr-3 text-right">
                      <button
                        onClick={() => handleDelete(doc.id)}
                        disabled={deletingId === doc.id}
                        className="text-[11px] md:text-xs text-red-700 hover:text-red-900 disabled:opacity-50"
                      >
                        {deletingId === doc.id
                          ? "Löschen..."
                          : "Löschen"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
