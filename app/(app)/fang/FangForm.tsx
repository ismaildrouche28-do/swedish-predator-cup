"use client";
import { useState, useTransition } from "react";
import { saveCatch, savePenalty } from "./actions";
import { FishPhoto } from "@/components/Icons";

const SPECIES = [
  { key: "perch",  label: "Barsch", min: 25, factor: 2.0 },
  { key: "zander", label: "Zander", min: 50, factor: 1.3 },
  { key: "pike",   label: "Hecht",  min: 60, factor: 1.0 },
] as const;

export function FangForm({ competitionId, topwaterBonus = 10 }: { competitionId: string; topwaterBonus?: number }) {
  const [species, setSpecies] = useState<"perch" | "zander" | "pike">("zander");
  const [length, setLength] = useState("");
  const [topwater, setTopwater] = useState(false);
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  const rule = SPECIES.find(s => s.key === species)!;
  const l = parseInt(length) || 0;
  const valid = l >= rule.min;
  const base = valid ? Math.round(l * rule.factor) : 0;
  const bonus = valid && topwater ? topwaterBonus : 0;
  const total = base + bonus;

  return (
    <>
      <div className="bg-white rounded-3xl p-5 shadow-cs-sm">
        <div className="text-[11px] uppercase tracking-widest text-ink-3 font-bold mb-3">Fischart</div>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {SPECIES.map(s => {
            const selected = species === s.key;
            return (
              <button key={s.key} type="button" onClick={() => setSpecies(s.key)}
                className={`relative rounded-2xl overflow-hidden border-2 text-center transition group ${
                  selected ? "border-spc-mid ring-2 ring-spc-mid/25" : "border-transparent hover:border-spc-light/60"
                }`}>
                <div className={`relative aspect-[5/3] flex items-center justify-center transition ${selected ? "bg-spc-lighter/50" : "bg-spc-greyLight group-hover:bg-spc-lighter/30"}`}>
                  <FishPhoto species={s.key} className="max-w-[92%] max-h-[92%] object-contain drop-shadow-sm" />
                </div>
                <div className={`py-2 px-1 ${selected ? "bg-spc-lighter" : "bg-white"}`}>
                  <div className="text-[15.5px] font-bold text-spc-dark">{s.label}</div>
                  <div className="text-[11px] text-ink-3 mt-0.5">min {s.min} · ×{s.factor}</div>
                </div>
                {selected && (
                  <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-spc-mid text-white flex items-center justify-center text-[13px] font-bold shadow-md">✓</div>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-baseline gap-3 bg-spc-greyLight rounded-2xl px-5 py-4 mb-2">
          <span className="text-[12px] uppercase tracking-widest text-ink-3 font-bold w-[80px]">Länge</span>
          <input type="text" inputMode="numeric" value={length} placeholder="0"
            onChange={(e) => setLength(e.target.value.replace(/\D/g, ""))}
            className="flex-1 bg-transparent outline-none text-right text-[32px] font-bold num text-spc-dark placeholder:text-ink-4" />
          <span className="text-[17px] text-ink-3 font-medium">cm</span>
        </div>

        <button type="button" onClick={() => setTopwater(!topwater)}
          className="w-full flex items-center justify-between bg-spc-greyLight rounded-2xl px-5 py-4 mb-4 text-left">
          <div>
            <div className="text-[15px] font-bold text-spc-dark">Topwater</div>
            <div className="text-[12px] text-ink-3">Fang an der Oberfläche · +{topwaterBonus} Bonus</div>
          </div>
          <span className={`w-[51px] h-[31px] rounded-full relative transition ${topwater ? "bg-success" : "bg-ink-4"}`}>
            <span className={`absolute top-[2px] left-[2px] w-[27px] h-[27px] bg-white rounded-full shadow-sm transition-transform ${topwater ? "translate-x-[20px]" : ""}`}/>
          </span>
        </button>

        <div className="flex items-baseline justify-between bg-spc-lighter rounded-2xl px-5 py-4 mb-4">
          <span className="text-[11px] uppercase tracking-widest text-spc-dark font-bold">Ergibt</span>
          <span className="text-[32px] font-bold text-spc-mid num leading-none">
            {total}<span className="text-[14px] text-spc-mid/70 ml-1 font-semibold">Pkt</span>
          </span>
        </div>

        {!valid && l > 0 && (
          <div className="text-[13px] text-danger bg-danger/10 rounded-xl p-3 mb-3">
            {l} cm ist unter dem Mindestmaß ({rule.min} cm) — wird als „nicht gewertet" erfasst.
          </div>
        )}
        {err && <div className="text-[13px] text-danger bg-danger/10 rounded-xl p-3 mb-3">{err}</div>}

        <form action={(fd) => start(async () => {
          fd.set("competition_id", competitionId);
          fd.set("species", species);
          fd.set("length_cm", length);
          fd.set("topwater", topwater ? "1" : "0");
          const r = await saveCatch(fd);
          if (r?.error) setErr(r.error);
        })}>
          <button disabled={pending || !l} className="w-full py-3.5 rounded-2xl bg-spc-dark text-white font-bold text-[15px] disabled:opacity-50 hover:bg-spc-mid transition">
            {pending ? "Speichere…" : "Fang eintragen"}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-3xl p-5 shadow-cs-sm mt-3">
        <div className="text-[11px] uppercase tracking-widest text-ink-3 font-bold mb-3">Strafe erfassen</div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { key: "abriss",   label: "Abriss",  hint: "–20 Punkte" },
            { key: "handling", label: "Handling", hint: "10 Min Sperre" },
          ].map(p => (
            <form key={p.key} action={(fd) => start(async () => {
              fd.set("competition_id", competitionId);
              fd.set("penalty_type", p.key);
              const r = await savePenalty(fd);
              if (r?.error) setErr(r.error);
            })}>
              <button disabled={pending} className="w-full rounded-2xl p-4 bg-spc-greyLight hover:bg-spc-lighter/60 text-center transition disabled:opacity-50">
                <div className="text-[15px] font-bold text-spc-dark">{p.label}</div>
                <div className="text-[11.5px] text-ink-3 mt-0.5">{p.hint}</div>
              </button>
            </form>
          ))}
        </div>
      </div>
    </>
  );
}
