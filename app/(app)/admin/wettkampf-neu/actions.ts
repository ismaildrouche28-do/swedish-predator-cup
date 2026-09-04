"use server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAdmin, requireProfile } from "@/lib/auth";
import { generateCallsForCompetitionShared } from "@/lib/calls";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const generateCallsForCompetition = generateCallsForCompetitionShared;

export async function createCompetition(formData: FormData) {
  requireAdmin();
  const user = await requireProfile();
  const name = String(formData.get("name") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim() || null;
  const start_at = String(formData.get("start_at") ?? "") || null;
  const end_at = String(formData.get("end_at") ?? "") || null;
  const pause_start = String(formData.get("pause_start") ?? "") || null;
  const pause_end   = String(formData.get("pause_end") ?? "") || null;
  if (!name) return { error: "Name ist Pflicht" };
  if (!start_at || !end_at) return { error: "Angelstart und Angelende sind Pflicht" };
  if (new Date(end_at) <= new Date(start_at)) return { error: "Angelende muss nach Angelstart liegen" };
  if (pause_start && pause_end && new Date(pause_end) <= new Date(pause_start)) {
    return { error: "Pausenende muss nach Pausenbeginn liegen" };
  }

  // Erst mit Pause-Spalten versuchen, sonst ohne (falls Migration noch nicht eingespielt)
  const basePayload: any = { name, location, start_at, end_at, status: "prep", created_by: user.id };
  const withPause = { ...basePayload, pause_start, pause_end };
  let ins = await supabaseAdmin.from("competitions").insert(withPause).select().single();
  if (ins.error && /pause_(start|end)/i.test(ins.error.message)) {
    // Fallback: Spalten fehlen noch → ohne Pause anlegen
    ins = await supabaseAdmin.from("competitions").insert(basePayload).select().single();
  }
  if (ins.error || !ins.data) return { error: ins.error?.message ?? "Fehler beim Anlegen" };
  const comp = ins.data;

  await supabaseAdmin.from("competition_settings").insert({ competition_id: comp.id });
  await supabaseAdmin.from("boats").insert([
    { competition_id: comp.id, label: "Boot A", sort_order: 0 },
    { competition_id: comp.id, label: "Boot B", sort_order: 1 },
  ]);

  revalidatePath("/", "layout");
  redirect("/admin/wettkampf-neu");
}

export async function addParticipantById(userId: string, boatId: string) {
  requireAdmin();
  if (!userId || !boatId) return { error: "User und Boot erforderlich" };
  const { data: boat } = await supabaseAdmin.from("boats").select("competition_id").eq("id", boatId).maybeSingle();
  if (boat) {
    const { data: otherBoats } = await supabaseAdmin.from("boats").select("id").eq("competition_id", boat.competition_id);
    if (otherBoats) {
      for (const b of otherBoats) {
        if (b.id !== boatId) {
          await supabaseAdmin.from("boat_members").delete().eq("boat_id", b.id).eq("user_id", userId);
        }
      }
    }
  }
  await supabaseAdmin.from("boat_members").upsert({ boat_id: boatId, user_id: userId });
  revalidatePath("/admin/wettkampf-neu");
}

export async function removeParticipant(boatId: string, userId: string) {
  requireAdmin();
  await supabaseAdmin.from("boat_members").delete().eq("boat_id", boatId).eq("user_id", userId);
  revalidatePath("/admin/wettkampf-neu");
}


// Einzelnen Call anlegen (manuell)
export async function createCallManual(competitionId: string, formData: FormData) {
  requireAdmin();
  const boat_id = String(formData.get("boat_id") ?? "");
  const user_id = String(formData.get("user_id") ?? "");
  const start_at = String(formData.get("start_at") ?? "");
  const end_at   = String(formData.get("end_at") ?? "");
  const call_type = String(formData.get("call_type") ?? "mid");
  if (!boat_id || !user_id || !start_at || !end_at) return { error: "Alle Felder sind Pflicht" };
  if (new Date(end_at) <= new Date(start_at)) return { error: "Ende muss nach Start liegen" };
  const { error } = await supabaseAdmin.from("calls").insert({
    competition_id: competitionId, boat_id, user_id,
    call_type, start_at: new Date(start_at).toISOString(), end_at: new Date(end_at).toISOString(),
  });
  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return { ok: true };
}

// Call bearbeiten
export async function updateCallManual(callId: string, formData: FormData) {
  requireAdmin();
  const user_id = String(formData.get("user_id") ?? "");
  const start_at = String(formData.get("start_at") ?? "");
  const end_at   = String(formData.get("end_at") ?? "");
  const call_type = String(formData.get("call_type") ?? "");
  if (!user_id || !start_at || !end_at || !call_type) return { error: "Alle Felder sind Pflicht" };
  if (new Date(end_at) <= new Date(start_at)) return { error: "Ende muss nach Start liegen" };
  const { error } = await supabaseAdmin.from("calls").update({
    user_id, call_type, start_at: new Date(start_at).toISOString(), end_at: new Date(end_at).toISOString(),
  }).eq("id", callId);
  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return { ok: true };
}

// Call löschen
export async function deleteCallManual(callId: string) {
  requireAdmin();
  const { error } = await supabaseAdmin.from("calls").delete().eq("id", callId);
  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function autoGenerateCalls(competitionId: string) {
  requireAdmin();
  const r = await generateCallsForCompetition(competitionId);
  revalidatePath("/", "layout");
  return r;
}

export async function startCompetition(competitionId: string) {
  requireAdmin();
  const { count } = await supabaseAdmin.from("calls").select("id", { count: "exact", head: true }).eq("competition_id", competitionId);
  if (!count || count === 0) await generateCallsForCompetition(competitionId);

  await supabaseAdmin.from("competitions").update({ status: "running", updated_at: new Date().toISOString() }).eq("id", competitionId);
  revalidatePath("/", "layout");
  redirect("/");
}

export async function finishCompetition(competitionId: string) {
  requireAdmin();
  await supabaseAdmin.from("competitions").update({ status: "finished", updated_at: new Date().toISOString() }).eq("id", competitionId);
  revalidatePath("/", "layout");
  redirect("/");
}

// Grunddaten + Wettkampfzeit während Vorbereitung/Lauf aktualisieren
export async function updateWettkampfzeit(competitionId: string, formData: FormData) {
  requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim() || null;
  const start_at = String(formData.get("start_at") ?? "") || null;
  const end_at   = String(formData.get("end_at") ?? "") || null;
  const pause_start = String(formData.get("pause_start") ?? "") || null;
  const pause_end   = String(formData.get("pause_end") ?? "") || null;
  if (!name) return { error: "Name ist Pflicht" };
  if (!start_at || !end_at) return { error: "Angelstart und Angelende sind Pflicht" };
  if (new Date(end_at) <= new Date(start_at)) return { error: "Angelende muss nach Angelstart liegen" };
  if (pause_start && pause_end && new Date(pause_end) <= new Date(pause_start)) {
    return { error: "Pausenende muss nach Pausenbeginn liegen" };
  }
  const base: any = { name, location, start_at, end_at, updated_at: new Date().toISOString() };
  const withPause = { ...base, pause_start, pause_end };
  let res = await supabaseAdmin.from("competitions").update(withPause).eq("id", competitionId);
  if (res.error && /pause_(start|end)/i.test(res.error.message)) {
    res = await supabaseAdmin.from("competitions").update(base).eq("id", competitionId);
  }
  if (res.error) return { error: res.error.message };
  revalidatePath("/", "layout");
  return { ok: true };
}
