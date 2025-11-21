"use client";

import {
  useEffect,
  useState,
  ChangeEvent,
  FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import DocumentManager from "../../components/DocumentManager";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL as string;

interface CandidateProfile {
  first_name?: string;
  last_name?: string;
  country_of_origin?: string;
  target_country?: string;
  status?: "new" | "reviewed" | "eligible" | string;
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

const secondaryButtonClass =
  "flex items-center gap-2 rounded-lg border border-slate-400 bg-white px-3 py-2 text-xs md:text-sm " +
  "text-slate-900 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#5BE1E6]";

const primaryButtonClass =
  "rounded-lg bg-emerald-700 text-white text-xs md:text-sm font-medium px-3 py-2 " +
  "hover:bg-emerald-800 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#5BE1E6]";

export default function CandidateDashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingApps, setLoadingApps] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [appsError, setAppsError] = useState<string | null>(null);


  // simple „Status“-Flag für Stepper – nach CV-Upload
  const [hasUploadedCv, setHasUploadedCv] = useState(false);

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

  const handleCvUpload = async (e: FormEvent) => {
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

    try {
      setCvUploading(true);

      const formData = new FormData();
      formData.append("cv", cvFile);

      const res = await fetch(`${API_BASE_URL}/candidate/cv`, {
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
      console.log("CV upload response:", data);
      setCvMessage("CV erfolgreich hochgeladen.");
      setCvFile(null);
      setHasUploadedCv(true);
    } catch (err: any) {
      console.error(err);
      setCvError(err.message || "Fehler beim Upload der CV.");
    } finally {
      setCvUploading(false);
    }
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
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold tracking-wide">PROLINKED</span>
                <span className="text-[11px] uppercase opacity-70">
                  Candidate
                </span>
              </div>
              <div
                className="mt-1 h-0.5 w-16 rounded-full"
                style={{ backgroundColor: "#5BE1E6" }}
              />
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
  const profileComplete = Boolean(
    (profile.first_name && profile.first_name.trim() !== "") ||
      (profile.last_name && profile.last_name.trim() !== "")
  );

  // Stepper-Klassen
  const stepBase =
    "flex-1 rounded-lg border px-3 py-2 flex items-center gap-2 text-xs md:text-sm";
  const stepDone = "border-emerald-400 bg-emerald-50 text-emerald-900";
  const stepCurrent = "border-sky-400 bg-sky-50 text-sky-900";
  const stepUpcoming = "border-slate-200 bg-slate-50 text-slate-600";

  const circleBase =
    "flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-semibold";

  const statusLabel =
    profile.status === "eligible"
      ? "Vermittelbar"
      : profile.status === "reviewed"
      ? "Geprüft"
      : "Neu";

  const statusClass =
    profile.status === "eligible"
      ? "text-emerald-700 bg-emerald-50 border-emerald-200"
      : profile.status === "reviewed"
      ? "text-sky-700 bg-sky-50 border-sky-200"
      : "text-slate-600 bg-slate-50 border-slate-200";

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-sky-900 text-sky-50 shadow">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-6 py-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-wide">PROLINKED</span>
              <span className="text-[11px] uppercase opacity-70">
                Candidate
              </span>
            </div>
            <div
              className="mt-1 h-0.5 w-16 rounded-full"
              style={{ backgroundColor: "#5BE1E6" }}
            />
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
        {/* Stepper – Vermittlungsstatus */}
        <section className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <h2 className="text-sm font-semibold mb-3 text-slate-900">
            Mein Vermittlungsstatus
          </h2>
          <div className="flex flex-col md:flex-row md:items-stretch gap-3 mb-3">
            {/* Schritt 1: Profil */}
            <div
              className={
                stepBase +
                " " +
                (profileComplete ? stepDone : stepCurrent)
              }
            >
              <div
                className={
                  circleBase +
                  " " +
                  (profileComplete
                    ? "bg-emerald-500 text-white"
                    : "bg-sky-600 text-white")
                }
              >
                1
              </div>
              <div>
                <p className="font-semibold">Profil anlegen</p>
                <p className="text-[11px] text-slate-600">
                  Basisdaten (Name, Länder) hinterlegt.
                </p>
              </div>
            </div>

            {/* Schritt 2: CV */}
            <div
              className={
                stepBase +
                " " +
                (profileComplete && hasUploadedCv
                  ? stepDone
                  : !profileComplete
                  ? stepUpcoming
                  : stepCurrent)
              }
            >
              <div
                className={
                  circleBase +
                  " " +
                  (profileComplete && hasUploadedCv
                    ? "bg-emerald-500 text-white"
                    : profileComplete
                    ? "bg-sky-600 text-white"
                    : "bg-slate-300 text-slate-700")
                }
              >
                2
              </div>
              <div>
                <p className="font-semibold">CV hochladen</p>
                <p className="text-[11px] text-slate-600">
                  Lebenslauf als PDF/DOC hinterlegen.
                </p>
              </div>
            </div>

            {/* Schritt 3: Jobs */}
            <div
              className={
                stepBase +
                " " +
                (profileComplete && hasUploadedCv
                  ? stepCurrent
                  : stepUpcoming)
              }
            >
              <div
                className={
                  circleBase +
                  " " +
                  (profileComplete && hasUploadedCv
                    ? "bg-sky-600 text-white"
                    : "bg-slate-300 text-slate-700")
                }
              >
                3
              </div>
              <div>
                <p className="font-semibold">Jobs durchsuchen</p>
                <p className="text-[11px] text-slate-600">
                  Passende Stellen filtern & ansehen.
                </p>
              </div>
            </div>

            {/* Schritt 4: Bewerben */}
            <div
              className={
                stepBase +
                " " +
                (applications.length > 0 ? stepDone : stepUpcoming)
              }
            >
              <div
                className={
                  circleBase +
                  " " +
                  (applications.length > 0
                    ? "bg-emerald-500 text-white"
                    : "bg-slate-300 text-slate-700")
                }
              >
                4
              </div>
              <div>
                <p className="font-semibold">Bewerben</p>
                <p className="text-[11px] text-slate-600">
                  Bewerbungen abschicken & Status verfolgen.
                </p>
              </div>
            </div>
          </div>

          {/* Status-Badge */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-600">Aktueller Status:</span>
            <span
              className={
                "inline-flex items-center gap-1 px-2 py-1 rounded-full border text-[11px] " +
                statusClass
              }
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              {statusLabel}
            </span>
          </div>
        </section>

        {/* Profil-Section */}
        <section className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <h2 className="text-lg font-semibold mb-2 text-slate-900">
            Profil
          </h2>
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
        <section className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <h2 className="text-lg font-semibold mb-2 text-slate-900">
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

          <form onSubmit={handleCvUpload} className="space-y-3">
            <input
              id="cvInput"
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleCvChange}
              className="hidden"
            />

            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <button
                type="button"
                onClick={() =>
                  document.getElementById("cvInput")?.click()
                }
                className={secondaryButtonClass}
              >
                <Upload className="w-4 h-4" />
                <span>{cvFile ? "Datei ändern" : "Datei auswählen"}</span>
              </button>

              {cvFile && (
                <span className="text-xs text-slate-700 truncate max-w-[220px]">
                  {cvFile.name}
                </span>
              )}
            </div>

            {cvUploading && (
              <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full w-1/2 bg-[#5BE1E6] animate-pulse" />
              </div>
            )}

            <button
              type="submit"
              disabled={cvUploading || !cvFile}
              className={primaryButtonClass}
            >
              {cvUploading ? "Upload läuft..." : "CV hochladen"}
            </button>
          </form>
        </section>

        {/* NEU: Dokumentenverwaltung */}
        <DocumentManager />

        {/* Bewerbungen */}
        <section className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <h2 className="text-lg font-semibold mb-3 text-slate-900">
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

          <ul className="divide-y divide-slate-200 mt-2">
            {applications.map((app) => (
              <li key={app.id} className="py-2 text-sm">
                <div className="font-medium text-slate-900">
                  {app.job?.title}
                </div>
                <div className="text-slate-600">
                  {app.job?.employer?.company_name ||
                    "Unbekannter Arbeitgeber"}{" "}
                  – {app.job?.location || "Ort n/a"}
                </div>
                <div className="text-slate-500 text-xs">
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
