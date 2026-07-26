"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function DevPageClient({ users }: { users: any[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  const seed = async () => {
    setMsg("Erstelle Test-User…");
    const r = await fetch("/api/dev/seed", { method: "POST" });
    const j = await r.json();
    setMsg(`Fertig. Passwort für alle: ${j.password}`);
    router.refresh();
  };

  const loginAs = (email: string) => start(async () => {
    const r = await fetch("/api/dev/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email }),
      redirect: "manual",
    });
    if (r.status === 0 || r.type === "opaqueredirect" || r.ok) {
      window.location.href = "/";
    } else {
      const j = await r.json().catch(() => ({}));
      setMsg("Fehler: " + (j.error ?? r.status));
    }
  });

  if (users.length === 0) return (
    <div className="space-y-3">
      <p className="text-[13.5px] text-ink-2">Noch keine Test-User angelegt.</p>
      <button onClick={seed} className="w-full py-3.5 rounded-2xl bg-spc-dark text-white font-bold hover:bg-spc-mid transition">
        4 Test-User anlegen
      </button>
      {msg && <div className="text-[12.5px] text-ink-3 bg-spc-greyLight rounded-xl p-3">{msg}</div>}
    </div>
  );

  return (
    <div className="space-y-2">
      {users.map(u => (
        <button key={u.id} onClick={() => loginAs(u.email)} disabled={pending}
          className="w-full flex items-center gap-3 bg-spc-greyLight hover:bg-spc-lighter/60 disabled:opacity-50 rounded-2xl px-4 py-3 text-left transition">
          <div className="w-10 h-10 rounded-full bg-spc-mid text-white flex items-center justify-center font-bold text-[14px]">
            {(u.nickname ?? u.name).slice(0, 1).toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="text-[15px] font-bold text-spc-dark">{u.nickname ?? u.name}</div>
            <div className="text-[12px] text-ink-3">{u.email}</div>
          </div>
          <div className="text-spc-mid font-bold">→</div>
        </button>
      ))}
      <div className="pt-3 border-t border-black/[0.06] flex gap-2">
        <button onClick={seed} className="flex-1 py-2.5 rounded-xl bg-white border border-black/[0.08] text-[13px] font-semibold text-ink-2 hover:bg-spc-greyLight">
          Passwörter neu setzen
        </button>
        <form action="/api/logout" method="post" className="flex-1">
          <button className="w-full py-2.5 rounded-xl bg-white border border-black/[0.08] text-[13px] font-semibold text-ink-2 hover:bg-spc-greyLight">
            Abmelden
          </button>
        </form>
      </div>
      {msg && <div className="text-[12.5px] text-ink-3 bg-spc-greyLight rounded-xl p-3 mt-2">{msg}</div>}
    </div>
  );
}
