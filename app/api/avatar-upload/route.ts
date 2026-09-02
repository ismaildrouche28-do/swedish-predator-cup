import { NextResponse } from "next/server";
import { requireProfile } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED = new Set(["image/png", "image/jpeg", "image/webp"]);
const MAX_BYTES = 5_000_000;

export async function POST(req: Request) {
  try {
    const user = await requireProfile();

    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Keine Datei erhalten." }, { status: 400 });
    }
    if (!ALLOWED.has(file.type)) {
      return NextResponse.json({ error: "Nur PNG, JPG oder WEBP erlaubt." }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: `Bild zu groß (${Math.round(file.size / 1024 / 1024)} MB, max 5 MB).` }, { status: 400 });
    }

    // Bucket sicherstellen (idempotent, Fehler nicht fatal — Upload zeigt echten Fehler)
    try {
      const { data: buckets } = await supabaseAdmin.storage.listBuckets();
      const hasBucket = buckets?.some(b => b.name === "avatars");
      if (!hasBucket) {
        await supabaseAdmin.storage.createBucket("avatars", {
          public: true,
          fileSizeLimit: MAX_BYTES,
          allowedMimeTypes: ["image/png", "image/jpeg", "image/webp"],
        });
      }
    } catch { /* ignore — falls RLS blockt, geht Upload trotzdem falls Bucket existiert */ }

    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const path = `${user.id}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: upErr } = await supabaseAdmin.storage.from("avatars").upload(path, buffer, {
      contentType: file.type,
      upsert: true,
    });
    if (upErr) {
      return NextResponse.json({ error: `Upload fehlgeschlagen: ${upErr.message}` }, { status: 500 });
    }

    const { data: pub } = supabaseAdmin.storage.from("avatars").getPublicUrl(path);
    const avatarUrl = `${pub.publicUrl}?t=${Date.now()}`;

    const { error: dbErr } = await supabaseAdmin.from("users").update({ avatar_url: avatarUrl }).eq("id", user.id);
    if (dbErr) {
      return NextResponse.json({ error: `DB-Update: ${dbErr.message}` }, { status: 500 });
    }

    revalidatePath("/", "layout");
    return NextResponse.json({ ok: true, avatar_url: avatarUrl });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Unerwarteter Fehler." }, { status: 500 });
  }
}
