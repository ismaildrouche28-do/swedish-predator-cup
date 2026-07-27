import { requireAuth } from "@/lib/auth";
import { getActiveCompetition, getLatestCompetition, getCatchesForUser, getLiveRanking } from "@/lib/queries";
import { supabaseAdmin } from "@/lib/supabase";
import { KpiCard } from "@/components/KpiCard";
import { FishPhoto } from "@/components/Icons";
import Link from "next/link";

export const dynamic = "force-dynamic";
const SPECIES: any = { perch: "Barsch", zander: "Zander", pike: "Hecht" };
const COLORS: any = { perch: "#e8b247", zander: "#0a6db8", pike: "#0a3d5c" };

export default async function SpielerPage({ params }: { params: { userId: string } }) {
  const me = await requireAuth();
  const comp = await getActiveCompetition() ?? await getLatestCompetition();
  if (!comp) return null;

  const [ranking, catches, { data: profile }, { data: allTimeCatches }] = await Promise.all([
    getLiveRanking(comp.id),
    getCatchesForUser(comp.id, params.userId),
    supabaseAdmin.from("users").select("id, name, nickname").eq("id", params.userId).maybeSingle(),
    supabaseAdmin.from("catches").select("*").eq("user_id", params.userId).eq("is_valid", true),
  ]);

  const rank = ranking.findIndex((r: any) => r.user_id === params.userId) + 1;
  const row = ranking.find((r: any) => r.user_id === params.userId);
  const scored = catches.filter((c: any) => c.is_scored).sort((a: any, b: any) => b.total_points - a.total_points);
  const valid = catches.filter((c: any) => c.is_valid);
  const isMe = me.id === params.userId;

  // Fisch-Art-Verteilung (nur gewertete)
  const bySpecies = { perch: 0, zander: 0, pike: 0 } as any;
  for (const c of scored) bySpecies[c.species]++;
  const totalSpec = scored.length || 1;

  // Größte Fische pro Art (gesamter Wettkampf, valid)
  const biggestPerSpecies: any = {};
  for (const c of valid) {
    if (!biggestPerSpecies[c.species] || c.length_cm > biggestPerSpecies[c.species].length_cm) {
      biggestPerSpecies[c.species] = c;
    }
  }

  // Punkte-Verlauf (kumuliert über die Zeit — nur is_scored zählen)
  const scoredByTime = [...catches].filter(c => c.is_scored).sort((a, b) => +new Date(a.caught_at) - +new Date(b.caught_at));
  let cum = 0;
  const pointsCurve = scoredByTime.map(c => {
    cum += c.total_points;
    return { t: new Date(c.caught_at).getTime(), points: cum, cm: c.length_cm, species: c.species, topwater: c.topwater };
  });

  // Topwater-Ratio
  const topwaterCount = valid.filter(c => c.topwater).length;
  const topwaterPct = valid.length > 0 ? Math.round((topwaterCount / valid.length) * 100) : 0;

  return (
    <div>
      <Link href="/live" className="inline-flex items-center gap-1 text-[13px] text-spc-mid font-semibold mb-3">← Zurück zum Ranking</Link>

      <section className="bg-cs-gradient shadow-cs rounded-3xl p-6 mb-4 text-white">
        <div className="grid sm:grid-cols-[1fr_auto] gap-4 items-center">
          <div>
            <div className="inline-block bg-white/25 text-white text-[10px] font-bold px-2.5 py-1 rounded-full mb-2 uppercase tracking-widest">
              {isMe ? "Das bist du" : "Teilnehmer"}
            </div>
            <div className="text-[26px] font-bold leading-tight">{profile?.nickname ?? profile?.name}</div>
            <div className="text-white/75 text-[13.5px] mt-1">
              {scored.length} gewertete Fänge · {topwaterPct}% Topwater · {(row?.penalty_points ?? 0) < 0 ? `${row.penalty_points} Strafpunkte` : "Keine Strafen"}
            </div>
          </div>
          <div className="sm:pl-6 sm:border-l sm:border-white/25 sm:text-center">
            <div className="text-[48px] font-bold text-white leading-none num">{rank || "—"}</div>
            <div className="text-[10px] uppercase tracking-widest text-white/60 font-bold mt-1.5">von {ranking.length}</div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-4">
        <KpiCard label="Punkte" value={row?.points ?? 0} accent />
        <KpiCard label="Fänge" value={`${row?.scored_count ?? 0}/6`} />
        <KpiCard label="Slot frei" value={6 - (row?.scored_count ?? 0)} />
        <KpiCard label="Bester Fang" value={scored[0] ? `${SPECIES[scored[0].species].slice(0,3)}. ${scored[0].length_cm}` : "—"} />
      </div>

      <div className="grid lg:grid-cols-[1.2fr_1fr] gap-2.5">
        {/* Punkte-Verlauf-Chart */}
        <div className="bg-white rounded-3xl p-5 shadow-cs-sm">
          <div className="text-[11px] uppercase tracking-widest text-ink-3 font-bold mb-1">Punkte-Verlauf</div>
          <div className="text-[13px] text-ink-3 mb-4">Wie sich {isMe ? "deine" : "die"} Punkte über die Zeit entwickelt haben</div>
          {pointsCurve.length === 0 ? (
            <div className="text-[13.5px] text-ink-3 italic py-8 text-center">Noch keine gewerteten Fänge.</div>
          ) : (
            <PointsChart points={pointsCurve} />
          )}
        </div>

        {/* Fisch-Art-Donut */}
        <div className="bg-white rounded-3xl p-5 shadow-cs-sm">
          <div className="text-[11px] uppercase tracking-widest text-ink-3 font-bold mb-1">Fisch-Art-Verteilung</div>
          <div className="text-[13px] text-ink-3 mb-4">Anteil {isMe ? "deiner" : "der"} gewerteten Fänge</div>
          {scored.length === 0 ? (
            <div className="text-[13.5px] text-ink-3 italic py-8 text-center">Noch keine Fänge.</div>
          ) : (
            <div className="flex items-center gap-5">
              <Donut segments={[
                { color: COLORS.perch, value: bySpecies.perch / totalSpec },
                { color: COLORS.zander, value: bySpecies.zander / totalSpec },
                { color: COLORS.pike, value: bySpecies.pike / totalSpec },
              ]} />
              <div className="flex-1 space-y-1.5 text-[13.5px]">
                {(["perch","zander","pike"] as const).map(sp => (
                  <div key={sp} className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-sm" style={{ background: COLORS[sp] }} />
                    <span className="flex-1 font-semibold text-spc-dark">{SPECIES[sp]}</span>
                    <span className="text-ink-2 num font-bold">{bySpecies[sp]}</span>
                    <span className="text-ink-3 num text-[12px] w-[42px] text-right">{Math.round((bySpecies[sp] / totalSpec) * 100)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Größte Fische pro Art */}
      <div className="bg-white rounded-3xl p-5 shadow-cs-sm mt-3">
        <div className="text-[11px] uppercase tracking-widest text-ink-3 font-bold mb-3">Größter Fang pro Art · dieser Wettkampf</div>
        <div className="grid sm:grid-cols-3 gap-2.5">
          {(["perch", "zander", "pike"] as const).map(sp => {
            const c = biggestPerSpecies[sp];
            const color = COLORS[sp];
            return (
              <div key={sp} className="rounded-2xl p-4 relative overflow-hidden" style={{ background: `${color}10` }}>
                <div className="w-full aspect-[16/8] flex items-center justify-center mb-2">
                  <FishPhoto species={sp} className={`max-w-[85%] max-h-full object-contain drop-shadow-sm ${c ? "" : "opacity-30 grayscale"}`} />
                </div>
                <div className="text-[10px] uppercase tracking-widest font-bold" style={{ color }}>{SPECIES[sp]}</div>
                {c ? (
                  <>
                    <div className="text-[24px] font-bold num mt-0.5 leading-none" style={{ color }}>{c.length_cm}<span className="text-[14px] ml-1 opacity-70">cm</span></div>
                    <div className="text-[12px] text-ink-3 mt-2">
                      {c.total_points} Punkte
                      {c.topwater && <span className="ml-1 inline-block bg-success/15 text-success text-[9.5px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Topwater</span>}
                    </div>
                  </>
                ) : (
                  <div className="text-[13px] text-ink-3 italic mt-1">Noch keiner</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Fang-Liste alle */}
      <div className="bg-white rounded-3xl p-5 shadow-cs-sm mt-3">
        <div className="text-[11px] uppercase tracking-widest text-ink-3 font-bold mb-3">Alle Fänge · chronologisch</div>
        <div className="space-y-1.5">
          {catches.length === 0 && <div className="text-[13.5px] text-ink-3 italic py-3">Noch keine Fänge.</div>}
          {catches.map((c: any, i: number) => (
            <div key={c.id} className={`grid grid-cols-[48px_1fr_auto] gap-3 items-center rounded-2xl px-3 py-2.5 ${c.is_scored ? "bg-spc-greyLight" : "bg-spc-greyLight opacity-60"}`}>
              <div className="w-12 h-12 rounded-full overflow-hidden bg-white flex items-center justify-center relative">
                <FishPhoto species={c.species} className={`w-full h-full object-contain ${!c.is_valid ? "grayscale opacity-50" : ""}`} />
                {c.is_scored && <span className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-spc-mid text-white flex items-center justify-center text-[11px] font-bold border-2 border-white">✓</span>}
              </div>
              <div>
                <div className={`text-[15px] font-bold ${c.is_scored ? "text-spc-dark" : "text-ink-3 line-through"}`}>
                  {SPECIES[c.species]} {c.length_cm} cm
                  {c.topwater && <span className="ml-1.5 inline-block bg-success/15 text-success text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Topwater</span>}
                </div>
                <div className="text-[12.5px] text-ink-3">
                  {new Date(c.caught_at).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })} Uhr
                  {!c.is_valid && " · unter Mindestmaß"}
                  {c.is_valid && !c.is_scored && " · aus Wertung (Slot-Regel)"}
                </div>
              </div>
              <div className={`text-[18px] font-bold num ${c.is_scored ? "text-ink" : "text-ink-3 line-through"}`}>{c.total_points}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════ CHARTS ══════════════════════

function Donut({ segments }: { segments: { color: string; value: number }[] }) {
  const size = 140, stroke = 22, r = (size - stroke) / 2, c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} className="flex-shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f0f0f4" strokeWidth={stroke} />
      {segments.map((s, i) => {
        if (s.value === 0) return null;
        const dash = s.value * c;
        const el = (
          <circle key={i} cx={size / 2} cy={size / 2} r={r} fill="none"
            stroke={s.color} strokeWidth={stroke}
            strokeDasharray={`${dash} ${c - dash}`}
            strokeDashoffset={-offset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            strokeLinecap="butt" />
        );
        offset += dash;
        return el;
      })}
    </svg>
  );
}

function PointsChart({ points }: { points: { t: number; points: number; cm: number; species: string; topwater: boolean }[] }) {
  if (points.length === 0) return null;
  const W = 500, H = 180, padL = 34, padR = 12, padT = 12, padB = 24;
  const iw = W - padL - padR, ih = H - padT - padB;

  const maxY = Math.max(...points.map(p => p.points), 100);
  const tMin = points[0].t, tMax = points[points.length - 1].t;
  const tRange = Math.max(tMax - tMin, 60_000); // min 1 min

  const x = (t: number) => padL + ((t - tMin) / tRange) * iw;
  const y = (v: number) => padT + ih - (v / maxY) * ih;

  const path = points.map((p, i) => `${i === 0 ? "M" : "L"} ${x(p.t).toFixed(1)} ${y(p.points).toFixed(1)}`).join(" ");
  const area = `${path} L ${x(points[points.length - 1].t).toFixed(1)} ${padT + ih} L ${x(points[0].t).toFixed(1)} ${padT + ih} Z`;

  const yTicks = 4;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none" className="max-w-full">
      <defs>
        <linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#0a6db8" stopOpacity="0.28" />
          <stop offset="1" stopColor="#0a6db8" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Y-Grid */}
      {Array.from({ length: yTicks + 1 }).map((_, i) => {
        const yy = padT + (ih / yTicks) * i;
        const v = Math.round(maxY - (maxY / yTicks) * i);
        return (
          <g key={i}>
            <line x1={padL} x2={W - padR} y1={yy} y2={yy} stroke="#e5e5ea" strokeWidth="1" />
            <text x={padL - 6} y={yy + 3} fontSize="10" fill="#8e8e93" textAnchor="end">{v}</text>
          </g>
        );
      })}
      {/* Area + Line */}
      <path d={area} fill="url(#chartFill)" />
      <path d={path} fill="none" stroke="#0a6db8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Points */}
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={x(p.t)} cy={y(p.points)} r={i === points.length - 1 ? 5 : 3.5}
            fill={i === points.length - 1 ? "#0a6db8" : "#ffffff"}
            stroke="#0a6db8" strokeWidth="2" />
        </g>
      ))}
      {/* X-Achse: erster und letzter Zeitstempel */}
      <text x={padL} y={H - 4} fontSize="10" fill="#8e8e93">
        {new Date(points[0].t).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}
      </text>
      {points.length > 1 && (
        <text x={W - padR} y={H - 4} fontSize="10" fill="#8e8e93" textAnchor="end">
          {new Date(points[points.length - 1].t).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}
        </text>
      )}
    </svg>
  );
}
