"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const { login, user, token } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("candidate1@example.com"); // zum Testen
  const [password, setPassword] = useState("secret1234");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);

      // Nach Login abhängig von Rolle weiterleiten
      // Wir vertrauen darauf, dass useAuth user nach login setzt
      setTimeout(() => {
        if (!user) {
          // user wird minimal verzögert geladen, daher fallback
          router.push("/dashboard");
        } else if (user.role === "candidate") {
          router.push("/candidate/dashboard");
        } else if (user.role === "employer") {
          router.push("/employer/dashboard");
        } else {
          router.push("/dashboard");
        }
      }, 200);
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="w-full max-w-md bg-white rounded-xl shadow p-8">
        <h1 className="text-2xl font-semibold mb-4 text-center">PROLINKED Login</h1>

        {error && (
          <div className="mb-4 text-sm text-red-600 border border-red-200 bg-red-50 rounded px-3 py-2">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">E-Mail</label>
            <input
              type="email"
              className="w-full border rounded px-3 py-2 text-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Passwort</label>
            <input
              type="password"
              className="w-full border rounded px-3 py-2 text-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-sky-600 hover:bg-sky-700 text-white font-medium rounded px-3 py-2 text-sm disabled:opacity-50"
          >
            {loading ? "Bitte warten..." : "Einloggen"}
          </button>
        </form>

        <p className="mt-4 text-xs text-center text-slate-500">
          Test-Login: candidate1@example.com / secret1234
        </p>
      </div>
    </div>
  );
}
