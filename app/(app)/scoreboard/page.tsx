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
