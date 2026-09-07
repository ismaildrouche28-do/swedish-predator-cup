import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { getActiveCompetition, getPrepCompetition, getLatestCompetition } from "@/lib/queries";
import { KpiCard } from "@/components/KpiCard";
import { ProfileActions, CreateProfileForm, AdminLogoutButton, PresetProfilesButton, DeleteCompetitionButton } from "./AdminClient";
import Link from "next/link";

export const dynamic = "force-dynamic";

const STATUS_LABEL: any = { prep: "Vorbereitung", running: "läuft", paused: "pausiert", finished: "beendet" };
const STATUS_STYLE: any = {
  prep:     "bg-spc-lighter text-spc-dark",
  running:  "bg-success/15 text-success-dark",
  paused:   "bg-spc-gold/20 text-spc-goldDeep",
  finished: "bg-ink-4/20 text-ink-2",
};

export default async function AdminPage() {
  requireAdmin();
  const [{ data: users }, { data: comps }, { count: totalCatches }, active, prep, latest] = await Promise.all([
    supabaseAdmin.from("users").select("*").order("name"),
    supabaseAdmin.from("competitions").select("*").order("created_at", { ascending: false }),
    supabaseAdmin.from("catches").select("id", { count: "exact", head: true }),
    getActiveCompetition(),
    getPrepCompetition(),
    getLatestCompetition(),
  ]);

  const focusComp = active ?? prep ?? latest;
  const teilnehmer = (users ?? []).filter((u: any) => u.is_active && !u.is_admin);
  // Phase 2 ist nur sinnvoll, wenn ein Wettkampf läuft oder pausiert ist
  const controlUrl = focusComp ? `/admin/wettkampf?id=${focusComp.id}` : `/admin/wettkampf`;

  return (
    <div>
      {/* Header */}
      <section className="bg-cs-gradient shadow-cs rounded-3xl p-5 mb-4 text-white">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-widest text-white/70 mb-1">Admin</div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Verwaltung</h1>
          </div>
          <AdminLogoutButton />
        </div>
        <p className="text-[14px] text-white/80 mt-1 max-w-[56ch]">
          Klare Trennung zwischen Wettkampf vorbereiten und laufenden Wettkampf steuern.
        </p>
      </section>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-4">
        <KpiCard label="Teilnehmer aktiv" value={teilnehmer.length} accent />
        <KpiCard label="Wettkämpfe" value={(comps ?? []).length} />
        <KpiCard label="Fänge insgesamt" value={totalCatches ?? 0} />
        <KpiCard label="Aktueller Status" value={focusComp ? STATUS_LABEL[focusComp.status] : "—"} success={focusComp?.status === "running"} />
      </div>

      {/* PHASE 1: Wettkampf erstellen und vorbereiten */}
      <PhaseCard
        step="Phase 1"
        title="Wettkampf erstellen und vorbereiten"
        href="/admin/wettkampf-neu?new=1"
        actionLabel="Neuen Wettkampf anlegen"
        variant="dark"
        bullets={[
          "Einen neuen Wettkampf erstellen",
          "Teilnehmer für den Wettkampf auswählen",
          "Teilnehmer den Booten A oder B zuweisen",
          "Calls automatisch oder manuell vergeben",
          "Wettkampfzeit: Datum, Start, Ende, Pause",
        ]}
      />

      {/* PHASE 2: Wettkampf steuern und korrigieren */}
      <PhaseCard
        step="Phase 2"
        title="Wettkampf steuern und korrigieren"
        href={controlUrl}
        actionLabel={focusComp ? "Öffnen" : "Erst Wettkampf vorbereiten"}
        disabled={!focusComp}
        variant="light"
        bullets={[
          "Falsch eingetragene Fänge korrigieren",
          "Strafen setzen oder korrigieren",
          "Wettkampf pausieren und fortsetzen",
          "Pause bei Bedarf verlängern",
          "Wettkampfkorrekturen während des Spiels",
        ]}
      />

      {/* Aktueller Wettkampf im Fokus */}
      {focusComp && (
        <div className="bg-white rounded-3xl p-5 shadow-cs-sm mb-3">
          <div className="text-[11px] uppercase tracking-widest text-spc-mid font-bold">Aktueller Wettkampf</div>
          <div className="flex flex-wrap items-baseline gap-2 mt-1">
            <div className="text-[19px] font-bold text-spc-dark">{focusComp.name}</div>
            <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-widest ${STATUS_STYLE[focusComp.status]}`}>{STATUS_LABEL[focusComp.status]}</span>
          </div>
          <div className="text-[13px] text-ink-3 mt-0.5">
            {focusComp.location ?? "—"} · {focusComp.start_at ? new Date(focusComp.start_at).toLocaleString("de-DE") : "—"}
          </div>
        </div>
      )}

      {/* Profile-Verwaltung */}
      <div className="bg-white rounded-3xl p-5 shadow-cs-sm mb-3">
        <div className="text-[11px] uppercase tracking-widest text-spc-mid font-bold">Profile</div>
        <div className="text-[19px] font-bold text-spc-dark">Teilnehmer & Admin-Profile</div>
        <p className="text-[13px] text-ink-3 mt-0.5 mb-3">Jeder Teilnehmer bekommt ein Profil. Erscheint in der Profil-Auswahl nach dem PIN-Login.</p>
        <CreateProfileForm />
        <PresetProfilesButton />

        <div className="mt-4 space-y-1.5">
          <div className="text-[11px] uppercase tracking-widest text-ink-3 font-bold mb-1">Alle Profile ({(users ?? []).length})</div>
          {(users ?? []).map((u: any) => (
            <div key={u.id} className={`grid grid-cols-[40px_1fr_auto] gap-3 items-center rounded-xl px-3 py-2.5 ${u.is_active ? "bg-spc-greyLight" : "bg-spc-greyLight opacity-60"}`}>
              <div className="w-9 h-9 rounded-full overflow-hidden bg-spc-mid text-white flex items-center justify-center font-bold text-[13px]">
                {u.avatar_url ? <img src={u.avatar_url} alt="" className="w-full h-full object-cover"/> : (u.nickname ?? u.name).slice(0,1).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="text-[14.5px] font-bold text-spc-dark truncate">
                  {u.nickname ?? u.name}
                  {u.is_admin && <span className="ml-1.5 inline-block bg-spc-gold/25 text-spc-goldDeep text-[9.5px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Admin</span>}
                  {!u.is_active && <span className="ml-1.5 inline-block bg-danger/20 text-danger text-[9.5px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Inaktiv</span>}
                </div>
                <div className="text-[11.5px] text-ink-3 truncate">{u.email ?? "(kein E-Mail)"}</div>
              </div>
              <ProfileActions id={u.id} isActive={u.is_active} />
            </div>
          ))}
        </div>
      </div>

      {/* Wettkampf-Übersicht */}
      <div className="bg-white rounded-3xl p-5 shadow-cs-sm">
        <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
          <div>
            <div className="text-[11px] uppercase tracking-widest text-spc-mid font-bold">Wettkämpfe</div>
            <div className="text-[19px] font-bold text-spc-dark">Übersicht aller Wettkämpfe</div>
            <p className="text-[13px] text-ink-3 mt-0.5">Vorbereitet, laufend und beendet — hier wählst du den Wettkampf zum Konfigurieren, Starten oder Steuern.</p>
          </div>
          <Link href="/admin/wettkampf-neu?new=1"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-spc-dark text-white font-bold text-[13.5px] hover:bg-spc-mid transition shadow-cs-sm shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
            Neuen Wettkampf anlegen
          </Link>
        </div>

        {(comps ?? []).length === 0 ? (
          <div className="text-[13.5px] text-ink-3 italic py-3">
            Noch kein Wettkampf. Klick oben rechts auf <strong className="text-spc-dark font-semibold">„Neuen Wettkampf anlegen"</strong>.
          </div>
        ) : (
          <div className="space-y-1.5">
            {sortForOverview(comps ?? []).map((c: any) => {
              const isPrep = c.status === "prep";
              const isLive = c.status === "running" || c.status === "paused";
              const activeHighlight = isLive
                ? "ring-2 ring-success/40 bg-success/5"
                : "bg-spc-greyLight";
              return (
                <div key={c.id}
                  className={`rounded-xl px-3 py-2.5 transition ${activeHighlight}`}>
                  <div className="grid grid-cols-[48px_minmax(0,1fr)_auto] sm:grid-cols-[64px_minmax(0,1fr)_100px] gap-3 items-center">
                    <div className="text-[16px] font-bold text-spc-mid num">{c.start_at ? new Date(c.start_at).getFullYear() : "—"}</div>
                    <div className="min-w-0">
                      <div className="text-[14.5px] font-bold text-spc-dark truncate">{c.name}</div>
                      <div className="text-[12px] text-ink-3 truncate">
                        {c.location ?? "—"}
                        {c.start_at && <> · {new Date(c.start_at).toLocaleDateString("de-DE")}</>}
                      </div>
                    </div>
                    <div className={`text-[10px] font-bold px-2 py-1 rounded text-center uppercase tracking-widest ${STATUS_STYLE[c.status]}`}>{STATUS_LABEL[c.status] ?? c.status}</div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-2 pl-[60px] sm:pl-[76px]">
                    {isPrep && (
                      <>
                        <Link href={`/admin/wettkampf-neu?id=${c.id}`} className="text-spc-mid text-[12.5px] font-semibold hover:underline">Konfigurieren</Link>
                        <span className="text-ink-4">·</span>
                        <Link href={`/admin/wettkampf?id=${c.id}`} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-success text-white text-[12px] font-bold hover:bg-success/90 transition">
                          Starten ▸
                        </Link>
                      </>
                    )}
                    {isLive && (
                      <Link href={`/admin/wettkampf?id=${c.id}`} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-spc-dark text-white text-[12px] font-bold hover:bg-spc-mid transition">
                        Steuern ›
                      </Link>
                    )}
                    {c.status === "finished" && (
                      <Link href={`/admin/wettkampf?id=${c.id}`} className="text-spc-mid text-[12.5px] font-semibold hover:underline">Ansehen ›</Link>
                    )}
                    <span className="ml-auto">
                      <DeleteCompetitionButton competitionId={c.id} competitionName={c.name ?? ""} />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// Übersichts-Sortierung: erst offene Wettkämpfe (running, paused, prep), dann finished
function sortForOverview(list: any[]): any[] {
  const rank: Record<string, number> = { running: 0, paused: 1, prep: 2, finished: 3 };
  return [...list].sort((a, b) => {
    const ra = rank[a.status] ?? 99;
    const rb = rank[b.status] ?? 99;
    if (ra !== rb) return ra - rb;
    const ta = a.created_at ? +new Date(a.created_at) : 0;
    const tb = b.created_at ? +new Date(b.created_at) : 0;
    return tb - ta;
  });
}

function PhaseCard({ step, title, href, actionLabel, bullets, variant, disabled }: {
  step: string; title: string; href: string; actionLabel: string;
  bullets: string[]; variant: "dark" | "light"; disabled?: boolean;
}) {
  const wrapper = variant === "dark"
    ? "bg-spc-dark text-white"
    : "bg-white text-spc-dark border border-black/[0.06]";
  const kicker = variant === "dark" ? "text-white/70" : "text-spc-mid";
  const body   = variant === "dark" ? "text-white/85" : "text-ink-2";
  const bulletColor = variant === "dark" ? "text-white/90 marker:text-spc-gold" : "text-ink marker:text-spc-mid";
  const buttonCls = disabled
    ? "bg-white/10 text-white/60 cursor-not-allowed"
    : variant === "dark"
      ? "bg-white text-spc-dark hover:bg-white/90"
      : "bg-spc-dark text-white hover:bg-spc-mid";
  return (
    <div className={`rounded-3xl p-5 sm:p-6 shadow-cs-sm mb-3 ${wrapper}`}>
      <div className={`text-[11px] uppercase tracking-widest font-bold ${kicker}`}>{step}</div>
      <h2 className="text-[20px] sm:text-[22px] font-bold mt-0.5 tracking-tight">{title}</h2>
      <ul className={`list-disc pl-5 mt-3 space-y-1 text-[13.5px] ${bulletColor} ${body}`}>
        {bullets.map(b => <li key={b}>{b}</li>)}
      </ul>
      {disabled ? (
        <span className={`inline-block mt-4 px-4 py-2.5 rounded-xl font-bold text-[13.5px] ${buttonCls}`}>{actionLabel}</span>
      ) : (
        <Link href={href} className={`inline-block mt-4 px-4 py-2.5 rounded-xl font-bold text-[13.5px] transition ${buttonCls}`}>
          {actionLabel} →
        </Link>
      )}
    </div>
  );
}
