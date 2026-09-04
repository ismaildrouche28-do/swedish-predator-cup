"use client";
import { useTransition, useState } from "react";
import { createCompetition, addParticipantById, removeParticipant, startCompetition, finishCompetition, autoGenerateCalls, updateWettkampfzeit, createCallManual, updateCallManual, deleteCallManual } from "./actions";

function toLocalInput(v: string | null | undefined): string {
  if (!v) return "";
  const d = new Date(v);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function CreateForm() {
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  return (
    <form
      action={(fd) => start(async () => {
        setErr(null);
        try {
          const r: any = await createCompetition(fd);
          if (r?.error) setErr(r.error);
          // ok-Fall: server-Action redirected → kein Handling nötig
        } catch (e: any) {
          // redirect() wirft NEXT_REDIRECT — nur echte Fehler anzeigen
          if (e?.digest?.startsWith?.("NEXT_REDIRECT")) throw e;
          setErr(e?.message ?? "Unbekannter Fehler");
        }
      })}
      className="bg-white rounded-3xl p-5 shadow-cs-sm space-y-3">
      <div className="text-[16px] font-bold text-spc-dark">Neuen Wettkampf anlegen</div>
      <input name="name" required placeholder="Name (z.B. SPC 2026)" defaultValue="SPC 2026"
        className="w-full px-4 py-3 rounded-xl bg-spc-greyLight focus:bg-white outline-none text-[15px] border border-transparent focus:border-spc-mid" />
      <input name="location" placeholder="Ort"
        className="w-full px-4 py-3 rounded-xl bg-spc-greyLight focus:bg-white outline-none text-[15px] border border-transparent focus:border-spc-mid" />

      <div className="text-[11px] uppercase tracking-widest text-spc-mid font-bold pt-1">Wettkampfzeit</div>
      <div className="grid grid-cols-2 gap-2">
        <label className="block bg-spc-greyLight rounded-xl p-3">
          <span className="block text-[11px] text-ink-3 font-bold mb-1 uppercase tracking-widest">Angelstart</span>
          <input type="datetime-local" name="start_at" required className="w-full bg-transparent outline-none text-[14px]" />
        </label>
        <label className="block bg-spc-greyLight rounded-xl p-3">
          <span className="block text-[11px] text-ink-3 font-bold mb-1 uppercase tracking-widest">Angelende</span>
          <input type="datetime-local" name="end_at" required className="w-full bg-transparent outline-none text-[14px]" />
        </label>
        <label className="block bg-spc-greyLight rounded-xl p-3">
          <span className="block text-[11px] text-ink-3 font-bold mb-1 uppercase tracking-widest">Pause ab (optional)</span>
          <input type="datetime-local" name="pause_start" className="w-full bg-transparent outline-none text-[14px]" />
        </label>
        <label className="block bg-spc-greyLight rounded-xl p-3">
          <span className="block text-[11px] text-ink-3 font-bold mb-1 uppercase tracking-widest">Pause bis (optional)</span>
          <input type="datetime-local" name="pause_end" className="w-full bg-transparent outline-none text-[14px]" />
        </label>
      </div>
      <p className="text-[11.5px] text-ink-3 leading-snug">
        Die Wettkampfzeit steuert Uhr, Calls und Pause. Nichts ist hart codiert — alle Zeiten stammen aus diesem Formular.
      </p>

      {err && <div className="text-[13px] rounded-xl p-3 bg-danger/10 text-danger font-semibold">
        {err}
        {err.toLowerCase().includes("pause_start") || err.toLowerCase().includes("pause_end") ? (
          <div className="text-[11.5px] mt-1 font-normal">Hinweis: die neuen Pause-Spalten fehlen in der DB. Bitte SQL <code>pause_columns.sql</code> in Supabase einspielen.</div>
        ) : null}
      </div>}

      <button disabled={pending} className="w-full py-3.5 rounded-2xl bg-spc-dark text-white font-bold disabled:opacity-50 hover:bg-spc-mid transition">
        {pending ? "Lege an…" : "Wettkampf anlegen"}
      </button>
    </form>
  );
}

// Zeit-Editor: bearbeitet Grunddaten + Wettkampfzeit eines bestehenden Wettkampfs
export function WettkampfzeitForm({ comp }: { comp: any }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ t: "ok" | "err"; m: string } | null>(null);
  return (
    <form action={(fd) => start(async () => {
      setMsg(null);
      const r = await updateWettkampfzeit(comp.id, fd);
      if (r?.error) setMsg({ t: "err", m: r.error });
      else setMsg({ t: "ok", m: "Wettkampfzeit gespeichert." });
    })} className="bg-white rounded-3xl p-5 shadow-cs-sm space-y-3">
      <div>
        <div className="text-[11px] uppercase tracking-widest text-spc-mid font-bold">Wettkampfzeit</div>
        <div className="text-[16px] font-bold text-spc-dark">Datum, Zeitfenster und Pause</div>
        <p className="text-[12.5px] text-ink-3 mt-0.5">Beispiel: 10:00–19:00 Uhr, Pause 14:00–15:00 Uhr. Pause kann später verlängert werden.</p>
      </div>
      <div className="grid sm:grid-cols-2 gap-2">
        <label className="block bg-spc-greyLight rounded-xl p-3">
          <span className="block text-[11px] text-ink-3 font-bold mb-1 uppercase tracking-widest">Name</span>
          <input name="name" required defaultValue={comp.name ?? ""} className="w-full bg-transparent outline-none text-[14px]" />
        </label>
        <label className="block bg-spc-greyLight rounded-xl p-3">
          <span className="block text-[11px] text-ink-3 font-bold mb-1 uppercase tracking-widest">Ort</span>
          <input name="location" defaultValue={comp.location ?? ""} className="w-full bg-transparent outline-none text-[14px]" />
        </label>
        <label className="block bg-spc-greyLight rounded-xl p-3">
          <span className="block text-[11px] text-ink-3 font-bold mb-1 uppercase tracking-widest">Angelstart</span>
          <input type="datetime-local" name="start_at" defaultValue={toLocalInput(comp.start_at)} className="w-full bg-transparent outline-none text-[14px]" />
        </label>
        <label className="block bg-spc-greyLight rounded-xl p-3">
          <span className="block text-[11px] text-ink-3 font-bold mb-1 uppercase tracking-widest">Angelende</span>
          <input type="datetime-local" name="end_at" defaultValue={toLocalInput(comp.end_at)} className="w-full bg-transparent outline-none text-[14px]" />
        </label>
        <label className="block bg-spc-greyLight rounded-xl p-3">
          <span className="block text-[11px] text-ink-3 font-bold mb-1 uppercase tracking-widest">Pause ab</span>
          <input type="datetime-local" name="pause_start" defaultValue={toLocalInput(comp.pause_start)} className="w-full bg-transparent outline-none text-[14px]" />
        </label>
        <label className="block bg-spc-greyLight rounded-xl p-3">
          <span className="block text-[11px] text-ink-3 font-bold mb-1 uppercase tracking-widest">Pause bis</span>
          <input type="datetime-local" name="pause_end" defaultValue={toLocalInput(comp.pause_end)} className="w-full bg-transparent outline-none text-[14px]" />
        </label>
      </div>
      <button disabled={pending} className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-spc-dark text-white font-bold disabled:opacity-50 hover:bg-spc-mid transition">
        {pending ? "Speichere…" : "Wettkampfzeit speichern"}
      </button>
      {msg && <div className={`text-[13px] rounded-xl p-3 ${msg.t === "err" ? "bg-danger/10 text-danger" : "bg-success/10 text-success-dark font-semibold"}`}>{msg.m}</div>}
    </form>
  );
}

// Robustes Grid-Layout: 4 Spalten, Button garantiert sichtbar
export function ParticipantPicker({ availableUsers, boats }: { availableUsers: any[]; boats: any[] }) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [boatByUser, setBoatByUser] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    availableUsers.forEach((u, i) => { init[u.id] = boats[i % boats.length]?.id ?? boats[0]?.id ?? ""; });
    return init;
  });

  const add = (userId: string) => start(async () => {
    setErr(null);
    const boatId = boatByUser[userId] ?? boats[0]?.id;
    if (!boatId) return setErr("Bitte Boot auswählen");
    const r = await addParticipantById(userId, boatId);
    if (r?.error) setErr(r.error);
  });

  if (availableUsers.length === 0) return (
    <div className="mt-4 bg-spc-greyLight rounded-2xl p-4 text-center">
      <p className="text-[13.5px] text-ink-2 font-medium mb-2">Alle registrierten User sind bereits zugewiesen.</p>
      <p className="text-[12px] text-ink-3">Weitere Teilnehmer müssen sich zuerst per <a href="/dev" className="text-spc-mid font-semibold underline">/dev</a> oder Mail-Login anmelden.</p>
    </div>
  );

  return (
    <div className="mt-5">
      <div className="text-[11px] uppercase tracking-widest text-ink-3 font-bold mb-1">Verfügbare Teilnehmer ({availableUsers.length})</div>
      <p className="text-[12.5px] text-ink-3 mb-3">Boot wählen und auf „<strong className="text-spc-dark">Hinzufügen</strong>" klicken.</p>
      <div className="flex flex-col gap-2">
        {availableUsers.map(u => (
          <div key={u.id}
            className="grid gap-2 items-center bg-spc-greyLight rounded-2xl p-3"
            style={{ gridTemplateColumns: "40px minmax(120px,1fr) 110px 130px" }}>
            <div className="w-10 h-10 rounded-full bg-spc-mid text-white flex items-center justify-center text-[14px] font-bold">
              {(u.nickname ?? u.name ?? "?").slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-[14.5px] font-semibold text-spc-dark truncate">{u.nickname ?? u.name}</div>
              <div className="text-[11.5px] text-ink-3 truncate">{u.email}</div>
            </div>
            <select
              value={boatByUser[u.id] ?? boats[0]?.id ?? ""}
              onChange={(e) => setBoatByUser(prev => ({ ...prev, [u.id]: e.target.value }))}
              className="w-full px-2 py-2 rounded-lg bg-white text-[13px] font-semibold text-spc-dark border border-black/[0.12] outline-none focus:border-spc-mid">
              {boats.map(b => <option key={b.id} value={b.id}>{b.label}</option>)}
            </select>
            <button
              onClick={() => add(u.id)}
              disabled={pending}
              type="button"
              className="w-full px-3 py-2 rounded-lg bg-spc-dark text-white text-[13px] font-bold disabled:opacity-50 hover:bg-spc-mid transition">
              {pending ? "…" : "Hinzufügen"}
            </button>
          </div>
        ))}
      </div>
      {err && <div className="text-[12.5px] text-white bg-danger rounded-lg p-2.5 mt-3 font-semibold">{err}</div>}
    </div>
  );
}

export function RemoveButton({ boatId, userId }: { boatId: string; userId: string }) {
  const [pending, start] = useTransition();
  return (
    <button onClick={() => start(() => removeParticipant(boatId, userId).then())}
      className="text-[12px] text-danger hover:underline font-semibold" disabled={pending}>
      {pending ? "…" : "entfernen"}
    </button>
  );
}

export function StartButton({ competitionId }: { competitionId: string }) {
  const [pending, start] = useTransition();
  return (
    <button onClick={() => start(() => startCompetition(competitionId).then())} disabled={pending}
      className="mt-6 w-full sm:w-auto sm:min-w-[280px] mx-auto block px-8 py-4 rounded-2xl bg-spc-dark text-white font-bold text-[15px] shadow-cs disabled:opacity-50 hover:bg-spc-mid transition">
      {pending ? "Starte…" : "🎣 Wettkampf jetzt starten →"}
    </button>
  );
}

export function FinishButton({ competitionId }: { competitionId: string }) {
  const [pending, start] = useTransition();
  const [confirm, setConfirm] = useState(false);
  if (!confirm) return (
    <button onClick={() => setConfirm(true)} className="text-[13px] text-danger hover:underline font-semibold">Wettkampf beenden</button>
  );
  return (
    <div className="flex gap-2 items-center justify-center">
      <span className="text-[13px] text-ink-2">Sicher?</span>
      <button onClick={() => start(() => finishCompetition(competitionId).then())} disabled={pending} className="px-4 py-2 rounded-xl bg-danger text-white text-[13px] font-bold">
        {pending ? "…" : "Ja, beenden"}
      </button>
      <button onClick={() => setConfirm(false)} className="text-[13px] text-ink-3">Nein</button>
    </div>
  );
}

export function GenerateCallsButton({ competitionId, hasCalls }: { competitionId: string; hasCalls: boolean }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <div className="mt-3">
      <button onClick={() => start(async () => {
        setMsg(null);
        const r = await autoGenerateCalls(competitionId);
        if (r?.error) setMsg("Fehler: " + r.error);
        else setMsg(`${r?.count ?? 0} Call-Zeitfenster erstellt.`);
      })} disabled={pending}
        className="px-4 py-2 rounded-xl bg-white border border-spc-mid text-spc-mid text-[13px] font-bold disabled:opacity-50 hover:bg-spc-lighter/40 transition">
        {pending ? "Generiere…" : hasCalls ? "Call-Zeitfenster neu verteilen" : "Call-Zeitfenster automatisch verteilen"}
      </button>
      {msg && <div className="text-[12.5px] text-spc-mid mt-2 font-semibold">{msg}</div>}
    </div>
  );
}

// Manueller Call anlegen
export function ManualCallForm({ competitionId, boats, participants }: {
  competitionId: string;
  boats: { id: string; label: string }[];
  participants: { id: string; label: string; boat_id: string }[];
}) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ t: "ok" | "err"; m: string } | null>(null);
  const [boatId, setBoatId] = useState(boats[0]?.id ?? "");
  const usersForBoat = participants.filter(p => p.boat_id === boatId);

  return (
    <form action={(fd) => start(async () => {
      setMsg(null);
      const r = await createCallManual(competitionId, fd);
      if (r?.error) setMsg({ t: "err", m: r.error });
      else setMsg({ t: "ok", m: "Call angelegt." });
    })} className="grid gap-2 sm:grid-cols-[130px_1fr_140px_140px_120px_auto] items-end bg-spc-greyLight rounded-2xl p-3">
      <label className="block">
        <span className="block text-[10px] uppercase tracking-widest text-ink-3 font-bold mb-1">Boot</span>
        <select name="boat_id" value={boatId} onChange={(e) => setBoatId(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-white text-[13px] font-semibold border border-black/[0.10]">
          {boats.map(b => <option key={b.id} value={b.id}>{b.label}</option>)}
        </select>
      </label>
      <label className="block">
        <span className="block text-[10px] uppercase tracking-widest text-ink-3 font-bold mb-1">Teilnehmer</span>
        <select name="user_id" required
          className="w-full px-3 py-2 rounded-lg bg-white text-[13px] font-semibold border border-black/[0.10]">
          <option value="">Wählen…</option>
          {usersForBoat.map(u => <option key={u.id} value={u.id}>{u.label}</option>)}
        </select>
      </label>
      <label className="block">
        <span className="block text-[10px] uppercase tracking-widest text-ink-3 font-bold mb-1">Start</span>
        <input type="datetime-local" name="start_at" required
          className="w-full px-3 py-2 rounded-lg bg-white text-[13px] border border-black/[0.10]" />
      </label>
      <label className="block">
        <span className="block text-[10px] uppercase tracking-widest text-ink-3 font-bold mb-1">Ende</span>
        <input type="datetime-local" name="end_at" required
          className="w-full px-3 py-2 rounded-lg bg-white text-[13px] border border-black/[0.10]" />
      </label>
      <label className="block">
        <span className="block text-[10px] uppercase tracking-widest text-ink-3 font-bold mb-1">Typ</span>
        <select name="call_type" defaultValue="mid"
          className="w-full px-3 py-2 rounded-lg bg-white text-[13px] font-semibold border border-black/[0.10]">
          <option value="morning">Morning</option>
          <option value="mid">Mid</option>
          <option value="late">Late</option>
        </select>
      </label>
      <button disabled={pending} className="px-4 py-2 rounded-lg bg-spc-dark text-white font-bold text-[13px] disabled:opacity-50">
        {pending ? "…" : "Anlegen"}
      </button>
      {msg && <div className={`sm:col-span-6 text-[12.5px] rounded-lg p-2 ${msg.t === "err" ? "bg-danger/10 text-danger" : "bg-success/15 text-success-dark font-semibold"}`}>{msg.m}</div>}
    </form>
  );
}

// Einzelnen Call editieren/löschen
export function CallRow({ call, participants }: {
  call: any;
  participants: { id: string; label: string; boat_id: string }[];
}) {
  const [pending, start] = useTransition();
  const [editing, setEditing] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const partsForBoat = participants.filter(p => p.boat_id === call.boat_id);
  const currentUser = participants.find(p => p.id === call.user_id);
  const CALL_LABEL: any = { morning: "Morning", mid: "Mid", late: "Late" };

  if (editing) {
    return (
      <form
        action={(fd) => start(async () => {
          setErr(null);
          const r = await updateCallManual(call.id, fd);
          if (r?.error) { setErr(r.error); return; }
          setEditing(false);
        })}
        className="grid gap-2 sm:grid-cols-[1fr_140px_140px_120px_auto] items-end bg-spc-lighter/40 rounded-xl p-3">
        <label className="block">
          <span className="block text-[10px] uppercase tracking-widest text-ink-3 font-bold mb-1">Teilnehmer</span>
          <select name="user_id" defaultValue={call.user_id} required
            className="w-full px-3 py-2 rounded-lg bg-white text-[13px] font-semibold border border-black/[0.10]">
            {partsForBoat.map(u => <option key={u.id} value={u.id}>{u.label}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="block text-[10px] uppercase tracking-widest text-ink-3 font-bold mb-1">Start</span>
          <input type="datetime-local" name="start_at" defaultValue={toLocalInput(call.start_at)} required
            className="w-full px-3 py-2 rounded-lg bg-white text-[13px] border border-black/[0.10]" />
        </label>
        <label className="block">
          <span className="block text-[10px] uppercase tracking-widest text-ink-3 font-bold mb-1">Ende</span>
          <input type="datetime-local" name="end_at" defaultValue={toLocalInput(call.end_at)} required
            className="w-full px-3 py-2 rounded-lg bg-white text-[13px] border border-black/[0.10]" />
        </label>
        <label className="block">
          <span className="block text-[10px] uppercase tracking-widest text-ink-3 font-bold mb-1">Typ</span>
          <select name="call_type" defaultValue={call.call_type}
            className="w-full px-3 py-2 rounded-lg bg-white text-[13px] font-semibold border border-black/[0.10]">
            <option value="morning">Morning</option>
            <option value="mid">Mid</option>
            <option value="late">Late</option>
          </select>
        </label>
        <div className="flex gap-1">
          <button disabled={pending} className="px-3 py-2 rounded-lg bg-spc-dark text-white font-bold text-[12px] disabled:opacity-50">
            {pending ? "…" : "Speichern"}
          </button>
          <button type="button" onClick={() => setEditing(false)} className="px-3 py-2 rounded-lg bg-white text-ink-3 text-[12px] font-semibold border border-black/[0.10]">Abbrechen</button>
        </div>
        {err && <div className="sm:col-span-5 text-[12px] text-danger">{err}</div>}
      </form>
    );
  }

  return (
    <div className="grid grid-cols-[110px_1fr_auto_auto] gap-3 items-center bg-spc-greyLight rounded-xl px-3 py-2 text-[13px]">
      <div className="num font-semibold text-spc-dark">
        {new Date(call.start_at).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}–{new Date(call.end_at).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}
      </div>
      <div>
        <strong className="font-semibold text-[14px]">{currentUser?.label ?? "?"}</strong>
        <span className="ml-1.5 text-[11.5px] text-ink-3">{CALL_LABEL[call.call_type] ?? call.call_type}</span>
      </div>
      <button onClick={() => setEditing(true)} className="w-8 h-8 rounded-lg bg-white text-spc-mid text-[13px] hover:bg-spc-lighter/40" title="Bearbeiten">✎</button>
      <button onClick={() => { if (confirm("Call löschen?")) start(async () => { await deleteCallManual(call.id); }); }} disabled={pending}
        className="w-8 h-8 rounded-lg bg-white text-danger text-[13px] hover:bg-danger/10" title="Löschen">🗑</button>
    </div>
  );
}
