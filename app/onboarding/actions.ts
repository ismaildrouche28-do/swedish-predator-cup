"use server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function completeOnboarding(formData: FormData) {
  const user = await requireAuth();
  const name = String(formData.get("name") ?? "").trim();
  const nickname = String(formData.get("nickname") ?? "").trim() || null;
  if (!name) return { error: "Bitte gib deinen Namen ein." };

  // Upsert damit auch wenn User noch nicht in public.users existiert, der Row angelegt wird
  const { error } = await supabaseAdmin.from("users").upsert({
    id: user.id,
    email: user.email,
    name,
    nickname,
    onboarding_done: true,
  }, { onConflict: "id" });
  if (error) return { error: `${error.message} — Check ob SUPABASE_SERVICE_ROLE_KEY in .env.local korrekt ist.` };

  revalidatePath("/", "layout");
  redirect("/");
}
