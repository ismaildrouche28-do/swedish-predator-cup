import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

function decodeJwt(token: string) {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(Buffer.from(payload, "base64").toString());
  } catch { return { error: "invalid jwt" }; }
}

export async function GET() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

  const tests: any = {};

  // Test 1: verschiedene Tabellen
  for (const table of ["users", "competitions", "boats", "catches", "penalties", "competition_settings"]) {
    const { data, error } = await supabaseAdmin.from(table).select("*").limit(1);
    tests[table] = error ? { error: error.message, code: error.code } : { rows: data?.length ?? 0, ok: true };
  }

  // Test 2: raw SQL via RPC (funktioniert nur wenn "select_current_role" function existiert - meistens nicht)
  const { data: rawTest, error: rawError } = await supabaseAdmin.rpc("current_role_check");

  return NextResponse.json({
    service_jwt_payload: decodeJwt(serviceKey),
    anon_jwt_payload: decodeJwt(anonKey),
    tables: tests,
    raw_test: rawError ? { error: rawError.message } : rawTest,
  }, { headers: { "content-type": "application/json" } });
}
