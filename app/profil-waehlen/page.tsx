import { isAppUnlocked } from "@/lib/auth";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase";
import { ProfileGrid } from "./ProfileGrid";

export const dynamic = "force-dynamic";

export default async function ProfilWaehlen() {
  if (!isAppUnlocked()) redirect("/login");

  const { data: profiles } = await supabaseAdmin
    .from("users")
    .select("id, name, nickname, avatar_url")
    .eq("is_active", true)
    .order("name");

  return (
    <main className="min-h-screen bg-cs-gradient flex flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-cs p-6 sm:p-8">
        <div className="text-center mb-6">
          <div className="text-3xl mb-2">🎣</div>
          <h1 className="text-[22px] sm:text-[26px] font-bold text-spc-dark tracking-tight">Wer bist du?</h1>
          <p className="text-[14px] text-ink-2 mt-1.5">Wähl dein Profil aus.</p>
        </div>
        <ProfileGrid profiles={profiles ?? []} />
        <div className="mt-6 text-center border-t border-black/[0.06] pt-4">
          <a href="/admin/login" className="text-[13px] text-spc-mid font-semibold hover:underline">Admin-Bereich →</a>
        </div>
      </div>
    </main>
  );
}
