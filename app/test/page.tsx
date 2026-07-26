export const dynamic = "force-dynamic";
export default function TestPage() {
  return (
    <main style={{padding: 40, fontFamily: "system-ui"}}>
      <h1>Test-Route</h1>
      <p>Wenn du das siehst, funktioniert der Server + das Root-Layout.</p>
      <p>Env-Vars: {process.env.NEXT_PUBLIC_SUPABASE_URL ? "URL gesetzt ✅" : "URL fehlt ❌"}</p>
    </main>
  );
}
