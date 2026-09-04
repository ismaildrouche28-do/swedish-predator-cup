"use client";
import { useTransition, useState } from "react";
import { updateCatchAsAdmin, deleteCatchAsAdmin, startCompetitionAdmin, pauseCompetitionAdmin, resumeCompetitionAdmin, finishCompetitionAdmin, createPenaltyAsAdmin, extendPauseAsAdmin, deletePenaltyAsAdmin } from "../actions";

function toLocalInput(v: string | null | undefined): string {
  if (!v) return "";
  const d = new Date(v);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const SPECIES: any = { perch: "Barsch", zander: "Zander", pike: "Hecht" };

export function WettkampfSteuerung({ competitionId, status }: { competitionId: string; status: string }) {
  const [pending, start] = useTransition();
  const btn = "px-4 py-2.5 rounded-xl text-white font-bold text-[13px] disabled:opacity-50 transition";
  return (
    <div className="flex flex-wrap gap-2">
      {status === "prep" && (
        <button onClick={() => start(() => startCompetitionAdmin(competitionId))} disabled={pending}
          className={`${btn} bg-success hover:bg-success/90`}>▶ Wettkampf starten</button>
      )}
      {status === "running" && (
        <>
          <button onClick={() => start(() => pauseCompetitionAdmin(competitionId))} disabled={pending}
            className={`${btn} bg-warn hover:bg-warn/90`}>⏸ Pausieren</button>
          <button onClick={() => start(() => finishCompetitionAdmin(competitionId))} disabled={pending}
            className={`${btn} bg-danger hover:bg-danger/90`}>⏹ Beenden</button>
        </>
      )}
      {status === "paused" && (
        <>
          <button onClick={() => start(() => resumeCompetitionAdmin(competitionId))} disabled={pending}
            className={`${btn} bg-success hover:bg-success/90`}>▶ Fortsetzen</button>
          <button onClick={() => start(() => finishCompetitionAdmin(competitionId))} disabled={pending}
            className={`${btn} bg-danger hover:bg-danger/90`}>⏹ Beenden</button>
        </>
      )}
      {status === "finished" && (
        <div className="text-[13px] text-ink-3">Wettkampf ist beendet. Neuen Wettkampf im Setup anlegen.</div>
      )}
    </div>
  );
}

export function CatchEditor({ c, userName }: { c: any; userName: string }) {
  const [editing, setEditing] = useState(false);
  const [pending, start] = useTransition();
  const [length, setLength] = useState(c.length_cm.toString());
  const [topwater, setTopwater] = useState(c.topwater);
  const [species, setSpecies] = useState(c.species);
  const [err, setErr] = useState<string | null>(null);

  if (editing) {
    return (
      <div className="rounded-xl p-3 bg-spc-lighter/40 space-y-2">
        <div className="text-[11px] font-bold text-spc-mid uppercase tracking-widest">Bearbeiten · {userName}</div>
        <div className="flex flex-wrap gap-2">
          <select value={species} onChange={(e) => setSpecies(e.target.value)}
            className="px-3 py-2 rounded-lg bg-white text-[13px] font-semibold border border-black/[0.10]">
            <option value="perch">Barsch</option>
            <option value="zander">Zander</option>
            <option value="pike">Hecht</option>
          </select>
          <input type="text" inputMode="numeric" value={length} onChange={(e) => setLength(e.target.value.replace(/\D/g, ""))}
            className="w-24 px-3 py-2 rounded-lg bg-white text-[13px] font-semibold border border-black/[0.10]" placeholder="cm" />
          <label className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white text-[13px] font-semibold cursor-pointer border border-black/[0.10]">
            <input type="checkbox" checked={topwater} onChange={(e) => setTopwater(e.target.checked)} /> Topwater
          </label>
        </div>
        <div className="flex gap-2">
          <button onClick={() => start(async () => {
            const fd = new FormData();
            fd.set("length_cm", length);
            fd.set("topwater", topwater ? "1" : "0");
            fd.set("species", species);
            const r = await updateCatchAsAdmin(c.id, fd);
            if (r?.error) { setErr(r.error); return; }
            setEditing(false);
          })} disabled={pending}
            className="px-4 py-1.5 rounded-lg bg-spc-dark text-white text-[12px] font-bold disabled:opacity-50">
            {pending ? "…" : "Speichern"}
          </button>
          <button onClick={() => setEditing(false)} className="px-3 py-1.5 rounded-lg bg-white text-ink-3 text-[12px] font-semibold border border-black/[0.10]">Abbrechen</button>
        </div>
        {err && <div className="text-[12px] text-danger">{err}</div>}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[1fr_auto] gap-3 items-center bg-spc-greyLight rounded-xl px-3 py-2">
      <div>
        <div className={`text-[14px] font-bold ${c.is_valid ? "text-spc-dark" : "text-ink-3 line-through"}`}>
          {SPECIES[c.species]} {c.length_cm} cm
          {c.topwater && <span className="ml-1.5 inline-block bg-success/15 text-success text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">TW</span>}
          {c.is_scored && <span className="ml-1.5 inline-block bg-spc-mid/15 text-spc-mid text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Gewertet</span>}
        </div>
        <div className="text-[11.5px] text-ink-3">
          {userName} · {new Date(c.caught_at).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })} · {c.total_points} Pkt
        </div>
      </div>
      <div className="flex gap-1">
        <button onClick={() => setEditing(true)} className="w-8 h-8 rounded-lg bg-white text-spc-mid text-[13px] hover:bg-spc-lighter/40" title="Bearbeiten">✎</button>
        <button onClick={() => { if (confirm("Fang wirklich löschen?")) start(() => deleteCatchAsAdmin(c.id)); }} disabled={pending}
          className="w-8 h-8 rounded-lg bg-white text-danger text-[13px] hover:bg-danger/10" title="Löschen">🗑</button>
      </div>
    </div>
  );
}

// Strafe manuell setzen
export function PenaltyForm({ competitionId, users }: { competitionId: string; users: { id: string; label: string }[] }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ t: "ok" | "err"; m: string } | null>(null);
  return (
    <form
      action={(fd) => start(async () => {
        setMsg(null);
        const r = await createPenaltyAsAdmin(competitionId, fd);
        if (r?.error) setMsg({ t: "err", m: r.error });
        else setMsg({ t: "ok", m: "Strafe erfasst." });
      })}
      className="grid gap-2 sm:grid-cols-[1fr_150px_auto] bg-spc-greyLight rounded-2xl p-3 items-center">
      <select name="user_id" required
        className="w-full px-3 py-2.5 rounded-xl bg-white text-[13.5px] font-semibold border border-black/[0.10] outline-none focus:border-spc-mid">
        <option value="">Teilnehmer wählen…</option>
        {users.map(u => <option key={u.id} value={u.id}>{u.label}</option>)}
      </select>
      <select name="penalty_type" defaultValue="handling"
        className="w-full px-3 py-2.5 rounded-xl bg-white text-[13.5px] font-semibold border border-black/[0.10] outline-none focus:border-spc-mid">
        <option value="handling">Handling (−0 Pkt, 10 Min Sperre)</option>
        <option value="abriss">Abriss (−20 Pkt)</option>
      </select>
      <button disabled={pending} className="px-4 py-2.5 rounded-xl bg-danger text-white font-bold text-[13.5px] disabled:opacity-50">
        {pending ? "…" : "Strafe erfassen"}
      </button>
      {msg && <div className={`sm:col-span-3 text-[12.5px] rounded-lg p-2 ${msg.t === "err" ? "bg-danger/10 text-danger" : "bg-success/15 text-success-dark font-semibold"}`}>{msg.m}</div>}
    </form>
  );
}

// Strafe löschen
export function DeletePenaltyButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      onClick={() => { if (confirm("Strafe wirklich löschen?")) start(() => deletePenaltyAsAdmin(id)); }}
      disabled={pending}
      className="text-[11.5px] text-danger font-semibold hover:underline">
      {pending ? "…" : "löschen"}
    </button>
  );
}

// Pause-Fenster + verlängern
export function PauseWindow({ competitionId, pauseStart, pauseEnd }: { competitionId: string; pauseStart: string | null; pauseEnd: string | null }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ t: "ok" | "err"; m: string } | null>(null);
  const fmt = (v: string | null) => v ? new Date(v).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—";
  return (
    <div>
      <div className="grid sm:grid-cols-2 gap-2 mb-3">
        <div className="bg-spc-greyLight rounded-xl px-3 py-2.5">
          <div className="text-[10px] uppercase tracking-widest text-ink-3 font-bold">Pause ab</div>
          <div className="text-[14px] font-bold text-spc-dark num">{fmt(pauseStart)}</div>
        </div>
        <div className="bg-spc-greyLight rounded-xl px-3 py-2.5">
          <div className="text-[10px] uppercase tracking-widest text-ink-3 font-bold">Pause bis</div>
          <div className="text-[14px] font-bold text-spc-dark num">{fmt(pauseEnd)}</div>
        </div>
      </div>
      <form
        action={(fd) => start(async () => {
          setMsg(null);
          const r = await extendPauseAsAdmin(competitionId, fd);
          if (r?.error) setMsg({ t: "err", m: r.error });
          else setMsg({ t: "ok", m: "Pausen-Ende aktualisiert." });
        })}
        className="grid gap-2 sm:grid-cols-[1fr_auto] items-end">
        <label className="block bg-spc-greyLight rounded-xl p-3">
          <span className="block text-[11px] text-ink-3 font-bold mb-1 uppercase tracking-widest">Neues Pausen-Ende</span>
          <input type="datetime-local" name="pause_end" defaultValue={toLocalInput(pauseEnd)} required
            className="w-full bg-transparent outline-none text-[14px]" />
        </label>
        <button disabled={pending} className="px-5 py-3 rounded-xl bg-spc-dark text-white font-bold text-[13.5px] disabled:opacity-50 hover:bg-spc-mid transition">
          {pending ? "…" : "Pause verlängern"}
        </button>
        {msg && <div className={`sm:col-span-2 text-[12.5px] rounded-lg p-2 ${msg.t === "err" ? "bg-danger/10 text-danger" : "bg-success/15 text-success-dark font-semibold"}`}>{msg.m}</div>}
      </form>
    </div>
  );
}
