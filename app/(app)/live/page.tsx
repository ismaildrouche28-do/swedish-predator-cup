import { requireAuth } from "@/lib/auth";
import { getActiveCompetition, getLatestCompetition, getLiveRanking, getCompetitionFull } from "@/lib/queries";
import { supabaseAdmin } from "@/lib/supabase";
import { assignScoredSlots, DEFAULT_SETTINGS } from "@/lib/scoring";
import { LiveClock } from "./LiveClient";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 0;
const SPECIES: any = { perch: "Barsch", zander: "Zander", pike: "Hecht" };

export default async function LivePage() {
  const user = await requireAuth();
  const comp = await getActiveCompetition() ?? await getLatestCompetition();
  if (!comp) return <NoComp />;

  const [ranking, compFull, { data: allCatches }, { data: penaltyRows }] = await Promise.all([
    getLiveRanking(comp.id),
    getCompetitionFull(comp.id),
    supabaseAdmin.from("catches").select("*").eq("competition_id", comp.id).order("caught_at", { ascending: false }),
    supabaseAdmin.from("penalties").select("user_id, penalty_type").eq("competition_id", comp.id),
  ]);

  // Boni + Strafen pro User
  const hasTW = new Set<string>();          // Topwater-Bonus erhalten
  const handlingCount = new Map<string, number>();  // H(!) Anzahl
  const abrissCount   = new Map<string, number>();  // A(!) Anzahl
  for (const c of allCatches ?? []) {
    if (c.topwater && c.is_valid && c.is_scored) hasTW.add(c.user_id);
  }
  for (const p of penaltyRows ?? []) {
    if (p.penalty_type === "handling") handlingCount.set(p.user_id, (handlingCount.get(p.user_id) ?? 0) + 1);
    if (p.penalty_type === "abriss")   abrissCount.set(p.user_id,   (abrissCount.get(p.user_id) ?? 0) + 1);
  }

  // Trend: aktuelles Ranking vs. Ranking OHNE letzten gültigen Fang
  const trendMap = computeTrend(ranking, allCatches ?? []);

  const leader = ranking[0];
  const usersById = new Map(compFull.users.map(u => [u.id, u]));

  // CALLS pro Boot — Ableitung aus compFull.calls (Single Source of Truth aus Setup).
  // Fuer jedes Boot mit konfigurierten Calls berechnen wir:
  //   currentCall = call wo start_at <= now <= end_at
  //   nextCall    = erster call mit start_at > now
  // Zeit-Referenz: falls bereits gestartet, real actual_start_at + acc pause,
  //                sonst planned start (fuer prep-Vorschau).
  const nameFor = (uid: string) => {
    const u = usersById.get(uid);
    return u?.nickname ?? u?.name ?? "—";
  };
  const fmtT = (v: string | Date) => new Date(v).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Berlin" });
  const nowMs = Date.now();

  type BoatCallInfo = {
    boat_id: string;
    boat_label: string;
    hasCalls: boolean;
    currentUser?: string;
    currentUntil?: string;
    nextUser?: string;
    nextStart?: string;
  };
  const boatCalls: BoatCallInfo[] = compFull.boats.map(b => {
    const rows = compFull.calls
      .filter((c: any) => c.boat_id === b.id)
      .sort((a: any, b: any) => +new Date(a.start_at) - +new Date(b.start_at));
    if (rows.length === 0) return { boat_id: b.id, boat_label: b.label, hasCalls: false };

    const curr = rows.find((c: any) => +new Date(c.start_at) <= nowMs && +new Date(c.end_at) >= nowMs);
    const next = rows.find((c: any) => +new Date(c.start_at) > nowMs);
    return {
      boat_id: b.id,
      boat_label: b.label,
      hasCalls: true,
      currentUser: curr ? nameFor(curr.user_id) : undefined,
      currentUntil: curr ? fmtT(curr.end_at) : undefined,
      nextUser:  next ? nameFor(next.user_id) : undefined,
      nextStart: next ? fmtT(next.start_at) : undefined,
    };
  });
  const activeBoats = boatCalls.filter(b => b.hasCalls);

  // Trend-Berechnung: Placeholder (echter Trend braucht historische Snapshots — später)
  return (
    <div>
      {/* HEADER: „AKTUELL VORN" + LIVE-Puls + Countdown */}
      <section className="bg-cs-gradient shadow-cs rounded-3xl p-5 sm:p-6 mb-3 text-white relative overflow-hidden">
        <div className="absolute top-3 right-4 inline-flex items-center gap-1.5 bg-danger/90 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-widest">
          <span className="w-1.5 h-1.5 rounded-full bg-white pulse-dot"/> Live
        </div>
        <div className="text-[10px] font-bold uppercase tracking-widest text-white/70 mb-1">Aktuell vorn</div>
        {leader && (leader.points ?? 0) > 0 ? (
          <>
            <div className="text-[32px] sm:text-[38px] font-bold leading-tight">{leader.nickname ?? leader.display_name}</div>
            <div className="text-[14.5px] text-white/85 mt-0.5">
              <span className="font-bold">{leader.points ?? 0}</span> Punkte · <span className="font-bold">{leader.scored_count ?? 0}</span> Fänge
            </div>
          </>
        ) : (
          <div className="text-[24px] font-bold leading-tight">Noch offen — kein Fang</div>
        )}

        {(comp.start_at && comp.end_at) && (
          <div className="mt-4 pt-3 border-t border-white/20">
            <LiveClock
              startAt={comp.start_at}
              endAt={comp.end_at}
              status={comp.status}
              pauseStart={comp.pause_start}
              pauseEnd={comp.pause_end}
              actualStartAt={comp.actual_start_at}
              pausedAt={comp.paused_at}
              accumulatedPauseMs={comp.accumulated_pause_ms}
              updatedAt={comp.updated_at}
              showStatusPill={false}
            />
          </div>
        )}
      </section>

      {/* CALL-Header: JETZT / NEXT pro Boot, nur Boote mit konfigurierten Calls */}
      {activeBoats.length > 0 && (
        <section className={`grid gap-2.5 mb-3 ${activeBoats.length > 1 ? "sm:grid-cols-2" : ""}`}>
          {activeBoats.map(info => (
            <div key={info.boat_id} className="bg-white rounded-2xl p-4 shadow-cs-sm">
              <div className="text-[10.5px] uppercase tracking-widest text-spc-mid font-bold mb-2">{info.boat_label}</div>
              <div className="grid grid-cols-2 gap-3">
                <div className="min-w-0">
                  <div className="text-[10px] uppercase tracking-widest text-ink-3 font-bold mb-0.5">
                    Call jetzt{info.currentUntil ? ` · bis ${info.currentUntil}` : ""}
                  </div>
                  <div className="text-[15px] font-bold text-spc-dark truncate">
                    {info.currentUser ?? <span className="text-ink-3 font-medium">kein Call</span>}
                  </div>
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] uppercase tracking-widest text-ink-3 font-bold mb-0.5">
                    Call next{info.nextStart ? ` · ab ${info.nextStart}` : ""}
                  </div>
                  <div className="text-[14px] font-semibold text-ink-2 truncate">
                    {info.nextUser ?? <span className="text-ink-3 font-medium">—</span>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* RANKING-Tabelle mit Bonus/Strafe/Trend */}
      <section className="bg-white rounded-3xl overflow-hidden shadow-cs-sm mb-3">
        <div className="px-3 sm:px-5 pt-4 pb-2 grid grid-cols-[32px_minmax(0,1fr)_46px_40px_68px_32px] lg:grid-cols-[42px_1fr_74px_54px_100px_50px] gap-2 sm:gap-3 text-[9.5px] sm:text-[10px] uppercase tracking-widest font-bold text-ink-3">
          <span>#</span><span>Name</span><span className="text-right">Pkt</span><span className="text-right">Fänge</span><span className="text-right">Bonus</span><span className="text-right">Trend</span>
        </div>
        {ranking.length === 0 && <div className="p-10 text-center text-ink-3 text-[14px]">Noch keine Teilnehmer angemeldet.</div>}
        {ranking.map((r: any, idx: number) => {
          const tw = hasTW.has(r.user_id);
          const hc = handlingCount.get(r.user_id) ?? 0;
          const ac = abrissCount.get(r.user_id)   ?? 0;
          const delta = trendMap.get(r.user_id) ?? 0;
          return (
            <Link key={r.user_id} href={`/spieler/${r.user_id}`}
              className={`grid grid-cols-[32px_minmax(0,1fr)_46px_40px_68px_32px] lg:grid-cols-[42px_1fr_74px_54px_100px_50px] gap-2 sm:gap-3 items-center px-3 sm:px-5 py-3 border-t border-black/[0.04] hover:bg-spc-greyLight transition ${r.user_id === user.id ? "bg-spc-lighter/60" : ""}`}>
              <Medal rank={idx + 1} />
              <div className="min-w-0">
                <div className={`font-bold text-[15px] truncate ${r.user_id === user.id ? "text-spc-dark" : "text-ink"}`}>
                  {r.nickname ?? r.display_name} {r.user_id === user.id && <span className="text-ink-3 font-normal text-[12.5px]">(Du)</span>}
                </div>
                <div className="text-[11.5px] text-ink-3 truncate">
                  {r.last_catch_at ? new Date(r.last_catch_at).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Berlin" }) : "—"}
                </div>
              </div>
              <div className={`text-right text-[20px] font-bold num ${r.user_id === user.id ? "text-spc-mid" : "text-ink"}`}>{r.points ?? 0}</div>
              <div className="text-right text-[12.5px] text-ink-3 num font-semibold">{r.scored_count ?? 0}/6</div>
              <div className="flex flex-wrap items-center justify-end gap-1">
                {tw   && <BonusChip label="TW"    kind="ok" />}
                {hc   > 0 && <BonusChip label={hc > 1 ? `H(!) ×${hc}` : "H(!)"} kind="bad" />}
                {ac   > 0 && <BonusChip label={ac > 1 ? `A(!) ×${ac}` : "A(!)"} kind="bad" />}
                {!tw && hc === 0 && ac === 0 && <span className="text-ink-4 text-[12px]">—</span>}
              </div>
              <TrendArrow delta={delta} />
            </Link>
          );
        })}
      </section>

    </div>
  );
}

function Medal({ rank }: { rank: number }) {
  const styles = ["","bg-gradient-to-br from-amber-300 to-amber-500 text-amber-950 shadow-sm",
                  "bg-gradient-to-br from-gray-200 to-gray-400 text-gray-700",
                  "bg-gradient-to-br from-orange-300 to-orange-500 text-white"];
  const cls = styles[rank] ?? "bg-spc-greyLight text-ink-3";
  return <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-[14px] num ${cls}`}>{rank}</div>;
}

function BonusChip({ label, kind }: { label: string; kind: "ok" | "bad" }) {
  const cls = kind === "ok"
    ? "bg-success text-white"
    : "bg-danger text-white";
  return <span className={`inline-block ${cls} text-[10px] px-1.5 py-0.5 rounded font-bold leading-none tracking-tight`}>{label}</span>;
}

function TrendArrow({ delta }: { delta: number }) {
  // Nur anzeigen wenn tatsächliche Positionsveränderung — sonst leer
  if (delta === 0) return <div />;
  const up = delta > 0;
  return (
    <div className={`text-right text-[12px] font-bold num ${up ? "text-success" : "text-danger"} inline-flex items-center justify-end gap-0.5`}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        {up ? <path d="M12 19V5M5 12l7-7 7 7"/> : <path d="M12 5v14M19 12l-7 7-7-7"/>}
      </svg>
      {Math.abs(delta)}
    </div>
  );
}

// Trend: aktuelle Rangliste vs. Rangliste OHNE den letzten gültigen Fang.
// Vergleicht auf Basis der scored-Punkte pro User (Strafen sind statisch → verändern die Reihenfolge nicht).
function computeTrend(currentRanking: any[], allCatches: any[]): Map<string, number> {
  const map = new Map<string, number>();
  const validCatches = (allCatches ?? []).filter((c: any) => c.is_valid);
  if (validCatches.length === 0) return map;

  const latest = validCatches[0]; // allCatches ist bereits caught_at DESC sortiert
  const scoredPointsPer = (excludeId: string | null) => {
    const byUser: Record<string, any[]> = {};
    for (const c of validCatches) {
      if (excludeId && c.id === excludeId) continue;
      (byUser[c.user_id] ||= []).push(c);
    }
    const out = new Map<string, number>();
    for (const uid of Object.keys(byUser)) {
      const scored = assignScoredSlots(byUser[uid] as any, DEFAULT_SETTINGS);
      out.set(uid, scored.filter(c => c.is_scored).reduce((s, c) => s + (c.total_points ?? 0), 0));
    }
    return out;
  };

  const curr = scoredPointsPer(null);
  const prev = scoredPointsPer(latest.id);
  const users = new Set(currentRanking.map(r => r.user_id));
  for (const uid of Array.from(prev.keys())) users.add(uid);
  for (const uid of Array.from(curr.keys())) users.add(uid);

  const currList = Array.from(users).map(uid => ({ uid, p: curr.get(uid) ?? 0 })).sort((a, b) => b.p - a.p);
  const prevList = Array.from(users).map(uid => ({ uid, p: prev.get(uid) ?? 0 })).sort((a, b) => b.p - a.p);
  const currRank = new Map(currList.map((r, i) => [r.uid, i]));
  const prevRank = new Map(prevList.map((r, i) => [r.uid, i]));
  for (const uid of Array.from(users)) {
    const c = currRank.get(uid) ?? 0;
    const p = prevRank.get(uid) ?? c;
    map.set(uid, p - c); // >0 = nach oben gerückt
  }
  return map;
}



function NoComp() {
  return <div className="bg-white rounded-3xl p-10 text-center shadow-cs-sm"><div className="text-5xl mb-3">📊</div><div className="text-[20px] font-bold text-spc-dark mb-2">Noch kein Wettkampf</div><p className="text-ink-3 text-[14px]">Sobald der erste SPC läuft, siehst du hier die Live-Rangliste.</p></div>;
}
