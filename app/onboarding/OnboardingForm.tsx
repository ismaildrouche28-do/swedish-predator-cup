"use client";
import { useTransition, useState } from "react";
import { completeOnboarding } from "./actions";

export function OnboardingForm({ defaultName }: { defaultName: string }) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  return (
    <form action={(fd) => start(async () => { const res = await completeOnboarding(fd); if (res?.error) setErr(res.error); })} className="space-y-4">
      <div>
        <label className="block text-[13px] font-bold text-spc-dark mb-1.5">Dein Name</label>
        <input name="name" required defaultValue={defaultName}
          className="w-full px-4 py-3 rounded-xl bg-spc-greyLight border border-transparent focus:border-spc-mid focus:bg-white outline-none text-[15px]" />
        <p className="text-[12px] text-ink-3 mt-1.5">So sehen dich die anderen im Ranking.</p>
      </div>
      <div>
        <label className="block text-[13px] font-bold text-spc-dark mb-1.5">Nickname <span className="text-ink-3 font-normal">(optional)</span></label>
        <input name="nickname" placeholder="z. B. Pikeslayer"
          className="w-full px-4 py-3 rounded-xl bg-spc-greyLight border border-transparent focus:border-spc-mid focus:bg-white outline-none text-[15px]" />
        <p className="text-[12px] text-ink-3 mt-1.5">Falls du einen Spitznamen willst.</p>
      </div>
      {err && <div className="text-[13px] text-danger bg-danger/10 rounded-xl p-3">{err}</div>}
      <button disabled={pending} className="w-full py-3.5 rounded-2xl bg-spc-dark text-white font-bold disabled:opacity-50 hover:bg-spc-mid transition">
        {pending ? "Speichere…" : "Los geht's"}
      </button>
    </form>
  );
}
