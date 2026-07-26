"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function pickProfile(formData: FormData) {
  const pid = String(formData.get("profileId") ?? "");
  if (!pid) return;
  cookies().set("spc_profile", pid, {
    httpOnly: false, sameSite: "lax", secure: true, path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  redirect("/");
}

export async function logoutApp() {
  cookies().delete("spc_app");
  cookies().delete("spc_profile");
  cookies().delete("spc_admin");
  redirect("/login");
}
