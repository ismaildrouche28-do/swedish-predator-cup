"use server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function saveCatch(formData: FormData): Promise<{ error?: string; ok?: boolean; catchId?: string; improved?: boolean }> {
  const user = await requireAuth();
  const competition_id = String(formData.get("competition_id") ?? "");
  const species = String(formData.get("species") ?? "") as "perch" | "zander" | "pike";
  const length_cm = parseInt(String(formData.get("length_cm") ?? "0"));
  const topwater = formData.get("topwater") === "1";
  if (!competition_id || !species || !length_cm) return { error: "Alle Felder ausfüllen" };

  // Punkte VOR dem Insert
  const { data: rankBefore } = await supabaseAdmin.from("live_ranking").select("points").eq("competition_id", competition_id).eq("user_id", user.id).maybeSingle();
  const pointsBefore = rankBefore?.points ?? 0;

  const { data: inserted, error } = await supabaseAdmin.from("catches").insert({
    competition_id, user_id: user.id, species, length_cm, topwater,
  }).select("id").single();
  if (error) return { error: error.message };

  // Punkte NACH dem Insert (Trigger hat inzwischen recompute gemacht)
  const { data: rankAfter } = await supabaseAdmin.from("live_ranking").select("points").eq("competition_id", competition_id).eq("user_id", user.id).maybeSingle();
  const pointsAfter = rankAfter?.points ?? 0;

  const improved = pointsAfter > pointsBefore;
  revalidatePath("/", "layout");
  return { ok: true, catchId: inserted?.id, improved };
}

export async function savePenalty(formData: FormData) {
  const user = await requireAuth();
  const competition_id = String(formData.get("competition_id") ?? "");
  const penalty_type = String(formData.get("penalty_type") ?? "") as "abriss" | "handling";
  if (!competition_id || !penalty_type) return { error: "Fehlt" };

  const { data: settings } = await supabaseAdmin.from("competition_settings").select("*").eq("competition_id", competition_id).maybeSingle();
  const points = penalty_type === "abriss" ? -(settings?.abriss_penalty ?? 20) : 0;
  const ban_until = penalty_type === "handling"
    ? new Date(Date.now() + (settings?.handling_ban_minutes ?? 10) * 60_000).toISOString()
    : null;

  const { error } = await supabaseAdmin.from("penalties").insert({
    competition_id, user_id: user.id, penalty_type, points, ban_until,
  });
  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return { ok: true };
}
