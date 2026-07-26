import { NextRequest, NextResponse } from "next/server";
import { checkAdminPin } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { pin } = await req.json();
  if (!checkAdminPin(pin)) return NextResponse.json({ error: "Falscher Admin-Code" }, { status: 401 });
  const res = NextResponse.json({ ok: true });
  res.cookies.set("spc_admin", "ok", {
    httpOnly: true, sameSite: "lax", secure: true, path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
