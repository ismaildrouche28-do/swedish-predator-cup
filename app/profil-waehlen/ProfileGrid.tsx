"use client";
import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";

export function ProfileGrid({ profiles }: { profiles: any[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  const pick = (id: string) => start(async () => {
    setErr(null);
    const r = await fetch("/api/set-profile", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ profileId: id }),
    });
    if (!r.ok) return setErr("Fehler beim Wechseln");
    router.push("/");
    router.refresh();
  });

  if (profiles.length === 0) return (
    <div className="text-center py-10">
      <div className="text-5xl mb-3">👤</div>
      <div className="text-[16px] font-bold text-spc-dark mb-2">Noch keine Profile</div>
      <p className="text-[13.5px] text-ink-3 mb-4">Der Admin muss zuerst Teilnehmer anlegen.</p>
      <a href="/admin/login" className="inline-block px-5 py-2.5 rounded-xl bg-spc-dark text-white text-[13px] font-bold">Zum Admin-Bereich</a>
    </div>
  );

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {profiles.map(p => (
          <button key={p.id} disabled={pending} onClick={() => pick(p.id)}
            className="rounded-2xl p-4 bg-spc-greyLight hover:bg-spc-lighter/60 disabled:opacity-50 text-center transition group">
            <div className="w-20 h-20 mx-auto rounded-full bg-spc-mid text-white flex items-center justify-center text-[28px] font-bold overflow-hidden mb-2 group-hover:ring-4 group-hover:ring-spc-mid/30 transition">
              {p.avatar_url ? <img src={p.avatar_url} alt="" className="w-full h-full object-cover" /> : (p.nickname ?? p.name).slice(0,1).toUpperCase()}
            </div>
            <div className="text-[15px] font-bold text-spc-dark">{p.nickname ?? p.name}</div>
          </button>
        ))}
      </div>
      {err && <div className="text-[13px] rounded-xl p-3 mt-3" style={{background: "#fdecea", color: "#c22"}}>{err}</div>}
    </>
  );
}
