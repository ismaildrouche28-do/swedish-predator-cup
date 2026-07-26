import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { EditForm } from "./EditForm";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function EditWettkampf({ searchParams }: { searchParams: { id?: string } }) {
  await requireAdmin();
  if (!searchParams.id) return <div className="p-10">Kein Wettkampf ausgewählt.</div>;
  const { data: comp } = await supabaseAdmin.from("competitions").select("*").eq("id", searchParams.id).maybeSingle();
  if (!comp) return <div className="p-10">Wettkampf nicht gefunden.</div>;

  return (
    <div>
      <Link href="/admin" className="inline-flex items-center gap-1 text-[13px] text-spc-mid font-semibold mb-3">← Admin</Link>
      <section className="bg-cs-section rounded-3xl p-5 mb-4">
        <div className="text-[11px] font-bold text-spc-mid uppercase tracking-widest mb-1">Admin · Wettkampf</div>
        <h1 className="text-2xl sm:text-3xl font-bold text-spc-dark tracking-tight">{comp.name}</h1>
        <p className="text-[14px] text-ink-2 mt-1 max-w-[56ch]">Als Admin darfst du Grunddaten und Status ändern — auch während der Wettkampf läuft.</p>
      </section>
      <div className="max-w-[540px]">
        <EditForm comp={comp} />
      </div>
    </div>
  );
}
