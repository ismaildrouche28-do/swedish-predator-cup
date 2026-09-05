import { supabaseAdmin } from "./supabase";

// Verteilt eine Kette von Call-Slots über [startMs, endMs] und lässt dabei
// [pauseStartMs, pauseEndMs] vollständig aus. Slots, die die Pause kreuzen,
// werden in zwei Segmente pro Teilnehmer aufgeteilt.
type Slot = { start: number; end: number; memberIndex: number };
function planBoatSlots(
  startMs: number, endMs: number,
  pauseStartMs: number | null, pauseEndMs: number | null,
  memberCount: number
): Slot[] {
  if (memberCount <= 0) return [];
  const pauseMs = (pauseStartMs != null && pauseEndMs != null && pauseEndMs > pauseStartMs)
    ? (pauseEndMs - pauseStartMs) : 0;
  const effectiveMs = Math.max(1, (endMs - startMs) - pauseMs);
  const perMemberMs = effectiveMs / memberCount;

  const slots: Slot[] = [];
  let cursor = startMs;
  for (let i = 0; i < memberCount; i++) {
    let remaining = perMemberMs;
    while (remaining > 0.5) {
      // Wenn Cursor in der Pause → auf Pause-Ende springen
      if (pauseStartMs != null && pauseEndMs != null && cursor >= pauseStartMs && cursor < pauseEndMs) {
        cursor = pauseEndMs;
      }
      // Nächste Grenze: Pause-Beginn oder Wettkampf-Ende
      const nextBoundary = (pauseStartMs != null && cursor < pauseStartMs) ? pauseStartMs : endMs;
      const available = nextBoundary - cursor;
      if (available <= 0) break;
      const chunk = Math.min(remaining, available);
      slots.push({ start: cursor, end: cursor + chunk, memberIndex: i });
      cursor += chunk;
      remaining -= chunk;
      // Falls wir an die Pause-Grenze gestoßen sind: darüber springen
      if (pauseStartMs != null && pauseEndMs != null && cursor === pauseStartMs && remaining > 0.5) {
        cursor = pauseEndMs;
      }
    }
  }
  return slots;
}

// Pause-aware Call-Generator. Verteilt jede Boot-Besatzung gleichmäßig
// über die tatsächliche Fischzeit (Wettkampfzeit abzüglich Pause) und lässt
// die Pause auf beiden Booten vollständig aus. Löscht bestehende Calls.
export async function generateCallsForCompetitionShared(competitionId: string): Promise<{ ok?: boolean; count?: number; error?: string }> {
  let compRes = await supabaseAdmin
    .from("competitions")
    .select("start_at, end_at, pause_start, pause_end")
    .eq("id", competitionId).maybeSingle();
  if (compRes.error && /pause_(start|end)/i.test(compRes.error.message)) {
    compRes = await supabaseAdmin.from("competitions").select("start_at, end_at").eq("id", competitionId).maybeSingle() as any;
  }
  const comp: any = compRes.data;
  if (!comp?.start_at || !comp?.end_at) return { error: "Wettkampf braucht Start- und Endzeit" };

  const startMs = new Date(comp.start_at).getTime();
  const endMs = new Date(comp.end_at).getTime();
  if (endMs <= startMs) return { error: "Ende muss nach Start liegen" };

  let pauseStartMs: number | null = null;
  let pauseEndMs: number | null = null;
  if (comp.pause_start && comp.pause_end) {
    const ps = new Date(comp.pause_start).getTime();
    const pe = new Date(comp.pause_end).getTime();
    if (pe > ps && ps >= startMs && pe <= endMs) {
      pauseStartMs = ps;
      pauseEndMs = pe;
    }
  }

  await supabaseAdmin.from("calls").delete().eq("competition_id", competitionId);

  const { data: boats } = await supabaseAdmin.from("boats").select("id, sort_order").eq("competition_id", competitionId).order("sort_order");
  if (!boats) return { error: "Keine Boote" };

  const rows: any[] = [];
  for (const b of boats) {
    const { data: members } = await supabaseAdmin.from("boat_members").select("user_id").eq("boat_id", b.id);
    if (!members || members.length === 0) continue;
    const slots = planBoatSlots(startMs, endMs, pauseStartMs, pauseEndMs, members.length);
    for (const s of slots) {
      const callType = members.length === 1
        ? "morning"
        : s.memberIndex === 0
          ? "morning"
          : s.memberIndex === members.length - 1
            ? "late"
            : "mid";
      rows.push({
        competition_id: competitionId,
        boat_id: b.id,
        user_id: members[s.memberIndex].user_id,
        call_type: callType,
        start_at: new Date(s.start).toISOString(),
        end_at:   new Date(s.end).toISOString(),
      });
    }
  }

  if (rows.length > 0) {
    const { error } = await supabaseAdmin.from("calls").insert(rows);
    if (error) return { error: error.message };
  }
  return { ok: true, count: rows.length };
}
