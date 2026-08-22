import { requireAuth } from "@/lib/auth";
import { getActiveCompetition, getLatestCompetition, getCatchesForUser, getLiveRanking } from "@/lib/queries";
import { supabaseAdmin } from "@/lib/supabase";
import { KpiCard } from "@/components/KpiCard";
import { FishThumb, FishPhoto } from "@/components/Icons";
import Link from "next/link";

export const dynamic = "force-dynamic";
const SPECIES: any = { perch: "Barsch", zander: "Zander", pike: "Hecht" };

export default async function ScoreboardPage() {
  const user = await requireAuth();
  const comp = await getActiveCompetition() ?? await getLatestCompetition();
  if (!comp) return <NoComp />;

  const catches = await getCatchesForUser(comp.id, user.id);
  const ranking = await getLiveRanking(comp.id);
  const { data: settings } = await supabaseAdmin.from("competition_settings").select("*").eq("competition_id", comp.id).maybeSingle();

  const me = ranking.find((r: any) => r.user_id === user.id);
  const idx = me ? ranking.indexOf(me) : -1;
  const leader = ranking[0];
  const nextAhead = idx > 0 ? ranking[idx - 1] : null;
  const chaser = idx < ranking.length - 1 && idx >= 0 ? ranking[idx + 1] : null;

  const scored = catches.filter((c: any) => c.is_scored).sort((a: any, b: any) => b.total_points - a.total_points);
  const unscored = catches.filter((c: any) => !c.is_scored);
  const weakest = scored[scored.length - 1];

  const speciesCounts = { perch: 0, zander: 0, pike: 0 } as any;
  for (const c of scored) speciesCounts[c.species]++;
  const maxSpec = settings?.max_fish_per_species ?? 4;

  return (
    <div>
      <section className="bg-cs-section rounded-3xl p-5 mb-4">
        <div className="text-[11px] font-bold text-spc-mid uppercase tracking-widest mb-1">Deine Wertung</div>
        <h1 className="text-2xl sm:text-3xl font-bold text-spc-dark tracking-tight">Mein Scoreboard</h1>
        <p className="text-[14px] text-ink-2 mt-1 mb-4 max-w-[56ch]">Gewertete Fänge nach Punkten. Der schwächste wird als erstes ersetzt.</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          <KpiCard label="Punkte" value={me?.points ?? 0} unit={idx >= 0 ? `Platz ${idx + 1} von ${ranking.length}` : ""} accent />
          <KpiCard label="Vorplatz" value={nextAhead ? `−${(nextAhead.points ?? 0) - (me?.points ?? 0)}` : "—"} unit={nextAhead ? `zu ${nextAhead.nickname ?? nextAhead.display_name}` : "Du führst"} />
          <KpiCard label="Verfolger" value={chaser ? `+${(me?.points ?? 0) - (chaser.points ?? 0)}` : "—"} unit={chaser ? `vor ${chaser.nickname ?? chaser.display_name}` : "Kein Verfolger"} success />
          <KpiCard label="Slots" value={`${scored.length}/6`} unit={scored.length < 6 ? `${6 - scored.length} offen` : "voll"} />
        </div>
      </section>

      {catches.length > 0 && (
        <div className="grid lg:grid-cols-[1.2fr_1fr] gap-2.5 mb-3">
          <div className="bg-white rounded-3xl p-5 shadow-cs-sm">
            <div className="text-[11px] uppercase tracking-widest text-ink-3 font-bold mb-1">Punkte-Verlauf</div>
            <div className="text-[12.5px] text-ink-3 mb-3">Wie sich deine Punkte über die Zeit entwickelt haben</div>
            <PointsChart catches={catches} />
          </div>
          <div className="bg-white rounded-3xl p-5 shadow-cs-sm">
            <div className="text-[11px] uppercase tracking-widest text-ink-3 font-bold mb-1">Fisch-Art-Verteilung</div>
            <div className="text-[12.5px] text-ink-3 mb-3">Anteil deiner gewerteten Fänge</div>
            <SpeciesDonut scored={scored} />
          </div>
        </div>
      )}

      <div className="bg-white rounded-3xl p-5 shadow-cs-sm">
        <div className="text-[11px] uppercase tracking-widest text-ink-3 font-bold mb-3">Meine gewerteten Fänge</div>
        <div className="space-y-1.5">
          {scored.length === 0 && (
            <div className="text-center py-6 text-ink-3 text-[13.5px]">
              Noch keine gewerteten Fänge. <Link href="/fang" className="text-spc-mid font-semibold hover:underline">Jetzt Fang eintragen →</Link>
            </div>
          )}
          {scored.map((c: any, i: number) => {
            const isWeak = weakest && c.id === weakest.id;
            return (
              <div key={c.id} className={`grid grid-cols-[48px_1fr_auto] gap-3 items-center rounded-2xl px-3 py-2.5 ${isWeak ? "bg-danger/10" : "bg-spc-greyLight"}`}>
                <div className="relative w-12 h-12 shrink-0">
                  <div className={`w-12 h-12 rounded-full overflow-hidden flex items-center justify-center ${isWeak ? "bg-danger/10" : "bg-white"}`}>
                    <FishPhoto species={c.species} className="w-full h-full object-contain" />
                  </div>
                  <span className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold num ring-2 ring-white ${i === 0 ? "bg-spc-gold text-spc-goldDeep" : isWeak ? "bg-danger text-white" : "bg-spc-mid text-white"}`}>{i + 1}</span>
                </div>
                <div>
                  <div className="text-[15px] font-bold text-spc-dark">
                    {SPECIES[c.species]} {c.length_cm} cm
                    {c.topwater && <span className="ml-1.5 inline-block bg-success/15 text-success text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Topwater</span>}
                  </div>
                  <div className="text-[12.5px] text-ink-3">
                    {new Date(c.caught_at).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })} Uhr
                    {isWeak && <> · <strong className="text-danger font-bold">schwächster Fang</strong></>}
                  </div>
                </div>
                <div className={`text-[20px] font-bold num ${isWeak ? "text-danger" : "text-ink"}`}>{c.total_points}</div>
              </div>
            );
          })}
        </div>
        <div className="grid grid-cols-3 gap-1.5 mt-3">
          {["perch","zander","pike"].map(sp => (
            <div key={sp} className={`text-center rounded-2xl px-2 py-3 text-[11px] uppercase tracking-widest font-bold ${speciesCounts[sp] > 0 ? "bg-spc-lighter text-spc-dark" : "bg-spc-greyLight text-ink-3"}`}>
              {SPECIES[sp]}
              <div className={`text-[19px] font-bold num mt-1 ${speciesCounts[sp] > 0 ? "text-spc-mid" : "text-ink"}`}>{speciesCounts[sp]}/{maxSpec}</div>
            </div>
          ))}
        </div>
      </div>

      {unscored.length > 0 && (
        <div className="bg-white rounded-3xl p-5 shadow-cs-sm mt-3">
          <div className="text-[11px] uppercase tracking-widest text-ink-3 font-bold mb-3">Nicht gewertete Fänge</div>
          <div className="space-y-1.5">
            {unscored.map((c: any) => (
              <div key={c.id} className="grid grid-cols-[48px_1fr_auto] gap-3 items-center rounded-2xl px-3 py-2.5 bg-spc-greyLight opacity-70">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-white flex items-center justify-center shrink-0">
                  <FishPhoto species={c.species} className="w-full h-full object-contain grayscale opacity-60" />
                </div>
                <div>
                  <div className="text-[14.5px] font-bold line-through text-ink-3">{SPECIES[c.species]} {c.length_cm} cm</div>
                  <div className="text-[12px] text-ink-3">{c.is_valid ? "aus der Wertung (Slot-Regel)" : "unter Mindestmaß"}</div>
                </div>
                <div className="text-[15px] text-ink-3 line-through num">{c.total_points}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function NoComp() {
  return <div className="bg-white rounded-3xl p-10 text-center shadow-cs-sm"><div className="text-5xl mb-3">🎣</div><div className="text-[20px] font-bold text-spc-dark">Kein Wettkampf</div></div>;
}

function PointsChart({ catches }: { catches: any[] }) {
  const scored = catches.filter(c => c.is_scored).sort((a, b) => +new Date(a.caught_at) - +new Date(b.caught_at));
  if (scored.length === 0) return <div className="text-[13px] text-ink-3 italic py-4 text-center">Noch keine gewerteten Fänge.</div>;
  let cum = 0;
  const pts = scored.map(c => { cum += c.total_points; return { t: new Date(c.caught_at).getTime(), p: cum }; });
  const W = 500, H = 160, padL = 30, padR = 10, padT = 12, padB = 20;
  const iw = W - padL - padR, ih = H - padT - padB;
  const maxY = Math.max(...pts.map(p => p.p), 100);
  const tMin = pts[0].t, tMax = pts[pts.length - 1].t;
  const range = Math.max(tMax - tMin, 60_000);
  const x = (t: number) => padL + ((t - tMin) / range) * iw;
  const y = (v: number) => padT + ih - (v / maxY) * ih;
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${x(p.t).toFixed(1)} ${y(p.p).toFixed(1)}`).join(" ");
  const area = `${line} L ${x(pts[pts.length - 1].t).toFixed(1)} ${padT + ih} L ${x(pts[0].t).toFixed(1)} ${padT + ih} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none" className="max-w-full">
      <defs>
        <linearGradient id="pt-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#0a6db8" stopOpacity="0.28" />
          <stop offset="1" stopColor="#0a6db8" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75, 1].map(f => {
        const yy = padT + ih * (1 - f);
        return <line key={f} x1={padL} x2={W - padR} y1={yy} y2={yy} stroke="#e5e5ea" />;
      })}
      <path d={area} fill="url(#pt-fill)" />
      <path d={line} stroke="#0a6db8" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <circle key={i} cx={x(p.t)} cy={y(p.p)} r={i === pts.length - 1 ? 5 : 3.5}
          fill={i === pts.length - 1 ? "#0a6db8" : "#ffffff"} stroke="#0a6db8" strokeWidth="2" />
      ))}
    </svg>
  );
}

function SpeciesDonut({ scored }: { scored: any[] }) {
  const COLORS: any = { perch: "#e8b247", zander: "#0a6db8", pike: "#0a3d5c" };
  const NAMES: any = { perch: "Barsch", zander: "Zander", pike: "Hecht" };
  const counts = { perch: 0, zander: 0, pike: 0 } as any;
  for (const c of scored) counts[c.species]++;
  const total = scored.length || 1;
  const size = 130, stroke = 22, r = (size - stroke) / 2, circ = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="flex items-center gap-5">
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} className="shrink-0">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f0f0f4" strokeWidth={stroke} />
        {(["perch","zander","pike"] as const).map(sp => {
          const val = counts[sp] / total;
          if (val === 0) return null;
          const dash = val * circ;
          const el = <circle key={sp} cx={size/2} cy={size/2} r={r} fill="none"
            stroke={COLORS[sp]} strokeWidth={stroke}
            strokeDasharray={`${dash} ${circ - dash}`}
            strokeDashoffset={-offset}
            transform={`rotate(-90 ${size/2} ${size/2})`} />;
          offset += dash;
          return el;
        })}
      </svg>
      <div className="flex-1 space-y-1.5 text-[13px]">
        {(["perch","zander","pike"] as const).map(sp => (
          <div key={sp} className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm" style={{ background: COLORS[sp] }} />
            <span className="flex-1 font-semibold text-spc-dark">{NAMES[sp]}</span>
            <span className="text-ink-2 num font-bold">{counts[sp]}</span>
            <span className="text-ink-3 num text-[12px] w-[40px] text-right">{Math.round((counts[sp] / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

