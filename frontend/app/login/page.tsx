"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL as string;

interface LoginResponse {
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
  token: string;
}

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      setLoading(true);

      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        let body: any = null;
        try {
          body = await res.json();
        } catch {
          // ignore
        }
        const msg =
          body?.message || `Login fehlgeschlagen (${res.status})`;
        throw new Error(msg);
      }

      const data = (await res.json()) as LoginResponse;

      if (typeof window !== "undefined") {
        localStorage.setItem("prolinked_token", data.token);
        localStorage.setItem("prolinked_role", data.user.role);
      }

      const role = (data.user.role || "").toLowerCase();

      if (role === "candidate") {
        router.push("/candidate/dashboard");
      } else if (role === "employer") {
        router.push("/employer/dashboard");
      } else if (role === "admin") {
        router.push("/admin/candidates");
      } else {
        router.push("/");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Unbekannter Fehler beim Login.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-900 to-sky-950">
      <div className="w-full max-w-md bg-white/95 border border-slate-700/40 rounded-2xl shadow-xl p-6">
        <div className="mb-4 text-center">
          <h1 className="text-xl font-semibold text-slate-900">
            PROLINKED Login
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Bitte melde dich mit deinen Zugangsdaten an.
          </p>
          <div
            className="mt-2 h-0.5 w-16 mx-auto rounded-full"
            style={{ backgroundColor: "#5BE1E6" }}
          />
        </div>

        {error && (
          <p className="text-sm text-red-800 bg-red-50 border border-red-200 rounded px-3 py-2 mb-3">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-800 mb-1">
              E-Mail
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5BE1E6] focus:border-[#5BE1E6]"
              placeholder="name@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-800 mb-1">
              Passwort
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5BE1E6] focus:border-[#5BE1E6]"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-sky-800 text-white text-sm font-medium py-2 mt-2 hover:bg-sky-900 disabled:opacity-50"
          >
            {loading ? "Login läuft..." : "Einloggen"}
          </button>
        </form>

        <div className="mt-4 text-center text-[11px] text-slate-600 space-y-1">
          <p>
            Noch kein Account?{" "}
            <a
              href="/register/candidate"
              className="text-sky-700 hover:underline"
            >
              Kandidat registrieren
            </a>{" "}
            ·{" "}
            <a
              href="/register/employer"
              className="text-sky-700 hover:underline"
            >
              Arbeitgeber registrieren
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
