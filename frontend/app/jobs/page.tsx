"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL as string;

interface Job {
  id: number;
  title: string;
  location?: string;
  employment_type?: string;
  description: string;
  language_requirement?: string;
}

export default function JobsPage() {
  const router = useRouter();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [loadingApply, setLoadingApply] = useState<number | null>(null);
  const [applyMessage, setApplyMessage] = useState<string | null>(null);
  const [applyError, setApplyError] = useState<string | null>(null);

  const [token, setToken] = useState<string | null>(null);

  // Token check beim Laden
  useEffect(() => {
    const t =
      typeof window !== "undefined"
        ? localStorage.getItem("prolinked_token")
        : null;

    if (!t) {
      router.push("/login");
      return;
    }

    setToken(t);
  }, [router]);

  // Jobs laden
  const fetchJobs = async (q?: string, location?: string) => {
    if (!API_BASE_URL) return;

    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (q) params.append("q", q);
      if (location) params.append("location", location);

      const url =
        params.toString().length > 0
          ? `${API_BASE_URL}/jobs?${params.toString()}`
          : `${API_BASE_URL}/jobs`;

      const res = await fetch(url, {
        headers: {
          Accept: "application/json",
        },
      });

      if (!res.ok) {
        throw new Error(`Fehler beim Laden der Jobs (${res.status})`);
      }

      const data = await res.json();
      // Laravel-Pagination: data.data = eigentliche Liste
      const list = Array.isArray(data) ? data : data.data;
      setJobs(list || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Fehler beim Laden der Jobs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleFilterSubmit = (e: FormEvent) => {
    e.preventDefault();
    fetchJobs(search, locationFilter);
  };

  const handleApply = async (jobId: number) => {
    if (!token) {
      router.push("/login");
      return;
    }

    setApplyMessage(null);
    setApplyError(null);
    setLoadingApply(jobId);

    try {
      const res = await fetch(`${API_BASE_URL}/jobs/${jobId}/apply`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        let body: any = null;
        try {
          body = await res.json();
        } catch {
          // ignore
        }

        // Falls Backend 409 bei "already applied"
        if (res.status === 409) {
          throw new Error(
            body?.message || "Du hast dich bereits auf diesen Job beworben."
          );
        }

        const msg =
          body?.message || `Bewerbung fehlgeschlagen (${res.status})`;
        throw new Error(msg);
      }

      setApplyMessage("Bewerbung erfolgreich abgeschickt.");
    } catch (err: any) {
      console.error(err);
      setApplyError(err.message || "Fehler bei der Bewerbung.");
    } finally {
      setLoadingApply(null);
    }
  };

  const handleBackToDashboard = () => {
    router.push("/candidate/dashboard");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-sky-900 text-sky-50 shadow">
  <div className="max-w-5xl mx-auto flex items-center justify-between px-6 py-3">
    <div className="flex items-center gap-2">
      <span className="font-bold tracking-wide">PROLINKED</span>
      <span className="text-[11px] uppercase opacity-70">Jobs</span>
    </div>
    <nav className="flex items-center gap-3 text-sm">
      <button
        onClick={() => router.push("/candidate/dashboard")}
        className="px-2 py-1 rounded hover:bg-sky-800"
      >
        Dashboard
      </button>
      <button
        onClick={() => router.push("/jobs")}
        className="px-2 py-1 rounded bg-sky-800"
      >
        Jobs
      </button>
    </nav>
  </div>
</header>


      <main className="p-6 max-w-5xl mx-auto space-y-4">
        <section className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-3">Jobs suchen</h2>

          <form
            onSubmit={handleFilterSubmit}
            className="flex flex-col md:flex-row gap-3"
          >
            <input
              type="text"
              placeholder="Suche nach Titel oder Beschreibung..."
              className="flex-1 border rounded px-3 py-2 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <input
              type="text"
              placeholder="Ort (z.B. Berlin)"
              className="w-full md:w-48 border rounded px-3 py-2 text-sm"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
            />
            <button
              type="submit"
              className="px-4 py-2 text-sm rounded bg-sky-600 text-white hover:bg-sky-700"
            >
              Filtern
            </button>
          </form>
        </section>

        <section className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-3">Verfügbare Jobs</h2>

          {applyMessage && (
            <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2 mb-2">
              {applyMessage}
            </p>
          )}
          {applyError && (
            <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2 mb-2">
              {applyError}
            </p>
          )}

          {loading && <p className="text-sm">Jobs werden geladen...</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}

          {!loading && jobs.length === 0 && !error && (
            <p className="text-sm text-slate-600">
              Aktuell sind keine Jobs verfügbar.
            </p>
          )}

          <ul className="divide-y divide-slate-200">
            {jobs.map((job) => (
              <li key={job.id} className="py-3 text-sm">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <div className="font-medium text-base">{job.title}</div>
                    <div className="text-slate-600">
                      {job.location || "Ort n/a"} –{" "}
                      {job.employment_type || "Beschäftigungsart n/a"}
                    </div>
                    {job.language_requirement && (
                      <div className="text-slate-500">
                        Sprache: {job.language_requirement}
                      </div>
                    )}
                    <p className="mt-1 text-slate-700 text-xs">
                      {job.description.slice(0, 200)}
                      {job.description.length > 200 ? "..." : ""}
                    </p>
                  </div>
                  <div className="shrink-0">
                    <button
                      onClick={() => handleApply(job.id)}
                      disabled={loadingApply === job.id}
                      className="px-3 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 text-xs"
                    >
                      {loadingApply === job.id
                        ? "Bewerbung läuft..."
                        : "Bewerben"}
                    </button>
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
