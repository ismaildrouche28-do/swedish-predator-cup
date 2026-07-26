import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/";

  const res = NextResponse.redirect(new URL(next, req.url));

  if (code) {
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
    const { error } = await supa.auth.exchangeCodeForSession(code);
    if (error) {
      const errRedir = new URL("/login", req.url);
      errRedir.searchParams.set("error", error.message);
      return NextResponse.redirect(errRedir);
    }
  }

  return res;
}
