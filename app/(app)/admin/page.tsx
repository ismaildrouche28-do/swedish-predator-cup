import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { KpiCard } from "@/components/KpiCard";
import { ProfileActions, CreateProfileForm, AdminLogoutButton } from "./AdminClient";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  requireAdmin();
  const [{ data: users }, { data: comps }, { count: totalCatches }] = await Promise.all([
    supabaseAdmin.from("users").select("*").order("name"),
    supabaseAdmin.from("competitions").select("*").order("created_at", { ascending: false }),
    supabaseAdmin.from("catches").select("id", { count: "exact", head: true }),
  ]);

  return (
    <div>
      <section className="bg-cs-gradient shadow-cs rounded-3xl p-5 mb-4 text-white">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-widest text-white/70 mb-1">Admin-Bereich</div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Verwaltung</h1>
          </div>
          <AdminLogoutButton />
        </div>
        <p className="text-[14px] text-white/80 mt-1 max-w-[56ch]">Profile verwalten, Wettkämpfe editieren, Daten korrigieren.</p>
      </section>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-4">
        <KpiCard label="Profile aktiv" value={(users ?? []).filter((u:any)=>u.is_active).length} accent />
        <KpiCard label="Profile inaktiv" value={(users ?? []).filter((u:any)=>!u.is_active).length} />
        <KpiCard label="Wettkämpfe" value={(comps ?? []).length} />
        <KpiCard label="Fänge insgesamt" value={totalCatches ?? 0} />
      </div>

      <div className="bg-white rounded-3xl p-5 shadow-cs-sm mb-3">
        <div className="text-[16px] font-bold text-spc-dark mb-1">Profile anlegen</div>
        <p className="text-[13px] text-ink-3 mb-3">Jeder Teilnehmer bekommt ein Profil. Es wird auf der Login-Seite zur Auswahl angezeigt.</p>
        <CreateProfileForm />
      </div>

      <div className="bg-white rounded-3xl p-5 shadow-cs-sm mb-3">
        <div className="text-[16px] font-bold text-spc-dark mb-3">Alle Profile ({(users ?? []).length})</div>
        <div className="space-y-1.5">
          {(users ?? []).map((u: any) => (
            <div key={u.id} className={`grid grid-cols-[40px_1fr_auto] gap-3 items-center rounded-xl px-3 py-2.5 ${u.is_active ? "bg-spc-greyLight" : "bg-spc-greyLight opacity-60"}`}>
              <div className="w-9 h-9 rounded-full overflow-hidden bg-spc-mid text-white flex items-center justify-center font-bold text-[13px]">
                {u.avatar_url ? <img src={u.avatar_url} alt="" className="w-full h-full object-cover"/> : (u.nickname ?? u.name).slice(0,1).toUpperCase()}
              </div>
              <div>
                <div className="text-[14.5px] font-bold text-spc-dark">
                  {u.nickname ?? u.name}
                  {!u.is_active && <span className="ml-1.5 inline-block bg-danger/20 text-danger text-[9.5px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Inaktiv</span>}
                </div>
                <div className="text-[11.5px] text-ink-3">{u.email ?? "(kein E-Mail)"}</div>
              </div>
              <ProfileActions id={u.id} isActive={u.is_active} />
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-3xl p-5 shadow-cs-sm">
        <div className="text-[16px] font-bold text-spc-dark mb-3">Wettkämpfe</div>
        <div className="space-y-1.5">
          {(comps ?? []).map((c: any) => (
            <Link key={c.id} href={`/admin/wettkampf?id=${c.id}`}
              className="grid grid-cols-[64px_1fr_100px_auto] gap-3 items-center bg-spc-greyLight rounded-xl px-3 py-2.5 hover:bg-spc-lighter/40 transition">
              <div className="text-[16px] font-bold text-spc-mid num">{c.start_at ? new Date(c.start_at).getFullYear() : "—"}</div>
              <div>
                <div className="text-[14.5px] font-bold text-spc-dark">{c.name}</div>
                <div className="text-[12px] text-ink-3">{c.location ?? "—"}</div>
              </div>
              <div className="text-[11px] font-bold px-2 py-1 rounded text-center uppercase tracking-wider bg-white text-ink-2">{c.status}</div>
              <div className="text-spc-mid font-bold">›</div>
            </Link>
          ))}
          {(comps ?? []).length === 0 && <div className="text-[13.5px] text-ink-3 italic py-3">Noch keine Wettkämpfe. Leg einen im <Link href="/setup" className="text-spc-mid font-semibold hover:underline">Setup</Link> an.</div>}
        </div>
      </div>
    </div>
  );
}
