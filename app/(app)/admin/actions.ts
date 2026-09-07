"use server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAdmin } from "@/lib/auth";
import { generateCallsForCompetitionShared } from "@/lib/calls";
import { revalidatePath } from "next/cache";

export async function createProfile(formData: FormData) {
  requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const nickname = String(formData.get("nickname") ?? "").trim() || null;
  if (!name) return { error: "Name ist Pflicht" };
  const { error } = await supabaseAdmin.from("users").insert({ name, nickname, is_active: true, onboarding_done: true });
  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function updateProfileById(id: string, formData: FormData) {
  requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const nickname = String(formData.get("nickname") ?? "").trim() || null;
  if (!name) return { error: "Name ist Pflicht" };
  const { error } = await supabaseAdmin.from("users").update({ name, nickname }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function toggleProfileActive(id: string, active: boolean) {
  requireAdmin();
  await supabaseAdmin.from("users").update({ is_active: active }).eq("id", id);
  revalidatePath("/", "layout");
}

export async function deleteProfilePermanent(id: string) {
  requireAdmin();
  // Fänge & Strafen des Profils auch weg
  await supabaseAdmin.from("catches").delete().eq("user_id", id);
  await supabaseAdmin.from("penalties").delete().eq("user_id", id);
  await supabaseAdmin.from("boat_members").delete().eq("user_id", id);
  await supabaseAdmin.from("calls").delete().eq("user_id", id);
  await supabaseAdmin.from("users").delete().eq("id", id);
  revalidatePath("/", "layout");
}

export async function updateCompetitionMeta(competitionId: string, formData: FormData) {
  requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim() || null;
  const start_at = String(formData.get("start_at") ?? "") || null;
  const end_at = String(formData.get("end_at") ?? "") || null;
  const status = String(formData.get("status") ?? "");
  if (!name) return { error: "Name ist Pflicht" };
  const patch: any = { name, location, start_at, end_at, updated_at: new Date().toISOString() };
  if (["prep", "running", "paused", "finished"].includes(status)) patch.status = status;
  const { error } = await supabaseAdmin.from("competitions").update(patch).eq("id", competitionId);
  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function adminLogout() {
  "use server";
  const { cookies } = await import("next/headers");
  cookies().delete("spc_admin");
  const { redirect } = await import("next/navigation");
  redirect("/profil-waehlen");
}


export async function createPresetProfiles() {
  requireAdmin();
  const presets = [
    { name: "Admin",              nickname: "Admin",       is_admin: true  },
    { name: "Erik Kappel",        nickname: "Erik K.",     is_admin: false },
    { name: "Tim Mußmann",        nickname: "Tim M.",      is_admin: false },
    { name: "Jan Dierking",       nickname: "Jan D.",      is_admin: false },
    { name: "Stefan Schlichting", nickname: "Stefan S.",   is_admin: false },
    { name: "Denis Stuchlik",     nickname: "Denis S.",    is_admin: false },
  ];
  const results: any[] = [];
  for (const p of presets) {
    // Update falls Name schon existiert (idempotent)
    const { data: existing } = await supabaseAdmin.from("users").select("id").eq("name", p.name).maybeSingle();
    if (existing) {
      await supabaseAdmin.from("users").update({ nickname: p.nickname, is_active: true, onboarding_done: true }).eq("id", existing.id);
      results.push({ name: p.name, updated: true });
    } else {
      const { error } = await supabaseAdmin.from("users").insert({ ...p, is_active: true, onboarding_done: true });
      results.push({ name: p.name, ok: !error, error: error?.message });
    }
  }
  revalidatePath("/", "layout");
  return { results };
}

// Deaktiviert ALLE Profile ausser den 5 echten Wettkampf-Teilnehmern
export async function deactivateNonPresetProfiles() {
  requireAdmin();
  const preservedNames = [
    "Admin", "Erik Kappel", "Tim Mußmann", "Jan Dierking", "Stefan Schlichting", "Denis Stuchlik"
  ];
  const { error } = await supabaseAdmin
    .from("users")
    .update({ is_active: false })
    .not("name", "in", `(${preservedNames.map(n => `"${n}"`).join(",")})`);
  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return { ok: true };
}



export async function updateCatchAsAdmin(catchId: string, formData: FormData) {
  requireAdmin();
  const length_cm = parseInt(String(formData.get("length_cm") ?? "0"));
  const topwater = formData.get("topwater") === "1";
  const species = String(formData.get("species") ?? "") as "perch" | "zander" | "pike";
  if (!length_cm) return { error: "Länge fehlt" };
  const { error } = await supabaseAdmin.from("catches").update({ length_cm, topwater, species }).eq("id", catchId);
  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteCatchAsAdmin(catchId: string) {
  requireAdmin();
  await supabaseAdmin.from("catches").delete().eq("id", catchId);
  revalidatePath("/", "layout");
}

export async function deletePenaltyAsAdmin(penaltyId: string) {
  requireAdmin();
  await supabaseAdmin.from("penalties").delete().eq("id", penaltyId);
  revalidatePath("/", "layout");
}

// Helper: update mit Fallback falls die neuen Timer-Spalten (actual_start_at, paused_at,
// accumulated_pause_ms) noch nicht in der DB existieren.
async function updateCompRobust(competitionId: string, withTimer: any, minimal: any) {
  let res = await supabaseAdmin.from("competitions").update(withTimer).eq("id", competitionId);
  if (res.error && /actual_start_at|paused_at|accumulated_pause_ms/i.test(res.error.message)) {
    res = await supabaseAdmin.from("competitions").update(minimal).eq("id", competitionId);
  }
  return res;
}

// Wettkampf-Steuerung: Start / Pause / Fortsetzen / Beenden
export async function startCompetitionAdmin(competitionId: string) {
  requireAdmin();
  // Auto-Generate Calls falls noch keine (pause-aware, respektiert die im Wettkampf gesetzte Zeit)
  const { count } = await supabaseAdmin.from("calls").select("id", { count: "exact", head: true }).eq("competition_id", competitionId);
  if (!count || count === 0) {
    await generateCallsForCompetitionShared(competitionId);
  }
  const nowIso = new Date().toISOString();
  await updateCompRobust(competitionId,
    { status: "running", actual_start_at: nowIso, paused_at: null, accumulated_pause_ms: 0, updated_at: nowIso },
    { status: "running", updated_at: nowIso });
  revalidatePath("/", "layout");
}

export async function pauseCompetitionAdmin(competitionId: string) {
  requireAdmin();
  const nowIso = new Date().toISOString();
  // paused_at nur setzen wenn nicht bereits gesetzt
  const { data: comp } = await supabaseAdmin
    .from("competitions").select("paused_at").eq("id", competitionId).maybeSingle();
  const alreadyPaused = !!(comp && (comp as any).paused_at);
  await updateCompRobust(competitionId,
    { status: "paused", paused_at: alreadyPaused ? (comp as any).paused_at : nowIso, updated_at: nowIso },
    { status: "paused", updated_at: nowIso });
  revalidatePath("/", "layout");
}

export async function resumeCompetitionAdmin(competitionId: string) {
  requireAdmin();
  const nowIso = new Date().toISOString();
  // Zeit der offenen Pause aufaddieren
  const { data: comp } = await supabaseAdmin
    .from("competitions").select("paused_at, accumulated_pause_ms").eq("id", competitionId).maybeSingle();
  const anyComp = comp as any;
  let addPauseMs = 0;
  if (anyComp?.paused_at) {
    addPauseMs = Math.max(0, Date.now() - new Date(anyComp.paused_at).getTime());
  }
  const newAcc = Number(anyComp?.accumulated_pause_ms ?? 0) + addPauseMs;
  await updateCompRobust(competitionId,
    { status: "running", paused_at: null, accumulated_pause_ms: newAcc, updated_at: nowIso },
    { status: "running", updated_at: nowIso });
  revalidatePath("/", "layout");
}

// Wettkampf inklusive aller zugehoerigen Daten dauerhaft loeschen.
// Alle FKs sind auf ON DELETE CASCADE gesetzt (competitions -> boats, calls, catches,
// penalties, competition_settings; boats -> boat_members). Ein einziges DELETE
// entfernt daher alle Ergebnis-, Wertungs- und Teilnehmerdaten dieses Wettkampfs.
export async function deleteCompetitionAsAdmin(competitionId: string) {
  requireAdmin();
  if (!competitionId) return { error: "Kein Wettkampf angegeben" };

  // Zusaetzlich defensive Loeschung: falls Cascade in einem alten Schema fehlt
  await supabaseAdmin.from("catches").delete().eq("competition_id", competitionId);
  await supabaseAdmin.from("penalties").delete().eq("competition_id", competitionId);
  await supabaseAdmin.from("calls").delete().eq("competition_id", competitionId);
  // boat_members ueber die boats-Tabelle indirekt (cascade), oder falls Cascade fehlt:
  const { data: boatRows } = await supabaseAdmin.from("boats").select("id").eq("competition_id", competitionId);
  for (const b of boatRows ?? []) {
    await supabaseAdmin.from("boat_members").delete().eq("boat_id", b.id);
  }
  await supabaseAdmin.from("boats").delete().eq("competition_id", competitionId);
  await supabaseAdmin.from("competition_settings").delete().eq("competition_id", competitionId);

  const { error } = await supabaseAdmin.from("competitions").delete().eq("id", competitionId);
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function finishCompetitionAdmin(competitionId: string) {
  requireAdmin();
  const nowIso = new Date().toISOString();
  // Falls aktuell pausiert: Pause aufaddieren und schließen
  const { data: comp } = await supabaseAdmin
    .from("competitions").select("paused_at, accumulated_pause_ms").eq("id", competitionId).maybeSingle();
  const anyComp = comp as any;
  const addPauseMs = anyComp?.paused_at
    ? Math.max(0, Date.now() - new Date(anyComp.paused_at).getTime()) : 0;
  const newAcc = Number(anyComp?.accumulated_pause_ms ?? 0) + addPauseMs;
  await updateCompRobust(competitionId,
    { status: "finished", paused_at: null, accumulated_pause_ms: newAcc, updated_at: nowIso },
    { status: "finished", updated_at: nowIso });
  revalidatePath("/", "layout");
}

// Strafe manuell setzen
export async function createPenaltyAsAdmin(competitionId: string, formData: FormData) {
  requireAdmin();
  const user_id = String(formData.get("user_id") ?? "");
  const penalty_type = String(formData.get("penalty_type") ?? "") as "abriss" | "handling";
  const note = String(formData.get("note") ?? "").trim() || null;
  if (!user_id) return { error: "Teilnehmer fehlt" };
  if (!["abriss", "handling"].includes(penalty_type)) return { error: "Ungültiger Strafentyp" };
  const points = penalty_type === "abriss" ? 20 : 0;
  const ban_until = penalty_type === "handling" ? new Date(Date.now() + 10 * 60 * 1000).toISOString() : null;
  const { error } = await supabaseAdmin.from("penalties").insert({
    competition_id: competitionId, user_id, penalty_type, points, ban_until, note,
  });
  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return { ok: true };
}

// Pause verlängern (bzw. Pausen-Ende neu setzen)
export async function extendPauseAsAdmin(competitionId: string, formData: FormData) {
  requireAdmin();
  const pause_end = String(formData.get("pause_end") ?? "") || null;
  if (!pause_end) return { error: "Neues Pausen-Ende fehlt" };
  const { error } = await supabaseAdmin.from("competitions")
    .update({ pause_end, updated_at: new Date().toISOString() })
    .eq("id", competitionId);
  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return { ok: true };
}
