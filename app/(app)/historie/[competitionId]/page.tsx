import { requireAuth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { getLiveRanking, getTopFish, getAllCatches } from "@/lib/queries";
import { KpiCard } from "@/components/KpiCard";
import { FishThumb } from "@/components/Icons";
import Link from "next/link";

export const dynamic = "force-dynamic";
const SPECIES: any = { perch: "Barsch", zander: "Zander", pike: "Hecht" };

export default async function CompetitionDetail({ params }: { params: { competitionId: string } }) {
  await requireAuth();

  const [{ data: comp }, ranking, topFish, catches, { data: penalties }, { data: users }] = await Promise.all([
    supabaseAdmin.from("competitions").select("*").eq("id", params.competitionId).maybeSingle(),
    getLiveRanking(params.competitionId),
    getTopFish(params.competitionId),
    getAllCatches(params.competitionId),
    supabaseAdmin.from("penalties").select("*, users(name, nickname)").eq("competition_id", params.competitionId).order("occurred_at", { ascending: false }),
    supabaseAdmin.from("users").select("id, name, nickname"),
  ]);

  if (!comp) return <div className="p-10 text-center">Wettkampf nicht gefunden.</div>;

  const usersById = new Map((users ?? []).map(u => [u.id, u]));
  const totalCatches = catches.length;
  const scoredCatches = catches.filter((c: any) => c.is_scored);
  const totalPoints = ranking.reduce((s: number, r: any) => s + (r.points ?? 0), 0);
  const topwaterCount = catches.filter((c: any) => c.topwater && c.is_valid).length;

  const statusLabel = { prep: "in Vorbereitung", running: "läuft", paused: "pausiert", finished: "beendet" }[comp.status as string];
  const winner = ranking[0];

  return (
    <div>
      <Link href="/historie" className="inline-flex items-center gap-1 text-[13px] text-spc-mid font-semibold mb-3">← Historie</Link>

      <section className="bg-cs-gradient shadow-cs rounded-3xl p-6 mb-4 text-white">
        <div className="grid sm:grid-cols-[1fr_auto] gap-4 items-center">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-widest text-white/70 mb-1">
              {comp.status === "running" && <><span className="pulse-dot inline-block w-1.5 h-1.5 rounded-full bg-white align-middle mr-1"/> Live · </>}
              {comp.name} · {statusLabel}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{comp.location ?? "Wettkampf"}</h1>
            <div className="text-[13.5px] text-white/75 mt-1">
              {comp.start_at ? new Date(comp.start_at).toLocaleDateString("de-DE") : "—"}
              {comp.end_at && ` – ${new Date(comp.end_at).toLocaleDateString("de-DE")}`}
            </div>
          </div>
          {winner && (winner.points ?? 0) > 0 && (
            <div className="sm:pl-6 sm:border-l sm:border-white/25 sm:text-right">
              <div className="text-[10px] uppercase tracking-widest text-white/60 font-bold">{comp.status === "finished" ? "Sieger" : "Aktuell vorn"}</div>
              <div className="text-[20px] font-bold mt-0.5">{winner.nickname ?? winner.display_name}</div>
              <div className="text-[12px] text-white/75">{winner.points} Punkte</div>
            </div>
          )}
        </div>
      </section>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-4">
        <KpiCard label="Fänge gesamt" value={totalCatches} accent />
        <KpiCard label="Gewertet" value={scoredCatches.length} />
        <KpiCard label="Topwater" value={topwaterCount} success />
        <KpiCard label="Teilnehmer" value={ranking.filter((r: any) => (r.scored_count ?? 0) > 0).length} />
      </div>

      {topFish && (
        <div className="bg-white rounded-3xl p-5 shadow-cs-sm mb-3 relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-spc-gold" />
          <div className="flex items-center gap-4">
            <FishThumb species={topFish.species} size={56} />
            <div className="flex-1 min-w-0">
              <div className="text-[10px] uppercase tracking-widest text-spc-goldDeep font-bold">🏆 Top-Fisch</div>
              <div className="text-[18px] font-bold text-spc-dark mt-0.5">
                {SPECIES[topFish.species]} · {topFish.length_cm} cm
                {topFish.topwater && <span className="ml-1.5 inline-block bg-success/15 text-success text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Topwater</span>}
              </div>
              <div className="text-[12.5px] text-ink-3 mt-0.5">
                {(usersById.get(topFish.user_id)?.nickname ?? usersById.get(topFish.user_id)?.name ?? "?")} · {new Date(topFish.caught_at).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })} Uhr
              </div>
            </div>
            <div className="text-right">
              <div className="text-[28px] font-bold text-spc-gold num leading-none">{topFish.total_points}</div>
              <div className="text-[10px] uppercase tracking-widest text-ink-3 font-bold mt-1">Punkte</div>
            </div>
          </div>
        </div>
      )}

      {/* Endstand */}
      <div className="bg-white rounded-3xl overflow-hidden shadow-cs-sm mb-3">
        <div className="px-5 pt-5 pb-2">
          <div className="text-[11px] uppercase tracking-widest text-ink-3 font-bold">Endstand</div>
          <div className="text-[16px] font-bold text-spc-dark">Rangliste</div>
        </div>
        {ranking.map((r: any, idx: number) => (
          <Link key={r.user_id} href={`/spieler/${r.user_id}`}
            className="grid grid-cols-[42px_1fr_68px_54px] gap-3 items-center px-4 py-3.5 border-t border-black/[0.04] hover:bg-spc-greyLight transition">
            <Medal rank={idx + 1} />
            <div className="min-w-0">
              <div className="font-bold text-[15px] truncate">{r.nickname ?? r.display_name}</div>
              <div className="text-[12px] text-ink-3">{r.scored_count ?? 0} Fänge gewertet</div>
            </div>
            <div className="text-right text-[22px] font-bold num text-ink">{r.points ?? 0}</div>
            <div className="text-right text-[12.5px] text-ink-3 num font-semibold">{r.penalty_points ? r.penalty_points : "—"}</div>
          </Link>
        ))}
      </div>

      {/* Alle Fänge chronologisch */}
      <div className="bg-white rounded-3xl p-5 shadow-cs-sm mb-3">
        <div className="text-[11px] uppercase tracking-widest text-ink-3 font-bold mb-3">Alle Fänge · chronologisch neuste zuerst</div>
        <div className="space-y-1.5">
          {catches.length === 0 && <div className="text-[13.5px] text-ink-3 italic py-3">Noch keine Fänge erfasst.</div>}
          {catches.map((c: any) => {
            const u = usersById.get(c.user_id);
            const isTop = topFish?.id === c.id;
            return (
              <div key={c.id} className={`grid grid-cols-[40px_1fr_auto] gap-3 items-center rounded-2xl px-3.5 py-3 ${isTop ? "bg-spc-gold/10 border border-spc-gold/30" : c.is_valid ? "bg-spc-greyLight" : "bg-danger/10 opacity-75"}`}>
                <FishThumb species={c.species} size={40} />
                <div>
                  <div className={`text-[14.5px] font-bold ${c.is_valid ? "text-spc-dark" : "text-ink-3 line-through"}`}>
                    {SPECIES[c.species]} · {c.length_cm} cm
                    {c.topwater && <span className="ml-1.5 inline-block bg-success/15 text-success text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Topwater</span>}
                    {isTop && <span className="ml-1.5 inline-block bg-spc-gold/25 text-spc-goldDeep text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Top-Fisch</span>}
                    {!c.is_valid && <span className="ml-1.5 inline-block bg-danger/15 text-danger text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Untermaß</span>}
                    {c.is_valid && !c.is_scored && <span className="ml-1.5 inline-block bg-ink-4/40 text-ink-3 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Nicht in Wertung</span>}
                  </div>
                  <div className="text-[12px] text-ink-3">
                    <Link href={`/spieler/${c.user_id}`} className="font-semibold text-ink-2 hover:text-spc-mid">
                      {u?.nickname ?? u?.name ?? "?"}
                    </Link>
                    {" · "}
                    {new Date(c.caught_at).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })} Uhr
                  </div>
                </div>
                <div className={`text-right text-[18px] font-bold num ${!c.is_valid ? "text-danger line-through" : c.is_scored ? "text-ink" : "text-ink-3"}`}>{c.total_points}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Strafen */}
      {(penalties?.length ?? 0) > 0 && (
        <div className="bg-white rounded-3xl p-5 shadow-cs-sm">
          <div className="text-[11px] uppercase tracking-widest text-ink-3 font-bold mb-3">Strafen</div>
          <div className="space-y-1.5">
            {(penalties ?? []).map((p: any) => (
              <div key={p.id} className="grid grid-cols-[40px_1fr_auto] gap-3 items-center bg-danger/10 rounded-2xl px-3.5 py-3">
                <div className="w-10 h-10 rounded-full bg-danger/20 text-danger flex items-center justify-center text-[18px] font-bold">!</div>
                <div>
                  <div className="text-[14.5px] font-bold text-spc-dark">
                    {p.penalty_type === "abriss" ? "Abriss" : "Falsches Handling"}
                  </div>
                  <div className="text-[12px] text-ink-3">
                    {p.users?.nickname ?? p.users?.name ?? "?"} · {new Date(p.occurred_at).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })} Uhr
                  </div>
                </div>
                <div className="text-right text-[16px] font-bold num text-danger">
                  {p.points !== 0 ? p.points : "10 Min"}
                </div>
              </div>
            ))}
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
