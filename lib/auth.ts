import { redirect } from "next/navigation";
import { cache } from "react";
import { createClientServer, supabaseAdmin } from "./supabase";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  nickname: string | null;
  avatar_url: string | null;
  onboarding_done: boolean;
};

export const requireAuth = cache(async (): Promise<SessionUser> => {
  const supa = createClientServer();
  const { data: { user } } = await supa.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabaseAdmin
    .from("users")
    .select("id, email, name, nickname, avatar_url, onboarding_done")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    const email = user.email ?? "";
    const nameGuess = email.split("@")[0] || "Neuer Teilnehmer";
    await supabaseAdmin.from("users").insert({
      id: user.id, email, name: nameGuess, onboarding_done: false,
    });
    return { id: user.id, email, name: nameGuess, nickname: null, avatar_url: null, onboarding_done: false };
  }
  return profile as SessionUser;
});
