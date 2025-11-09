"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL as string;

const inputClass =
  "w-full rounded-lg border border-slate-400 bg-white px-3 py-2 text-sm " +
  "text-slate-900 placeholder-slate-500 " +
  "focus:outline-none focus:ring-2 focus:ring-[#5BE1E6] focus:border-[#5BE1E6]";

const primaryButtonClass =
  "w-full rounded-lg bg-sky-800 text-white text-sm font-medium px-3 py-2 " +
  "hover:bg-sky-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5BE1E6] " +
  "disabled:opacity-50 transition";

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
            <div
              className="mt-2 h-0.5 w-20 rounded-full"
              style={{ backgroundColor: "#5BE1E6" }}
            />
          </div>
          <span className="text-[11px] px-2 py-1 rounded-full bg-amber-50 text-amber-700 border"
                style={{ borderColor: "#5BE1E6" }}>
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
              className={inputClass}
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
              className={inputClass}
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
              className={inputClass}
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
              className={inputClass}
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
                className={inputClass}
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
                className={inputClass}
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                autoComplete="new-password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={primaryButtonClass}
          >
            {loading ? "Registrierung läuft..." : "Arbeitgeber registrieren"}
          </button>
        </form>

        <div className="mt-6 text-[11px] text-slate-500 text-center space-y-2">
          <p>Bereits ein Account?</p>
          <button
            onClick={gotoLogin}
            className="text-sky-800 hover:underline font-medium"
          >
            Zum Login
          </button>
        </div>
      </div>
    </div>
  );
}
