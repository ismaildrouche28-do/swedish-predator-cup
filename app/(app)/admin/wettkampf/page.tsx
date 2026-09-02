import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { EditForm } from "./EditForm";
import { WettkampfSteuerung, CatchEditor } from "./AdminCatches";
import Link from "next/link";

export const dynamic = "force-dynamic";
const SPECIES: any = { perch: "Barsch", zander: "Zander", pike: "Hecht" };

export default async function EditWettkampf({ searchParams }: { searchParams: { id?: string } }) {
  requireAdmin();
  if (!searchParams.id) return <div className="p-10">Kein Wettkampf ausgewählt.</div>;

  const [{ data: comp }, { data: catches }, { data: penalties }, { data: users }] = await Promise.all([
    supabaseAdmin.from("competitions").select("*").eq("id", searchParams.id).maybeSingle(),
    supabaseAdmin.from("catches").select("*").eq("competition_id", searchParams.id).order("caught_at", { ascending: false }),
    supabaseAdmin.from("penalties").select("*, users(name, nickname)").eq("competition_id", searchParams.id).order("occurred_at", { ascending: false }),
    supabaseAdmin.from("users").select("id, name, nickname"),
  ]);

  if (!comp) return <div className="p-10">Wettkampf nicht gefunden.</div>;
  const usersById = new Map((users ?? []).map(u => [u.id, u]));

  return (
    <div>
      <Link href="/admin" className="inline-flex items-center gap-1 text-[13px] text-spc-mid font-semibold mb-3">← Admin</Link>
      <section className="bg-cs-section rounded-3xl p-5 mb-4">
        <div className="text-[11px] font-bold text-spc-mid uppercase tracking-widest mb-1">Admin · Wettkampf</div>
        <h1 className="text-2xl sm:text-3xl font-bold text-spc-dark tracking-tight">{comp.name}</h1>
        <p className="text-[14px] text-ink-2 mt-1 max-w-[56ch]">Steuerung, Grunddaten, Fänge und Strafen korrigieren.</p>
      </section>

      {/* Wettkampfuhr / Steuerung */}
      <div className="bg-white rounded-3xl p-5 shadow-cs-sm mb-3">
        <div className="text-[16px] font-bold text-spc-dark mb-1">Wettkampf-Steuerung</div>
        <p className="text-[13px] text-ink-3 mb-3">Aktueller Status: <strong className="text-spc-dark">{comp.status}</strong></p>
        <WettkampfSteuerung competitionId={comp.id} status={comp.status} />
      </div>

      {/* Grunddaten */}
      <div className="max-w-[540px] mb-3">
        <EditForm comp={comp} />
      </div>

      {/* Fänge editieren/löschen */}
      <div className="bg-white rounded-3xl p-5 shadow-cs-sm mb-3">
        <div className="text-[16px] font-bold text-spc-dark mb-1">Fänge korrigieren</div>
        <p className="text-[13px] text-ink-3 mb-3">Klick auf ✎ zum Bearbeiten oder 🗑 zum Löschen.</p>
        <div className="space-y-1.5">
          {(catches ?? []).length === 0 && <div className="text-[13.5px] text-ink-3 italic py-3">Keine Fänge im Wettkampf.</div>}
          {(catches ?? []).map((c: any) => {
            const u = usersById.get(c.user_id);
            return (
              <CatchEditor key={c.id} c={c} userName={u?.nickname ?? u?.name ?? "?"} />
            );
          })}
        </div>
      </div>

      {/* Strafen */}
      {(penalties ?? []).length > 0 && (
        <div className="bg-white rounded-3xl p-5 shadow-cs-sm">
          <div className="text-[16px] font-bold text-spc-dark mb-3">Strafen</div>
          <div className="space-y-1.5">
            {(penalties ?? []).map((p: any) => (
              <div key={p.id} className="grid grid-cols-[1fr_auto] gap-3 items-center bg-danger/10 rounded-xl px-3 py-2">
                <div>
                  <div className="text-[14px] font-bold text-spc-dark">
                    {p.penalty_type === "abriss" ? "Abriss" : "Handling"} · {p.users?.nickname ?? p.users?.name ?? "?"}
                  </div>
                  <div className="text-[11.5px] text-ink-3">{new Date(p.occurred_at).toLocaleString("de-DE")} · {p.points || "10 Min"}</div>
                </div>
                <form action={`/api/admin/delete-penalty?id=${p.id}`} method="post">
                  <button className="text-[11.5px] text-danger font-semibold hover:underline">löschen</button>
                </form>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
