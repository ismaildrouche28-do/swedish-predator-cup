import { isAppUnlocked } from "@/lib/auth";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase";
import { pickProfile, logoutApp } from "./actions";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ProfilWaehlen() {
  if (!isAppUnlocked()) redirect("/login");

  const { data: profiles, error } = await supabaseAdmin
    .from("users")
    .select("id, name, nickname, avatar_url, is_admin")
    .eq("is_active", true)
    .order("is_admin", { ascending: false })
    .order("name");

  return (
    <main className="min-h-screen bg-cs-gradient flex flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-cs p-6 sm:p-8">
        <div className="text-center mb-6">
          <div className="text-3xl mb-2">🎣</div>
          <h1 className="text-[22px] sm:text-[26px] font-bold text-spc-dark tracking-tight">Wer bist du?</h1>
          <p className="text-[14px] text-ink-2 mt-1.5">Wähl dein Profil aus.</p>
        </div>

        {error && <div className="text-[13px] rounded-xl p-3 mb-3" style={{background:"#fdecea", color:"#c22"}}>Fehler: {error.message}</div>}

        {(!profiles || profiles.length === 0) ? (
          <div className="text-center py-10">
            <div className="text-5xl mb-3">👤</div>
            <div className="text-[16px] font-bold text-spc-dark mb-2">Noch keine Profile</div>
            <p className="text-[13.5px] text-ink-3 mb-4">Der Admin muss zuerst Teilnehmer anlegen.</p>
            <Link href="/admin/login" className="inline-block px-5 py-2.5 rounded-xl bg-spc-dark text-white text-[13px] font-bold">Zum Admin-Bereich</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {profiles.map((p: any) => (
              <form key={p.id} action={pickProfile}>
                <input type="hidden" name="profileId" value={p.id} />
                <button type="submit"
                  className={`w-full rounded-2xl p-4 text-center transition group ${
                    p.is_admin
                      ? "bg-spc-gold/15 border-2 border-spc-gold hover:bg-spc-gold/25"
                      : "bg-spc-greyLight hover:bg-spc-lighter/60"
                  }`}>
                  <div className={`w-20 h-20 mx-auto rounded-full text-white flex items-center justify-center text-[28px] font-bold overflow-hidden mb-2 group-hover:ring-4 transition ${
                    p.is_admin
                      ? "bg-spc-goldDeep group-hover:ring-spc-gold/30"
                      : "bg-spc-mid group-hover:ring-spc-mid/30"
                  }`}>
                    {p.avatar_url ? <img src={p.avatar_url} alt="" className="w-full h-full object-cover" /> : (p.nickname ?? p.name ?? "?").slice(0,1).toUpperCase()}
                  </div>
                  <div className={`text-[15px] font-bold ${p.is_admin ? "text-spc-goldDeep" : "text-spc-dark"}`}>
                    {p.nickname ?? p.name}
                  </div>
                  {p.is_admin && <div className="text-[10px] uppercase tracking-widest font-bold text-spc-goldDeep mt-0.5">Verwaltung</div>}
                </button>
              </form>
            ))}
          </div>
        )}

        <div className="mt-6 text-center border-t border-black/[0.06] pt-4 flex items-center justify-between">
          <Link href="/admin/login" className="text-[13px] text-spc-mid font-semibold hover:underline">Admin-PIN eingeben →</Link>
          <form action={logoutApp}>
            <button className="text-[12px] text-ink-3 hover:text-danger">Zugangscode zurücksetzen</button>
          </form>
        </div>
      </div>
    </main>
  );
}
