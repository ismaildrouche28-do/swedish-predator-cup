import { supabaseAdmin } from "./supabase";

// Effektive Zeit (ohne Pause) auf Wanduhr-Zeit mappen.
export function effToWall(effOffsetMs: number, startMs: number, pauseStartMs: number | null, pauseEndMs: number | null): number {
  if (pauseStartMs == null || pauseEndMs == null) return startMs + effOffsetMs;
  const preClipMs = pauseStartMs - startMs;
  const pauseMs = pauseEndMs - pauseStartMs;
  if (preClipMs <= 0) return startMs + effOffsetMs + pauseMs;
  if (effOffsetMs <= preClipMs) return startMs + effOffsetMs;
  return startMs + effOffsetMs + pauseMs;
}

// Pause-aware Call-Generator. Verteilt jede Boot-Besatzung gleichmäßig
// über Wettkampfzeit (abzüglich Pause). Löscht bestehende Calls des Wettkampfs.
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

  const pauseMs = (pauseStartMs != null && pauseEndMs != null) ? (pauseEndMs - pauseStartMs) : 0;
  const effectiveMs = Math.max(1, endMs - startMs - pauseMs);

  const rows: any[] = [];
  for (const b of boats) {
    const { data: members } = await supabaseAdmin.from("boat_members").select("user_id").eq("boat_id", b.id);
    if (!members || members.length === 0) continue;
    const per = effectiveMs / members.length;
    for (let i = 0; i < members.length; i++) {
      const s = effToWall(i * per, startMs, pauseStartMs, pauseEndMs);
      const e = effToWall((i + 1) * per, startMs, pauseStartMs, pauseEndMs);
      const callType = members.length === 1 ? "morning" : i === 0 ? "morning" : i === members.length - 1 ? "late" : "mid";
      rows.push({
        competition_id: competitionId,
        boat_id: b.id,
        user_id: members[i].user_id,
        call_type: callType,
        start_at: new Date(s).toISOString(),
        end_at:   new Date(e).toISOString(),
      });
    }
  }

  if (rows.length > 0) {
    const { error } = await supabaseAdmin.from("calls").insert(rows);
    if (error) return { error: error.message };
  }
  return { ok: true, count: rows.length };
}
