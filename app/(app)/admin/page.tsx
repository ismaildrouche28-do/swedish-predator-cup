import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { getActiveCompetition, getPrepCompetition, getLatestCompetition } from "@/lib/queries";
import { KpiCard } from "@/components/KpiCard";
import { ProfileActions, CreateProfileForm, AdminLogoutButton, PresetProfilesButton } from "./AdminClient";
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
        href="/admin/wettkampf-neu"
        actionLabel={focusComp?.status === "prep" ? "Vorbereitung fortsetzen" : "Öffnen"}
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

      {/* Archiv */}
      <div className="bg-white rounded-3xl p-5 shadow-cs-sm">
        <div className="text-[11px] uppercase tracking-widest text-spc-mid font-bold">Archiv</div>
        <div className="text-[19px] font-bold text-spc-dark">Alle Wettkämpfe</div>
        <p className="text-[13px] text-ink-3 mt-0.5 mb-3">Klick auf einen Eintrag, um Fänge zu bearbeiten oder die Uhr zu steuern.</p>
        <div className="space-y-1.5">
          {(comps ?? []).map((c: any) => (
            <Link key={c.id} href={`/admin/wettkampf?id=${c.id}`}
              className="grid grid-cols-[64px_1fr_100px_auto] gap-3 items-center bg-spc-greyLight rounded-xl px-3 py-2.5 hover:bg-spc-lighter/40 transition">
              <div className="text-[16px] font-bold text-spc-mid num">{c.start_at ? new Date(c.start_at).getFullYear() : "—"}</div>
              <div className="min-w-0">
                <div className="text-[14.5px] font-bold text-spc-dark truncate">{c.name}</div>
                <div className="text-[12px] text-ink-3 truncate">{c.location ?? "—"}</div>
              </div>
              <div className={`text-[10px] font-bold px-2 py-1 rounded text-center uppercase tracking-widest ${STATUS_STYLE[c.status]}`}>{STATUS_LABEL[c.status] ?? c.status}</div>
              <div className="text-spc-mid font-bold">›</div>
            </Link>
          ))}
          {(comps ?? []).length === 0 && (
            <div className="text-[13.5px] text-ink-3 italic py-3">
              Noch keine Wettkämpfe. Fang in <Link href="/admin/wettkampf-neu" className="text-spc-mid font-semibold hover:underline">Phase 1</Link> an.
            </div>
          )}
        </div>
      </div>
    </div>
  );
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
