import { requireAuth } from "@/lib/auth";
import { getActiveCompetition } from "@/lib/queries";
import { supabaseAdmin } from "@/lib/supabase";
import { FangForm } from "./FangForm";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function FangPage() {
  await requireAuth();
  const comp = await getActiveCompetition();
  if (!comp) return (
    <div className="bg-white rounded-3xl p-10 text-center shadow-cs-sm">
      <div className="text-5xl mb-3">🎣</div>
      <div className="text-[20px] font-bold text-spc-dark mb-2">Kein laufender Wettkampf</div>
      <p className="text-ink-3 text-[14px] mb-5">Fänge können nur während eines laufenden SPC erfasst werden.</p>
      <Link href="/setup" className="inline-block px-5 py-3 rounded-2xl bg-spc-dark text-white font-bold shadow-cs-sm">Zum Setup</Link>
    </div>
  );
  const { data: settings } = await supabaseAdmin.from("competition_settings").select("topwater_bonus").eq("competition_id", comp.id).maybeSingle();

  return (
    <div>
      <section className="bg-cs-section rounded-3xl p-5 mb-4">
        <div className="text-[11px] font-bold text-spc-mid uppercase tracking-widest mb-1">Neuer Fang · {new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })} Uhr</div>
        <h1 className="text-2xl sm:text-3xl font-bold text-spc-dark tracking-tight">Fang erfassen</h1>
        <p className="text-[14px] text-ink-2 mt-1 max-w-[56ch]">So wenige Eingaben wie möglich. Punkte, Bonus und Slot-Zuordnung rechnet das System.</p>
      </section>
      <div className="max-w-[540px]">
        <FangForm competitionId={comp.id} topwaterBonus={settings?.topwater_bonus ?? 10} />
      </div>
    </div>
  );
}
