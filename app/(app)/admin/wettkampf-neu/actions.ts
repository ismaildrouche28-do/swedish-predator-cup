"use server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAdmin, requireProfile } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

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

  const { data: comp, error } = await supabaseAdmin
    .from("competitions")
    .insert({ name, location, start_at, end_at, pause_start, pause_end, status: "prep", created_by: user.id })
    .select().single();
  if (error || !comp) return { error: error?.message ?? "Fehler beim Anlegen" };

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

async function generateCallsForCompetition(competitionId: string) {
  const { data: comp } = await supabaseAdmin.from("competitions").select("start_at, end_at").eq("id", competitionId).maybeSingle();
  if (!comp?.start_at || !comp?.end_at) return { error: "Wettkampf braucht Start- und Endzeit" };

  await supabaseAdmin.from("calls").delete().eq("competition_id", competitionId);

  const { data: boats } = await supabaseAdmin.from("boats").select("id, label, sort_order").eq("competition_id", competitionId).order("sort_order");
  if (!boats) return { error: "Keine Boote" };

  const start = new Date(comp.start_at).getTime();
  const end = new Date(comp.end_at).getTime();
  if (end <= start) return { error: "Ende muss nach Start liegen" };

  const rows: any[] = [];
  for (const b of boats) {
    const { data: members } = await supabaseAdmin.from("boat_members").select("user_id").eq("boat_id", b.id);
    if (!members || members.length === 0) continue;

    const chunk = (end - start) / members.length;
    for (let i = 0; i < members.length; i++) {
      const callStart = new Date(start + chunk * i).toISOString();
      const callEnd = new Date(start + chunk * (i + 1)).toISOString();
      const callType = members.length === 1 ? "morning" : i === 0 ? "morning" : i === members.length - 1 ? "late" : "mid";
      rows.push({
        competition_id: competitionId,
        boat_id: b.id,
        user_id: members[i].user_id,
        call_type: callType,
        start_at: callStart,
        end_at: callEnd,
      });
    }
  }

  if (rows.length > 0) {
    const { error } = await supabaseAdmin.from("calls").insert(rows);
    if (error) return { error: error.message };
  }
  return { count: rows.length };
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
  const { error } = await supabaseAdmin.from("competitions")
    .update({ name, location, start_at, end_at, pause_start, pause_end, updated_at: new Date().toISOString() })
    .eq("id", competitionId);
  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return { ok: true };
}
