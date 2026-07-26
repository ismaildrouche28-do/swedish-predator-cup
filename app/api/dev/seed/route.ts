import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

const TEST_USERS = [
  { email: "jens@spc-test.local",   name: "Jens Lundgren",  nickname: "Jens" },
  { email: "anna@spc-test.local",   name: "Anna Berg",      nickname: "Anna" },
  { email: "peter@spc-test.local",  name: "Peter Svensson", nickname: "Peter" },
  { email: "mikael@spc-test.local", name: "Mikael Nilsson", nickname: "Mikael" },
];
const PASSWORD = "test123456";

export async function POST() {
  const results: any[] = [];

  for (const u of TEST_USERS) {
    // Auth-User anlegen (falls noch nicht da) — mit auto-confirm
    let authUserId: string | null = null;
    const { data: list } = await supabaseAdmin.auth.admin.listUsers();
    const existing = list?.users?.find(x => x.email === u.email);
    if (existing) {
      authUserId = existing.id;
      // Passwort zurücksetzen für Konsistenz
      await supabaseAdmin.auth.admin.updateUserById(existing.id, { password: PASSWORD, email_confirm: true });
    } else {
      const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
        email: u.email,
        password: PASSWORD,
        email_confirm: true,
      });
      if (error || !created?.user) { results.push({ email: u.email, error: error?.message ?? "create failed" }); continue; }
      authUserId = created.user.id;
    }

    // Profil upserten
    await supabaseAdmin.from("users").upsert({
      id: authUserId,
      email: u.email,
      name: u.name,
      nickname: u.nickname,
      onboarding_done: true,
      is_active: true,
    }, { onConflict: "id" });

    results.push({ email: u.email, id: authUserId, ok: true });
  }

  return NextResponse.json({ password: PASSWORD, users: results });
}
