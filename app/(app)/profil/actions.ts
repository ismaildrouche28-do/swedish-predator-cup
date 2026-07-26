"use server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function updateProfile(formData: FormData) {
  const user = await requireAuth();
  const nickname = String(formData.get("nickname") ?? "").trim() || null;
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Name ist Pflicht" };
  const { error } = await supabaseAdmin.from("users").update({ name, nickname }).eq("id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function updateAvatar(dataUrl: string) {
  const user = await requireAuth();
  if (!dataUrl.startsWith("data:image/")) return { error: "Ungültiges Bild" };
  const match = dataUrl.match(/^data:image\/(png|jpeg|jpg|webp);base64,(.+)$/);
  if (!match) return { error: "Nur PNG/JPG/WEBP erlaubt" };
  const ext = match[1] === "jpeg" ? "jpg" : match[1];
  const buffer = Buffer.from(match[2], "base64");
  if (buffer.length > 3_000_000) return { error: "Bild zu groß (max 3 MB)" };

  const path = `${user.id}.${ext}`;
  const { error: upErr } = await supabaseAdmin.storage.from("avatars").upload(path, buffer, {
    contentType: `image/${match[1]}`, upsert: true,
  });
  if (upErr) return { error: upErr.message };

  const { data: pub } = supabaseAdmin.storage.from("avatars").getPublicUrl(path);
  const cacheBusted = `${pub.publicUrl}?t=${Date.now()}`;
  const { error: dbErr } = await supabaseAdmin.from("users").update({ avatar_url: cacheBusted }).eq("id", user.id);
  if (dbErr) return { error: dbErr.message };

  revalidatePath("/", "layout");
  return { ok: true, avatar_url: cacheBusted };
}
