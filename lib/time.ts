// Einheitliche Zeit-Anzeige — immer in Europe/Berlin, unabhaengig vom Ort des Renderings.
// Verhindert dass Server-Components (Vercel laeuft in UTC) andere Uhrzeiten zeigen
// als Client-Components (Browser des Users). Alle Fangzeiten, Call-Zeiten, Pause-Zeiten
// und geplanten Wettkampfzeiten laufen ueber diese Helpers.

const TZ = "Europe/Berlin";

export function fmtTime(v: string | Date | null | undefined): string {
  if (!v) return "—";
  const d = typeof v === "string" ? new Date(v) : v;
  if (isNaN(+d)) return "—";
  return d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit", timeZone: TZ });
}

export function fmtDateShort(v: string | Date | null | undefined): string {
  if (!v) return "—";
  const d = typeof v === "string" ? new Date(v) : v;
  if (isNaN(+d)) return "—";
  return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", timeZone: TZ });
}

export function fmtDateTimeShort(v: string | Date | null | undefined): string {
  if (!v) return "—";
  const d = typeof v === "string" ? new Date(v) : v;
  if (isNaN(+d)) return "—";
  return d.toLocaleString("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: TZ });
}

export function fmtDateTimeLong(v: string | Date | null | undefined): string {
  if (!v) return "—";
  const d = typeof v === "string" ? new Date(v) : v;
  if (isNaN(+d)) return "—";
  return d.toLocaleString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: TZ });
}

export function fmtDateWeekday(v: string | Date | null | undefined): string {
  if (!v) return "—";
  const d = typeof v === "string" ? new Date(v) : v;
  if (isNaN(+d)) return "—";
  return d.toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric", timeZone: TZ });
}
