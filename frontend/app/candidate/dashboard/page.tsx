"use client";

import {
  useEffect,
  useState,
  ChangeEvent,
  FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL as string;

interface CandidateProfile {
  first_name?: string;
  last_name?: string;
  country_of_origin?: string;
  target_country?: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  candidate_profile?: CandidateProfile;
}

interface Application {
  id: number;
  status: string;
  created_at: string;
  job: {
    id: number;
    title: string;
    location?: string;
    employer?: {
      company_name?: string;
    };
  };
}

export default function CandidateDashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingApps, setLoadingApps] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [appsError, setAppsError] = useState<string | null>(null);

  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvUploading, setCvUploading] = useState(false);
  const [cvMessage, setCvMessage] = useState<string | null>(null);
  const [cvError, setCvError] = useState<string | null>(null);
  const [cvProgress, setCvProgress] = useState<number | null>(null);

  // Benutzer & Bewerbungen laden
  useEffect(() => {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("prolinked_token")
        : null;

    if (!token) {
      router.push("/login");
      return;
    }

    const fetchMe = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        if (!res.ok) {
          throw new Error("Fehler beim Laden des Benutzers.");
        }

        const data = (await res.json()) as User;
        setUser(data);

        if (data.role !== "candidate") {
          setError("Dieses Dashboard ist nur für Kandidaten.");
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Fehler beim Laden des Benutzers.");
      } finally {
        setLoading(false);
      }
    };

    const fetchApplications = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/candidate/applications`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        if (!res.ok) {
          throw new Error("Fehler beim Laden der Bewerbungen.");
        }

        const data = (await res.json()) as Application[];
        setApplications(data);
      } catch (err: any) {
        console.error(err);
        setAppsError(err.message || "Fehler beim Laden der Bewerbungen.");
      } finally {
        setLoadingApps(false);
      }
    };

    fetchMe();
    fetchApplications();
  }, [router]);

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("prolinked_token");
      localStorage.removeItem("prolinked_role");
    }
    router.push("/login");
  };

  const handleCvChange = (e: ChangeEvent<HTMLInputElement>) => {
    setCvError(null);
    setCvMessage(null);
    const file = e.target.files?.[0] || null;
    setCvFile(file);
  };

  const handleCvUpload = (e: FormEvent) => {
    e.preventDefault();
    setCvError(null);
    setCvMessage(null);

    if (!cvFile) {
      setCvError("Bitte zuerst eine Datei auswählen.");
      return;
    }

    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("prolinked_token")
        : null;

    if (!token) {
      setCvError("Nicht eingeloggt. Bitte erneut einloggen.");
      router.push("/login");
      return;
    }

    setCvUploading(true);
    setCvProgress(0);

    const formData = new FormData();
    formData.append("cv", cvFile);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_BASE_URL}/candidate/cv`, true);
    xhr.setRequestHeader("Accept", "application/json");
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        setCvProgress(percent);
      }
    };

    xhr.onreadystatechange = () => {
      if (xhr.readyState !== XMLHttpRequest.DONE) return;

      setCvUploading(false);

      let body: any = null;
      try {
        body = xhr.responseText ? JSON.parse(xhr.responseText) : null;
      } catch {
        // ignore parse error
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        setCvMessage("CV erfolgreich hochgeladen.");
        setCvError(null);
      } else {
        const msg =
          body?.message ||
          `Upload fehlgeschlagen (${xhr.status.toString()})`;
        setCvError(msg);
        setCvMessage(null);
      }

      setCvProgress(null);
    };

    xhr.onerror = () => {
      setCvUploading(false);
      setCvError("Netzwerkfehler beim Upload der CV.");
      setCvMessage(null);
      setCvProgress(null);
    };

    xhr.send(formData);
  };

  if (loading) {
    return <div className="p-6">Lade Benutzerdaten...</div>;
  }

  if (!user) {
    return (
      <div className="p-6">
        <p className="mb-3">
          Kein Benutzer geladen. Bitte erneut einloggen.
        </p>
        <button
          onClick={handleLogout}
          className="px-3 py-1 rounded bg-slate-200 hover:bg-slate-300 text-sm"
        >
          Zurück zum Login
        </button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50">
        <header className="bg-sky-900 text-sky-50 shadow">
          <div className="max-w-5xl mx-auto flex items-center justify-between px-6 py-3">
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-wide">PROLINKED</span>
              <span className="text-[11px] uppercase opacity-70">
                Candidate
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="px-3 py-1 rounded bg-slate-100 text-sky-900 hover:bg-white text-xs font-semibold"
            >
              Logout
            </button>
          </div>
        </header>
        <main className="p-6 max-w-3xl mx-auto">
          <p className="text-sm text-red-800 bg-red-50 border border-red-200 rounded px-3 py-2 mb-3">
            {error}
          </p>
          <button
            onClick={handleLogout}
            className="px-3 py-1 rounded bg-slate-200 hover:bg-slate-300 text-sm"
          >
            Zurück zum Login
          </button>
        </main>
      </div>
    );
  }

  const profile = user.candidate_profile || {};

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-sky-900 text-sky-50 shadow">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2">
            <span className="font-bold tracking-wide">PROLINKED</span>
            <span className="text-[11px] uppercase opacity-70">
              Candidate
            </span>
          </div>
          <nav className="flex items-center gap-3 text-sm">
            <button
              onClick={() => router.push("/candidate/dashboard")}
              className="px-2 py-1 rounded bg-sky-800"
            >
              Dashboard
            </button>
            <button
              onClick={() => router.push("/jobs")}
              className="px-2 py-1 rounded hover:bg-sky-800"
            >
              Jobs
            </button>
            <button
              onClick={handleLogout}
              className="px-3 py-1 rounded bg-slate-100 text-sky-900 hover:bg-white text-xs font-semibold"
            >
              Logout
            </button>
          </nav>
        </div>
      </header>

      <main className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Profil-Section */}
        <section className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-2">Profil</h2>
          <p className="text-sm text-slate-700">
            Name: {profile.first_name} {profile.last_name}
          </p>
          <p className="text-sm text-slate-700">
            Herkunftsland: {profile.country_of_origin || "–"}
          </p>
          <p className="text-sm text-slate-700">
            Zielland: {profile.target_country || "–"}
          </p>
        </section>

        {/* CV-Upload */}
        <section className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-2">
            CV / Lebenslauf hochladen
          </h2>
          <p className="text-xs text-slate-700 mb-3">
            Hinweis: Bitte zuerst eine Datei auswählen (PDF, DOC, DOCX), dann
            auf <span className="font-semibold">„CV hochladen“</span> klicken.
          </p>

          {cvMessage && (
            <p className="text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded px-3 py-2 mb-2">
              {cvMessage}
            </p>
          )}
          {cvError && (
            <p className="text-sm text-red-800 bg-red-50 border border-red-200 rounded px-3 py-2 mb-2">
              {cvError}
            </p>
          )}

          {cvUploading && cvProgress !== null && (
            <div className="mb-2">
              <div className="w-full bg-slate-200 rounded h-2 overflow-hidden">
                <div
                  className="h-2 bg-sky-600 transition-all"
                  style={{ width: `${cvProgress}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-slate-600">
                Upload: {cvProgress}%
              </p>
            </div>
          )}

          <form onSubmit={handleCvUpload} className="space-y-3">
            <input
              id="cvInput"
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleCvChange}
              className="hidden"
            />

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() =>
                  document.getElementById("cvInput")?.click()
                }
                className="flex items-center gap-2 px-4 py-2 text-sm rounded bg-sky-700 text-white hover:bg-sky-800 transition"
              >
                <Upload className="w-4 h-4" />
                {cvFile ? "Datei ändern" : "Datei auswählen"}
              </button>

              {cvFile && (
                <span className="text-xs text-slate-700 truncate max-w-[180px]">
                  {cvFile.name}
                </span>
              )}
            </div>

            <button
              type="submit"
              disabled={cvUploading || !cvFile}
              className="px-4 py-2 text-sm rounded bg-emerald-700 text-white hover:bg-emerald-800 disabled:opacity-50 transition"
            >
              {cvUploading ? "Upload läuft..." : "CV hochladen"}
            </button>
          </form>
        </section>

        {/* Bewerbungen */}
        <section className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-3">
            Meine Bewerbungen
          </h2>

          {appsError && (
            <p className="text-sm text-red-800 bg-red-50 border border-red-200 rounded px-3 py-2 mb-2">
              {appsError}
            </p>
          )}

          {loadingApps && (
            <p className="text-sm">Bewerbungen werden geladen...</p>
          )}

          {!loadingApps && applications.length === 0 && !appsError && (
            <p className="text-sm text-slate-600">
              Noch keine Bewerbungen vorhanden.
            </p>
          )}

          <ul className="divide-y divide-slate-200">
            {applications.map((app) => (
              <li key={app.id} className="py-2 text-sm">
                <div className="font-medium">
                  {app.job?.title}
                </div>
                <div className="text-slate-600">
                  {app.job?.employer?.company_name || "Unbekannter Arbeitgeber"}{" "}
                  – {app.job?.location || "Ort n/a"}
                </div>
                <div className="text-slate-500">
                  Status: {app.status} – Erstellt am:{" "}
                  {new Date(app.created_at).toLocaleString()}
                </div>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
