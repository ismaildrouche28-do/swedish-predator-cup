import { supabaseAdmin } from "@/lib/supabase";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

async function setupPresets() {
  "use server";
  const presets = [
    { name: "Admin",              nickname: "Admin",       is_admin: true  },
    { name: "Erik Kappel",        nickname: "Erik K.",     is_admin: false },
    { name: "Tim Mußmann",        nickname: "Tim M.",      is_admin: false },
    { name: "Jan Dierking",       nickname: "Jan D.",      is_admin: false },
    { name: "Stefan Schlichting", nickname: "Stefan S.",   is_admin: false },
    { name: "Denis Stuchlik",     nickname: "Denis S.",    is_admin: false },
  ];
  for (const p of presets) {
    const { data: existing } = await supabaseAdmin.from("users").select("id").eq("name", p.name).maybeSingle();
    if (existing) {
      await supabaseAdmin.from("users").update({ nickname: p.nickname, is_admin: p.is_admin, is_active: true, onboarding_done: true }).eq("id", existing.id);
    } else {
      await supabaseAdmin.from("users").insert({ ...p, is_active: true, onboarding_done: true });
    }
  }
  redirect("/profil-waehlen");
}

export default function SetupInitial() {
  return (
    <main className="min-h-screen bg-cs-gradient flex flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-cs p-7 text-center">
        <div className="text-3xl mb-2">🎣</div>
        <h1 className="text-[22px] font-bold text-spc-dark tracking-tight mb-2">Erstsetup</h1>
        <p className="text-[14px] text-ink-2 mb-5">Legt Admin + die 5 SPC-Teilnehmer an (Erik K., Tim M., Jan D., Stefan S., Denis S.)</p>
        <form action={setupPresets}>
          <button className="w-full py-3.5 rounded-2xl bg-spc-dark text-white font-bold text-[15px] hover:bg-spc-mid transition">
            🎣 Los, alle anlegen
          </button>
        </form>
      </div>
    </main>
  );
}
