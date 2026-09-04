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
        <div className="text-[11px] font-bold text-spc-mid uppercase tracking-widest mb-1">Phase 2 · Wettkampf steuern</div>
        <h1 className="text-2xl sm:text-3xl font-bold text-spc-dark tracking-tight">{comp.name}</h1>
        <p className="text-[14px] text-ink-2 mt-1 max-w-[56ch]">
          Status: <strong className="text-spc-dark">{STATUS_LABEL[comp.status] ?? comp.status}</strong> — Fänge und Strafen korrigieren, Wettkampfuhr steuern, Pause verlängern.
        </p>
      </section>

      {/* Wettkampf-Steuerung */}
      <div className="bg-white rounded-3xl p-5 shadow-cs-sm mb-3">
        <div className="text-[11px] uppercase tracking-widest text-spc-mid font-bold">Wettkampfuhr</div>
        <div className="text-[19px] font-bold text-spc-dark mt-0.5 mb-3">Starten · Pausieren · Fortsetzen · Beenden</div>
        <WettkampfSteuerung competitionId={comp.id} status={comp.status} />
      </div>

      {/* Pause-Fenster */}
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
                    {new Date(p.occurred_at).toLocaleString("de-DE")} · {p.penalty_type === "abriss" ? "−20 Pkt" : "10 Min Sperre"}
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
