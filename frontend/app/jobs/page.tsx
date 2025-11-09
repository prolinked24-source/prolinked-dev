"use client";

import { FormEvent, useEffect, useState } from "react";
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
          // ignore parse error
        }

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
    // Für Kandidaten sinnvoll – später ggf. rollenspezifisch erweitern
    router.push("/candidate/dashboard");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-sky-900 text-sky-50 shadow">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2">
            <span className="font-bold tracking-wide">PROLINKED</span>
            <span className="text-[11px] uppercase opacity-70">
              Jobs
            </span>
          </div>
          <nav className="flex items-center gap-3 text-sm">
            <button
              onClick={handleBackToDashboard}
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

      <main className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Filter-Section */}
        <section className="bg-white rounded-lg shadow p-4">
          <h1 className="text-lg font-semibold mb-3">Jobs suchen</h1>
          <form
            onSubmit={handleFilterSubmit}
            className="grid gap-3 md:grid-cols-[2fr,2fr,auto]"
          >
            <div>
              <label className="block text-xs font-medium mb-1 text-slate-700">
                Stichwort (Titel, Beschreibung)
              </label>
              <input
                type="text"
                className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-slate-50"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="z. B. Pflegekraft, IT, Bau..."
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1 text-slate-700">
                Ort
              </label>
              <input
                type="text"
                className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-slate-50"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                placeholder="z. B. Berlin, München..."
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="w-full md:w-auto px-4 py-2 text-sm rounded bg-sky-700 text-white hover:bg-sky-800 transition"
              >
                Filtern
              </button>
            </div>
          </form>
        </section>

        {/* Jobliste */}
        <section className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-3">
            Verfügbare Jobs
          </h2>

          {applyMessage && (
            <p className="text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded px-3 py-2 mb-2">
              {applyMessage}
            </p>
          )}
          {applyError && (
            <p className="text-sm text-red-800 bg-red-50 border border-red-200 rounded px-3 py-2 mb-2">
              {applyError}
            </p>
          )}

          {loading && (
            <p className="text-sm">Jobs werden geladen...</p>
          )}

          {error && (
            <p className="text-sm text-red-800 bg-red-50 border border-red-200 rounded px-3 py-2 mb-2">
              {error}
            </p>
          )}

          {!loading && jobs.length === 0 && !error && (
            <p className="text-sm text-slate-600">
              Aktuell sind keine Jobs verfügbar.
            </p>
          )}

          <ul className="divide-y divide-slate-200">
            {jobs.map((job) => (
              <li key={job.id} className="py-3 text-sm">
                <div className="flex flex-col gap-1 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="font-medium text-sm md:text-base">
                      {job.title}
                    </div>
                    <div className="text-slate-600 text-xs md:text-sm">
                      {job.location || "Ort n/a"} –{" "}
                      {job.employment_type || "Beschäftigungsart n/a"}
                    </div>
                    {job.language_requirement && (
                      <div className="text-slate-500 text-xs">
                        Sprache: {job.language_requirement}
                      </div>
                    )}
                    <div className="text-slate-700 text-sm mt-1">
                      {job.description.slice(0, 200)}
                      {job.description.length > 200 ? " ..." : ""}
                    </div>
                  </div>
                  <div className="mt-2 md:mt-0 md:ml-4">
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
