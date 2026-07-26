import { NextRequest, NextResponse } from "next/server";
import { checkAppPin } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { pin } = await req.json();
  if (!checkAppPin(pin)) return NextResponse.json({ error: "Falscher Code" }, { status: 401 });
  const res = NextResponse.json({ ok: true });
  res.cookies.set("spc_app", "ok", {
    httpOnly: true, sameSite: "lax", secure: true, path: "/",
    maxAge: 60 * 60 * 24 * 365 * 10, // 10 Jahre
  });
  return res;
}
