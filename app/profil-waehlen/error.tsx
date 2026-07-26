"use client";
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main style={{padding: 30, fontFamily: "system-ui", background: "#fdecea", minHeight: "100vh"}}>
      <h1 style={{color: "#c22", fontSize: 20, marginBottom: 10}}>Fehler in /profil-waehlen</h1>
      <pre style={{background: "#fff", padding: 15, borderRadius: 8, whiteSpace: "pre-wrap", fontSize: 13, color: "#333"}}>
        {error.message}
        {"\n\n"}
        {error.stack}
      </pre>
      <p style={{marginTop: 15, fontSize: 12, color: "#666"}}>Digest: {error.digest ?? "—"}</p>
      <button onClick={() => reset()} style={{marginTop: 10, padding: "8px 16px", background: "#0a3d5c", color: "#fff", border: "none", borderRadius: 8}}>Nochmal probieren</button>
    </main>
  );
}
