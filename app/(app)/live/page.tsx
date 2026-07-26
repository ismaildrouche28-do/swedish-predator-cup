import { requireAuth } from "@/lib/auth";
import { getActiveCompetition, getLatestCompetition, getLiveRanking, getTopFish } from "@/lib/queries";
import { FishThumb } from "@/components/Icons";
import Link from "next/link";

export const dynamic = "force-dynamic";
const SPECIES: any = { perch: "Barsch", zander: "Zander", pike: "Hecht" };

export default async function LivePage() {
  const user = await requireAuth();
  const comp = await getActiveCompetition() ?? await getLatestCompetition();
  if (!comp) return <NoComp />;

  const [ranking, topFish] = await Promise.all([getLiveRanking(comp.id), getTopFish(comp.id)]);
  const tagesbester = ranking.reduce((best: any, r: any) => (!best || (r.points ?? 0) > (best.points ?? 0)) ? r : best, null);

  return (
    <div>
      {/* Hero */}
      <section className="bg-cs-gradient shadow-cs rounded-3xl p-5 sm:p-6 mb-4 text-white">
        <div className="grid sm:grid-cols-[1fr_auto] gap-4 items-center">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-widest text-white/70 mb-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-white pulse-dot"/> Live
            </div>
            <div className="text-2xl sm:text-3xl font-bold tracking-tight">{comp.name}</div>
            <div className="text-[13.5px] text-white/75 mt-1">{comp.status === "running" ? "Wettkampf läuft" : comp.status === "finished" ? "Endstand" : "Vorschau"}</div>
          </div>
          {tagesbester && (tagesbester.points ?? 0) > 0 && (
            <div className="sm:text-right sm:pl-6 sm:border-l sm:border-white/25">
              <div className="text-[10px] uppercase tracking-widest text-white/60 font-bold">Aktuell vorn</div>
              <div className="text-[18px] font-bold mt-0.5">{tagesbester.nickname ?? tagesbester.display_name}</div>
              <div className="text-[12px] text-white/75">{tagesbester.points ?? 0} Punkte · {tagesbester.scored_count ?? 0} Fänge</div>
            </div>
          )}
        </div>
      </section>

      {/* Section: Ranking */}
      <section className="bg-white rounded-3xl overflow-hidden shadow-cs-sm mb-4">
        <div className="px-5 pt-5 pb-2 flex items-center justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-widest text-ink-3 font-bold">Rangliste</div>
            <div className="text-[16px] font-bold text-spc-dark">Alle Teilnehmer</div>
          </div>
          <div className="text-[11.5px] text-ink-3">👆 tippe für Details</div>
        </div>

        {ranking.length === 0 && <div className="p-10 text-center text-ink-3 text-[14px]">Noch keine Teilnehmer angemeldet.</div>}

        {ranking.map((r: any, idx: number) => (
          <Link key={r.user_id} href={`/spieler/${r.user_id}`}
            className={`grid grid-cols-[42px_1fr_68px_54px] lg:grid-cols-[42px_1fr_80px_60px_60px] gap-3 items-center px-4 lg:px-5 py-3.5 border-t border-black/[0.04] hover:bg-spc-greyLight transition ${r.user_id === user.id ? "bg-spc-lighter/60" : ""}`}>
            <Medal rank={idx + 1} />
            <div className="min-w-0">
              <div className={`font-bold text-[15px] truncate ${r.user_id === user.id ? "text-spc-dark" : "text-ink"}`}>
                {r.nickname ?? r.display_name} {r.user_id === user.id && <span className="text-ink-3 font-normal text-[12.5px]">(Du)</span>}
              </div>
              <div className="text-[12px] text-ink-3 truncate">
                {r.last_catch_at ? `Letzter Fang · ${new Date(r.last_catch_at).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })} Uhr` : "Noch kein Fang"}
              </div>
            </div>
            <div className={`text-right text-[22px] font-bold num ${r.user_id === user.id ? "text-spc-mid" : "text-ink"}`}>{r.points ?? 0}</div>
            <div className="text-right text-[12.5px] text-ink-3 num font-semibold">{r.scored_count ?? 0}/6</div>
            <div className="hidden lg:block text-right text-[12.5px] text-ink-3 num font-semibold">{r.penalty_points ? r.penalty_points : "—"}</div>
          </Link>
        ))}
      </section>

      {topFish && (
        <div className="bg-white rounded-3xl p-5 shadow-cs-sm relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-spc-gold" />
          <div className="flex items-center gap-4">
            <FishThumb species={topFish.species} size={48} />
            <div className="flex-1 min-w-0">
              <div className="text-[10px] uppercase tracking-widest text-spc-goldDeep font-bold">Top-Fisch</div>
              <div className="text-[17px] font-bold text-spc-dark mt-0.5">
                {SPECIES[topFish.species]} · {topFish.length_cm} cm
                {topFish.topwater && <span className="ml-1.5 inline-block bg-success/15 text-success text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Topwater</span>}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[26px] font-bold text-spc-gold num leading-none">{topFish.total_points}</div>
              <div className="text-[10px] uppercase tracking-widest text-ink-3 font-bold mt-1">Punkte</div>
            </div>
          </div>
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

function NoComp() {
  return <div className="bg-white rounded-3xl p-10 text-center shadow-cs-sm"><div className="text-5xl mb-3">📊</div><div className="text-[20px] font-bold text-spc-dark mb-2">Noch kein Wettkampf</div><p className="text-ink-3 text-[14px]">Sobald der erste SPC läuft, siehst du hier die Live-Rangliste.</p></div>;
}
