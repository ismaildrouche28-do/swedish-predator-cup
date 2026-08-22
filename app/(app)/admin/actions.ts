"use server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAdmin } from "@/lib/auth";
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
    { name: "Erik Kappel",       nickname: "Erik" },
    { name: "Tim Mußmann",       nickname: "Tim" },
    { name: "Jan Dierking",      nickname: "Jan" },
    { name: "Stefan Schlichting",nickname: "Stefan" },
    { name: "Denis Stuchlik",    nickname: "Denis" },
  ];
  const results: any[] = [];
  for (const p of presets) {
    const { data: existing } = await supabaseAdmin.from("users").select("id").eq("name", p.name).maybeSingle();
    if (existing) { results.push({ name: p.name, existed: true }); continue; }
    const { error } = await supabaseAdmin.from("users").insert({ ...p, is_active: true, onboarding_done: true });
    results.push({ name: p.name, ok: !error, error: error?.message });
  }
  revalidatePath("/", "layout");
  return { results };
}
