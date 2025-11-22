"use client";

import {
  useEffect,
  useState,
  FormEvent,
  ChangeEvent,
} from "react";
import { useRouter } from "next/navigation";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL as string;

interface EmployerUser {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface EmployerJob {
  id: number;
  title: string;
  location?: string | null;
  employment_type?: string | null;
  description: string;
  requirements?: string | null;
  language_requirement?: string | null;
  is_active: boolean;
  created_at: string;
}

export default function EmployerDashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState<EmployerUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [userError, setUserError] = useState<string | null>(null);

  const [jobs, setJobs] = useState<EmployerJob[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [jobsError, setJobsError] = useState<string | null>(null);

  // Job-Form
  const [showJobForm, setShowJobForm] = useState(false);
  const [jobTitle, setJobTitle] = useState("");
  const [jobLocation, setJobLocation] = useState("");
  const [jobEmploymentType, setJobEmploymentType] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [jobRequirements, setJobRequirements] = useState("");
  const [jobLanguageReq, setJobLanguageReq] = useState("");
  const [jobIsActive, setJobIsActive] = useState(true);

  const [jobFormError, setJobFormError] = useState<string | null>(null);
  const [jobFormMessage, setJobFormMessage] = useState<string | null>(null);
  const [jobFormSubmitting, setJobFormSubmitting] = useState(false);

  // User & Jobs laden
  useEffect(() => {
    const run = async () => {
      try {
        if (typeof window === "undefined") return;

        const token = localStorage.getItem("prolinked_token");
        if (!token) {
          setLoadingUser(false);
          router.push("/login");
          return;
        }

        // 1) User laden
        setLoadingUser(true);
        const meRes = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        if (!meRes.ok) {
          throw new Error("Fehler beim Laden des Benutzers.");
        }

        const me = (await meRes.json()) as EmployerUser;
        setUser(me);

        if ((me.role || "").toLowerCase() !== "employer") {
          setUserError("Dieses Dashboard ist nur für Arbeitgeber.");
          setLoadingJobs(false);
          return;
        }

        // 2) Jobs laden
        setLoadingJobs(true);
        const jobsRes = await fetch(`${API_BASE_URL}/employer/jobs`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        if (!jobsRes.ok) {
          throw new Error("Fehler beim Laden der Stellenanzeigen.");
        }

        const data = (await jobsRes.json()) as EmployerJob[];
        setJobs(data);
      } catch (err: any) {
        console.error(err);
        if (!user) {
          setUserError(err.message || "Fehler beim Laden der Benutzerdaten.");
        } else {
          setJobsError(err.message || "Fehler beim Laden der Stellenanzeigen.");
        }
      } finally {
        setLoadingUser(false);
        setLoadingJobs(false);
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

  const handleJobSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setJobFormError(null);
    setJobFormMessage(null);

    if (!jobTitle.trim() || !jobDescription.trim()) {
      setJobFormError(
        "Bitte mindestens Titel und Beschreibung der Stelle angeben."
      );
      return;
    }

    if (typeof window === "undefined") return;
    const token = localStorage.getItem("prolinked_token");
    if (!token) {
      setJobFormError("Nicht eingeloggt. Bitte erneut einloggen.");
      router.push("/login");
      return;
    }

    try {
      setJobFormSubmitting(true);

      const body = {
        title: jobTitle.trim(),
        location: jobLocation.trim() || null,
        employment_type: jobEmploymentType.trim() || null,
        description: jobDescription.trim(),
        requirements: jobRequirements.trim() || null,
        language_requirement: jobLanguageReq.trim() || null,
        is_active: jobIsActive,
      };

      const res = await fetch(`${API_BASE_URL}/employer/jobs`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        let rBody: any = null;
        try {
          rBody = await res.json();
        } catch {
          // ignore
        }
        const msg =
          rBody?.message ||
          `Fehler beim Anlegen der Stelle (${res.status.toString()})`;
        throw new Error(msg);
      }

      const newJob = (await res.json()) as EmployerJob;

      // Neue Stelle in Liste einfügen
      setJobs((prev) => [newJob, ...prev]);

      // Formular zurücksetzen
      setJobTitle("");
      setJobLocation("");
      setJobEmploymentType("");
      setJobDescription("");
      setJobRequirements("");
      setJobLanguageReq("");
      setJobIsActive(true);

      setJobFormMessage("Stelle erfolgreich angelegt.");
    } catch (err: any) {
      console.error(err);
      setJobFormError(err.message || "Unbekannter Fehler beim Speichern.");
    } finally {
      setJobFormSubmitting(false);
    }
  };

  const totalJobs = jobs.length;
  const activeJobs = jobs.filter((j) => j.is_active).length;

  // Ladezustand
  if (loadingUser && !user && !userError) {
    return <div className="p-6 text-slate-900">Lade Benutzerdaten...</div>;
  }

  if (userError) {
    return (
      <div className="min-h-screen bg-slate-50">
        <header className="bg-sky-900 text-sky-50 shadow">
          <div className="max-w-5xl mx-auto flex items-center justify-between px-6 py-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold tracking-wide">PROLINKED</span>
                <span className="text-[11px] uppercase opacity-70">
                  Employer
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
            {userError}
          </p>
          <button
            onClick={() => router.push("/login")}
            className="px-3 py-1 rounded bg-slate-200 hover:bg-slate-300 text-sm text-slate-900"
          >
            Zurück zum Login
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-sky-900 text-sky-50 shadow">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-6 py-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-wide">PROLINKED</span>
              <span className="text-[11px] uppercase opacity-70">
                Employer
              </span>
            </div>
            <div
              className="mt-1 h-0.5 w-16 rounded-full"
              style={{ backgroundColor: "#5BE1E6" }}
            />
          </div>
          <nav className="flex items-center gap-3 text-sm">
            <button
              onClick={() => router.push("/employer/dashboard")}
              className="px-2 py-1 rounded bg-sky-800 text-sky-50 hover:bg-sky-900"
            >
              Dashboard
            </button>
            <button
              onClick={() => router.push("/jobs")}
              className="px-2 py-1 rounded hover:bg-sky-800 text-sky-50/90"
            >
              Öffentliche Jobs
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
        {/* Begrüßung & KPI-Karten */}
        <section className="space-y-3">
          <h1 className="text-xl font-semibold text-slate-900">
            Willkommen, {user?.name ?? "Arbeitgeber"}
          </h1>
          <p className="text-sm text-slate-700">
            Verwalten Sie Ihre Stellenanzeigen und behalten Sie den Überblick
            über Ihre Recruiting-Aktivitäten.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <p className="text-[11px] uppercase text-slate-500">
                Gesamtstellen
              </p>
              <p className="text-2xl font-semibold text-slate-900">
                {totalJobs}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <p className="text-[11px] uppercase text-slate-500">
                Aktive Stellen
              </p>
              <p className="text-2xl font-semibold text-emerald-700">
                {activeJobs}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <p className="text-[11px] uppercase text-slate-500">
                Bewerbungen (Platzhalter)
              </p>
              <p className="text-xs text-slate-600">
                Detaillierte Bewerbungsstatistiken folgen in Phase 3.
              </p>
            </div>
          </div>
        </section>

        {/* Neue Stelle anlegen */}
        <section className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-slate-900">
              Neue Stelle anlegen
            </h2>
            <button
              type="button"
              onClick={() => setShowJobForm((prev) => !prev)}
              className="text-xs px-3 py-1 rounded border border-slate-400 bg-slate-100 text-slate-900 hover:bg-slate-200"
            >
              {showJobForm ? "Formular ausblenden" : "Formular anzeigen"}
            </button>
          </div>

          {showJobForm && (
            <div className="mt-2">
              {jobFormMessage && (
                <p className="text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded px-3 py-2 mb-2">
                  {jobFormMessage}
                </p>
              )}
              {jobFormError && (
                <p className="text-sm text-red-800 bg-red-50 border border-red-200 rounded px-3 py-2 mb-2">
                  {jobFormError}
                </p>
              )}

              <form onSubmit={handleJobSubmit} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-800 mb-1">
                      Stellentitel *
                    </label>
                    <input
                      type="text"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5BE1E6] focus:border-[#5BE1E6]"
                      placeholder="z.B. Pflegefachkraft (m/w/d)"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-800 mb-1">
                      Standort
                    </label>
                    <input
                      type="text"
                      value={jobLocation}
                      onChange={(e) => setJobLocation(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5BE1E6] focus:border-[#5BE1E6]"
                      placeholder="z.B. Köln, Remote, Hybrid"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-800 mb-1">
                      Anstellungsart
                    </label>
                    <select
                      value={jobEmploymentType}
                      onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                        setJobEmploymentType(e.target.value)
                      }
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#5BE1E6] focus:border-[#5BE1E6]"
                    >
                      <option value="">Bitte wählen…</option>
                      <option value="Vollzeit">Vollzeit</option>
                      <option value="Teilzeit">Teilzeit</option>
                      <option value="Befristet">Befristet</option>
                      <option value="Praktikum">Praktikum</option>
                      <option value="Ausbildung">Ausbildung</option>
                      <option value="Sonstiges">Sonstiges</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-800 mb-1">
                      Sprachanforderungen
                    </label>
                    <input
                      type="text"
                      value={jobLanguageReq}
                      onChange={(e) => setJobLanguageReq(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5BE1E6] focus:border-[#5BE1E6]"
                      placeholder="z.B. Deutsch B2, Englisch B1"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-800 mb-1">
                    Beschreibung *
                  </label>
                  <textarea
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5BE1E6] focus:border-[#5BE1E6]"
                    rows={4}
                    placeholder="Beschreiben Sie die Aufgaben und den Kontext der Stelle."
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-800 mb-1">
                    Anforderungen / Profil
                  </label>
                  <textarea
                    value={jobRequirements}
                    onChange={(e) => setJobRequirements(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5BE1E6] focus:border-[#5BE1E6]"
                    rows={3}
                    placeholder="z.B. Ausbildung, Berufserfahrung, Soft Skills..."
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    id="jobIsActive"
                    type="checkbox"
                    checked={jobIsActive}
                    onChange={(e) => setJobIsActive(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-sky-700 focus:ring-[#5BE1E6]"
                  />
                  <label
                    htmlFor="jobIsActive"
                    className="text-xs text-slate-800"
                  >
                    Stelle ist aktiv und sichtbar
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={jobFormSubmitting}
                  className="px-4 py-2 rounded-lg bg-sky-800 text-white text-sm font-medium hover:bg-sky-900 disabled:opacity-50"
                >
                  {jobFormSubmitting ? "Speichere..." : "Stelle anlegen"}
                </button>
              </form>
            </div>
          )}
        </section>

        {/* Stellenliste */}
        <section className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <h2 className="text-lg font-semibold text-slate-900 mb-3">
            Meine Stellenanzeigen
          </h2>

          {jobsError && (
            <p className="text-sm text-red-800 bg-red-50 border border-red-200 rounded px-3 py-2 mb-2">
              {jobsError}
            </p>
          )}

          {loadingJobs && (
            <p className="text-sm text-slate-700">
              Stellenanzeigen werden geladen...
            </p>
          )}

          {!loadingJobs && jobs.length === 0 && !jobsError && (
            <p className="text-sm text-slate-700">
              Sie haben derzeit noch keine Stellen angelegt.
            </p>
          )}

          {!loadingJobs && jobs.length > 0 && (
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="min-w-full text-xs md:text-sm bg-white">
                <thead>
                  <tr className="text-left text-slate-600 border-b border-slate-200">
                    <th className="py-2 px-3">Titel</th>
                    <th className="py-2 px-3">Standort</th>
                    <th className="py-2 px-3">Anstellungsart</th>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 px-3">Erstellt am</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job) => (
                    <tr
                      key={job.id}
                      className="border-b border-slate-100 last:border-0"
                    >
                      <td className="py-2 px-3 text-slate-900">
                        {job.title}
                      </td>
                      <td className="py-2 px-3 text-slate-800">
                        {job.location || "–"}
                      </td>
                      <td className="py-2 px-3 text-slate-800">
                        {job.employment_type || "–"}
                      </td>
                      <td className="py-2 px-3">
                        <span
                          className={
                            "inline-flex items-center px-2 py-1 rounded-full text-[11px] border " +
                            (job.is_active
                              ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                              : "bg-slate-50 text-slate-700 border-slate-300")
                          }
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current mr-1" />
                          {job.is_active ? "Aktiv" : "Inaktiv"}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-slate-800 whitespace-nowrap">
                        {job.created_at
                          ? new Date(job.created_at).toLocaleString()
                          : "–"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
