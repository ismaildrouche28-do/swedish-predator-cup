import { requireAuth } from "@/lib/auth";
import { getActiveCompetition, getLatestCompetition, getLiveRanking, getTopFish, getCurrentCall, getUpcomingCalls, getCompetitionFull } from "@/lib/queries";
import { supabaseAdmin } from "@/lib/supabase";
import { FishPhoto, FishThumb } from "@/components/Icons";
import { LiveClock, TrendCell } from "./LiveClient";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 0;
const SPECIES: any = { perch: "Barsch", zander: "Zander", pike: "Hecht" };

export default async function LivePage() {
  const user = await requireAuth();
  const comp = await getActiveCompetition() ?? await getLatestCompetition();
  if (!comp) return <NoComp />;

  const [ranking, topFish, currentCalls, upcomingAll, compFull, { data: allCatches }] = await Promise.all([
    getLiveRanking(comp.id),
    getTopFish(comp.id),
    getCurrentCall(comp.id),
    getUpcomingCalls(comp.id, 20),
    getCompetitionFull(comp.id),
    supabaseAdmin.from("catches").select("id, user_id, is_scored, topwater, is_valid").eq("competition_id", comp.id),
  ]);

  // Berechne Boni + Strafen pro User für Tabelle
  const bonusMap = new Map<string, number>();     // Anzahl Topwater-Boni (max 1 pro Rolle in UX-Review)
  const penaltyMap = new Map<string, number>();   // Anzahl Strafen
  for (const c of allCatches ?? []) {
    if (c.topwater && c.is_valid && c.is_scored) bonusMap.set(c.user_id, 1); // "Nur einmal möglich" laut UX
  }
  const { data: penaltyRows } = await supabaseAdmin.from("penalties").select("user_id").eq("competition_id", comp.id);
  for (const p of penaltyRows ?? []) penaltyMap.set(p.user_id, (penaltyMap.get(p.user_id) ?? 0) + 1);

  const leader = ranking[0];
  const usersById = new Map(compFull.users.map(u => [u.id, u]));

  // Calls pro Boot: aktueller + nächster
  type CallInfo = { boat_label: string; currentUser?: string; nextUser?: string; nextTime?: string };
  const byBoat = new Map<string, CallInfo>();
  for (const b of compFull.boats) byBoat.set(b.id, { boat_label: b.label });
  for (const c of currentCalls as any[]) {
    const info = byBoat.get(c.boat_id);
    if (info) info.currentUser = c.users?.nickname ?? c.users?.name ?? "—";
  }
  for (const c of upcomingAll as any[]) {
    const info = byBoat.get(c.boat_id);
    if (info && !info.nextUser) {
      info.nextUser = c.users?.nickname ?? c.users?.name ?? "—";
      info.nextTime = new Date(c.start_at).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
    }
  }

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
            <LiveClock startAt={comp.start_at} endAt={comp.end_at} />
          </div>
        )}
      </section>

      {/* CALL-Header: aktuelle + kommende Calls pro Boot */}
      {compFull.boats.length > 0 && (
        <section className="grid sm:grid-cols-2 gap-2.5 mb-3">
          {compFull.boats.map(b => {
            const info = byBoat.get(b.id)!;
            return (
              <div key={b.id} className="bg-white rounded-2xl p-4 shadow-cs-sm">
                <div className="text-[10.5px] uppercase tracking-widest text-spc-mid font-bold mb-1.5">{b.label}</div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-ink-3 font-bold mb-0.5">Jetzt</div>
                    <div className="text-[15px] font-bold text-spc-dark truncate">{info?.currentUser ?? "—"}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-ink-3 font-bold mb-0.5">Next {info?.nextTime && `· ${info.nextTime}`}</div>
                    <div className="text-[14px] font-semibold text-ink-2 truncate">{info?.nextUser ?? "—"}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </section>
      )}

      {/* Top-Fisch dezent */}
      {topFish && (
        <div className="bg-white rounded-2xl px-4 py-2.5 shadow-cs-sm mb-3 relative overflow-hidden flex items-center gap-3">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-spc-gold" />
          <span className="text-[10px] uppercase tracking-widest text-spc-goldDeep font-bold pl-1">Top</span>
          <FishThumb species={topFish.species} size={32} />
          <div className="flex-1 min-w-0 text-[13.5px]">
            <span className="font-bold text-spc-dark">{SPECIES[topFish.species]} {topFish.length_cm} cm</span>
            <span className="text-ink-3 ml-1.5">· {usersById.get(topFish.user_id)?.nickname ?? usersById.get(topFish.user_id)?.name ?? "—"}</span>
          </div>
          <div className="text-[16px] font-bold text-spc-gold num">{topFish.total_points}</div>
        </div>
      )}

      {/* RANKING-Tabelle mit Bonus/Strafe/Trend */}
      <section className="bg-white rounded-3xl overflow-hidden shadow-cs-sm mb-3">
        <div className="px-5 pt-4 pb-2 grid grid-cols-[42px_1fr_60px_50px_60px_44px] lg:grid-cols-[42px_1fr_74px_54px_74px_50px] gap-3 text-[10px] uppercase tracking-widest font-bold text-ink-3">
          <span>#</span><span>Name</span><span className="text-right">Pkt</span><span className="text-right">Fänge</span><span className="text-right">Bonus/Strafe</span><span className="text-right">Trend</span>
        </div>
        {ranking.length === 0 && <div className="p-10 text-center text-ink-3 text-[14px]">Noch keine Teilnehmer angemeldet.</div>}
        {ranking.map((r: any, idx: number) => {
          const hasBonus = (bonusMap.get(r.user_id) ?? 0) > 0;
          const penCount = penaltyMap.get(r.user_id) ?? 0;
          return (
            <Link key={r.user_id} href={`/spieler/${r.user_id}`}
              className={`grid grid-cols-[42px_1fr_60px_50px_60px_44px] lg:grid-cols-[42px_1fr_74px_54px_74px_50px] gap-3 items-center px-4 lg:px-5 py-3 border-t border-black/[0.04] hover:bg-spc-greyLight transition ${r.user_id === user.id ? "bg-spc-lighter/60" : ""}`}>
              <Medal rank={idx + 1} />
              <div className="min-w-0">
                <div className={`font-bold text-[15px] truncate ${r.user_id === user.id ? "text-spc-dark" : "text-ink"}`}>
                  {r.nickname ?? r.display_name} {r.user_id === user.id && <span className="text-ink-3 font-normal text-[12.5px]">(Du)</span>}
                </div>
                <div className="text-[11.5px] text-ink-3 truncate">
                  {r.last_catch_at ? new Date(r.last_catch_at).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }) : "—"}
                </div>
              </div>
              <div className={`text-right text-[20px] font-bold num ${r.user_id === user.id ? "text-spc-mid" : "text-ink"}`}>{r.points ?? 0}</div>
              <div className="text-right text-[12.5px] text-ink-3 num font-semibold">{r.scored_count ?? 0}/6</div>
              <div className="flex items-center justify-end gap-1">
                {hasBonus && <span className="inline-block bg-success/15 text-success text-[10px] px-1.5 py-0.5 rounded font-bold">TW</span>}
                {penCount > 0 && (
                  <span className="inline-block bg-danger/15 text-danger text-[11px] px-1.5 py-0.5 rounded font-bold leading-none tracking-tight">
                    {"!".repeat(Math.min(penCount, 3))}
                  </span>
                )}
                {!hasBonus && penCount === 0 && <span className="text-ink-4 text-[12px]">—</span>}
              </div>
              <TrendCell userId={r.user_id} />
            </Link>
          );
        })}
      </section>

      {/* Tabellen-Verlauf-Chart */}
      {ranking.length > 0 && (
        <div className="bg-white rounded-3xl p-5 shadow-cs-sm mb-3">
          <div className="flex items-baseline justify-between mb-1">
            <div>
              <div className="text-[11px] uppercase tracking-widest text-ink-3 font-bold">Ranking-Verlauf</div>
              <div className="text-[13px] text-ink-3">Punkte-Entwicklung pro Teilnehmer</div>
            </div>
          </div>
          <RankingChart competitionId={comp.id} ranking={ranking.filter((r: any) => !usersById.get(r.user_id)?.is_admin)} usersById={usersById} />
        </div>
      )}
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

// Ranking-Chart: elegant, Legende separat oben
async function RankingChart({ competitionId, ranking, usersById }: any) {
  const { data: catches } = await supabaseAdmin
    .from("catches")
    .select("user_id, total_points, is_scored, caught_at")
    .eq("competition_id", competitionId)
    .eq("is_scored", true)
    .order("caught_at");

  const COLORS = ["#0a6db8", "#e8b247", "#5a7a5f", "#e0524e", "#7db3d9", "#0a3d5c"];
  const participants = ranking.slice(0, 6);

  // Empty state — kein Chart, sondern Placeholder
  if (!catches || catches.length < 2) {
    return (
      <div className="mt-3">
        <div className="rounded-2xl bg-spc-greyLight/60 border border-dashed border-ink-4/40 py-10 px-4 text-center">
          <div className="text-3xl mb-2">📈</div>
          <div className="text-[14px] font-bold text-spc-dark">Noch nicht genug Fänge</div>
          <p className="text-[12.5px] text-ink-3 mt-1">Sobald mindestens zwei gewertete Fänge erfasst sind, siehst du hier den Punkte-Verlauf pro Teilnehmer.</p>
        </div>
      </div>
    );
  }

  // Pro User: kumulative Punkte-Reihe
  const series = new Map<string, { t: number; p: number }[]>();
  const cumul: any = {};
  const sorted = [...catches].sort((a, b) => +new Date(a.caught_at) - +new Date(b.caught_at));
  const tMin = new Date(sorted[0].caught_at).getTime();
  const tMax = new Date(sorted[sorted.length - 1].caught_at).getTime();
  for (const c of sorted) {
    // Admin ausschließen
    if (usersById.get(c.user_id)?.is_admin) continue;
    cumul[c.user_id] = (cumul[c.user_id] ?? 0) + c.total_points;
    if (!series.has(c.user_id)) series.set(c.user_id, []);
    series.get(c.user_id)!.push({ t: new Date(c.caught_at).getTime(), p: cumul[c.user_id] });
  }

  const maxP = Math.max(1, ...Object.values(cumul) as number[]);
  const range = Math.max(tMax - tMin, 60_000);
  const W = 600, H = 200, padL = 34, padR = 14, padT = 14, padB = 24;
  const iw = W - padL - padR, ih = H - padT - padB;
  const x = (t: number) => padL + ((t - tMin) / range) * iw;
  const y = (v: number) => padT + ih - (v / maxP) * ih;

  // Y-Ticks (5 Stufen)
  const yTicks = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div className="mt-3">
      {/* Legende: elegante Chips */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {participants.map((r: any, i: number) => {
          const has = series.has(r.user_id);
          return (
            <div key={r.user_id}
              className={`inline-flex items-center gap-1.5 rounded-full pl-1 pr-2.5 py-0.5 text-[11.5px] font-semibold transition ${
                has ? "bg-spc-greyLight text-spc-dark" : "bg-spc-greyLight/50 text-ink-3"
              }`}>
              <span className="w-3 h-3 rounded-full shrink-0" style={{ background: has ? COLORS[i % COLORS.length] : "#c7c7cc" }} />
              {r.nickname ?? r.display_name}
              <span className="text-[10px] font-bold text-ink-3 ml-0.5 num">{r.points ?? 0}</span>
            </div>
          );
        })}
      </div>

      {/* SVG Chart */}
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" preserveAspectRatio="none" className="max-w-full block" style={{ height: H }}>
        <defs>
          {participants.map((r: any, i: number) => (
            <linearGradient key={r.user_id} id={`rk-${r.user_id}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor={COLORS[i % COLORS.length]} stopOpacity="0.16" />
              <stop offset="1" stopColor={COLORS[i % COLORS.length]} stopOpacity="0" />
            </linearGradient>
          ))}
        </defs>

        {/* Y-Axis Grid + Labels */}
        {yTicks.map(f => {
          const yy = padT + ih * (1 - f);
          const val = Math.round(maxP * f);
          return (
            <g key={f}>
              <line x1={padL} x2={W - padR} y1={yy} y2={yy} stroke="#eef1f4" strokeWidth="1" />
              <text x={padL - 6} y={yy + 3} fontSize="9.5" fill="#8e8e93" textAnchor="end" fontWeight="500">{val}</text>
            </g>
          );
        })}

        {/* X-Achse: Start- und Ende-Uhrzeit */}
        <text x={padL} y={H - 6} fontSize="9.5" fill="#8e8e93" fontWeight="500">
          {new Date(tMin).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}
        </text>
        <text x={W - padR} y={H - 6} fontSize="9.5" fill="#8e8e93" textAnchor="end" fontWeight="500">
          {new Date(tMax).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}
        </text>

        {/* Reihen pro User */}
        {participants.map((r: any, i: number) => {
          const s = series.get(r.user_id);
          if (!s || s.length === 0) return null;
          const smooth = smoothPath(s.map(pt => [x(pt.t), y(pt.p)] as [number, number]));
          const areaPath = `${smooth} L ${x(s[s.length - 1].t).toFixed(1)} ${padT + ih} L ${x(s[0].t).toFixed(1)} ${padT + ih} Z`;
          const isLeader = i === 0;
          return (
            <g key={r.user_id}>
              <path d={areaPath} fill={`url(#rk-${r.user_id})`} opacity={isLeader ? 1 : 0.5} />
              <path d={smooth} stroke={COLORS[i % COLORS.length]} strokeWidth={isLeader ? 2.6 : 2} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={isLeader ? 1 : 0.75} />
              {/* Punkte-Marker nur auf letztem Punkt */}
              <circle cx={x(s[s.length - 1].t)} cy={y(s[s.length - 1].p)} r={isLeader ? 5 : 4}
                fill={COLORS[i % COLORS.length]} stroke="#ffffff" strokeWidth="2" />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// Sanfte Bezier-Kurve durch die Punkte
function smoothPath(points: [number, number][]): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0][0].toFixed(1)} ${points[0][1].toFixed(1)}`;
  const d: string[] = [`M ${points[0][0].toFixed(1)} ${points[0][1].toFixed(1)}`];
  for (let i = 1; i < points.length; i++) {
    const [x0, y0] = points[i - 1];
    const [x1, y1] = points[i];
    const cx = (x0 + x1) / 2;
    d.push(`C ${cx.toFixed(1)} ${y0.toFixed(1)} ${cx.toFixed(1)} ${y1.toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)}`);
  }
  return d.join(" ");
}

function NoComp() {
  return <div className="bg-white rounded-3xl p-10 text-center shadow-cs-sm"><div className="text-5xl mb-3">📊</div><div className="text-[20px] font-bold text-spc-dark mb-2">Noch kein Wettkampf</div><p className="text-ink-3 text-[14px]">Sobald der erste SPC läuft, siehst du hier die Live-Rangliste.</p></div>;
}
