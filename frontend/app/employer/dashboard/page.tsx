"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL as string;

interface EmployerProfile {
  company_name?: string;
  contact_name?: string;
  country?: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  employer?: EmployerProfile;
}

interface Job {
  id: number;
  title: string;
  location?: string | null;
  employment_type?: string | null;
  description: string;
  is_active: boolean;
  created_at: string;
}

interface CandidateProfile {
  first_name?: string;
  last_name?: string;
  country_of_origin?: string;
  target_country?: string;
  user?: {
    email: string;
  };
}

interface EmployerApplication {
  id: number;
  status: string;
  created_at: string;
  candidate_profile?: CandidateProfile;
}

const inputClass =
  "w-full rounded-lg border border-slate-400 bg-white px-3 py-2 text-sm " +
  "text-slate-900 placeholder-slate-500 " +
  "focus:outline-none focus:ring-2 focus:ring-[#5BE1E6] focus:border-[#5BE1E6]";

const primaryButtonClass =
  "px-4 py-2 text-sm rounded-lg bg-sky-800 text-white font-medium " +
  "hover:bg-sky-900 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#5BE1E6]";

const secondaryButtonClass =
  "px-3 py-1 text-xs rounded-lg bg-emerald-600 text-white " +
  "hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-[#5BE1E6]";

export default function EmployerDashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [jobsError, setJobsError] = useState<string | null>(null);

  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [jobApplications, setJobApplications] = useState<EmployerApplication[]>([]);
  const [appsLoading, setAppsLoading] = useState(false);
  const [appsError, setAppsError] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);

  // Neues Job-Formular
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [employmentType, setEmploymentType] = useState("");
  const [description, setDescription] = useState("");
  const [creatingJob, setCreatingJob] = useState(false);
  const [createMessage, setCreateMessage] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);

  // User & Jobs laden
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

        if (data.role !== "employer") {
          setError("Dieses Dashboard ist nur für Arbeitgeber.");
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Fehler beim Laden des Benutzers.");
      } finally {
        setLoading(false);
      }
    };

    const fetchJobs = async () => {
      try {
        setJobsLoading(true);
        setJobsError(null);

        const res = await fetch(`${API_BASE_URL}/employer/jobs`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        if (!res.ok) {
          throw new Error("Fehler beim Laden der Jobs.");
        }

        const data = await res.json();
        const list = Array.isArray(data) ? data : data.data;
        setJobs(list || []);
      } catch (err: any) {
        console.error(err);
        setJobsError(err.message || "Fehler beim Laden der Jobs.");
      } finally {
        setJobsLoading(false);
      }
    };

    fetchMe();
    fetchJobs();
  }, [router]);

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("prolinked_token");
      localStorage.removeItem("prolinked_role");
    }
    router.push("/login");
  };

  // Bewerbungen zu einem Job laden
  const handleViewApplications = async (jobId: number) => {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("prolinked_token")
        : null;

    if (!token) {
      setAppsError("Nicht eingeloggt.");
      router.push("/login");
      return;
    }

    setSelectedJobId(jobId);
    setAppsError(null);
    setJobApplications([]);
    setAppsLoading(true);

    try {
      const res = await fetch(
        `${API_BASE_URL}/employer/jobs/${jobId}/applications`,
        {
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
          `Fehler beim Laden der Bewerbungen für Job ${jobId} (${res.status})`;
        throw new Error(msg);
      }

      const data = (await res.json()) as EmployerApplication[];
      setJobApplications(data || []);
    } catch (err: any) {
      console.error(err);
      setAppsError(err.message || "Fehler beim Laden der Bewerbungen.");
    } finally {
      setAppsLoading(false);
    }
  };

  // Job erstellen
  const handleCreateJob = async (e: FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setCreateMessage(null);

    if (!title || !description) {
      setCreateError("Titel und Beschreibung sind Pflichtfelder.");
      return;
    }

    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("prolinked_token")
        : null;

    if (!token) {
      setCreateError("Nicht eingeloggt.");
      router.push("/login");
      return;
    }

    try {
      setCreatingJob(true);

      const res = await fetch(`${API_BASE_URL}/employer/jobs`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          location,
          employment_type: employmentType,
          description,
        }),
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
          `Job-Erstellung fehlgeschlagen (${res.status.toString()})`;
        throw new Error(msg);
      }

      const data = await res.json();
      setCreateMessage("Job erfolgreich erstellt.");

      setJobs((prev) => [data, ...prev]);

      setTitle("");
      setLocation("");
      setEmploymentType("");
      setDescription("");
    } catch (err: any) {
      console.error(err);
      setCreateError(err.message || "Fehler beim Erstellen des Jobs.");
    } finally {
      setCreatingJob(false);
    }
  };

  if (loading) {
    return <div className="p-6">Lade Benutzerdaten...</div>;
  }

  // Fallback: kein User geladen
  if (!user && !error) {
    return (
      <div className="p-6">
        <p className="mb-3">Kein Benutzer geladen. Bitte erneut einloggen.</p>
        <button
          onClick={handleLogout}
          className="px-3 py-1 rounded bg-slate-200 hover:bg-slate-300 text-sm"
        >
          Zurück zum Login
        </button>
      </div>
    );
  }

  // Fehlerfall (z. B. falsche Rolle)
  if (error) {
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

  const profile = user?.employer || {};
  const totalJobs = jobs.length;
  const activeJobs = jobs.filter((j) => j.is_active).length;
  const applicationsForSelectedJob = jobApplications.length;
  const hasJobs = totalJobs > 0;
  const hasApplications = jobs.some((j) => j.is_active) && (jobApplications.length > 0 || appsLoading);

  // Stepper-Klassen (ähnlich Candidate, aber 3 Schritte)
  const stepBase =
    "flex-1 rounded-lg border px-3 py-2 flex items-center gap-2 text-xs md:text-sm";
  const stepDone = "border-emerald-400 bg-emerald-50 text-emerald-900";
  const stepCurrent = "border-sky-400 bg-sky-50 text-sky-900";
  const stepUpcoming = "border-slate-200 bg-slate-50 text-slate-600";

  const circleBase =
    "flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-semibold";

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
          <nav className="flex items-center gap-3 text-sm">
            <button
              onClick={() => router.push("/employer/dashboard")}
              className="px-2 py-1 rounded bg-sky-800"
            >
              Dashboard
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
        {/* Stepper – Hiring-Flow */}
        <section className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <h2 className="text-sm font-semibold mb-3 text-slate-900">
            Hiring-Flow
          </h2>
          <p className="text-[11px] text-slate-600 mb-3">
            Übersicht über die drei zentralen Schritte im PROLINKED-Hiring:
            <span className="font-semibold"> Job anlegen</span>,{" "}
            <span className="font-semibold">Bewerbungen prüfen</span> und{" "}
            <span className="font-semibold">Kandidaten kontaktieren</span>.
          </p>
          <div className="flex flex-col md:flex-row md:items-stretch gap-3">
            {/* Schritt 1: Job anlegen */}
            <div
              className={
                stepBase +
                " " +
                (hasJobs ? stepDone : stepCurrent)
              }
            >
              <div
                className={
                  circleBase +
                  " " +
                  (hasJobs
                    ? "bg-emerald-500 text-white"
                    : "bg-sky-600 text-white")
                }
              >
                1
              </div>
              <div>
                <p className="font-semibold">Job anlegen</p>
                <p className="text-[11px] text-slate-600">
                  Stellenanzeige erstellen und veröffentlichen.
                </p>
              </div>
            </div>

            {/* Schritt 2: Bewerbungen prüfen */}
            <div
              className={
                stepBase +
                " " +
                (hasJobs && hasApplications
                  ? stepDone
                  : hasJobs
                  ? stepCurrent
                  : stepUpcoming)
              }
            >
              <div
                className={
                  circleBase +
                  " " +
                  (hasJobs && hasApplications
                    ? "bg-emerald-500 text-white"
                    : hasJobs
                    ? "bg-sky-600 text-white"
                    : "bg-slate-300 text-slate-700")
                }
              >
                2
              </div>
              <div>
                <p className="font-semibold">Bewerbungen prüfen</p>
                <p className="text-[11px] text-slate-600">
                  Eingehende Bewerbungen sichten & vergleichen.
                </p>
              </div>
            </div>

            {/* Schritt 3: Kandidaten kontaktieren */}
            <div
              className={
                stepBase +
                " " +
                (hasApplications ? stepCurrent : stepUpcoming)
              }
            >
              <div
                className={
                  circleBase +
                  " " +
                  (hasApplications
                    ? "bg-sky-600 text-white"
                    : "bg-slate-300 text-slate-700")
                }
              >
                3
              </div>
              <div>
                <p className="font-semibold">Kandidaten kontaktieren</p>
                <p className="text-[11px] text-slate-600">
                  Geeignete Kandidaten per E-Mail erreichen.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* KPI-Section */}
        <section className="grid gap-4 md:grid-cols-3">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Jobs gesamt
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {totalJobs}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Aktive Jobs
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {activeJobs}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Bewerbungen (ausgewählter Job)
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {selectedJobId ? applicationsForSelectedJob : "–"}
            </p>
          </div>
        </section>

        {/* Profil-Section */}
        <section className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <h2 className="text-lg font-semibold mb-2 text-slate-900">
            Unternehmensprofil
          </h2>
          <p className="text-sm text-slate-700">
            Firma: {profile.company_name || user?.name || "–"}
          </p>
          <p className="text-sm text-slate-700">
            Ansprechpartner: {profile.contact_name || "–"}
          </p>
          <p className="text-sm text-slate-700">
            Land: {profile.country || "–"}
          </p>
        </section>

        {/* Job erstellen */}
        <section className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <h2 className="text-lg font-semibold mb-3 text-slate-900">
            Neuen Job erstellen
          </h2>

          {createMessage && (
            <p className="text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded px-3 py-2 mb-2">
              {createMessage}
            </p>
          )}
          {createError && (
            <p className="text-sm text-red-800 bg-red-50 border border-red-200 rounded px-3 py-2 mb-2">
              {createError}
            </p>
          )}

          <form onSubmit={handleCreateJob} className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-800">
                Jobtitel *
              </label>
              <input
                type="text"
                className={inputClass}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-800">
                  Standort
                </label>
                <input
                  type="text"
                  className={inputClass}
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-800">
                  Beschäftigungsart
                </label>
                <input
                  type="text"
                  className={inputClass}
                  value={employmentType}
                  onChange={(e) => setEmploymentType(e.target.value)}
                  placeholder="z.B. Vollzeit, Teilzeit"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-slate-800">
                Beschreibung *
              </label>
              <textarea
                className={inputClass + " min-h-[120px] resize-y"}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={creatingJob}
              className={primaryButtonClass}
            >
              {creatingJob ? "Job wird erstellt..." : "Job erstellen"}
            </button>
          </form>
        </section>

        {/* Jobliste + Bewerbungen */}
        <section className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <h2 className="text-lg font-semibold mb-3 text-slate-900">
            Meine Jobs
          </h2>

          {jobsError && (
            <p className="text-sm text-red-800 bg-red-50 border border-red-200 rounded px-3 py-2 mb-2">
              {jobsError}
            </p>
          )}

          {jobsLoading && (
            <p className="text-sm">Jobs werden geladen...</p>
          )}

          {!jobsLoading && jobs.length === 0 && !jobsError && (
            <p className="text-sm text-slate-600">
              Noch keine Jobs angelegt.
            </p>
          )}

          <ul className="divide-y divide-slate-200">
            {jobs.map((job) => (
              <li key={job.id} className="py-2 text-sm">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <div className="font-medium text-sm md:text-base text-slate-900">
                      {job.title}
                    </div>
                    <div className="text-slate-600 text-xs md:text-sm">
                      {job.location || "Ort n/a"} –{" "}
                      {job.employment_type || "Typ n/a"}
                    </div>
                    <div className="text-slate-500 text-xs">
                      Aktiv: {job.is_active ? "Ja" : "Nein"} – Erstellt am:{" "}
                      {new Date(job.created_at).toLocaleString()}
                    </div>
                  </div>
                  <div className="shrink-0 flex flex-col gap-2">
                    <button
                      onClick={() => handleViewApplications(job.id)}
                      className={secondaryButtonClass}
                    >
                      Bewerbungen ansehen
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-4 border-t border-slate-200 pt-4">
            <h3 className="text-md font-semibold mb-2 text-slate-900">
              Bewerbungen für Job{" "}
              {selectedJobId ? `#${selectedJobId}` : "(Job auswählen)"}
            </h3>

            {appsLoading && (
              <p className="text-sm">Bewerbungen werden geladen...</p>
            )}
            {appsError && (
              <p className="text-sm text-red-800 bg-red-50 border border-red-200 rounded px-3 py-2 mb-2">
                {appsError}
              </p>
            )}

            {!appsLoading &&
              selectedJobId &&
              jobApplications.length === 0 &&
              !appsError && (
                <p className="text-sm text-slate-600">
                  Für diesen Job liegen aktuell keine Bewerbungen vor.
                </p>
              )}

            <ul className="divide-y divide-slate-200">
              {jobApplications.map((app) => (
                <li key={app.id} className="py-2 text-sm">
                  <div className="font-medium text-slate-900">
                    {app.candidate_profile?.first_name}{" "}
                    {app.candidate_profile?.last_name}
                  </div>
                  <div className="text-slate-600 text-xs md:text-sm">
                    Herkunftsland:{" "}
                    {app.candidate_profile?.country_of_origin || "–"} – Zielland:{" "}
                    {app.candidate_profile?.target_country || "–"}
                  </div>
                  <div className="text-slate-500 text-xs">
                    Status: {app.status} – Erstellt am:{" "}
                    {new Date(app.created_at).toLocaleString()}
                  </div>
                  {app.candidate_profile?.user?.email && (
                    <div className="text-slate-500 text-xs">
                      E-Mail: {app.candidate_profile.user.email}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
}
