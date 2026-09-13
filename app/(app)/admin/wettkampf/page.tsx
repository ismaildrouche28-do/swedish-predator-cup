import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { WettkampfSteuerung, CatchEditor, PenaltyForm, PauseWindow, DeletePenaltyButton } from "./AdminCatches";
import Link from "next/link";

export const dynamic = "force-dynamic";
const SPECIES: any = { perch: "Barsch", zander: "Zander", pike: "Hecht" };
const STATUS_LABEL: any = { prep: "Vorbereitung", running: "läuft", paused: "pausiert", finished: "beendet" };

export default async function EditWettkampf({ searchParams }: { searchParams: { id?: string } }) {
  requireAdmin();
  if (!searchParams.id) return (
    <div className="p-10 max-w-lg mx-auto text-center">
      <div className="text-[15px] text-ink-3">Kein Wettkampf ausgewählt.</div>
      <Link href="/admin" className="inline-block mt-4 px-4 py-2.5 rounded-xl bg-spc-dark text-white font-bold text-[13.5px]">← zum Admin</Link>
    </div>
  );

  const [{ data: comp }, { data: catches }, { data: penalties }, { data: users }, { data: members }] = await Promise.all([
    supabaseAdmin.from("competitions").select("*").eq("id", searchParams.id).maybeSingle(),
    supabaseAdmin.from("catches").select("*").eq("competition_id", searchParams.id).order("caught_at", { ascending: false }),
    supabaseAdmin.from("penalties").select("*, users(name, nickname)").eq("competition_id", searchParams.id).order("occurred_at", { ascending: false }),
    supabaseAdmin.from("users").select("id, name, nickname, is_admin, is_active"),
    supabaseAdmin.from("boat_members").select("user_id, boats!inner(competition_id)").eq("boats.competition_id", searchParams.id),
  ]);

  if (!comp) return <div className="p-10">Wettkampf nicht gefunden.</div>;
  const usersById = new Map((users ?? []).map(u => [u.id, u]));
  const participantIds = new Set((members ?? []).map((m: any) => m.user_id));
  const participants = (users ?? [])
    .filter((u: any) => participantIds.has(u.id) && !u.is_admin)
    .map((u: any) => ({ id: u.id, label: u.nickname ?? u.name }));

  return (
    <div>
      <Link href="/admin" className="inline-flex items-center gap-1 text-[13px] text-spc-mid font-semibold mb-3">← Admin</Link>

      <section className="bg-cs-section rounded-3xl p-5 mb-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="text-[11px] font-bold text-spc-mid uppercase tracking-widest mb-1">Wettkampf steuern</div>
            <h1 className="text-2xl sm:text-3xl font-bold text-spc-dark tracking-tight">{comp.name}</h1>
            <p className="text-[14px] text-ink-2 mt-1 max-w-[56ch]">
              Status: <strong className="text-spc-dark">{STATUS_LABEL[comp.status] ?? comp.status}</strong>
              {comp.status === "prep"
                ? " — Wettkampf ist vorbereitet. Klick unten auf Wettkampf starten."
                : " — Fänge und Strafen korrigieren, Wettkampfuhr steuern, Pause verlängern."}
            </p>
          </div>
          {comp.status === "prep" && (
            <Link href={`/admin/wettkampf-neu?id=${comp.id}`}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white text-spc-dark text-[13px] font-semibold shadow-cs-sm hover:bg-spc-lighter/40 transition">
              ← Konfiguration bearbeiten
            </Link>
          )}
        </div>
      </section>

      {/* Wettkampf-Steuerung */}
      <div className="bg-white rounded-3xl p-5 shadow-cs-sm mb-3">
        <div className="text-[11px] uppercase tracking-widest text-spc-mid font-bold">Wettkampfuhr</div>
        <div className="text-[19px] font-bold text-spc-dark mt-0.5 mb-3">
          {comp.status === "prep" ? "Wettkampf jetzt starten" : "Starten · Pausieren · Fortsetzen · Beenden"}
        </div>
        <WettkampfSteuerung competitionId={comp.id} status={comp.status} />
      </div>

      {/* Geplante Zeiten (Read-only Zusammenfassung der bereits im Setup erfassten Werte) */}
      <PlannedTimesCard comp={comp} competitionCalls={await getCallsSummary(comp.id)} />

      {/* Pause-Fenster (Pausen-Ende live anpassbar) */}
      <div className="bg-white rounded-3xl p-5 shadow-cs-sm mb-3">
        <div className="text-[11px] uppercase tracking-widest text-spc-mid font-bold">Pause / Timeout</div>
        <div className="text-[19px] font-bold text-spc-dark mt-0.5 mb-3">Pausenzeit steuern</div>
        <PauseWindow competitionId={comp.id} pauseStart={comp.pause_start ?? null} pauseEnd={comp.pause_end ?? null} />
      </div>

      {/* Strafen setzen */}
      <div className="bg-white rounded-3xl p-5 shadow-cs-sm mb-3">
        <div className="text-[11px] uppercase tracking-widest text-spc-mid font-bold">Strafen</div>
        <div className="text-[19px] font-bold text-spc-dark mt-0.5 mb-3">Strafe setzen</div>
        {participants.length === 0 ? (
          <div className="text-[13.5px] text-ink-3 italic">Noch keine Teilnehmer zugewiesen — erst in Phase 1 die Boote füllen.</div>
        ) : (
          <PenaltyForm competitionId={comp.id} users={participants} />
        )}

        {(penalties ?? []).length > 0 && (
          <div className="mt-4 space-y-1.5">
            <div className="text-[11px] uppercase tracking-widest text-ink-3 font-bold mb-1">Bereits erfasste Strafen</div>
            {(penalties ?? []).map((p: any) => (
              <div key={p.id} className="grid grid-cols-[1fr_auto] gap-3 items-center bg-danger/10 rounded-xl px-3 py-2">
                <div>
                  <div className="text-[14px] font-bold text-spc-dark">
                    {p.penalty_type === "abriss" ? "Abriss" : "Handling"} · {p.users?.nickname ?? p.users?.name ?? "?"}
                  </div>
                  <div className="text-[11.5px] text-ink-3">
                    {new Date(p.occurred_at).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Berlin" })} · {p.penalty_type === "abriss" ? "−20 Pkt" : "10 Min Sperre"}
                  </div>
                </div>
                <DeletePenaltyButton id={p.id} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Fänge korrigieren */}
      <div className="bg-white rounded-3xl p-5 shadow-cs-sm mb-3">
        <div className="text-[11px] uppercase tracking-widest text-spc-mid font-bold">Fänge</div>
        <div className="text-[19px] font-bold text-spc-dark mt-0.5 mb-1">Fänge korrigieren</div>
        <p className="text-[13px] text-ink-3 mb-3">✎ zum Bearbeiten, 🗑 zum Löschen. Änderungen fließen sofort in die Wertung ein.</p>
        <div className="space-y-1.5">
          {(catches ?? []).length === 0 && <div className="text-[13.5px] text-ink-3 italic py-3">Keine Fänge im Wettkampf.</div>}
          {(catches ?? []).map((c: any) => {
            const u = usersById.get(c.user_id);
            return (
              <CatchEditor key={c.id} c={c} userName={u?.nickname ?? u?.name ?? "?"} />
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Alle vorhandenen Calls fuer die Uebersicht laden (inkl. Nickname und Boot-Label).
// Nur Lese-Query — keine Aenderung an der Wettkampfsteuerungslogik.
async function getCallsSummary(competitionId: string) {
  const { data } = await supabaseAdmin
    .from("calls")
    .select("id, start_at, end_at, call_type, user_id, boat_id, users(name, nickname), boats(label)")
    .eq("competition_id", competitionId)
    .order("start_at");
  return data ?? [];
}

// Read-only Karte mit ALLEN bereits im Wettkampf hinterlegten geplanten Zeiten:
// Angelstart, Angelende, Gesamtdauer, Pause, Call-Ueberblick pro Boot.
// Nichts hier ist editierbar — bearbeiten passiert weiterhin im Setup bzw. via
// „Konfiguration bearbeiten" / PauseWindow oben.
function PlannedTimesCard({ comp, competitionCalls }: { comp: any; competitionCalls: any[] }) {
  const TZ = "Europe/Berlin";
  const fmtT  = (v: any) => v ? new Date(v).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit", timeZone: TZ }) : "—";
  const fmtDT = (v: any) => v ? new Date(v).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: TZ }) : "—";
  const fmtDate = (v: any) => v ? new Date(v).toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric", timeZone: TZ }) : "—";
  const fmtDur = (ms: number) => {
    const min = Math.max(0, Math.round(ms / 60000));
    const h = Math.floor(min / 60);
    const m = min % 60;
    return m === 0 ? `${h} h` : `${h} h ${m} min`;
  };

  const startMs = comp.start_at ? +new Date(comp.start_at) : null;
  const endMs   = comp.end_at   ? +new Date(comp.end_at)   : null;
  const pStart  = comp.pause_start ? +new Date(comp.pause_start) : null;
  const pEnd    = comp.pause_end   ? +new Date(comp.pause_end)   : null;
  const totalMs = (startMs != null && endMs != null && endMs > startMs) ? endMs - startMs : 0;
  const pauseMs = (pStart != null && pEnd != null && pEnd > pStart) ? pEnd - pStart : 0;
  const effMs   = Math.max(0, totalMs - pauseMs);

  const CALL_LABEL: any = { morning: "Morning Call", mid: "Mid Call", late: "Late Call" };
  // Calls pro Boot gruppieren
  const byBoat = new Map<string, { label: string; rows: any[] }>();
  for (const c of competitionCalls) {
    const b = c.boat_id;
    const label = (c as any).boats?.label ?? "Boot";
    if (!byBoat.has(b)) byBoat.set(b, { label, rows: [] });
    byBoat.get(b)!.rows.push(c);
  }

  return (
    <div className="bg-white rounded-3xl p-5 shadow-cs-sm mb-3">
      <div className="text-[11px] uppercase tracking-widest text-spc-mid font-bold">Geplante Wettkampfzeiten</div>
      <div className="text-[19px] font-bold text-spc-dark mt-0.5 mb-1">Alle vorgesehenen Zeiten im Überblick</div>
      <p className="text-[12.5px] text-ink-3 mb-3">
        Bereits im Setup hinterlegt. Bearbeiten unter <em>„Konfiguration bearbeiten"</em>. Die Pause kann unten separat verlängert werden.
      </p>

      {/* Basis-Fakten */}
      <div className="grid sm:grid-cols-2 gap-2 mb-3">
        <SummaryPill label="Datum">{fmtDate(comp.start_at)}</SummaryPill>
        <SummaryPill label="Ort">{comp.location ?? "—"}</SummaryPill>
        <SummaryPill label="Angelstart">{fmtT(comp.start_at)} Uhr</SummaryPill>
        <SummaryPill label="Angelende">{fmtT(comp.end_at)} Uhr</SummaryPill>
        <SummaryPill label="Pause ab">{comp.pause_start ? `${fmtT(comp.pause_start)} Uhr` : "keine Pause"}</SummaryPill>
        <SummaryPill label="Pause bis">{comp.pause_end ? `${fmtT(comp.pause_end)} Uhr` : "—"}</SummaryPill>
        <SummaryPill label="Wettkampf-Gesamtdauer">{totalMs > 0 ? fmtDur(totalMs) : "—"}</SummaryPill>
        <SummaryPill label="Effektive Call-Zeit">{effMs > 0 ? fmtDur(effMs) : "—"}</SummaryPill>
      </div>

      {/* Manueller Start (real, falls schon gestartet) */}
      {comp.actual_start_at && (
        <div className="grid sm:grid-cols-2 gap-2 mb-3">
          <SummaryPill label="Tatsächlicher Start">{fmtDT(comp.actual_start_at)} Uhr</SummaryPill>
          {comp.paused_at && <SummaryPill label="Aktuell pausiert seit">{fmtDT(comp.paused_at)} Uhr</SummaryPill>}
        </div>
      )}

      {/* Calls pro Boot */}
      {byBoat.size > 0 && (
        <div className="mt-2">
          <div className="text-[11px] uppercase tracking-widest text-ink-3 font-bold mb-2">Calls pro Boot</div>
          <div className="grid sm:grid-cols-2 gap-3">
            {Array.from(byBoat.values()).map(({ label, rows }) => (
              <div key={label} className="bg-spc-greyLight rounded-2xl p-3">
                <div className="text-[10px] uppercase tracking-widest text-spc-mid font-bold mb-2">{label}</div>
                <div className="space-y-1.5">
                  {rows.map((c: any) => {
                    const u = c.users as any;
                    const name = u?.nickname ?? u?.name ?? "—";
                    return (
                      <div key={c.id} className="flex items-center gap-2 text-[13px]">
                        <span className="num font-semibold text-spc-dark shrink-0 min-w-[94px]">
                          {fmtT(c.start_at)}–{fmtT(c.end_at)}
                        </span>
                        <span className="font-semibold text-spc-dark truncate">{name}</span>
                        <span className="text-[11.5px] text-ink-3 ml-auto shrink-0">{CALL_LABEL[c.call_type] ?? c.call_type}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryPill({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-spc-greyLight rounded-xl px-3 py-2">
      <div className="text-[10px] uppercase tracking-widest text-ink-3 font-bold">{label}</div>
      <div className="text-[14.5px] font-bold text-spc-dark num truncate">{children}</div>
    </div>
  );
}
