"use client";
import { useTransition, useState } from "react";
import { createCompetition, addParticipantById, removeParticipant, startCompetition, finishCompetition, autoGenerateCalls } from "./actions";

export function CreateForm() {
  const [pending, start] = useTransition();
  return (
    <form action={(fd) => start(() => createCompetition(fd).then())} className="bg-white rounded-3xl p-5 shadow-cs-sm space-y-3">
      <div className="text-[16px] font-bold text-spc-dark">Neuen Wettkampf anlegen</div>
      <input name="name" required placeholder="Name (z.B. SPC 2026)" defaultValue="SPC 2026"
        className="w-full px-4 py-3 rounded-xl bg-spc-greyLight focus:bg-white outline-none text-[15px] border border-transparent focus:border-spc-mid" />
      <input name="location" placeholder="Ort"
        className="w-full px-4 py-3 rounded-xl bg-spc-greyLight focus:bg-white outline-none text-[15px] border border-transparent focus:border-spc-mid" />
      <div className="grid grid-cols-2 gap-2">
        <label className="block bg-spc-greyLight rounded-xl p-3">
          <span className="block text-[11px] text-ink-3 font-bold mb-1 uppercase tracking-widest">Angelstart</span>
          <input type="datetime-local" name="start_at" className="w-full bg-transparent outline-none text-[14px]" />
        </label>
        <label className="block bg-spc-greyLight rounded-xl p-3">
          <span className="block text-[11px] text-ink-3 font-bold mb-1 uppercase tracking-widest">Angelende</span>
          <input type="datetime-local" name="end_at" className="w-full bg-transparent outline-none text-[14px]" />
        </label>
      </div>
      <button disabled={pending} className="w-full py-3.5 rounded-2xl bg-spc-dark text-white font-bold disabled:opacity-50 hover:bg-spc-mid transition">
        {pending ? "Lege an…" : "Wettkampf anlegen"}
      </button>
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
