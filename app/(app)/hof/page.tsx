import { requireAuth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

async function biggestBySpecies(species: "perch" | "zander" | "pike") {
  const { data } = await supabaseAdmin.from("catches").select("*, users(name, nickname), competitions(name, start_at)")
    .eq("species", species).eq("is_valid", true).order("length_cm", { ascending: false }).limit(1).maybeSingle();
  return data;
}
async function highestScore() {
  const { data } = await supabaseAdmin.from("live_ranking").select("*, competitions(name, start_at)")
    .order("points", { ascending: false }).limit(1).maybeSingle();
  if (!data) return null;
  const { data: user } = await supabaseAdmin.from("users").select("name, nickname").eq("id", (data as any).user_id).maybeSingle();
  return { ...data, user };
}
async function mostWins() {
  const { data: comps } = await supabaseAdmin.from("competitions").select("id").eq("status", "finished");
  if (!comps || comps.length === 0) return null;
  const winsByUser: Record<string, number> = {};
  for (const c of comps) {
    const { data: rows } = await supabaseAdmin.from("live_ranking").select("user_id, points").eq("competition_id", c.id).order("points", { ascending: false }).limit(1);
    if (rows && rows[0]) winsByUser[rows[0].user_id!] = (winsByUser[rows[0].user_id!] ?? 0) + 1;
  }
  const entries = Object.entries(winsByUser).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) return null;
  const [uid, count] = entries[0];
  const { data: user } = await supabaseAdmin.from("users").select("name, nickname").eq("id", uid).maybeSingle();
  return { user, count };
}
async function mostParticipations() {
  const { data: users } = await supabaseAdmin.from("users").select("id, name, nickname").eq("is_active", true);
  if (!users) return null;
  const counts: any[] = [];
  for (const u of users) {
    const { count } = await supabaseAdmin.from("catches").select("competition_id", { count: "exact", head: true }).eq("user_id", u.id);
    counts.push({ user: u, count: count ?? 0 });
  }
  counts.sort((a, b) => b.count - a.count);
  return counts[0] ?? null;
}

export default async function HofPage() {
  await requireAuth();
  const [pike, zander, perch, high, wins, part] = await Promise.all([
    biggestBySpecies("pike"), biggestBySpecies("zander"), biggestBySpecies("perch"),
    highestScore(), mostWins(), mostParticipations(),
  ]);

  return (
    <div>
      <section className="bg-cs-gradient shadow-cs rounded-3xl p-6 mb-4 text-white">
        <div className="text-[11px] font-bold uppercase tracking-widest text-white/70 mb-1">Ewige Bestenliste</div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Hall of Fame</h1>
        <p className="text-[14px] text-white/80 mt-1 max-w-[56ch]">Rekorde und Auszeichnungen über alle SPC-Ausgaben. Aktualisiert sich automatisch.</p>
      </section>

      <div className="grid sm:grid-cols-2 gap-2.5">
        <HofCard title="Größter Hecht" value={pike ? `${pike.length_cm} cm` : "—"} holder={pike ? holderText(pike) : "wird ermittelt"} year={pike ? yearOf(pike.competitions) : ""} />
        <HofCard title="Größter Zander" value={zander ? `${zander.length_cm} cm` : "—"} holder={zander ? holderText(zander) : "wird ermittelt"} year={zander ? yearOf(zander.competitions) : ""} />
        <HofCard title="Größter Barsch" value={perch ? `${perch.length_cm} cm` : "—"} holder={perch ? holderText(perch) : "wird ermittelt"} year={perch ? yearOf(perch.competitions) : ""} />
        <HofCard title="Höchste Punktzahl" value={high ? `${(high as any).points} P` : "—"} holder={high ? ((high as any).user?.nickname ?? (high as any).user?.name ?? "—") : "wird ermittelt"} year={high ? yearOf((high as any).competitions) : ""} />
        <HofCard title="Häufigster Sieger" value={wins ? (wins.user?.nickname ?? wins.user?.name ?? "—") : "—"} holder={wins ? `${wins.count}× gewonnen` : "wird ermittelt"} year={wins ? `${wins.count}×` : ""} isCount />
        <HofCard title="Meiste Teilnahmen" value={part ? (part.user.nickname ?? part.user.name) : "—"} holder={part ? `${part.count} Fänge insgesamt` : "wird ermittelt"} year={part ? String(part.count) : ""} isCount />
      </div>
    </div>
  );
}

function yearOf(c: any) { return c?.start_at ? String(new Date(c.start_at).getFullYear()) : ""; }
function holderText(c: any) { return `${c.users?.nickname ?? c.users?.name ?? "—"} · ${c.competitions?.name ?? ""}`; }

function HofCard({ title, value, holder, year, isCount }: any) {
  return (
    <div className="bg-white rounded-3xl p-5 shadow-cs-sm grid grid-cols-[1fr_auto] gap-4 items-center relative overflow-hidden">
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-spc-gold" />
      <div className="pl-2">
        <div className="text-[10px] uppercase tracking-widest font-bold text-spc-goldDeep mb-1.5">{title}</div>
        <div className="text-[20px] font-bold text-spc-dark leading-tight">{value}</div>
        <div className="text-[12.5px] text-ink-3 mt-1">{holder}</div>
      </div>
      <div className="text-center">
        <div className="text-[24px] font-bold text-spc-gold num leading-none">{year || "—"}</div>
        <div className="text-[9px] uppercase tracking-widest text-ink-3 font-bold mt-1">{isCount ? "Anzahl" : "Jahr"}</div>
      </div>
    </div>
  );
}
