"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL as string;

interface Job {
  id: number;
  title: string;
  location?: string;
  employment_type?: string;
  is_active: boolean;
  created_at: string;
}

interface CandidateProfile {
  first_name?: string;
  last_name?: string;
  country_of_origin?: string;
  target_country?: string;
}

interface CandidateUser {
  id: number;
  name: string;
  email: string;
}

interface EmployerApplication {
  id: number;
  status: string;
  created_at: string;
  candidate_profile: CandidateProfile & { user?: CandidateUser };
}


export default function EmployerDashboardPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [jobsError, setJobsError] = useState<string | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [jobApplications, setJobApplications] = useState<EmployerApplication[]>(
  []
  );
  const [appsLoading, setAppsLoading] = useState(false);
  const [appsError, setAppsError] = useState<string | null>(null);

  const [title, setTitle] = useState("Software Engineer");
  const [location, setLocation] = useState("Berlin");
  const [employmentType, setEmploymentType] = useState("full-time");
  const [description, setDescription] = useState(
    "Entwicklung von Web-Applikationen für PROLINKED Partner."
  );
  const [requirements, setRequirements] = useState(
    "Erfahrung mit PHP/Laravel oder Node/React."
  );
  const [languageRequirement, setLanguageRequirement] =
    useState("Deutsch B2");
  const [formError, setFormError] = useState<string | null>(null);
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  const [token, setToken] = useState<string | null>(null);

  // Token & Rolle prüfen
  useEffect(() => {
    const t =
      typeof window !== "undefined"
        ? localStorage.getItem("prolinked_token")
        : null;
    const role =
      typeof window !== "undefined"
        ? localStorage.getItem("prolinked_role")
        : null;

    if (!t) {
      router.push("/login");
      return;
    }

    setToken(t);
    setUserRole(role);
    setLoading(false);
  }, [router]);

  // Jobs laden
  useEffect(() => {
    const fetchJobs = async () => {
      if (!token) return;

      try {
        setJobsLoading(true);
        const res = await fetch(`${API_BASE_URL}/employer/jobs`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        if (!res.ok) {
          throw new Error("Fehler beim Laden der Jobs");
        }

        const data = (await res.json()) as Job[];
        setJobs(data);
      } catch (err: any) {
        console.error(err);
        setJobsError(err.message || "Fehler beim Laden der Jobs");
      } finally {
        setJobsLoading(false);
      }
    };

    if (token) {
      fetchJobs();
    }
  }, [token]);

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("prolinked_token");
      localStorage.removeItem("prolinked_role");
    }
    router.push("/login");
  };

  const handleCreateJob = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormMessage(null);

    if (!token) {
      setFormError("Nicht eingeloggt.");
      return;
    }

    try {
      setFormSubmitting(true);
      const res = await fetch(`${API_BASE_URL}/employer/jobs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          location,
          employment_type: employmentType,
          description,
          requirements,
          language_requirement: languageRequirement,
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
          body?.message || `Job-Erstellung fehlgeschlagen (${res.status})`;
        throw new Error(msg);
      }

      const job = (await res.json()) as Job;
      setFormMessage("Job erfolgreich angelegt.");
      setJobs((prev) => [job, ...prev]);
    } catch (err: any) {
      console.error(err);
      setFormError(err.message || "Fehler beim Anlegen des Jobs.");
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleViewApplications = async (jobId: number) => {
  if (!token) {
    setAppsError("Nicht eingeloggt.");
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
    setJobApplications(data);
  } catch (err: any) {
    console.error(err);
    setAppsError(err.message || "Fehler beim Laden der Bewerbungen.");
  } finally {
    setAppsLoading(false);
  }
};

  if (loading) {
    return <div className="p-6">Lade Arbeitgeber-Dashboard...</div>;
  }

  if (userRole !== "employer") {
    return (
      <div className="p-6">
        <p className="mb-4">
          Dieses Dashboard ist nur für Arbeitgeber-Accounts. Bitte mit einem
          Employer-Login anmelden.
        </p>
        <button
          onClick={handleLogout}
          className="px-3 py-1 text-sm rounded bg-slate-200 hover:bg-slate-300"
        >
          Zurück zum Login
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-sky-900 text-sky-50 shadow">
  <div className="max-w-5xl mx-auto flex items-center justify-between px-6 py-3">
    <div className="flex items-center gap-2">
      <span className="font-bold tracking-wide">PROLINKED</span>
      <span className="text-[11px] uppercase opacity-70">Employer</span>
    </div>
    <nav className="flex items-center gap-3 text-sm">
      <button
        onClick={() => router.push("/employer/dashboard")}
        className="px-2 py-1 rounded hover:bg-sky-800"
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
        <section className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-3">Neuen Job anlegen</h2>

          {formMessage && (
            <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2 mb-2">
              {formMessage}
            </p>
          )}
          {formError && (
            <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2 mb-2">
              {formError}
            </p>
          )}

          <form onSubmit={handleCreateJob} className="grid gap-3 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Jobtitel</label>
              <input
                className="w-full border rounded px-3 py-2 text-sm"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Ort</label>
              <input
                className="w-full border rounded px-3 py-2 text-sm"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Beschäftigungsart
              </label>
              <input
                className="w-full border rounded px-3 py-2 text-sm"
                value={employmentType}
                onChange={(e) => setEmploymentType(e.target.value)}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">
                Beschreibung
              </label>
              <textarea
                className="w-full border rounded px-3 py-2 text-sm"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">
                Anforderungen
              </label>
              <textarea
                className="w-full border rounded px-3 py-2 text-sm"
                rows={3}
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">
                Sprach-Anforderung
              </label>
              <input
                className="w-full border rounded px-3 py-2 text-sm"
                value={languageRequirement}
                onChange={(e) => setLanguageRequirement(e.target.value)}
              />
            </div>

            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={formSubmitting}
                className="px-4 py-2 text-sm rounded bg-sky-600 text-white hover:bg-sky-700 disabled:opacity-50"
              >
                {formSubmitting ? "Job wird angelegt..." : "Job veröffentlichen"}
              </button>
            </div>
          </form>
        </section>

        <section className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-3">Meine Jobs</h2>

          {jobsLoading && <p className="text-sm">Jobs werden geladen...</p>}
          {jobsError && (
            <p className="text-sm text-red-800 bg-red-50 border border-red-200 rounded px-3 py-2 mb-2">{jobsError}</p>
          )}

          {!jobsLoading && jobs.length === 0 && (
            <p className="text-sm text-slate-600">
              Noch keine Jobs angelegt.
            </p>
          )}

          <ul className="divide-y divide-slate-200">
            {jobs.map((job) => (
              <li key={job.id} className="py-2 text-sm">
                <div className="font-medium">{job.title}</div>
                <div className="text-slate-600">
                  {job.location || "Ort n/a"} –{" "}
                  {job.employment_type || "Typ n/a"}
                </div>
                <div className="text-slate-500">
                  Aktiv: {job.is_active ? "Ja" : "Nein"} –{" "}
                  Erstellt am: {new Date(job.created_at).toLocaleString()}
                </div>
              </li>
            ))}
          </ul>
          <ul className="divide-y divide-slate-200">
  {jobs.map((job) => (
    <li key={job.id} className="py-2 text-sm">
      <div className="flex justify-between items-start gap-4">
        <div>
          <div className="font-medium">{job.title}</div>
          <div className="text-slate-600">
            {job.location || "Ort n/a"} –{" "}
            {job.employment_type || "Typ n/a"}
          </div>
          <div className="text-slate-500">
            Aktiv: {job.is_active ? "Ja" : "Nein"} – Erstellt am:{" "}
            {new Date(job.created_at).toLocaleString()}
          </div>
        </div>
        <div className="shrink-0 flex flex-col gap-2">
          <button
            onClick={() => handleViewApplications(job.id)}
            className="px-3 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-700 text-xs"
          >
            Bewerbungen ansehen
              </button>
            </div>
         <div className="mt-4 border-t pt-4">
  <h3 className="text-md font-semibold mb-2">
    Bewerbungen für Job{" "}
    {selectedJobId ? `#${selectedJobId}` : "(Job auswählen)"}
  </h3>

  {appsLoading && <p className="text-sm">Bewerbungen werden geladen...</p>}
  {appsError && (
    <p className="text-sm text-red-800 bg-red-50 border border-red-200 rounded px-3 py-2 mb-2">{appsError}</p>
  )}

  {!appsLoading && selectedJobId && jobApplications.length === 0 && !appsError && (
    <p className="text-sm text-slate-600">
      Für diesen Job liegen aktuell keine Bewerbungen vor.
    </p>
  )}

  <ul className="divide-y divide-slate-200">
    {jobApplications.map((app) => (
      <li key={app.id} className="py-2 text-sm">
        <div className="font-medium">
          {app.candidate_profile?.first_name}{" "}
          {app.candidate_profile?.last_name}
        </div>
        <div className="text-slate-600">
          Herkunftsland:{" "}
          {app.candidate_profile?.country_of_origin || "–"} – Zielland:{" "}
          {app.candidate_profile?.target_country || "–"}
        </div>
        <div className="text-slate-500">
          Status: {app.status} – Erstellt am:{" "}
          {new Date(app.created_at).toLocaleString()}
        </div>
      </li>
    ))}
  </ul>
</div>

           </div>
          </li>
         ))}
        </ul>

        </section>
      </main>
    </div>
  );
}
