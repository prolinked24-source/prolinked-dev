"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DocumentManager from "../../components/DocumentManager";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL as string;

interface CandidateProfile {
  first_name?: string | null;
  last_name?: string | null;
  country_of_origin?: string | null;
  target_country?: string | null;
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
    location?: string | null;
    employer?: {
      company_name?: string | null;
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

  useEffect(() => {
    const run = async () => {
      try {
        if (typeof window === "undefined") return;

        const token = localStorage.getItem("prolinked_token");
        if (!token) {
          setLoading(false);
          router.push("/login");
          return;
        }

        // 1) Benutzer laden
        setLoading(true);
        const meRes = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        if (!meRes.ok) {
          throw new Error("Fehler beim Laden des Benutzers.");
        }

        const me = (await meRes.json()) as User;
        setUser(me);

        if ((me.role || "").toLowerCase() !== "candidate") {
          setError("Dieses Dashboard ist nur für Kandidaten.");
          setLoadingApps(false);
          return;
        }

        // 2) Bewerbungen laden
        setLoadingApps(true);
        const appsRes = await fetch(
          `${API_BASE_URL}/candidate/applications`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          }
        );

        if (!appsRes.ok) {
          throw new Error("Fehler beim Laden der Bewerbungen.");
        }

        const apps = (await appsRes.json()) as Application[];
        setApplications(apps);
      } catch (err: any) {
        console.error(err);
        if (!user) {
          setError(err.message || "Fehler beim Laden der Benutzerdaten.");
        } else {
          setAppsError(err.message || "Fehler beim Laden der Bewerbungen.");
        }
      } finally {
        setLoading(false);
        setLoadingApps(false);
      }
    };

    run();
  }, [router]);

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("prolinked_token");
      localStorage.removeItem("prolinked_role");
    }
    router.push("/login");
  };

  if (loading && !user && !error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-800">Lade Benutzerdaten...</p>
      </div>
    );
  }

  if (!user && !loading && !error) {
    return (
      <div className="p-6">
        <p className="mb-3 text-slate-900">
          Kein Benutzer geladen. Bitte erneut einloggen.
        </p>
        <button
          onClick={handleLogout}
          className="px-3 py-1 rounded bg-slate-200 hover:bg-slate-300 text-sm text-slate-900"
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
            className="px-3 py-1 rounded bg-slate-200 hover:bg-slate-300 text-sm text-slate-900"
          >
            Zurück zum Login
          </button>
        </main>
      </div>
    );
  }

  const profile = user?.candidate_profile || {};
  const profileComplete = Boolean(
    (profile.first_name && profile.first_name.trim() !== "") ||
      (profile.last_name && profile.last_name.trim() !== "")
  );

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
      : "text-slate-700 bg-slate-50 border-slate-200";

  // Stepper-Klassen
  const stepBase =
    "flex-1 rounded-lg border px-3 py-2 flex items-center gap-2 text-xs md:text-sm";
  const stepDone = "border-emerald-400 bg-emerald-50 text-emerald-900";
  const stepCurrent = "border-sky-400 bg-sky-50 text-sky-900";
  const stepUpcoming = "border-slate-200 bg-slate-50 text-slate-600";

  const circleBase =
    "flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-semibold";

  const hasApplications = applications.length > 0;
  const isReviewedOrEligible =
    profile.status === "reviewed" || profile.status === "eligible";

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
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
              className="px-2 py-1 rounded bg-sky-800 text-sky-50 hover:bg-sky-900"
            >
              Dashboard
            </button>
            <button
              onClick={() => router.push("/jobs")}
              className="px-2 py-1 rounded hover:bg-sky-800 text-sky-50/90"
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

      {/* Main */}
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
                  Basisdaten (Name, Länder) hinterlegen.
                </p>
              </div>
            </div>

            {/* Schritt 2: Dokumente */}
            <div
              className={
                stepBase +
                " " +
                (profileComplete && isReviewedOrEligible
                  ? stepDone
                  : profileComplete
                  ? stepCurrent
                  : stepUpcoming)
              }
            >
              <div
                className={
                  circleBase +
                  " " +
                  (profileComplete && isReviewedOrEligible
                    ? "bg-emerald-500 text-white"
                    : profileComplete
                    ? "bg-sky-600 text-white"
                    : "bg-slate-300 text-slate-700")
                }
              >
                2
              </div>
              <div>
                <p className="font-semibold">Dokumente hochladen</p>
                <p className="text-[11px] text-slate-600">
                  CV, Zeugnisse & Unterlagen im Dokumenten-Center.
                </p>
              </div>
            </div>

            {/* Schritt 3: Jobs durchsuchen */}
            <div
              className={
                stepBase +
                " " +
                (profileComplete && isReviewedOrEligible
                  ? stepCurrent
                  : stepUpcoming)
              }
            >
              <div
                className={
                  circleBase +
                  " " +
                  (profileComplete && isReviewedOrEligible
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
                (hasApplications ? stepDone : stepUpcoming)
              }
            >
              <div
                className={
                  circleBase +
                  " " +
                  (hasApplications
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

        {/* Dokumenten-Center */}
        <section className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-slate-900">
              Dokumenten-Center
            </h2>
          </div>
          <p className="text-xs text-slate-700 mb-3">
            Lade hier deine{" "}
            <span className="font-semibold">CVs, Zeugnisse, Zertifikate</span>{" "}
            und andere relevante Unterlagen hoch. Diese Dokumente werden für
            die interne Prüfung und spätere Vermittlung genutzt.
          </p>

          <DocumentManager />
        </section>

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
            <p className="text-sm text-slate-700">
              Bewerbungen werden geladen...
            </p>
          )}

          {!loadingApps &&
            applications.length === 0 &&
            !appsError && (
              <p className="text-sm text-slate-700">
                Noch keine Bewerbungen vorhanden.
              </p>
            )}

          {!loadingApps && applications.length > 0 && (
            <ul className="divide-y divide-slate-200 mt-2">
              {applications.map((app) => (
                <li key={app.id} className="py-2 text-sm">
                  <div className="font-medium text-slate-900">
                    {app.job?.title}
                  </div>
                  <div className="text-slate-700">
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
          )}
        </section>
      </main>
    </div>
  );
}
