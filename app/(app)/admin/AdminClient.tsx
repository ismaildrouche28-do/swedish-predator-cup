"use client";
import { useTransition, useState } from "react";
import { createProfile, toggleProfileActive, deleteProfilePermanent, adminLogout, createPresetProfiles } from "./actions";

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
  return (
    <>
      <button onClick={() => start(async () => {
        const r = await createPresetProfiles();
        const anyOk = r?.results?.some((x: any) => x.ok);
        setMsg(anyOk ? "Standard-Teilnehmer angelegt." : "Alle Preset-Teilnehmer existieren bereits.");
      })} disabled={pending}
        className="px-4 py-2 rounded-xl bg-white border border-spc-mid text-spc-mid text-[13px] font-bold disabled:opacity-50 hover:bg-spc-lighter/40 transition mt-2">
        {pending ? "…" : "Standard-Teilnehmer anlegen (Erik, Tim, Jan, Stefan, Denis)"}
      </button>
      {msg && <div className="text-[12.5px] text-spc-mid mt-2 font-semibold">{msg}</div>}
    </>
  );
}
