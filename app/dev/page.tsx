import { supabaseAdmin } from "@/lib/supabase";
import { DevPageClient } from "./DevClient";

export const dynamic = "force-dynamic";

async function getTestUsers() {
  const { data } = await supabaseAdmin
    .from("users")
    .select("id, email, name, nickname")
    
    .order("name");
  return data ?? [];
}

export default async function DevPage() {
  const users = await getTestUsers();
  return (
    <main className="min-h-screen bg-cs-gradient flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-cs p-7">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 mb-3">
            <span className="text-3xl">🎣</span>
            <span className="text-xl font-bold text-spc-dark">SPC</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-danger/15 text-danger uppercase tracking-widest">Dev</span>
          </div>
          <h1 className="text-[22px] font-bold text-spc-dark tracking-tight">Test-User</h1>
          <p className="text-[13px] text-ink-2 mt-1.5">One-Click-Login zum Testen. Nicht in Produktion nutzen.</p>
        </div>
        <DevPageClient users={users} />
      </div>
    </main>
  );
}
