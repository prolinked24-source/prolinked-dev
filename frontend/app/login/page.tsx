"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL as string;

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("candidate1@example.com"); // Test-User
  const [password, setPassword] = useState("secret1234");
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

      // Nach Rolle weiterleiten
      if (data.user.role === "employer") {
        router.push("/employer/dashboard");
      } else if (data.user.role === "candidate") {
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

  // oben unverändert…

return (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
    <div className="w-full max-w-md bg-white/95 rounded-2xl shadow-xl p-8">
      <h1 className="text-2xl font-semibold mb-1 text-center text-sky-900">
        PROLINKED Login
      </h1>
      <p className="text-xs text-center mb-6 text-slate-600">
        Melde dich mit deinem Kandidaten- oder Arbeitgeber-Account an.
      </p>

      {error && (
        <div className="mb-4 text-sm text-red-800 border border-red-200 bg-red-50 rounded px-3 py-2">
          {error}
        </div>
      )}

      {/* dein Formular bleibt, nur ggf. Input-Klassen anpassen */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1 text-slate-800">
            E-Mail
          </label>
          <input
            type="email"
            className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-slate-50"
            // …
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-slate-800">
            Passwort
          </label>
          <input
            type="password"
            className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-slate-50"
            // …
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

      <div className="mt-5 text-[11px] text-slate-500 space-y-1 text-center">
        <p>Test Candidate: candidate1@example.com / secret1234</p>
        <p>Test Employer: employer1@example.com / secret1234</p>
      </div>
    </div>
  </div>
);

}
