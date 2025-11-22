"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DocumentManager from "../../components/DocumentManager";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL as string;

interface CandidateProfile {
  first_name?: string | null;
  last_name?: string | null;
  country_of_origin?: string | null;
  target_country?: string | null;
  status?: "new" | "reviewed" | "eligible" | string;
  headline?: string | null;
  summary?: string | null;
}

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  candidate_profile?: CandidateProfile;
}

interface Application {
  id: number;
  status: string;
  created_at: string;
  job: {
    id: number;
    title: string;
    location?: string | null;
    employer?: {
      company_name?: string | null;
    };
  };
}

interface CvTemplate {
  id: number;
  name: string;
  slug: string;
  industry: string | null;
  language: string;
  layout_type: string;
  description?: string | null;
}

export default function CandidateDashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingApps, setLoadingApps] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [appsError, setAppsError] = useState<string | null>(null);

  // CV-Generator-States
  const [cvIndustry, setCvIndustry] = useState<string>("");
  const [cvTemplates, setCvTemplates] = useState<CvTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templatesError, setTemplatesError] = useState<string | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(
    null
  );
  const [headlineOverride, setHeadlineOverride] = useState<string>("");
  const [summaryOverride, setSummaryOverride] = useState<string>("");
  const [generatingCv, setGeneratingCv] = useState(false);
  const [generatorMessage, setGeneratorMessage] = useState<string | null>(null);
  const [generatorError, setGeneratorError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        if (typeof window === "undefined") return;

        const token = localStorage.getItem("prolinked_token");
        if (!token) {
          setLoading(false);
          router.push("/login");
          return;
        }

        // Benutzer laden
        setLoading(true);
        const meRes = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        if (!meRes.ok) {
          throw new Error("Fehler beim Laden des Benutzers.");
        }

        const me = (await meRes.json()) as User;
        setUser(me);

        if ((me.role || "").toLowerCase() !== "candidate") {
          setError("Dieses Dashboard ist nur für Kandidaten.");
          setLoadingApps(false);
          return;
        }

        // Bewerbungen laden
        setLoadingApps(true);
        const appsRes = await fetch(
          `${API_BASE_URL}/candidate/applications`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          }
        );

        if (!appsRes.ok) {
          throw new Error("Fehler beim Laden der Bewerbungen.");
        }

        const apps = (await appsRes.json()) as Application[];
        setApplications(apps);
      } catch (err: any) {
        console.error(err);
        if (!user) {
          setError(err.message || "Fehler beim Laden der Benutzerdaten.");
        } else {
          setAppsError(err.message || "Fehler beim Laden der Bewerbungen.");
        }
      } finally {
        setLoading(false);
        setLoadingApps(false);
      }
    };

    run();
  }, [router]);

  // CV-Templates laden, wenn Branche gewählt wurde
  useEffect(() => {
    const fetchTemplates = async () => {
      if (!cvIndustry) {
        setCvTemplates([]);
        setTemplatesError(null);
        setSelectedTemplateId(null);
        return;
      }

      try {
        if (typeof window === "undefined") return;
        const token = localStorage.getItem("prolinked_token");
        if (!token) {
          setTemplatesError("Nicht eingeloggt. Bitte neu anmelden.");
          return;
        }

        setTemplatesLoading(true);
        setTemplatesError(null);
        setCvTemplates([]);
        setSelectedTemplateId(null);

        const url = `${API_BASE_URL}/candidate/cv-templates?industry=${encodeURIComponent(
          cvIndustry
        )}&language=de`;

        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        if (!res.ok) {
          throw new Error("Fehler beim Laden der CV-Templates.");
        }

        const data = (await res.json()) as CvTemplate[];
        setCvTemplates(data);
      } catch (err: any) {
        console.error(err);
        setTemplatesError(
          err.message || "Fehler beim Laden der CV-Templates."
        );
      } finally {
        setTemplatesLoading(false);
      }
    };

    fetchTemplates();
  }, [cvIndustry]);

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("prolinked_token");
      localStorage.removeItem("prolinked_role");
    }
    router.push("/login");
  };

  const handleGenerateCv = async () => {
    setGeneratorError(null);
    setGeneratorMessage(null);

    if (!selectedTemplateId) {
      setGeneratorError("Bitte zuerst ein CV-Template auswählen.");
      return;
    }

    try {
      if (typeof window === "undefined") return;
      const token = localStorage.getItem("prolinked_token");
      if (!token) {
        setGeneratorError("Nicht eingeloggt. Bitte neu anmelden.");
        return;
      }

      setGeneratingCv(true);

      const payload: Record<string, any> = {
        template_id: selectedTemplateId,
      };

      if (headlineOverride.trim() !== "") {
        payload.headline = headlineOverride.trim();
      }

      if (summaryOverride.trim() !== "") {
        payload.summary = summaryOverride.trim();
      }

      const res = await fetch(`${API_BASE_URL}/candidate/cv/generate`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let msg = "CV konnte nicht generiert werden.";
        try {
          const body = await res.json();
          if (body?.message) msg = body.message;
        } catch {
          // ignore
        }
        throw new Error(msg);
      }

      const body = await res.json();
      setGeneratorMessage(
        body?.message ||
          "CV wurde erfolgreich generiert und im Dokumenten-Center gespeichert."
      );
    } catch (err: any) {
      console.error(err);
      setGeneratorError(
        err.message ||
          "Fehler bei der CV-Generierung. Bitte später erneut versuchen."
      );
    } finally {
      setGeneratingCv(false);
    }
  };

  if (loading && !user && !error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-800">Lade Benutzerdaten...</p>
      </div>
    );
  }

  if (!user && !loading && !error) {
    return (
      <div className="p-6">
        <p className="mb-3 text-slate-900">
          Kein Benutzer geladen. Bitte erneut einloggen.
        </p>
        <button
          onClick={handleLogout}
          className="px-3 py-1 rounded bg-slate-200 hover:bg-slate-300 text-sm text-slate-900"
        >
          Zurück zum Login
        </button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50">
        <header className="bg-sky-900 text-sky-50 shadow">
          <div className="max-w-5xl mx-auto flex items-center justify-between px-6 py-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold tracking-wide">PROLINKED</span>
                <span className="text-[11px] uppercase opacity-70">
                  Candidate
                </span>
              </div>
              <div
                className="mt-1 h-0.5 w-16 rounded-full"
                style={{ backgroundColor: "#5BE1E6" }}
              />
            </div>
            <button
              onClick={handleLogout}
              className="px-3 py-1 rounded bg-slate-100 text-sky-900 hover:bg-white text-xs font-semibold"
            >
              Logout
            </button>
          </div>
        </header>
        <main className="p-6 max-w-3xl mx-auto">
          <p className="text-sm text-red-800 bg-red-50 border border-red-200 rounded px-3 py-2 mb-3">
            {error}
          </p>
          <button
            onClick={handleLogout}
            className="px-3 py-1 rounded bg-slate-200 hover:bg-slate-300 text-sm text-slate-900"
          >
            Zurück zum Login
          </button>
        </main>
      </div>
    );
  }

  const profile = user?.candidate_profile || {};
  const profileComplete = Boolean(
    (profile.first_name && profile.first_name.trim() !== "") ||
      (profile.last_name && profile.last_name.trim() !== "")
  );

  const statusLabel =
    profile.status === "eligible"
      ? "Vermittelbar"
      : profile.status === "reviewed"
      ? "Geprüft"
      : "Neu";

  const statusClass =
    profile.status === "eligible"
      ? "text-emerald-700 bg-emerald-50 border-emerald-200"
      : profile.status === "reviewed"
      ? "text-sky-700 bg-sky-50 border-sky-200"
      : "text-slate-700 bg-slate-50 border-slate-200";

  const stepBase =
    "flex-1 rounded-lg border px-3 py-2 flex items-center gap-2 text-xs md:text-sm";
  const stepDone = "border-emerald-400 bg-emerald-50 text-emerald-900";
  const stepCurrent = "border-sky-400 bg-sky-50 text-sky-900";
  const stepUpcoming = "border-slate-200 bg-slate-50 text-slate-600";

  const circleBase =
    "flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-semibold";

  const hasApplications = applications.length > 0;
  const isReviewedOrEligible =
    profile.status === "reviewed" || profile.status === "eligible";

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-sky-900 text-sky-50 shadow">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-6 py-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-wide">PROLINKED</span>
              <span className="text-[11px] uppercase opacity-70">
                Candidate
              </span>
            </div>
            <div
              className="mt-1 h-0.5 w-16 rounded-full"
              style={{ backgroundColor: "#5BE1E6" }}
            />
          </div>
          <nav className="flex items-center gap-3 text-sm">
            <button
              onClick={() => router.push("/candidate/dashboard")}
              className="px-2 py-1 rounded bg-sky-800 text-sky-50 hover:bg-sky-900"
            >
              Dashboard
            </button>
            <button
              onClick={() => router.push("/jobs")}
              className="px-2 py-1 rounded hover:bg-sky-800 text-sky-50/90"
            >
              Jobs
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

      {/* Main */}
      <main className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Stepper – Vermittlungsstatus */}
        <section className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <h2 className="text-sm font-semibold mb-3 text-slate-900">
            Mein Vermittlungsstatus
          </h2>

          <div className="flex flex-col md:flex-row md:items-stretch gap-3 mb-3">
            {/* Schritt 1: Profil */}
            <div
              className={
                stepBase +
                " " +
                (profileComplete ? stepDone : stepCurrent)
              }
            >
              <div
                className={
                  circleBase +
                  " " +
                  (profileComplete
                    ? "bg-emerald-500 text-white"
                    : "bg-sky-600 text-white")
                }
              >
                1
              </div>
              <div>
                <p className="font-semibold">Profil anlegen</p>
                <p className="text-[11px] text-slate-600">
                  Basisdaten (Name, Länder) hinterlegen.
                </p>
              </div>
            </div>

            {/* Schritt 2: Dokumente */}
            <div
              className={
                stepBase +
                " " +
                (profileComplete && isReviewedOrEligible
                  ? stepDone
                  : profileComplete
                  ? stepCurrent
                  : stepUpcoming)
              }
            >
              <div
                className={
                  circleBase +
                  " " +
                  (profileComplete && isReviewedOrEligible
                    ? "bg-emerald-500 text-white"
                    : profileComplete
                    ? "bg-sky-600 text-white"
                    : "bg-slate-300 text-slate-700")
                }
              >
                2
              </div>
              <div>
                <p className="font-semibold">Dokumente hochladen</p>
                <p className="text-[11px] text-slate-600">
                  CV, Zeugnisse & Unterlagen im Dokumenten-Center.
                </p>
              </div>
            </div>

            {/* Schritt 3: Jobs durchsuchen */}
            <div
              className={
                stepBase +
                " " +
                (profileComplete && isReviewedOrEligible
                  ? stepCurrent
                  : stepUpcoming)
              }
            >
              <div
                className={
                  circleBase +
                  " " +
                  (profileComplete && isReviewedOrEligible
                    ? "bg-sky-600 text-white"
                    : "bg-slate-300 text-slate-700")
                }
              >
                3
              </div>
              <div>
                <p className="font-semibold">Jobs durchsuchen</p>
                <p className="text-[11px] text-slate-600">
                  Passende Stellen filtern & ansehen.
                </p>
              </div>
            </div>

            {/* Schritt 4: Bewerben */}
            <div
              className={
                stepBase +
                " " +
                (hasApplications ? stepDone : stepUpcoming)
              }
            >
              <div
                className={
                  circleBase +
                  " " +
                  (hasApplications
                    ? "bg-emerald-500 text-white"
                    : "bg-slate-300 text-slate-700")
                }
              >
                4
              </div>
              <div>
                <p className="font-semibold">Bewerben</p>
                <p className="text-[11px] text-slate-600">
                  Bewerbungen abschicken & Status verfolgen.
                </p>
              </div>
            </div>
          </div>

          {/* Status-Badge */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-600">Aktueller Status:</span>
            <span
              className={
                "inline-flex items-center gap-1 px-2 py-1 rounded-full border text-[11px] " +
                statusClass
              }
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              {statusLabel}
            </span>
          </div>
        </section>

        {/* Profil-Section */}
        <section className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <h2 className="text-lg font-semibold mb-2 text-slate-900">
            Profil
          </h2>
          <p className="text-sm text-slate-700">
            Name: {profile.first_name} {profile.last_name}
          </p>
          <p className="text-sm text-slate-700">
            Herkunftsland: {profile.country_of_origin || "–"}
          </p>
          <p className="text-sm text-slate-700">
            Zielland: {profile.target_country || "–"}
          </p>
        </section>

        {/* Dokumenten-Center */}
        <section className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-slate-900">
              Dokumenten-Center
            </h2>
          </div>
          <p className="text-xs text-slate-700 mb-3">
            Lade hier deine{" "}
            <span className="font-semibold">CVs, Zeugnisse, Zertifikate</span>{" "}
            und andere relevante Unterlagen hoch. Diese Dokumente werden für die
            interne Prüfung und spätere Vermittlung genutzt.
          </p>

          <DocumentManager />
        </section>

        {/* CV-Generator */}
        <section className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <h2 className="text-lg font-semibold mb-2 text-slate-900">
            CV-Generator
          </h2>
          <p className="text-xs text-slate-700 mb-3">
            Wähle deine Branche, ein Layout-Template und generiere automatisch
            einen CV als PDF. Der fertige CV wird im Dokumenten-Center
            gespeichert und kann später bei Bewerbungen genutzt werden.
          </p>

          {generatorError && (
            <div className="text-sm text-red-800 bg-red-50 border border-red-200 rounded px-3 py-2 mb-3">
              {generatorError}
            </div>
          )}
          {generatorMessage && (
            <div className="text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded px-3 py-2 mb-3">
              {generatorMessage}
            </div>
          )}

          {/* Branche & Templates */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="md:col-span-1">
              <label className="block text-xs font-medium text-slate-800 mb-1">
                Branche
              </label>
              <select
                value={cvIndustry}
                onChange={(e) => setCvIndustry(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#5BE1E6] focus:border-[#5BE1E6]"
              >
                <option value="">Bitte auswählen</option>
                <option value="nursing">Pflege / Medizin</option>
                <option value="it">IT / Tech</option>
                <option value="hospitality">Gastronomie / Hotel</option>
                <option value="logistics">Logistik / Transport</option>
                <option value="general">Allgemein</option>
              </select>
              <p className="text-[11px] text-slate-500 mt-1">
                Die Auswahl hilft, ein passendes Layout für dein Profil zu
                finden.
              </p>
            </div>

            {/* Template-Auswahl */}
            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-slate-800">
                  Verfügbare Templates
                </span>
                {templatesLoading && (
                  <span className="text-[11px] text-slate-500">
                    Lade Templates...
                  </span>
                )}
              </div>

              {templatesError && (
                <div className="text-[11px] text-red-700 bg-red-50 border border-red-200 rounded px-2 py-1 mb-1">
                  {templatesError}
                </div>
              )}

              {!templatesLoading && cvIndustry && cvTemplates.length === 0 && !templatesError && (
                <p className="text-[11px] text-slate-500">
                  Für diese Branche sind aktuell noch keine Templates hinterlegt.
                </p>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                {cvTemplates.map((tpl) => {
                  const selected = tpl.id === selectedTemplateId;
                  return (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => setSelectedTemplateId(tpl.id)}
                      className={
                        "text-left rounded-lg border px-3 py-2 text-xs transition " +
                        (selected
                          ? "border-sky-500 bg-sky-50"
                          : "border-slate-200 bg-slate-50 hover:border-sky-300")
                      }
                    >
                      <div className="font-semibold text-slate-900">
                        {tpl.name}
                      </div>
                      {tpl.description && (
                        <div className="text-[11px] text-slate-600 mt-0.5">
                          {tpl.description}
                        </div>
                      )}
                      <div className="text-[10px] text-slate-400 mt-1">
                        Layout: {tpl.layout_type} · Sprache:{" "}
                        {tpl.language.toUpperCase()}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Optionale Overrides */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-slate-800 mb-1">
                Überschrift / Berufsziel (optional)
              </label>
              <input
                type="text"
                value={headlineOverride}
                onChange={(e) => setHeadlineOverride(e.target.value)}
                placeholder="z.B. Pflegefachkraft mit internationaler Erfahrung"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5BE1E6] focus:border-[#5BE1E6]"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Wenn leer, nutzt PROLINKED dein Profil bzw. eine Standardzeile.
              </p>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-800 mb-1">
                Kurzprofil / Zusammenfassung (optional)
              </label>
              <textarea
                value={summaryOverride}
                onChange={(e) => setSummaryOverride(e.target.value)}
                rows={3}
                placeholder="Kurze Beschreibung deines Profils (Stärken, Erfahrung, Ziel in Deutschland)."
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5BE1E6] focus:border-[#5BE1E6]"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleGenerateCv}
            disabled={generatingCv || !selectedTemplateId}
            className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[#5BE1E6]"
          >
            {generatingCv ? "CV wird generiert..." : "CV als PDF generieren"}
          </button>
          <p className="text-[11px] text-slate-500 mt-2">
            Der generierte CV erscheint automatisch im Dokumenten-Center (Typ:
            CV) und kann später bei Bewerbungen ausgewählt werden.
          </p>
        </section>

        {/* Video-Tutorials & Guides */}
        <section className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <h2 className="text-lg font-semibold mb-2 text-slate-900">
            Video-Tutorials & Schritt-für-Schritt-Guides
          </h2>
          <p className="text-xs text-slate-700 mb-3">
            In diesem Bereich werden dir (vorerst als Übersicht) die wichtigsten
            Schritte erklärt. Später können hier Video-Links oder integrierte
            Lernmodule erscheinen.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
              <p className="font-semibold text-slate-900 mb-1">
                Schritt 1: Profil & Dokumente
              </p>
              <ul className="list-disc list-inside text-slate-700 space-y-1">
                <li>Profil vollständig ausfüllen</li>
                <li>CV & Zeugnisse im Dokumenten-Center hochladen</li>
                <li>Sprachzertifikate (falls vorhanden) ergänzen</li>
              </ul>
            </div>

            <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
              <p className="font-semibold text-slate-900 mb-1">
                Schritt 2: Interne Prüfung
              </p>
              <ul className="list-disc list-inside text-slate-700 space-y-1">
                <li>PROLINKED-Team prüft deine Unterlagen</li>
                <li>Status wechselt von „Neu“ → „Geprüft“ → „Vermittelbar“</li>
                <li>Bei Rückfragen melden wir uns direkt bei dir</li>
              </ul>
            </div>

            <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
              <p className="font-semibold text-slate-900 mb-1">
                Schritt 3: Jobs & Vermittlung
              </p>
              <ul className="list-disc list-inside text-slate-700 space-y-1">
                <li>Jobs in deinem Zielland ansehen</li>
                <li>Bewerben über PROLINKED oder direkte Empfehlung</li>
                <li>Status deiner Bewerbungen im Dashboard verfolgen</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Bewerbungen */}
        <section className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <h2 className="text-lg font-semibold mb-3 text-slate-900">
            Meine Bewerbungen
          </h2>

          {appsError && (
            <p className="text-sm text-red-800 bg-red-50 border border-red-200 rounded px-3 py-2 mb-2">
              {appsError}
            </p>
          )}

          {loadingApps && (
            <p className="text-sm text-slate-700">
              Bewerbungen werden geladen...
            </p>
          )}

          {!loadingApps &&
            applications.length === 0 &&
            !appsError && (
              <p className="text-sm text-slate-700">
                Noch keine Bewerbungen vorhanden.
              </p>
            )}

          {!loadingApps && applications.length > 0 && (
            <ul className="divide-y divide-slate-200 mt-2">
              {applications.map((app) => (
                <li key={app.id} className="py-2 text-sm">
                  <div className="font-medium text-slate-900">
                    {app.job?.title}
                  </div>
                  <div className="text-slate-700">
                    {app.job?.employer?.company_name ||
                      "Unbekannter Arbeitgeber"}{" "}
                    – {app.job?.location || "Ort n/a"}
                  </div>
                  <div className="text-slate-500 text-xs">
                    Status: {app.status} – Erstellt am:{" "}
                    {new Date(app.created_at).toLocaleString()}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
