"use client";
import { useEffect, useState } from "react";

type Status = "prep" | "running" | "paused" | "finished";

type ClockProps = {
  startAt: string;
  endAt: string;
  status?: Status;
  pauseStart?: string | null;
  pauseEnd?: string | null;
  // Zeitpunkt an dem der Wettkampf zuletzt geändert wurde — wird für den „paused"-Zustand
  // als eingefrorener Anker genutzt, damit Verbleibend nicht mehr weiterläuft.
  updatedAt?: string | null;
};

const fmt = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
};

// Wie viel Fischzeit ist ab Zeitpunkt `t` noch übrig?
// Berücksichtigt die geplante Pause [pauseStart, pauseEnd].
function remainingFishing(tMs: number, startMs: number, endMs: number, pauseStartMs: number | null, pauseEndMs: number | null): number {
  if (tMs >= endMs) return 0;
  const anchor = Math.max(tMs, startMs);
  const nominal = endMs - anchor;
  if (pauseStartMs == null || pauseEndMs == null) return Math.max(0, nominal);
  // Restlicher Pause-Overlap zwischen anchor und endMs
  const overlap = Math.max(0, Math.min(endMs, pauseEndMs) - Math.max(anchor, pauseStartMs));
  return Math.max(0, nominal - overlap);
}

// Ist t im Pause-Fenster?
function isInPause(tMs: number, pauseStartMs: number | null, pauseEndMs: number | null): boolean {
  if (pauseStartMs == null || pauseEndMs == null) return false;
  return tMs >= pauseStartMs && tMs < pauseEndMs;
}

export function LiveClock({ startAt, endAt, status = "running", pauseStart, pauseEnd, updatedAt }: ClockProps) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const startMs = new Date(startAt).getTime();
  const endMs = new Date(endAt).getTime();
  const pauseStartMs = pauseStart ? new Date(pauseStart).getTime() : null;
  const pauseEndMs   = pauseEnd   ? new Date(pauseEnd).getTime()   : null;
  const pauseTotalMs = (pauseStartMs != null && pauseEndMs != null && pauseEndMs > pauseStartMs)
    ? (pauseEndMs - pauseStartMs) : 0;
  const fullFishingMs = Math.max(0, (endMs - startMs) - pauseTotalMs);

  // Ist der Countdown überhaupt aktiv?
  const active = status === "running";
  const paused = status === "paused";
  const finished = status === "finished";
  const prep = status === "prep";

  // Verbleibende Fischzeit
  let remainingMs: number;
  let label: string;
  let subLabel: string;
  if (prep) {
    remainingMs = fullFishingMs;
    label = "Wartet auf Start";
    const startFmt = new Date(startAt).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
    subLabel = `Angesetzt: ${startFmt} · ${fmt(fullFishingMs)} Fischzeit`;
  } else if (finished) {
    remainingMs = 0;
    label = "Beendet";
    subLabel = `${new Date(startAt).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })} – ${new Date(endAt).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}`;
  } else if (paused) {
    // eingefroren am updated_at
    const frozenAt = updatedAt ? new Date(updatedAt).getTime() : now;
    remainingMs = remainingFishing(frozenAt, startMs, endMs, pauseStartMs, pauseEndMs);
    label = "Pausiert";
    subLabel = "Uhr eingefroren — Admin kann fortsetzen.";
  } else {
    // running
    if (isInPause(now, pauseStartMs, pauseEndMs)) {
      // Zeit steht während Pause. Verbleibend = Fischzeit ab Pause-Ende.
      remainingMs = remainingFishing(pauseEndMs!, startMs, endMs, pauseStartMs, pauseEndMs);
      const pe = new Date(pauseEndMs!).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
      label = `Pause bis ${pe}`;
      subLabel = "Uhr steht während der Pause.";
    } else if (now < startMs) {
      remainingMs = fullFishingMs;
      const inMs = startMs - now;
      label = `Start in ${fmt(inMs)}`;
      subLabel = `Startet um ${new Date(startAt).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}`;
    } else if (now >= endMs) {
      remainingMs = 0;
      label = "Zeit abgelaufen";
      subLabel = "Wettkampf-Ende erreicht.";
    } else {
      remainingMs = remainingFishing(now, startMs, endMs, pauseStartMs, pauseEndMs);
      label = "Läuft";
      subLabel = `${new Date(startAt).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })} – ${new Date(endAt).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}` + (pauseTotalMs > 0 ? ` · Pause ${new Date(pauseStartMs!).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}–${new Date(pauseEndMs!).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}` : "");
    }
  }

  const progress = fullFishingMs > 0 ? (1 - remainingMs / fullFishingMs) : (finished ? 1 : 0);

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-white/60 font-bold">Wettkampfzeit · {label}</div>
          <div className="text-[12.5px] text-white/80 mt-0.5">{subLabel}</div>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-widest text-white/60 font-bold">Verbleibend</div>
          <div className="text-[22px] font-bold num text-white leading-none">{prep ? fmt(fullFishingMs) : fmt(remainingMs)}</div>
        </div>
      </div>
      <div className="h-1.5 bg-white/15 rounded-full mt-3 overflow-hidden">
        <div className="h-full bg-white/80 rounded-full transition-all" style={{ width: `${Math.min(100, Math.max(0, progress * 100))}%` }} />
      </div>
    </div>
  );
}

// Home-Variante: Uhr mit eigener Gradient-Card
export function HomeClockCard(props: ClockProps) {
  const showLivePulse = props.status === "running";
  return (
    <section className="bg-cs-gradient shadow-cs rounded-3xl p-5 mb-4 text-white relative overflow-hidden">
      {showLivePulse && (
        <div className="absolute top-3 right-4 inline-flex items-center gap-1.5 bg-danger/90 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-widest">
          <span className="w-1.5 h-1.5 rounded-full bg-white pulse-dot"/> Live
        </div>
      )}
      {props.status === "paused" && (
        <div className="absolute top-3 right-4 inline-flex items-center gap-1.5 bg-spc-gold/90 text-spc-goldDeep text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-widest">Pause</div>
      )}
      {props.status === "prep" && (
        <div className="absolute top-3 right-4 inline-flex items-center gap-1.5 bg-white/20 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-widest">Vorbereitung</div>
      )}
      {props.status === "finished" && (
        <div className="absolute top-3 right-4 inline-flex items-center gap-1.5 bg-white/20 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-widest">Beendet</div>
      )}
      <LiveClock {...props} />
    </section>
  );
}

// Trend-Cell: für später (braucht historische snapshots). Aktuell Placeholder mit "—"
export function TrendCell({ userId }: { userId: string }) {
  return <div className="text-right text-[13px] text-ink-4 num font-semibold">—</div>;
}
