import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PASSWORD = "test123456";

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: "email fehlt" }, { status: 400 });

  const res = NextResponse.redirect(new URL("/", req.url));
  const supa = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(n) { return req.cookies.get(n)?.value; },
        set(n, v, o) { res.cookies.set({ name: n, value: v, ...o }); },
        remove(n, o) { res.cookies.set({ name: n, value: "", ...o }); },
      },
    }
  );

  const { error } = await supa.auth.signInWithPassword({ email, password: PASSWORD });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return res;
}
