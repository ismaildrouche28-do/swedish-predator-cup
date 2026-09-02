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
  if (!dataUrl || !dataUrl.startsWith("data:image/")) {
    return { error: "Ungültiges Bild (Data-URL erwartet)" };
  }

  const match = dataUrl.match(/^data:image\/(png|jpeg|jpg|webp|gif);base64,(.+)$/i);
  if (!match) return { error: "Nur PNG, JPG oder WEBP erlaubt" };

  const ext = (match[1].toLowerCase() === "jpeg" ? "jpg" : match[1].toLowerCase());
  const buffer = Buffer.from(match[2], "base64");
  if (buffer.length === 0) return { error: "Leeres Bild" };
  if (buffer.length > 5_000_000) return { error: `Bild zu groß (${Math.round(buffer.length/1024/1024)} MB, max 5 MB)` };

  // Sicherstellen dass Bucket existiert (idempotent)
  const { data: buckets } = await supabaseAdmin.storage.listBuckets();
  const hasBucket = buckets?.some(b => b.name === "avatars");
  if (!hasBucket) {
    const { error: createErr } = await supabaseAdmin.storage.createBucket("avatars", {
      public: true, fileSizeLimit: 5_000_000,
      allowedMimeTypes: ["image/png", "image/jpeg", "image/webp"],
    });
    if (createErr) return { error: `Bucket-Erstellung: ${createErr.message}` };
  }

  const path = `${user.id}.${ext}`;
  const contentType = `image/${match[1].toLowerCase() === "jpg" ? "jpeg" : match[1].toLowerCase()}`;
  const { error: upErr } = await supabaseAdmin.storage.from("avatars").upload(path, buffer, {
    contentType, upsert: true,
  });
  if (upErr) return { error: `Upload fehlgeschlagen: ${upErr.message}` };

  const { data: pub } = supabaseAdmin.storage.from("avatars").getPublicUrl(path);
  const cacheBusted = `${pub.publicUrl}?t=${Date.now()}`;
  const { error: dbErr } = await supabaseAdmin.from("users").update({ avatar_url: cacheBusted }).eq("id", user.id);
  if (dbErr) return { error: `DB-Update: ${dbErr.message}` };

  revalidatePath("/", "layout");
  return { ok: true, avatar_url: cacheBusted };
}
