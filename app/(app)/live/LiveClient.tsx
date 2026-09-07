"use client";
import { useEffect, useState } from "react";

type Status = "prep" | "running" | "paused" | "finished";

type ClockProps = {
  startAt: string;                        // geplante Angelzeit ab (nur Info + volle Fischzeit-Berechnung)
  endAt: string;                          // geplante Angelzeit bis
  status?: Status;
  pauseStart?: string | null;             // geplante Pause (nur zur Berechnung der vollen Fischzeit)
  pauseEnd?: string | null;
  actualStartAt?: string | null;          // wann Admin manuell „Start" gedrückt hat
  pausedAt?: string | null;               // Zeitpunkt der aktuell offenen Pause (paused)
  accumulatedPauseMs?: number | null;     // Summe aller abgeschlossenen Pausen in ms
  updatedAt?: string | null;              // Legacy-Fallback
  showStatusPill?: boolean;               // default true — Statuspill oberhalb „Verbleibend"
};

const fmt = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
};

const STATUS_LABEL: Record<Status, string> = {
  prep: "Vorbereitet",
  running: "Läuft",
  paused: "Pausiert",
  finished: "Beendet",
};

export function LiveClock(props: ClockProps) {
  const { startAt, endAt, status = "prep", pauseStart, pauseEnd, actualStartAt, pausedAt, accumulatedPauseMs, updatedAt, showStatusPill = true } = props;

  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const plannedStartMs = new Date(startAt).getTime();
  const plannedEndMs   = new Date(endAt).getTime();
  const plannedPauseStartMs = pauseStart ? new Date(pauseStart).getTime() : null;
  const plannedPauseEndMs   = pauseEnd   ? new Date(pauseEnd).getTime()   : null;
  const plannedPauseMs = (plannedPauseStartMs != null && plannedPauseEndMs != null && plannedPauseEndMs > plannedPauseStartMs)
    ? (plannedPauseEndMs - plannedPauseStartMs) : 0;

  // Volle geplante Fischzeit — die läuft nach Start herunter.
  const fullFishingMs = Math.max(0, (plannedEndMs - plannedStartMs) - plannedPauseMs);

  const plannedWindow = `${new Date(startAt).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}–${new Date(endAt).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}` +
    (plannedPauseMs > 0 ? ` · Pause ${new Date(plannedPauseStartMs!).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}–${new Date(plannedPauseEndMs!).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}` : "");

  // Ohne manuellen Start: kein Countdown.
  const actualStartMs = actualStartAt ? new Date(actualStartAt).getTime() : null;
  const pausedAtMs = pausedAt ? new Date(pausedAt).getTime() : null;
  const accPauseMs = Number(accumulatedPauseMs ?? 0);

  let remainingMs = fullFishingMs;
  let subLabel = plannedWindow;

  if (status === "prep" || !actualStartMs) {
    // Kein Countdown vor manuellem Start
    remainingMs = fullFishingMs;
    subLabel = `Geplant: ${plannedWindow} · ${fmt(fullFishingMs)} Fischzeit`;
  } else if (status === "finished") {
    remainingMs = 0;
    subLabel = `Geplant: ${plannedWindow}`;
  } else if (status === "paused") {
    // Timer eingefroren am pausedAt (bzw. Legacy: updatedAt)
    const freezeAt = pausedAtMs ?? (updatedAt ? new Date(updatedAt).getTime() : now);
    const elapsed = Math.max(0, freezeAt - actualStartMs - accPauseMs);
    remainingMs = Math.max(0, fullFishingMs - elapsed);
    subLabel = "Uhr steht — Admin kann fortsetzen.";
  } else {
    // running
    const elapsed = Math.max(0, now - actualStartMs - accPauseMs);
    remainingMs = Math.max(0, fullFishingMs - elapsed);
    subLabel = `Geplant: ${plannedWindow}`;
  }

  const progress = fullFishingMs > 0 ? (1 - remainingMs / fullFishingMs) : (status === "finished" ? 1 : 0);

  // Statuspill die oberhalb von „Verbleibend" sitzt (rechte Spalte, eindeutig zugeordnet)
  const StatusPill = () => {
    if (status === "running") return (
      <div className="inline-flex items-center gap-1.5 bg-danger/90 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-widest">
        <span className="w-1.5 h-1.5 rounded-full bg-white pulse-dot"/> Live
      </div>
    );
    if (status === "paused") return (
      <div className="inline-flex items-center gap-1.5 bg-spc-gold/90 text-spc-goldDeep text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-widest">Pause</div>
    );
    if (status === "prep") return (
      <div className="inline-flex items-center gap-1.5 bg-white/20 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-widest">Vorbereitet</div>
    );
    return (
      <div className="inline-flex items-center gap-1.5 bg-white/20 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-widest">Beendet</div>
    );
  };

  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-white/60 font-bold">Wettkampf · {STATUS_LABEL[status]}</div>
          <div className="text-[12.5px] text-white/80 mt-0.5">{subLabel}</div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          {showStatusPill && <StatusPill />}
          <div className="text-[10px] uppercase tracking-widest text-white/60 font-bold">Verbleibend</div>
          <div className="text-[22px] font-bold num text-white leading-none">{fmt(remainingMs)}</div>
        </div>
      </div>
      <div className="h-1.5 bg-white/15 rounded-full mt-3 overflow-hidden">
        <div className="h-full bg-white/80 rounded-full transition-all" style={{ width: `${Math.min(100, Math.max(0, progress * 100))}%` }} />
      </div>
    </div>
  );
}

// Home-Variante: Uhr mit eigener Gradient-Card. Statuspill sitzt in LiveClock direkt
// ueber „Verbleibend" (rechte Spalte).
export function HomeClockCard(props: ClockProps) {
  return (
    <section className="bg-cs-gradient shadow-cs rounded-3xl p-5 mb-4 text-white">
      <LiveClock {...props} />
    </section>
  );
}

// Trend-Cell: Placeholder — echter Trend wird zentral aus computeTrend berechnet.
export function TrendCell({ userId }: { userId: string }) {
  return <div className="text-right text-[13px] text-ink-4 num font-semibold">—</div>;
}
