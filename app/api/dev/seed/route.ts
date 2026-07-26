import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

const TEST = [
  { name: "Jens Lundgren",  nickname: "Jens" },
  { name: "Anna Berg",      nickname: "Anna" },
  { name: "Peter Svensson", nickname: "Peter" },
  { name: "Mikael Nilsson", nickname: "Mikael" },
];

export async function POST() {
  const results: any[] = [];
  for (const u of TEST) {
    const { data: existing } = await supabaseAdmin.from("users").select("id").eq("name", u.name).maybeSingle();
    if (existing) { results.push({ name: u.name, ok: true, existed: true }); continue; }
    const { error } = await supabaseAdmin.from("users").insert({ name: u.name, nickname: u.nickname, is_active: true, onboarding_done: true });
    results.push({ name: u.name, ok: !error, error: error?.message });
  }
  return NextResponse.json({ users: results });
}
