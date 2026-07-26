import { NextResponse } from "next/server";
import { createClientServer } from "@/lib/supabase";

export async function POST() {
  const supa = createClientServer();
  await supa.auth.signOut();
  return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"));
}
