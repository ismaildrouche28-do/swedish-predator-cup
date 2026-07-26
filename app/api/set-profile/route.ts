import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { profileId } = await req.json();
  if (!profileId) return NextResponse.json({ error: "Fehlt" }, { status: 400 });
  const res = NextResponse.json({ ok: true });
  res.cookies.set("spc_profile", profileId, {
    httpOnly: false, sameSite: "lax", secure: true, path: "/",
    maxAge: 60 * 60 * 24 * 365 * 10,
  });
  return res;
}
