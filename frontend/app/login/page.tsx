"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL as string;

export default function LoginPage() {
  const router = useRouter();

  // Zum Testen kannst du hier Default-Werte setzen oder leer lassen:
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
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
        const msg = body?.message || `Login fehlgeschlagen (${res.status})`;
        throw new Error(msg);
      }

      const data = await res.json();

      if (typeof window !== "undefined") {
        localStorage.setItem("prolinked_token", data.token);
        localStorage.setItem("prolinked_role", data.user.role);
      }

      const role = (data.user.role || "").toLowerCase().trim();

      if (role === "employer") {
        router.push("/employer/dashboard");
      } else if (role === "candidate") {
        router.push("/candidate/dashboard");
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Login fehlgeschlagen");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4">
      <div className="w-full max-w-lg bg-white/95 rounded-2xl shadow-xl p-8">
        {/* Brand / Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-wide text-sky-900">
                PROLINKED
              </span>
            </div>
            <p className="text-[11px] uppercase tracking-wide text-slate-500">
              Talent & Employer Portal
            </p>
          </div>
          <span className="text-[11px] px-2 py-1 rounded-full bg-sky-100 text-sky-800 font-medium">
            Login
          </span>
        </div>

        <h1 className="text-lg font-semibold mb-1 text-slate-900">
          Willkommen zurück
        </h1>
        <p className="text-xs mb-4 text-slate-600">
          Melde dich als <span className="font-semibold">Kandidat</span> oder{" "}
          <span className="font-semibold">Arbeitgeber</span> mit deiner E-Mail
          und deinem Passwort an.
        </p>

        {error && (
          <div className="mb-4 text-sm text-red-800 border border-red-200 bg-red-50 rounded px-3 py-2">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-800">
              E-Mail
            </label>
            <input
              type="email"
              className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-slate-50"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              placeholder="z. B. candidate1@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-slate-800">
              Passwort
            </label>
            <input
              type="password"
              className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-slate-50"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-sky-700 hover:bg-sky-800 text-white font-medium rounded-lg px-3 py-2 text-sm disabled:opacity-50 transition"
          >
            {loading ? "Bitte warten..." : "Einloggen"}
          </button>
        </form>

        {/* Register Links */}
        <div className="mt-6 text-[11px] text-slate-500 text-center space-y-2">
          <p>Du hast noch keinen Account?</p>
          <div className="flex items-center justify-center gap-3 text-xs">
            <button
              onClick={() => router.push("/register-candidate")}
              className="text-sky-700 hover:underline font-medium"
            >
              Kandidat registrieren
            </button>
            <span className="text-slate-400">|</span>
            <button
              onClick={() => router.push("/register-employer")}
              className="text-sky-700 hover:underline font-medium"
            >
              Arbeitgeber registrieren
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
