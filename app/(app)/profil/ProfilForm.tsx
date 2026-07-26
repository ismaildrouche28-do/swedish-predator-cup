"use client";
import { useTransition, useState, useRef } from "react";
import { updateProfile, updateAvatar } from "./actions";

export function ProfilForm({ defaults }: { defaults: { name: string; nickname: string | null; avatar_url: string | null; email: string } }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ t: "ok" | "err"; m: string } | null>(null);
  const [avatar, setAvatar] = useState<string | null>(defaults.avatar_url);
  const fileRef = useRef<HTMLInputElement>(null);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    if (f.size > 3_000_000) return setMsg({ t: "err", m: "Bild zu groß (max 3 MB)" });
    const reader = new FileReader();
    reader.onload = () => start(async () => {
      const r = await updateAvatar(String(reader.result));
      if (r?.error) setMsg({ t: "err", m: r.error });
      else { setAvatar(r?.avatar_url ?? null); setMsg({ t: "ok", m: "Profilbild aktualisiert." }); }
    });
    reader.readAsDataURL(f);
  };

  return (
    <div className="bg-white rounded-3xl p-5 shadow-cs-sm">
      <div className="text-[11px] uppercase tracking-widest text-ink-3 font-bold mb-3">Persönliche Daten</div>

      <div className="flex items-center gap-4 mb-4">
        <div className="w-20 h-20 rounded-full bg-spc-lighter overflow-hidden flex items-center justify-center shrink-0">
          {avatar ? <img src={avatar} alt="" className="w-full h-full object-cover" /> :
            <span className="text-[28px] font-bold text-spc-mid">{(defaults.nickname ?? defaults.name).slice(0,1).toUpperCase()}</span>}
        </div>
        <div className="flex-1">
          <button type="button" onClick={() => fileRef.current?.click()} disabled={pending}
            className="px-4 py-2 rounded-xl bg-spc-lighter text-spc-dark text-[13px] font-bold hover:bg-spc-lighter/70 transition disabled:opacity-50">
            {pending ? "Lade…" : "Profilbild wählen"}
          </button>
          <p className="text-[11.5px] text-ink-3 mt-1">JPG/PNG/WEBP · max 3 MB</p>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFile} />
        </div>
      </div>

      <form action={(fd) => start(async () => {
        const r = await updateProfile(fd);
        if (r?.error) setMsg({ t: "err", m: r.error });
        else setMsg({ t: "ok", m: "Profil gespeichert." });
      })} className="space-y-3">
        <div>
          <label className="block text-[12px] font-bold text-spc-dark uppercase tracking-widest mb-1.5">Name</label>
          <input name="name" required defaultValue={defaults.name}
            className="w-full px-4 py-3 rounded-xl bg-spc-greyLight border border-transparent focus:border-spc-mid focus:bg-white outline-none text-[15px]" />
        </div>
        <div>
          <label className="block text-[12px] font-bold text-spc-dark uppercase tracking-widest mb-1.5">Nickname</label>
          <input name="nickname" defaultValue={defaults.nickname ?? ""} placeholder="Optional — z.B. Pikeslayer"
            className="w-full px-4 py-3 rounded-xl bg-spc-greyLight border border-transparent focus:border-spc-mid focus:bg-white outline-none text-[15px]" />
        </div>
        <div>
          <label className="block text-[12px] font-bold text-spc-dark uppercase tracking-widest mb-1.5">E-Mail</label>
          <div className="px-4 py-3 rounded-xl bg-spc-greyLight text-[14px] text-ink-3">{defaults.email}</div>
        </div>
        <button disabled={pending} className="w-full py-3 rounded-2xl bg-spc-dark text-white font-bold text-[15px] disabled:opacity-50 hover:bg-spc-mid transition">
          {pending ? "Speichere…" : "Speichern"}
        </button>
        {msg && <div className={`text-[13px] rounded-xl p-3 ${msg.t === "err" ? "bg-danger/10 text-danger" : "bg-success/10 text-success-dark font-semibold"}`} style={{color: msg.t === "ok" ? "#1a7a34" : undefined}}>{msg.m}</div>}
      </form>
    </div>
  );
}
