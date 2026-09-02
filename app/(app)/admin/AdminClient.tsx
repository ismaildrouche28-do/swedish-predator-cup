"use client";
import { useTransition, useState } from "react";
import { createProfile, toggleProfileActive, deleteProfilePermanent, adminLogout, createPresetProfiles, deactivateNonPresetProfiles } from "./actions";

export function CreateProfileForm() {
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  return (
    <form action={(fd) => start(async () => { setErr(null); const r = await createProfile(fd); if (r?.error) setErr(r.error); (document.getElementById("new-profile-form") as HTMLFormElement)?.reset(); })}
      id="new-profile-form"
      className="grid sm:grid-cols-[1fr_1fr_auto] gap-2">
      <input name="name" required placeholder="Voller Name (z.B. Jens Lundgren)"
        className="px-4 py-2.5 rounded-xl bg-spc-greyLight focus:bg-white outline-none text-[14px] border border-transparent focus:border-spc-mid" />
      <input name="nickname" placeholder="Nickname (optional)"
        className="px-4 py-2.5 rounded-xl bg-spc-greyLight focus:bg-white outline-none text-[14px] border border-transparent focus:border-spc-mid" />
      <button disabled={pending} className="px-5 py-2.5 rounded-xl bg-spc-dark text-white font-bold text-[14px] disabled:opacity-50 hover:bg-spc-mid transition whitespace-nowrap">
        {pending ? "…" : "+ Anlegen"}
      </button>
      {err && <div className="col-span-full text-[12.5px] text-danger bg-danger/10 rounded-lg p-2">{err}</div>}
    </form>
  );
}

export function ProfileActions({ id, isActive }: { id: string; isActive: boolean }) {
  const [pending, start] = useTransition();
  const [confirmDel, setConfirmDel] = useState(false);
  if (confirmDel) return (
    <div className="flex gap-1 items-center">
      <span className="text-[11.5px] text-ink-3">Sicher?</span>
      <button onClick={() => start(() => deleteProfilePermanent(id).then())} disabled={pending}
        className="text-[11.5px] px-2 py-1 rounded bg-danger text-white font-bold">Ja</button>
      <button onClick={() => setConfirmDel(false)} className="text-[11.5px] px-2 py-1 rounded bg-white text-ink-3">Nein</button>
    </div>
  );
  return (
    <div className="flex gap-1">
      <button onClick={() => start(() => toggleProfileActive(id, !isActive).then())} disabled={pending}
        className="text-[11.5px] px-2 py-1 rounded bg-white text-spc-mid font-semibold hover:bg-spc-lighter">
        {isActive ? "deaktivieren" : "aktivieren"}
      </button>
      <button onClick={() => setConfirmDel(true)} disabled={pending}
        className="text-[11.5px] px-2 py-1 rounded bg-white text-danger font-semibold hover:bg-danger/10">
        löschen
      </button>
    </div>
  );
}

export function AdminLogoutButton() {
  return (
    <form action={adminLogout}>
      <button className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-[12.5px] font-bold transition">
        Admin abmelden
      </button>
    </form>
  );
}


export function PresetProfilesButton() {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [confirmClean, setConfirmClean] = useState(false);

  const runPreset = () => start(async () => {
    setMsg(null);
    const r = await createPresetProfiles();
    setMsg(`${r?.results?.length ?? 0} Profile angelegt/aktualisiert (Erik K., Tim M., Jan D., Stefan S., Denis S.)`);
  });

  const runCleanup = () => start(async () => {
    setMsg(null);
    const r = await deactivateNonPresetProfiles();
    if (r?.error) setMsg("Fehler: " + r.error);
    else setMsg("Alle nicht-Wettkampf-Profile deaktiviert.");
    setConfirmClean(false);
  });

  return (
    <div className="mt-3 space-y-2">
      <button onClick={runPreset} disabled={pending}
        className="w-full sm:w-auto px-4 py-2 rounded-xl bg-spc-dark text-white text-[13px] font-bold disabled:opacity-50 hover:bg-spc-mid transition">
        {pending ? "…" : "🎣 Wettkampf-Teilnehmer anlegen (Erik K., Tim M., Jan D., Stefan S., Denis S.)"}
      </button>

      {!confirmClean ? (
        <button onClick={() => setConfirmClean(true)} disabled={pending}
          className="w-full sm:w-auto px-4 py-2 rounded-xl bg-white border border-danger/40 text-danger text-[13px] font-bold hover:bg-danger/5 transition block">
          🧹 Alle Test-Profile deaktivieren (nur die 5 Wettkampf-Teilnehmer bleiben aktiv)
        </button>
      ) : (
        <div className="p-3 rounded-xl bg-danger/10 flex flex-wrap gap-2 items-center">
          <span className="text-[13px] text-danger font-semibold">Sicher? Alle Profile außer den 5 Presets werden deaktiviert.</span>
          <button onClick={runCleanup} disabled={pending} className="px-3 py-1.5 rounded-lg bg-danger text-white text-[12px] font-bold">Ja, deaktivieren</button>
          <button onClick={() => setConfirmClean(false)} className="px-3 py-1.5 rounded-lg bg-white text-ink-3 text-[12px] font-semibold">Abbrechen</button>
        </div>
      )}

      {msg && <div className="text-[12.5px] font-semibold bg-spc-lighter/40 text-spc-dark rounded-lg p-2">{msg}</div>}
    </div>
  );
}
