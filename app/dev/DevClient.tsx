"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function DevPageClient({ users }: { users: any[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  const seed = async () => {
    setMsg("Erstelle Profile…");
    await fetch("/api/dev/seed", { method: "POST" });
    setMsg("Fertig. Profile in der DB angelegt.");
    router.refresh();
  };

  const use = (id: string) => start(async () => {
    await fetch("/api/set-profile", { method: "POST", headers: {"content-type":"application/json"}, body: JSON.stringify({ profileId: id }) });
    window.location.href = "/";
  });

  return (
    <div className="space-y-3">
      <button onClick={seed} className="w-full py-2.5 rounded-xl bg-white border border-spc-mid text-spc-mid font-bold text-[13px] hover:bg-spc-lighter/40">
        4 Test-Profile anlegen
      </button>
      {msg && <div className="text-[12.5px] text-ink-3 bg-spc-greyLight rounded-lg p-2">{msg}</div>}
      {users.length > 0 && (
        <div className="pt-2 border-t border-black/[0.06]">
          <div className="text-[11px] font-bold uppercase tracking-widest text-ink-3 mb-2">Als Test-User wechseln</div>
          <div className="space-y-1.5">
            {users.map(u => (
              <button key={u.id} disabled={pending} onClick={() => use(u.id)}
                className="w-full flex items-center gap-3 bg-spc-greyLight hover:bg-spc-lighter/60 disabled:opacity-50 rounded-xl px-3 py-2 text-left">
                <div className="w-8 h-8 rounded-full bg-spc-mid text-white flex items-center justify-center font-bold text-[13px]">
                  {(u.nickname ?? u.name).slice(0,1).toUpperCase()}
                </div>
                <div className="flex-1 text-[14px] font-semibold text-spc-dark">{u.nickname ?? u.name}</div>
                <div className="text-spc-mid font-bold">→</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
