"use client";
import { useTransition, useState } from "react";
import { updateCompetitionMeta } from "../actions";

function localFromIso(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function EditForm({ comp }: { comp: any }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ t: "ok" | "err"; m: string } | null>(null);

  return (
    <form action={(fd) => start(async () => {
      const r = await updateCompetitionMeta(comp.id, fd);
      if (r?.error) setMsg({ t: "err", m: r.error });
      else setMsg({ t: "ok", m: "Gespeichert." });
    })} className="bg-white rounded-3xl p-5 shadow-cs-sm space-y-3">
      <div>
        <label className="block text-[12px] font-bold text-spc-dark uppercase tracking-widest mb-1.5">Name</label>
        <input name="name" required defaultValue={comp.name}
          className="w-full px-4 py-3 rounded-xl bg-spc-greyLight focus:bg-white outline-none text-[15px] border border-transparent focus:border-spc-mid" />
      </div>
      <div>
        <label className="block text-[12px] font-bold text-spc-dark uppercase tracking-widest mb-1.5">Ort</label>
        <input name="location" defaultValue={comp.location ?? ""}
          className="w-full px-4 py-3 rounded-xl bg-spc-greyLight focus:bg-white outline-none text-[15px] border border-transparent focus:border-spc-mid" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label className="block bg-spc-greyLight rounded-xl p-3">
          <span className="block text-[11px] text-ink-3 font-bold mb-1 uppercase tracking-widest">Angelstart</span>
          <input type="datetime-local" name="start_at" defaultValue={localFromIso(comp.start_at)} className="w-full bg-transparent outline-none text-[14px]" />
        </label>
        <label className="block bg-spc-greyLight rounded-xl p-3">
          <span className="block text-[11px] text-ink-3 font-bold mb-1 uppercase tracking-widest">Angelende</span>
          <input type="datetime-local" name="end_at" defaultValue={localFromIso(comp.end_at)} className="w-full bg-transparent outline-none text-[14px]" />
        </label>
      </div>
      <div>
        <label className="block text-[12px] font-bold text-spc-dark uppercase tracking-widest mb-1.5">Status</label>
        <select name="status" defaultValue={comp.status}
          className="w-full px-4 py-3 rounded-xl bg-spc-greyLight focus:bg-white outline-none text-[15px] border border-transparent focus:border-spc-mid">
          <option value="prep">Vorbereitung</option>
          <option value="running">Läuft</option>
          <option value="paused">Pausiert</option>
          <option value="finished">Beendet</option>
        </select>
      </div>
      <button disabled={pending} className="w-full py-3 rounded-2xl bg-spc-dark text-white font-bold text-[15px] disabled:opacity-50 hover:bg-spc-mid transition">
        {pending ? "Speichere…" : "Änderungen speichern"}
      </button>
      {msg && <div className={`text-[13px] rounded-xl p-3 ${msg.t === "err" ? "bg-danger/10 text-danger" : "bg-success/10"}`} style={{color: msg.t === "ok" ? "#1a7a34" : undefined}}>{msg.m}</div>}
    </form>
  );
}
