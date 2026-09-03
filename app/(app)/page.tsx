import { requireAuth } from "@/lib/auth";
import { getActiveCompetition, getLatestCompetition, getLiveRanking, getTopFish, getCurrentCall, getUpcomingCalls, getAllCatches, getCompetitionFull } from "@/lib/queries";
import { supabaseAdmin } from "@/lib/supabase";
import { Icons, FishPhoto } from "@/components/Icons";
import { HomeClockCard } from "./live/LiveClient";
import Link from "next/link";

export const dynamic = "force-dynamic";
const SPECIES: any = { perch: "Barsch", zander: "Zander", pike: "Hecht" };

export default async function Dashboard() {
  const user = await requireAuth();
  const active = await getActiveCompetition();
  const comp = active ?? await getLatestCompetition();

  if (!comp) return <EmptyState nickname={user.nickname ?? user.name} />;
  if (comp.status === "prep") return <PrepState comp={comp} />;
  if (comp.status === "finished") return <FinishedState comp={comp} />;

  const [ranking, topFish, currentCalls, upcoming, allCatches, compFull] = await Promise.all([
    getLiveRanking(comp.id), getTopFish(comp.id),
    getCurrentCall(comp.id), getUpcomingCalls(comp.id, 4),
    getAllCatches(comp.id), getCompetitionFull(comp.id),
  ]);

  const me = ranking.find((r: any) => r.user_id === user.id);
  const myCall = currentCalls.find((c: any) => c.user_id === user.id);
  const anyCall = currentCalls[0];
  const lastCatch = allCatches[0];
  const totalCatches = allCatches.length;
  const totalPoints = ranking.reduce((s: number, r: any) => s + (r.points ?? 0), 0);
  const usersById = new Map(compFull.users.map(u => [u.id, u]));
  const teilnehmerCount = compFull.members.length;
  const bootCount = compFull.boats.length;

  const displayCall = myCall ?? anyCall;

  return (
    <div>
      {/* Welcome Header */}
      <div className="mb-4">
        <div className="text-[11px] font-bold text-spc-mid uppercase tracking-widest mb-1">{comp.name} · Läuft</div>
        <h1 className="text-2xl sm:text-3xl font-bold text-spc-dark tracking-tight">Moin, {user.nickname ?? user.name}</h1>
        <p className="text-[14px] text-ink-2 mt-1 max-w-[56ch]">
          {ranking[0]?.points > 0
            ? (ranking[0].user_id === user.id
                ? `Du führst mit ${ranking[0].points} Punkten.`
                : `Aktuell führt ${ranking[0].nickname ?? ranking[0].display_name} mit ${ranking[0].points} Punkten — dein Rückstand: ${(ranking[0].points ?? 0) - (me?.points ?? 0)}.`)
            : "Der Wettkampf läuft, noch keine Fänge."}
        </p>
      </div>

      {/* Wettkampfuhr */}
      {comp.start_at && comp.end_at && <HomeClockCard startAt={comp.start_at} endAt={comp.end_at} />}

      {/* Aktueller Call mit Fortschrittsbalken */}
      {displayCall && <CallCard call={displayCall} isMine={!!myCall} />}

      {/* KPI-Reihe mit Icons */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-4">
        <StatCard icon={<Icons.users className="w-7 h-7 text-spc-dark" />} label="Teilnehmer" value={teilnehmerCount} />
        <StatCard icon={<Icons.boat className="w-7 h-7 text-spc-dark" />} label="Boote" value={bootCount} />
        <StatCard icon={<Icons.fishFilled className="w-7 h-7 text-spc-dark" />} label="Fänge (Gesamt)" value={totalCatches} />
        <StatCard icon={<Icons.trophyFilled className="w-7 h-7 text-spc-dark" />} label="Punkte (Gesamt)" value={totalPoints.toLocaleString("de-DE")} />
      </div>

      {/* Top-Fisch + Letzter Fang — große Karten wie im Mockup */}
      {(topFish || lastCatch) && (
        <div className="grid sm:grid-cols-2 gap-3 mb-4">
          {topFish && (
            <BigFishCard
              label="TOP-FISCH"
              species={topFish.species}
              lengthCm={topFish.length_cm}
              points={topFish.total_points}
              userName={usersById.get(topFish.user_id)?.name ?? usersById.get(topFish.user_id)?.nickname ?? "—"}
              timeStr={new Date(topFish.caught_at).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}
              extra={topFish.topwater ? "Topwater" : undefined}
              accentGold
            />
          )}
          {lastCatch && (
            <BigFishCard
              label="LETZTER FANG"
              species={lastCatch.species}
              lengthCm={lastCatch.length_cm}
              points={lastCatch.total_points}
              userName={usersById.get(lastCatch.user_id)?.name ?? usersById.get(lastCatch.user_id)?.nickname ?? "—"}
              timeStr={new Date(lastCatch.caught_at).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}
              extra={lastCatch.topwater ? "Topwater" : undefined}
            />
          )}
        </div>
      )}

      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-3">
        {/* Timeline aller Fänge */}
        <div className="bg-white rounded-3xl p-5 shadow-cs-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[11px] uppercase tracking-widest text-ink-3 font-bold">Timeline</div>
              <div className="text-[16px] font-bold text-spc-dark">Alle Fänge · chronologisch</div>
            </div>
            <div className="text-[11px] text-ink-3">{allCatches.length} Einträge</div>
          </div>

          {allCatches.length === 0 && (
            <div className="text-center py-6">
              <div className="text-[13.5px] text-ink-3 italic">Noch keine Fänge. Trag den ersten ein!</div>
              <Link href="/fang" className="inline-block mt-3 px-4 py-2 rounded-xl bg-spc-dark text-white text-[13px] font-bold">Fang eintragen →</Link>
            </div>
          )}

          {allCatches.length > 0 && (
            <div className="relative pl-8">
              {/* Vertikale Linie */}
              <div className="absolute left-[13px] top-2 bottom-2 w-[2px] bg-spc-lighter" />
              <div className="space-y-3">
                {allCatches.slice(0, 12).map((c: any) => {
                  const u = usersById.get(c.user_id);
                  const isTop = topFish?.id === c.id;
                  return (
                    <div key={c.id} className="relative">
                      {/* Timeline-Dot */}
                      <div className={`absolute -left-[26px] top-3 w-6 h-6 rounded-full ring-4 ring-white flex items-center justify-center ${
                        isTop ? "bg-spc-gold" : c.is_valid && c.is_scored ? "bg-spc-mid" : c.is_valid ? "bg-ink-4" : "bg-danger"
                      }`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-white"/>
                      </div>

                      <div className={`grid grid-cols-[44px_1fr_auto] gap-3 items-center rounded-2xl px-3 py-2.5 ${
                        isTop ? "bg-spc-gold/10 border border-spc-gold/30" : c.is_valid ? "bg-spc-greyLight" : "bg-danger/10 opacity-75"
                      }`}>
                        <div className={`w-11 h-11 rounded-full overflow-hidden flex items-center justify-center ${isTop ? "bg-spc-gold/20" : "bg-white"}`}>
                          <FishPhoto species={c.species} className="w-full h-full object-contain" />
                        </div>
                        <div className="min-w-0">
                          <div className={`text-[14px] font-bold ${c.is_valid ? "text-spc-dark" : "text-ink-3 line-through"}`}>
                            {SPECIES[c.species]} · {c.length_cm} cm
                            {c.topwater && <span className="ml-1.5 inline-block bg-success/15 text-success text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Topwater</span>}
                            {isTop && <span className="ml-1.5 inline-block bg-spc-gold/25 text-spc-goldDeep text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Top</span>}
                          </div>
                          <div className="text-[11.5px] text-ink-3 truncate">
                            <Link href={`/spieler/${c.user_id}`} className="font-semibold text-ink-2 hover:text-spc-mid">
                              {u?.nickname ?? u?.name ?? "?"}
                            </Link>
                            {" · "}
                            {new Date(c.caught_at).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })} Uhr
                          </div>
                        </div>
                        <div className={`text-[18px] font-bold num ${!c.is_valid ? "text-danger" : c.is_scored ? "text-ink" : "text-ink-3"}`}>
                          {c.total_points}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {allCatches.length > 12 && (
                  <div className="relative">
                    <div className="absolute -left-[26px] top-2 w-6 h-6 rounded-full ring-4 ring-white bg-spc-lighter" />
                    <Link href={`/historie/${comp.id}`} className="block px-3 py-2 text-[13px] text-spc-mid font-semibold hover:underline">
                      + {allCatches.length - 12} weitere Fänge in der Historie ansehen →
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Nächste Calls */}
        {upcoming.length > 0 && (
          <div className="bg-white rounded-3xl p-5 shadow-cs-sm">
            <div className="text-[11px] uppercase tracking-widest text-ink-3 font-bold mb-3">Nächste Calls</div>
            <div className="space-y-1.5">
              {upcoming.map((c: any) => (
                <div key={c.id} className="grid grid-cols-[70px_1fr_auto] gap-3 items-center bg-spc-greyLight rounded-xl px-3 py-2 text-[13px]">
                  <div className="num font-semibold text-spc-dark">{new Date(c.start_at).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}</div>
                  <div>
                    <strong className="font-semibold text-[14px]">{c.users?.nickname ?? c.users?.name}</strong>
                    <span className="block text-[11.5px] text-ink-3">{({morning:"Morning",mid:"Mid",late:"Late"} as any)[c.call_type]}</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-spc-lighter text-spc-dark uppercase tracking-wider">{c.boats?.label?.split(" ").pop()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CallCard({ call, isMine }: { call: any; isMine: boolean }) {
  const start = new Date(call.start_at).getTime();
  const end = new Date(call.end_at).getTime();
  const now = Date.now();
  const progress = Math.max(0, Math.min(1, (now - start) / (end - start)));
  const label = ({ morning: "Morning Call", mid: "Mid Call", late: "Late Call" } as any)[call.call_type];
  const timeRange = `${new Date(call.start_at).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })} – ${new Date(call.end_at).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}`;

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-cs-sm mb-4">
      <div className="grid sm:grid-cols-[1fr_auto] gap-4 items-start">
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-widest font-bold text-ink-3 mb-1">
            {isMine ? "Dein Call" : "Aktueller Call"}
            {!isMine && call.users && <span className="ml-1.5 text-spc-mid">· {call.users.nickname ?? call.users.name}</span>}
          </div>
          <div className="text-[26px] sm:text-[30px] font-bold text-spc-dark tracking-tight leading-tight uppercase">{label}</div>
          <div className="text-[15px] text-ink-2 num mt-0.5">{timeRange}</div>
        </div>
        <div className="sm:text-right sm:min-w-[180px]">
          <div className="text-[11px] uppercase tracking-widest font-bold text-ink-3 mb-1">Verbleibend</div>
          <div className="text-[28px] sm:text-[32px] font-bold text-spc-dark num tracking-tight leading-none">{timeRemaining(call.end_at)}</div>
        </div>
      </div>
      <div className="h-2 bg-spc-greyLight rounded-full mt-4 overflow-hidden">
        <div className="h-full bg-success rounded-full transition-all" style={{ width: `${progress * 100}%` }} />
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="bg-white rounded-3xl px-4 py-4 shadow-cs-sm text-center">
      <div className="text-[10.5px] uppercase tracking-widest text-ink-3 font-bold">{label}</div>
      <div className="flex justify-center mt-3 mb-1.5">{icon}</div>
      <div className="text-[26px] font-bold num text-spc-dark leading-none">{value}</div>
    </div>
  );
}

function BigFishCard({ label, species, lengthCm, points, userName, timeStr, extra, accentGold }: {
  label: string; species: "perch" | "zander" | "pike"; lengthCm: number; points: number;
  userName: string; timeStr: string; extra?: string; accentGold?: boolean;
}) {
  return (
    <div className={`bg-white rounded-2xl p-4 shadow-cs-sm relative overflow-hidden ${accentGold ? "ring-1 ring-spc-gold/25" : ""}`}>
      {accentGold && <div className="absolute left-0 top-0 bottom-0 w-1 bg-spc-gold" />}
      <div className={`text-[10.5px] uppercase tracking-widest font-bold mb-2 ${accentGold ? "text-spc-goldDeep" : "text-ink-3"}`}>{label}</div>
      <div className="grid grid-cols-[64px_1fr_auto] gap-3 items-center">
        <div className="w-16 h-10 flex items-center justify-center shrink-0">
          <FishPhoto species={species} className="w-full h-full object-contain" />
        </div>
        <div className="min-w-0">
          <div className="text-[15.5px] font-bold text-spc-dark leading-tight truncate">{SPECIES[species]} {lengthCm} cm</div>
          <div className="text-[12px] text-ink-3 mt-0.5 truncate">
            {userName} · {timeStr}
            {extra && <span className="ml-1 inline-block bg-success/15 text-success text-[9.5px] px-1 py-0.5 rounded font-bold uppercase tracking-wider">TW</span>}
          </div>
        </div>
        <div className="text-right">
          <div className={`text-[24px] font-bold num leading-none ${accentGold ? "text-spc-gold" : "text-spc-dark"}`}>{points}</div>
          <div className="text-[9px] uppercase tracking-widest text-ink-3 font-bold mt-0.5">Pkt</div>
        </div>
      </div>
    </div>
  );
}

function timeRemaining(iso: string) {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return "beendet";
  const h = Math.floor(diff / 3600_000);
  const m = Math.floor((diff % 3600_000) / 60_000);
  const s = Math.floor((diff % 60_000) / 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function EmptyState({ nickname }: { nickname: string }) {
  return (
    <div>
      <section className="bg-cs-section rounded-3xl p-6 sm:p-8 mb-4">
        <div className="text-[11px] font-bold text-spc-mid uppercase tracking-widest mb-1">Kein Wettkampf</div>
        <h1 className="text-3xl font-bold text-spc-dark tracking-tight">Moin, {nickname}</h1>
        <p className="text-[14.5px] text-ink-2 mt-2 mb-5 max-w-[56ch]">Aktuell läuft kein SPC. Leg im Setup einen neuen an.</p>
        <Link href="/admin/wettkampf-neu" className="inline-block px-6 py-3 rounded-2xl bg-spc-dark text-white font-semibold shadow-cs-sm hover:bg-spc-mid transition">Zum Setup →</Link>
      </section>
    </div>
  );
}

function PrepState({ comp }: { comp: any }) {
  return (
    <section className="bg-cs-section rounded-3xl p-6 sm:p-8">
      <div className="text-[11px] font-bold text-spc-mid uppercase tracking-widest mb-1">In Vorbereitung</div>
      <h1 className="text-3xl font-bold text-spc-dark tracking-tight">{comp.name}</h1>
      <p className="text-[14.5px] text-ink-2 mt-2 mb-5 max-w-[56ch]">Der Wettkampf ist angelegt, aber noch nicht gestartet.</p>
      <Link href="/admin/wettkampf-neu" className="inline-block px-6 py-3 rounded-2xl bg-spc-dark text-white font-semibold shadow-cs-sm hover:bg-spc-mid transition">Zum Setup →</Link>
    </section>
  );
}

async function FinishedState({ comp }: { comp: any }) {
  const [ranking, topFish] = await Promise.all([getLiveRanking(comp.id), getTopFish(comp.id)]);
  const winner = ranking[0];
  const podium = ranking.slice(0, 3);
  return (
    <div>
      <section className="bg-cs-gradient shadow-cs rounded-3xl p-6 mb-4 text-white text-center">
        <div className="text-[11px] font-bold uppercase tracking-widest text-white/70 mb-1">🏁 Wettkampf beendet</div>
        <h1 className="text-3xl font-bold tracking-tight">{comp.name}</h1>
        {winner && (
          <div className="mt-5">
            <div className="text-[11px] uppercase tracking-widest text-white/60 font-bold mb-1">Sieger</div>
            <div className="text-[36px] font-bold leading-tight">🏆 {winner.nickname ?? winner.display_name}</div>
            <div className="text-[15px] text-white/85 mt-1">{winner.points ?? 0} Punkte · {winner.scored_count ?? 0} Fänge</div>
          </div>
        )}
      </section>

      {podium.length > 0 && (
        <div className="bg-white rounded-3xl p-5 shadow-cs-sm mb-3">
          <div className="text-[11px] uppercase tracking-widest text-ink-3 font-bold mb-3">Endstand · Podium</div>
          <div className="grid sm:grid-cols-3 gap-2.5">
            {podium.map((r: any, i: number) => {
              const styles = ["bg-gradient-to-br from-amber-300 to-amber-500 text-amber-950",
                              "bg-gradient-to-br from-gray-200 to-gray-400 text-gray-700",
                              "bg-gradient-to-br from-orange-300 to-orange-500 text-white"];
              const medals = ["🥇", "🥈", "🥉"];
              return (
                <div key={r.user_id} className={`rounded-2xl p-4 text-center ${styles[i]}`}>
                  <div className="text-4xl mb-1">{medals[i]}</div>
                  <div className="text-[16px] font-bold">{r.nickname ?? r.display_name}</div>
                  <div className="text-[13px] mt-0.5 opacity-90">{r.points ?? 0} Pkt</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {ranking.length > 3 && (
        <div className="bg-white rounded-3xl overflow-hidden shadow-cs-sm mb-3">
          <div className="px-5 pt-4 pb-2 text-[11px] uppercase tracking-widest text-ink-3 font-bold">Restliche Platzierungen</div>
          {ranking.slice(3).map((r: any, idx: number) => (
            <div key={r.user_id} className="grid grid-cols-[42px_1fr_68px] gap-3 items-center px-5 py-3 border-t border-black/[0.04]">
              <div className="w-8 h-8 rounded-full bg-spc-greyLight text-ink-3 flex items-center justify-center font-bold text-[14px] num">{idx + 4}</div>
              <div className="font-bold text-[15px]">{r.nickname ?? r.display_name}</div>
              <div className="text-right text-[18px] font-bold num">{r.points ?? 0}</div>
            </div>
          ))}
        </div>
      )}

      {topFish && (
        <div className="bg-white rounded-2xl px-4 py-3 shadow-cs-sm mb-3 flex items-center gap-3 relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-spc-gold" />
          <span className="text-[10px] uppercase tracking-widest text-spc-goldDeep font-bold pl-1">Top-Fisch</span>
          <div className="flex-1 text-[14px] font-bold text-spc-dark">
            {({perch:"Barsch",zander:"Zander",pike:"Hecht"} as any)[topFish.species]} {topFish.length_cm} cm
          </div>
          <div className="text-[18px] font-bold text-spc-gold num">{topFish.total_points}</div>
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        <Link href="/historie" className="px-5 py-3 rounded-2xl bg-spc-dark text-white font-semibold shadow-cs-sm">Alle Fänge ansehen</Link>
        <Link href="/hof" className="px-5 py-3 rounded-2xl bg-white text-spc-dark font-semibold shadow-cs-sm">Hall of Fame</Link>
      </div>
    </div>
  );
}
