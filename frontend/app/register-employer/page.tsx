"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL as string;

export default function RegisterEmployerPage() {
  const router = useRouter();

  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [country, setCountry] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!companyName || !email || !password || !passwordConfirmation) {
      setError("Bitte alle Pflichtfelder ausfüllen.");
      return;
    }

    if (password !== passwordConfirmation) {
      setError("Passwörter stimmen nicht überein.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${API_BASE_URL}/auth/register-employer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          company_name: companyName,
          contact_name: contactName,
          country,
          email,
          password,
          password_confirmation: passwordConfirmation,
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
          `Registrierung fehlgeschlagen (${res.status.toString()})`;
        throw new Error(msg);
      }

      setMessage(
        "Arbeitgeber erfolgreich registriert. Du kannst dich jetzt einloggen."
      );
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Registrierung fehlgeschlagen.");
    } finally {
      setLoading(false);
    }
  };

  const gotoLogin = () => {
    router.push("/login");
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
          <span className="text-[11px] px-2 py-1 rounded-full bg-amber-100 text-amber-800 font-medium">
            Employer
          </span>
        </div>

        <h1 className="text-lg font-semibold mb-1 text-slate-900">
          Arbeitgeber-Account erstellen
        </h1>
        <p className="text-xs mb-4 text-slate-600">
          Erstelle einen Arbeitgeber-Account, um Stellenanzeigen zu veröffentlichen
          und Bewerbungen zu verwalten.
        </p>

        {error && (
          <div className="mb-4 text-sm text-red-800 border border-red-200 bg-red-50 rounded px-3 py-2">
            {error}
          </div>
        )}
        {message && (
          <div className="mb-4 text-sm text-emerald-800 border border-emerald-200 bg-emerald-50 rounded px-3 py-2">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-800">
              Firmenname *
            </label>
            <input
              type="text"
              className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-slate-800">
              Ansprechpartner (optional)
            </label>
            <input
              type="text"
              className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="z. B. HR Manager"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-slate-800">
              Land (optional)
            </label>
            <input
              type="text"
              className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="z. B. Deutschland"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-slate-800">
              E-Mail *
            </label>
            <input
              type="email"
              className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-800">
                Passwort *
              </label>
              <input
                type="password"
                className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-800">
                Passwort bestätigen *
              </label>
              <input
                type="password"
                className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                autoComplete="new-password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-sky-700 hover:bg-sky-800 text-white font-medium rounded-lg px-3 py-2 text-sm disabled:opacity-50 transition"
          >
            {loading ? "Registrierung läuft..." : "Arbeitgeber registrieren"}
          </button>
        </form>

        <div className="mt-6 text-[11px] text-slate-500 text-center space-y-2">
          <p>Bereits ein Account?</p>
          <button
            onClick={gotoLogin}
            className="text-sky-700 hover:underline font-medium"
          >
            Zum Login
          </button>
        </div>
      </div>
    </div>
  );
}
