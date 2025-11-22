"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL as string;

export default function CandidateRegisterPage() {
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [countryOfOrigin, setCountryOfOrigin] = useState("");
  const [targetCountry, setTargetCountry] = useState("Deutschland");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (password !== passwordConfirmation) {
      setError("Passwörter stimmen nicht überein.");
      return;
    }

    try {
      setLoading(true);

      const body = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        country_of_origin: countryOfOrigin.trim(),
        target_country: targetCountry.trim(),
        email: email.trim(),
        password,
        password_confirmation: passwordConfirmation,
      };

      const res = await fetch(
        `${API_BASE_URL}/auth/register-candidate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(body),
        }
      );

      if (!res.ok) {
        let rBody: any = null;
        try {
          rBody = await res.json();
        } catch {
          // ignore
        }
        const msg =
          rBody?.message ||
          `Registrierung fehlgeschlagen (${res.status.toString()})`;
        throw new Error(msg);
      }

      setMessage("Registrierung erfolgreich. Du kannst dich jetzt einloggen.");
      // Optional: direkt zum Login schicken
      setTimeout(() => {
        router.push("/login");
      }, 1200);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Unbekannter Fehler bei der Registrierung.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-900 to-sky-950">
      <div className="w-full max-w-lg bg-white/95 border border-slate-700/40 rounded-2xl shadow-xl p-6">
        <div className="mb-4 text-center">
          <h1 className="text-xl font-semibold text-slate-900">
            Kandidat registrieren
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Erstelle dein PROLINKED-Konto, um deinen Bewerbungsprozess
            zu starten.
          </p>
          <div
            className="mt-2 h-0.5 w-16 mx-auto rounded-full"
            style={{ backgroundColor: "#5BE1E6" }}
          />
        </div>

        {message && (
          <p className="text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded px-3 py-2 mb-3">
            {message}
          </p>
        )}
        {error && (
          <p className="text-sm text-red-800 bg-red-50 border border-red-200 rounded px-3 py-2 mb-3">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-800 mb-1">
                Vorname *
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5BE1E6] focus:border-[#5BE1E6]"
                placeholder="z.B. Amina"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-800 mb-1">
                Nachname *
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5BE1E6] focus:border-[#5BE1E6]"
                placeholder="z.B. El-Boujattoui"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-800 mb-1">
                Herkunftsland *
              </label>
              <input
                type="text"
                value={countryOfOrigin}
                onChange={(e) => setCountryOfOrigin(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5BE1E6] focus:border-[#5BE1E6]"
                placeholder="z.B. Marokko"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-800 mb-1">
                Zielland *
              </label>
              <input
                type="text"
                value={targetCountry}
                onChange={(e) => setTargetCountry(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5BE1E6] focus:border-[#5BE1E6]"
                placeholder="z.B. Deutschland"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-800 mb-1">
              E-Mail *
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-800 mb-1">
                Passwort *
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5BE1E6] focus:border-[#5BE1E6]"
                placeholder="Mind. 8 Zeichen"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-800 mb-1">
                Passwort wiederholen *
              </label>
              <input
                type="password"
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5BE1E6] focus:border-[#5BE1E6]"
                placeholder="Noch einmal eingeben"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-sky-800 text-white text-sm font-medium py-2 mt-2 hover:bg-sky-900 disabled:opacity-50"
          >
            {loading ? "Registrierung läuft..." : "Registrieren"}
          </button>
        </form>

        <div className="mt-4 text-center text-[11px] text-slate-600 space-y-1">
          <p>
            Bereits einen Account?{" "}
            <a
              href="/login"
              className="text-sky-700 hover:underline"
            >
              Zum Login
            </a>
          </p>
          <p>
            Unternehmen?{" "}
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
