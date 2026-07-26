import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const url = new URL("/profil-waehlen", req.url);
  const res = NextResponse.redirect(url, { status: 303 });
  res.cookies.delete("spc_profile");
  return res;
}
