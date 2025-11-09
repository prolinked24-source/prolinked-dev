"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL as string;

export default function RegisterCandidatePage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [countryOfOrigin, setCountryOfOrigin] = useState("");
  const [targetCountry, setTargetCountry] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!email || !password || !passwordConfirmation || !firstName || !lastName) {
      setError("Bitte alle Pflichtfelder ausfüllen.");
      return;
    }

    if (password !== passwordConfirmation) {
      setError("Passwörter stimmen nicht überein.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${API_BASE_URL}/auth/register-candidate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          name: name || `${firstName} ${lastName}`,
          email,
          password,
          password_confirmation: passwordConfirmation,
          first_name: firstName,
          last_name: lastName,
          country_of_origin: countryOfOrigin,
          target_country: targetCountry,
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

      setMessage("Registrierung erfolgreich. Du kannst dich jetzt einloggen.");
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="w-full max-w-lg bg-white/95 rounded-2xl shadow-xl p-8">
        <h1 className="text-2xl font-semibold mb-1 text-center text-sky-900">
          Registrierung – Kandidat
        </h1>
        <p className="text-xs text-center mb-6 text-slate-600">
          Erstelle deinen PROLINKED-Kandidaten-Account und starte in den Bewerbungsprozess.
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-800">
                Vorname *
              </label>
              <input
                type="text"
                className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-800">
                Nachname *
              </label>
              <input
                type="text"
                className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-slate-800">
              Anzeigename (optional)
            </label>
            <input
              type="text"
              className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="z. B. Max M. (optional)"
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
                Herkunftsland
              </label>
              <input
                type="text"
                className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                value={countryOfOrigin}
                onChange={(e) => setCountryOfOrigin(e.target.value)}
                placeholder="z. B. Türkei, Ukraine, ..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-800">
                Zielland
              </label>
              <input
                type="text"
                className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                value={targetCountry}
                onChange={(e) => setTargetCountry(e.target.value)}
                placeholder="z. B. Deutschland, Österreich..."
              />
            </div>
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
            {loading ? "Registrierung läuft..." : "Kandidat registrieren"}
          </button>
        </form>

        <div className="mt-5 text-[11px] text-slate-500 text-center space-y-1">
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
