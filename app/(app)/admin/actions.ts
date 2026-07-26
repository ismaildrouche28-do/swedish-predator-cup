"use server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function updateCompetitionMeta(competitionId: string, formData: FormData) {
  await requireAdmin();
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

export async function deleteCatch(catchId: string) {
  await requireAdmin();
  await supabaseAdmin.from("catches").delete().eq("id", catchId);
  revalidatePath("/", "layout");
}

export async function toggleAdmin(userId: string, makeAdmin: boolean) {
  await requireAdmin();
  await supabaseAdmin.from("users").update({ is_admin: makeAdmin }).eq("id", userId);
  revalidatePath("/", "layout");
}

export async function deleteUser(userId: string) {
  await requireAdmin();
  await supabaseAdmin.from("users").update({ is_active: false }).eq("id", userId);
  revalidatePath("/", "layout");
}
