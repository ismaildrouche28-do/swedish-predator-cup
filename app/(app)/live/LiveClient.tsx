"use client";
import { useEffect, useState } from "react";

export function LiveClock({ startAt, endAt }: { startAt: string; endAt: string }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const start = new Date(startAt).getTime();
  const end = new Date(endAt).getTime();
  const total = Math.max(1, end - start);
  const elapsed = Math.min(total, Math.max(0, now - start));
  const remaining = Math.max(0, end - now);
  const progress = elapsed / total;
  const fmt = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const status = now < start ? "vor Start" : now > end ? "beendet" : "läuft";
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-white/60 font-bold">Wettkampfzeit · {status}</div>
          <div className="text-[13px] text-white/80 mt-0.5">
            {new Date(startAt).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })} – {new Date(endAt).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-widest text-white/60 font-bold">Verbleibend</div>
          <div className="text-[22px] font-bold num text-white leading-none">{fmt(remaining)}</div>
        </div>
      </div>
      <div className="h-1.5 bg-white/15 rounded-full mt-3 overflow-hidden">
        <div className="h-full bg-white/80 rounded-full transition-all" style={{ width: `${progress * 100}%` }} />
      </div>
    </div>
  );
}

// Trend-Cell: für später (braucht historische snapshots). Aktuell Placeholder mit "—"
export function TrendCell({ userId }: { userId: string }) {
  // TODO: Trend via ranking_snapshots table (nach jedem Fang) — v0.2
  return <div className="text-right text-[13px] text-ink-4 num font-semibold">—</div>;
}
