"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { useRouter } from "next/navigation";

interface Application {
  id: number;
  status: string;
  job: {
    id: number;
    title: string;
    location?: string;
    employer?: {
      company_name?: string;
    };
  };
  created_at: string;
}

export default function CandidateDashboardPage() {
  const { user, token, loading, logout } = useAuth();
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loadingApps, setLoadingApps] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Wenn nicht eingeloggt → Login
  useEffect(() => {
    if (!loading && (!user || !token)) {
      router.push("/login");
    }
  }, [user, token, loading, router]);

  useEffect(() => {
    const fetchApplications = async () => {
      if (!token) return;
      try {
        const data = await apiFetch<Application[]>("/candidate/applications", {}, token);
        setApplications(data);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Fehler beim Laden der Bewerbungen");
      } finally {
        setLoadingApps(false);
      }
    };

    if (token) {
      fetchApplications();
    }
  }, [token]);

  if (loading || !user) {
    return <div className="p-6">Lädt...</div>;
  }

  if (user.role !== "candidate") {
    return <div className="p-6">Dieses Dashboard ist nur für Kandidaten.</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="flex items-center justify-between px-6 py-4 bg-white shadow">
        <h1 className="text-xl font-semibold">PROLINKED – Candidate Dashboard</h1>
        <div className="flex items-center gap-4 text-sm">
          <span>{user.name} ({user.email})</span>
          <button
            onClick={logout}
            className="px-3 py-1 rounded bg-slate-200 hover:bg-slate-300"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="p-6 max-w-4xl mx-auto">
        <section className="mb-6 bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-2">Profil</h2>
          <p className="text-sm text-slate-700">
            Name: {user.candidate_profile?.first_name} {user.candidate_profile?.last_name}
          </p>
          <p className="text-sm text-slate-700">
            Herkunftsland: {user.candidate_profile?.country_of_origin || "–"}
          </p>
          <p className="text-sm text-slate-700">
            Ziel-Land: {user.candidate_profile?.target_country || "–"}
          </p>
        </section>

        <section className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-3">Meine Bewerbungen</h2>

          {loadingApps && <p className="text-sm">Bewerbungen werden geladen...</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}

          {!loadingApps && applications.length === 0 && (
            <p className="text-sm text-slate-600">Noch keine Bewerbungen vorhanden.</p>
          )}

          <ul className="divide-y divide-slate-200">
            {applications.map((app) => (
              <li key={app.id} className="py-2 text-sm">
                <div className="font-medium">{app.job?.title}</div>
                <div className="text-slate-600">
                  {app.job?.employer?.company_name || "Unbekannter Arbeitgeber"} –{" "}
                  {app.job?.location || "Ort n/a"}
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
