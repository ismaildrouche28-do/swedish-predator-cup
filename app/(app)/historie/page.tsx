import { requireAuth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function HistoriePage() {
  await requireAuth();
  const { data: comps } = await supabaseAdmin.from("competitions").select("*").order("start_at", { ascending: false, nullsFirst: false });

  // Anzahl Fänge pro Wettkampf
  const catchCounts: Record<string, number> = {};
  for (const c of comps ?? []) {
    const { count } = await supabaseAdmin.from("catches").select("id", { count: "exact", head: true }).eq("competition_id", c.id);
    catchCounts[c.id] = count ?? 0;
  }

  return (
    <div>
      <section className="bg-cs-section rounded-3xl p-5 mb-4">
        <div className="text-[11px] font-bold text-spc-mid uppercase tracking-widest mb-1">Archiv</div>
        <h1 className="text-2xl sm:text-3xl font-bold text-spc-dark tracking-tight">Historie</h1>
        <p className="text-[14px] text-ink-2 mt-1 max-w-[56ch]">Jede SPC-Ausgabe. Klick auf eine Zeile für alle Fänge, Endstand und Details.</p>
      </section>

      <div className="space-y-2">
        {(comps ?? []).length === 0 && (
          <div className="bg-white rounded-3xl p-10 text-center text-ink-3 text-[14px] shadow-cs-sm">
            Noch keine Wettkämpfe archiviert.
          </div>
        )}
        {(comps ?? []).map((c: any) => {
          const year = c.start_at ? new Date(c.start_at).getFullYear() : new Date(c.created_at).getFullYear();
          const dateRange = c.start_at && c.end_at
            ? `${new Date(c.start_at).toLocaleDateString("de-DE")} – ${new Date(c.end_at).toLocaleDateString("de-DE")}`
            : c.start_at ? new Date(c.start_at).toLocaleDateString("de-DE") : "—";
          const statusLabel: any = { prep: "in Vorbereitung", running: "läuft", paused: "pausiert", finished: "beendet" }[c.status];
          const isLive = c.status === "running";
          return (
            <Link key={c.id} href={`/historie/${c.id}`}
              className="bg-white rounded-3xl px-5 py-4 grid grid-cols-[70px_1fr_auto] gap-4 items-center hover:bg-spc-lighter/40 transition shadow-cs-sm">
              <div className="text-[28px] font-bold text-spc-mid num leading-none">{year}</div>
              <div>
                <div className="font-bold text-[16px] text-spc-dark flex items-center gap-1.5">
                  {c.name}
                  {isLive && <span className="pulse-dot inline-block w-1.5 h-1.5 rounded-full bg-success"/>}
                </div>
                <div className="text-[12.5px] text-ink-3">
                  {dateRange} · {c.location ?? "Ort offen"} · {catchCounts[c.id] ?? 0} Fänge
                  {c.status !== "finished" && <> · <em className="not-italic text-success font-bold">{statusLabel}</em></>}
                </div>
              </div>
              <div className="text-spc-mid text-xl">›</div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
