import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { supabaseAdmin } from "./supabase";

const APP_PIN   = process.env.SPC_APP_PIN   ?? "spc2026";
const ADMIN_PIN = process.env.SPC_ADMIN_PIN ?? "admin2026";

const APP_COOKIE     = "spc_app";      // Wert = "ok" nach PIN-Login
const ADMIN_COOKIE   = "spc_admin";    // Wert = "ok" nach Admin-PIN-Login
const PROFILE_COOKIE = "spc_profile";  // Wert = user_id

export type Profile = {
  id: string;
  email: string | null;
  name: string;
  nickname: string | null;
  avatar_url: string | null;
  is_active: boolean;
};

export function checkAppPin(pin: string) { return pin === APP_PIN; }
export function checkAdminPin(pin: string) { return pin === ADMIN_PIN; }

export function isAppUnlocked() {
  return cookies().get(APP_COOKIE)?.value === "ok";
}
export function isAdminUnlocked() {
  return cookies().get(ADMIN_COOKIE)?.value === "ok";
}

export function requireApp() {
  if (!isAppUnlocked()) redirect("/login");
}
export function requireAdmin() {
  requireApp();
  if (!isAdminUnlocked()) redirect("/admin/login");
}

// Aktuelles Profil aus Cookie holen
export const requireProfile = cache(async (): Promise<Profile> => {
  requireApp();
  const pid = cookies().get(PROFILE_COOKIE)?.value;
  if (!pid) redirect("/profil-waehlen");

  const { data } = await supabaseAdmin
    .from("users")
    .select("id, email, name, nickname, avatar_url, is_active")
    .eq("id", pid)
    .maybeSingle();

  if (!data || !data.is_active) redirect("/profil-waehlen");
  return data as Profile;
});

// Kompat-Layer für alten Code (requireAuth → requireProfile mit dummy is_admin)
export type SessionUser = Profile & { onboarding_done: boolean; is_admin: boolean };
export const requireAuth = cache(async (): Promise<SessionUser> => {
  const p = await requireProfile();
  return { ...p, onboarding_done: true, is_admin: isAdminUnlocked() };
});
