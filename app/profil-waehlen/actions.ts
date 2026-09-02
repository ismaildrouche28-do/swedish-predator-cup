"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase";

export async function pickProfile(formData: FormData) {
  const pid = String(formData.get("profileId") ?? "");
  if (!pid) return;

  cookies().set("spc_profile", pid, {
    httpOnly: false, sameSite: "lax", secure: true, path: "/",
    maxAge: 60 * 60 * 24 * 365 * 10,
  });

  // Falls das Profil is_admin=true hat → auch Admin-Cookie setzen
  const { data: profile } = await supabaseAdmin
    .from("users")
    .select("is_admin")
    .eq("id", pid)
    .maybeSingle();

  if (profile?.is_admin) {
    cookies().set("spc_admin", "ok", {
      httpOnly: true, sameSite: "lax", secure: true, path: "/",
      maxAge: 60 * 60 * 24 * 365 * 10,
    });
  } else {
    // Nicht-Admin-Profil → Admin-Cookie ggf. wegnehmen
    cookies().delete("spc_admin");
  }

  redirect("/");
}

export async function logoutApp() {
  cookies().delete("spc_app");
  cookies().delete("spc_profile");
  cookies().delete("spc_admin");
  redirect("/login");
}
