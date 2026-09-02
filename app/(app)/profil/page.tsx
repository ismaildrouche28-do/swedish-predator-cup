import { requireAuth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { ProfilForm } from "./ProfilForm";
import { KpiCard } from "@/components/KpiCard";
import Link from "next/link";

export const dynamic = "force-dynamic";
const SPECIES: any = { perch: "Barsch", zander: "Zander", pike: "Hecht" };

export default async function ProfilPage() {
  const user = await requireAuth();

  const [{ data: allCatches }, { data: comps }, { data: finishedComps }] = await Promise.all([
    supabaseAdmin.from("catches").select("*").eq("user_id", user.id).eq("is_valid", true),
    supabaseAdmin.from("catches").select("competition_id").eq("user_id", user.id),
    supabaseAdmin.from("competitions").select("id").eq("status", "finished"),
  ]);

  const totalCatches = allCatches?.length ?? 0;
  const compIds = new Set((comps ?? []).map((c: any) => c.competition_id));
  const teilnahmen = compIds.size;

  const bySpecies: any = { perch: 0, zander: 0, pike: 0 };
  for (const c of allCatches ?? []) bySpecies[c.species]++;

  const biggestPike = Math.max(0, ...(allCatches ?? []).filter((c:any)=>c.species==="pike").map((c:any)=>c.length_cm));
  const biggestZander = Math.max(0, ...(allCatches ?? []).filter((c:any)=>c.species==="zander").map((c:any)=>c.length_cm));
  const biggestPerch = Math.max(0, ...(allCatches ?? []).filter((c:any)=>c.species==="perch").map((c:any)=>c.length_cm));

  // Siege (Admin ausgeschlossen)
  const { data: admins } = await supabaseAdmin.from("users").select("id").eq("is_admin", true);
  const adminIds = new Set((admins ?? []).map((a: any) => a.id));
  let wins = 0;
  for (const fc of (finishedComps ?? [])) {
    const { data: rank } = await supabaseAdmin.from("live_ranking").select("user_id, points").eq("competition_id", fc.id).order("points", { ascending: false });
    const winner = (rank ?? []).find((r: any) => !adminIds.has(r.user_id));
    if (winner?.user_id === user.id) wins++;
  }

  // Achievements
  const achievements = [
    { key: "first_catch",   label: "Erster Fang",     hint: "1 Fang erfasst",              unlocked: totalCatches >= 1,    icon: "🎣" },
    { key: "ten_catches",   label: "Sammler",         hint: "10 Fänge insgesamt",          unlocked: totalCatches >= 10,   icon: "📦" },
    { key: "fifty_catches", label: "Vielangler",      hint: "50 Fänge insgesamt",          unlocked: totalCatches >= 50,   icon: "🐟" },
    { key: "all_species",   label: "Allrounder",      hint: "Alle 3 Arten gefangen",       unlocked: bySpecies.perch > 0 && bySpecies.zander > 0 && bySpecies.pike > 0, icon: "🎯" },
    { key: "big_pike",      label: "Hecht-König",     hint: "Hecht ≥ 90 cm",               unlocked: biggestPike >= 90,     icon: "👑" },
    { key: "big_zander",    label: "Zander-Meister",  hint: "Zander ≥ 75 cm",              unlocked: biggestZander >= 75,   icon: "⭐" },
    { key: "big_perch",     label: "Barsch-Spezialist",hint: "Barsch ≥ 40 cm",             unlocked: biggestPerch >= 40,    icon: "🥇" },
    { key: "winner",        label: "Sieger",          hint: "Einen SPC gewonnen",          unlocked: wins >= 1,             icon: "🏆" },
    { key: "veteran",       label: "Veteran",         hint: "3 SPCs teilgenommen",         unlocked: teilnahmen >= 3,       icon: "🎖️" },
  ];
  const unlockedCount = achievements.filter(a => a.unlocked).length;

  return (
    <div>
      <section className="bg-cs-section rounded-3xl p-5 mb-4">
        <div className="text-[11px] font-bold text-spc-mid uppercase tracking-widest mb-1">Dein Profil</div>
        <h1 className="text-2xl sm:text-3xl font-bold text-spc-dark tracking-tight">{user.nickname ?? user.name}</h1>
        <p className="text-[14px] text-ink-2 mt-1">{user.email}{user.is_admin && <span className="ml-2 inline-block bg-spc-gold/25 text-spc-goldDeep text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider">Admin</span>}</p>
      </section>

      <div className="grid lg:grid-cols-[1fr_1fr] gap-3 mb-3">
        <ProfilForm defaults={{ name: user.name, nickname: user.nickname, avatar_url: user.avatar_url, email: user.email }} />

        <div className="bg-white rounded-3xl p-5 shadow-cs-sm">
          <div className="text-[11px] uppercase tracking-widest text-ink-3 font-bold mb-3">Deine Bilanz</div>
          <div className="grid grid-cols-2 gap-2.5 mb-4">
            <KpiCard label="Fänge (gesamt)" value={totalCatches} accent />
            <KpiCard label="Teilnahmen" value={teilnahmen} />
            <KpiCard label="Siege" value={wins} />
            <KpiCard label="Größter Hecht" value={biggestPike ? `${biggestPike} cm` : "—"} />
          </div>
          <Link href="/stats" className="text-[13px] text-spc-mid font-semibold hover:underline">Ausführliche Statistik →</Link>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-5 shadow-cs-sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-[11px] uppercase tracking-widest text-ink-3 font-bold">Achievements</div>
            <div className="text-[16px] font-bold text-spc-dark">{unlockedCount}/{achievements.length} freigeschaltet</div>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {achievements.map(a => (
            <div key={a.key} className={`rounded-2xl p-3.5 text-center border-2 transition ${a.unlocked ? "bg-spc-gold/10 border-spc-gold/30" : "bg-spc-greyLight border-transparent opacity-60"}`}>
              <div className="text-[32px] leading-none mb-1.5">{a.icon}</div>
              <div className={`text-[13px] font-bold ${a.unlocked ? "text-spc-dark" : "text-ink-3"}`}>{a.label}</div>
              <div className={`text-[11px] mt-0.5 ${a.unlocked ? "text-spc-goldDeep" : "text-ink-3"}`}>{a.hint}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
