import { requireAuth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { KpiCard } from "@/components/KpiCard";
import { FishPhoto } from "@/components/Icons";

export const dynamic = "force-dynamic";
const SPECIES: any = { perch: "Barsch", zander: "Zander", pike: "Hecht" };

export default async function StatsPage() {
  const user = await requireAuth();
  const [{ data: allCatches }, { data: allComps }, { data: participations }] = await Promise.all([
    supabaseAdmin.from("catches").select("*, competitions(name, start_at)").eq("user_id", user.id).order("caught_at", { ascending: false }),
    supabaseAdmin.from("competitions").select("*").eq("status", "finished").order("start_at", { ascending: false }),
    supabaseAdmin.from("catches").select("competition_id").eq("user_id", user.id),
  ]);

  const compIds = new Set((participations ?? []).map((p: any) => p.competition_id));
  const myComps = (allComps ?? []).filter((c: any) => compIds.has(c.id));

  let wins = 0, podium = 0, positions: number[] = [];
  for (const c of myComps) {
    const { data: ranking } = await supabaseAdmin.from("live_ranking").select("user_id, points").eq("competition_id", c.id).order("points", { ascending: false });
    if (!ranking) continue;
    const rank = ranking.findIndex(r => r.user_id === user.id) + 1;
    if (rank === 1) wins++;
    if (rank > 0 && rank <= 3) podium++;
    if (rank > 0) positions.push(rank);
  }
  const avgPos = positions.length > 0 ? (positions.reduce((s,n) => s + n, 0) / positions.length).toFixed(1).replace(".", ",") : "—";

  const countBySpecies = { perch: 0, zander: 0, pike: 0 } as any;
  for (const c of (allCatches ?? [])) if (c.is_valid) countBySpecies[c.species]++;
  const maxCount = Math.max(1, ...Object.values(countBySpecies) as number[]);

  const bestByType: any = {};
  for (const c of (allCatches ?? [])) {
    if (!c.is_valid) continue;
    if (!bestByType[c.species] || c.length_cm > bestByType[c.species].length_cm) bestByType[c.species] = c;
  }

  return (
    <div>
      <section className="bg-cs-section rounded-3xl p-5 mb-4">
        <div className="text-[11px] font-bold text-spc-mid uppercase tracking-widest mb-1">{myComps.length > 0 ? `${myComps.length} Ausgaben` : "Noch keine Teilnahmen"}</div>
        <h1 className="text-2xl sm:text-3xl font-bold text-spc-dark tracking-tight">Deine Bilanz</h1>
        <p className="text-[14px] text-ink-2 mt-1 mb-4 max-w-[56ch]">Alle deine Ergebnisse und Rekorde. Wird nach jedem Wettkampf automatisch fortgeschrieben.</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          <KpiCard label="Teilnahmen" value={myComps.length} accent />
          <KpiCard label="Siege" value={wins} />
          <KpiCard label="Podest" value={podium} success />
          <KpiCard label="Ø Platz" value={avgPos} />
        </div>
      </section>

      <div className="grid lg:grid-cols-2 gap-2.5">
        <div className="bg-white rounded-3xl p-5 shadow-cs-sm">
          <div className="text-[11px] uppercase tracking-widest text-ink-3 font-bold mb-3">Fänge nach Art</div>
          <div className="space-y-3">
            {(["pike", "zander", "perch"] as const).map(sp => (
              <div key={sp} className="grid grid-cols-[64px_1fr_34px] gap-3 items-center text-[13.5px]">
                <span className="font-semibold text-spc-dark">{SPECIES[sp]}</span>
                <div className="h-2 rounded-full bg-spc-greyLight overflow-hidden">
                  <div className="h-full bg-spc-mid rounded-full" style={{ width: `${(countBySpecies[sp] / maxCount) * 100}%` }} />
                </div>
                <span className="text-right num text-ink-2 font-bold">{countBySpecies[sp]}</span>
              </div>
            ))}
          </div>

          <div className="text-[11px] uppercase tracking-widest text-ink-3 font-bold mt-6 mb-3">Persönliche Rekorde</div>
          <div className="space-y-1.5">
            {Object.keys(bestByType).length === 0 && <div className="text-[13.5px] text-ink-3 italic">Noch keine Rekorde.</div>}
            {(["pike", "zander", "perch"] as const).map(sp => {
              const c = bestByType[sp];
              if (!c) return null;
              return (
                <div key={sp} className="grid grid-cols-[48px_1fr_auto] gap-3 items-center bg-spc-greyLight rounded-2xl px-3 py-2.5">
                  <div className="relative w-12 h-12 shrink-0">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-white flex items-center justify-center">
                      <FishPhoto species={sp} className="w-full h-full object-contain" />
                    </div>
                    <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-spc-gold text-spc-goldDeep flex items-center justify-center text-[11px] font-bold ring-2 ring-white">★</span>
                  </div>
                  <div>
                    <div className="text-[15px] font-bold text-spc-dark">
                      {SPECIES[sp]} {c.length_cm} cm
                      {c.topwater && <span className="ml-1.5 inline-block bg-success/15 text-success text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Topwater</span>}
                    </div>
                    <div className="text-[12.5px] text-ink-3">{c.competitions?.name ?? ""}</div>
                  </div>
                  <div className="text-[19px] font-bold num">{c.total_points}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 shadow-cs-sm">
          <div className="text-[11px] uppercase tracking-widest text-ink-3 font-bold mb-3">Letzte Wettkämpfe</div>
          {myComps.length === 0 ? (
            <div className="text-[13.5px] text-ink-3 italic">Du hast noch an keinem abgeschlossenen SPC teilgenommen.</div>
          ) : (
            <div className="space-y-1.5">
              {myComps.slice(0, 6).map((c: any) => (
                <div key={c.id} className="grid grid-cols-[52px_1fr_auto] gap-3.5 items-center bg-spc-greyLight rounded-2xl px-3.5 py-3">
                  <div className="text-[18px] font-bold text-spc-mid num">{c.start_at ? new Date(c.start_at).getFullYear() : "—"}</div>
                  <div>
                    <div className="text-[14.5px] font-bold text-spc-dark">{c.name}</div>
                    <div className="text-[12px] text-ink-3">{c.location ?? "—"}</div>
                  </div>
                  <div className="text-spc-mid">›</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
