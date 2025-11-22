"use client";

import { useEffect, useState, ChangeEvent } from "react";
import { useRouter } from "next/navigation";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL as string;

type CandidateStatus = "new" | "reviewed" | "eligible" | string;

interface AdminCandidateProfile {
  first_name: string | null;
  last_name: string | null;
  country_of_origin: string | null;
  target_country: string | null;
  status: CandidateStatus;
}

interface AdminCandidate {
  id: number;
  name: string;
  email: string;
  profile: AdminCandidateProfile;
  created_at: string;
}

export default function AdminCandidatesPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [authChecking, setAuthChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<AdminCandidate[]>([]);
  const [savingStatusId, setSavingStatusId] = useState<number | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Token aus localStorage laden
  useEffect(() => {
    if (typeof window !== "undefined") {
      const t = localStorage.getItem("prolinked_token");
      setToken(t);
    }
  }, []);

  // Admin-Check + Kandidatenliste laden
  useEffect(() => {
    if (!token) {
      setAuthChecking(false);
      router.push("/login");
      return;
    }

    const checkAdminAndLoad = async () => {
      try {
        setAuthChecking(true);
        setError(null);

        // 1) /auth/me prüfen
        const meRes = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        if (!meRes.ok) {
          throw new Error("Fehler beim Laden des Benutzers.");
        }

        const me = await meRes.json();

        if ((me.role || "").toLowerCase() !== "admin") {
          throw new Error("Nur Admins haben Zugriff auf diese Seite.");
        }

        // 2) Kandidatenliste laden
        setLoading(true);
        const res = await fetch(`${API_BASE_URL}/admin/candidates`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        if (!res.ok) {
          throw new Error("Fehler beim Laden der Kandidatenliste.");
        }

        const data = (await res.json()) as AdminCandidate[];
        setCandidates(data);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Fehler beim Laden der Admin-Daten.");
      } finally {
        setLoading(false);
        setAuthChecking(false);
      }
    };

    checkAdminAndLoad();
  }, [token, router]);

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("prolinked_token");
      localStorage.removeItem("prolinked_role");
    }
    router.push("/login");
  };

  const handleStatusChange = (
    candidateId: number,
    e: ChangeEvent<HTMLSelectElement>
  ) => {
    const newStatus = e.target.value as CandidateStatus;
    setCandidates((prev) =>
      prev.map((c) =>
        c.id === candidateId
          ? {
              ...c,
              profile: {
                ...c.profile,
                status: newStatus,
              },
            }
          : c
      )
    );
  };

  const handleStatusSave = async (candidateId: number) => {
    const candidate = candidates.find((c) => c.id === candidateId);
    if (!candidate) return;

    if (!token) {
      alert("Nicht eingeloggt.");
      return;
    }

    try {
      setSavingStatusId(candidateId);

      const res = await fetch(
        `${API_BASE_URL}/admin/candidates/${candidateId}/status`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: candidate.profile.status,
          }),
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
          `Status-Update fehlgeschlagen (${res.status.toString()})`;
        throw new Error(msg);
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Fehler beim Speichern des Status.");
    } finally {
      setSavingStatusId(null);
    }
  };

  if (authChecking) {
    return (
      <div className="p-6">
        <p className="text-sm text-slate-700">
          Zugriffsprüfung läuft...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50">
        <header className="bg-sky-900 text-sky-50 shadow">
          <div className="max-w-5xl mx-auto flex items-center justify-between px-6 py-3">
            <span className="font-bold tracking-wide">
              PROLINKED – Admin
            </span>
            <button
              onClick={handleLogout}
              className="px-3 py-1 rounded bg-slate-100 text-sky-900 hover:bg-white text-xs font-semibold"
            >
              Logout
            </button>
          </div>
        </header>
        <main className="p-6 max-w-4xl mx-auto">
          <p className="text-sm text-red-800 bg-red-50 border border-red-200 rounded px-3 py-2 mb-3">
            {error}
          </p>
          <button
            onClick={() => router.push("/")}
            className="px-3 py-1 rounded bg-slate-200 hover:bg-slate-300 text-sm"
          >
            Zur Startseite
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-sky-900 text-sky-50 shadow">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-6 py-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-wide">
                PROLINKED
              </span>
              <span className="text-[11px] uppercase opacity-70">
                Admin
              </span>
            </div>
            <div
              className="mt-1 h-0.5 w-16 rounded-full"
              style={{ backgroundColor: "#5BE1E6" }}
            />
          </div>
          <nav className="flex items-center gap-3 text-sm">
            <button
              onClick={() => router.push("/admin/candidates")}
              className="px-2 py-1 rounded bg-sky-800"
            >
              Kandidaten
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

      <main className="p-6 max-w-5xl mx-auto">
        <h1 className="text-xl font-semibold mb-4 text-slate-900">
          Kandidatenübersicht
        </h1>

        {loading && (
          <p className="text-sm text-slate-700">
            Kandidaten werden geladen...
          </p>
        )}

        {!loading && candidates.length === 0 && (
          <p className="text-sm text-slate-600">
            Noch keine Kandidaten vorhanden.
          </p>
        )}

        {!loading && candidates.length > 0 && (
          <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white">
            <table className="min-w-full text-xs md:text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-200">
                  <th className="py-2 px-3">Name</th>
                  <th className="py-2 px-3">E-Mail</th>
                  <th className="py-2 px-3">Herkunft</th>
                  <th className="py-2 px-3">Zielland</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3 text-right">Aktion</th>
                </tr>
              </thead>
              <tbody>
                {candidates.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-slate-100 last:border-0"
                  >
                    <td className="py-2 px-3 text-slate-900 whitespace-nowrap">
                      {c.profile.first_name || c.profile.last_name
                        ? `${c.profile.first_name ?? ""} ${
                            c.profile.last_name ?? ""
                          }`.trim()
                        : c.name}
                    </td>
                    <td className="py-2 px-3 text-slate-700">
                      {c.email}
                    </td>
                    <td className="py-2 px-3 text-slate-700">
                      {c.profile.country_of_origin || "–"}
                    </td>
                    <td className="py-2 px-3 text-slate-700">
                      {c.profile.target_country || "–"}
                    </td>
                    <td className="py-2 px-3 text-slate-700">
                      <select
                        value={c.profile.status}
                        onChange={(e) => handleStatusChange(c.id, e)}
                        className="rounded border border-slate-300 bg-white px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-[#5BE1E6]"
                      >
                        <option value="new">Neu</option>
                        <option value="reviewed">Geprüft</option>
                        <option value="eligible">Vermittelbar</option>
                      </select>
                    </td>
                    <td className="py-2 px-3 text-right">
                      <button
                        onClick={() => handleStatusSave(c.id)}
                        disabled={savingStatusId === c.id}
                        className="px-3 py-1 rounded bg-sky-800 text-white text-[11px] md:text-xs hover:bg-sky-900 disabled:opacity-50"
                      >
                        {savingStatusId === c.id
                          ? "Speichere..."
                          : "Status speichern"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
