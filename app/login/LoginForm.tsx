"use client";
import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

const supa = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [msgType, setMsgType] = useState<"info" | "error">("info");
  const [loading, setLoading] = useState(false);

  const sendLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setMsg(null);
    const redirectTo = `${window.location.origin}/auth/callback`;
    const { error } = await supa.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true, emailRedirectTo: redirectTo },
    });
    setLoading(false);
    if (error) {
      const m = error.message.toLowerCase().includes("rate limit")
        ? "Zu viele Anfragen. Bitte kurz warten und nochmal probieren."
        : "Fehler: " + error.message;
      setMsg(m); setMsgType("error"); return;
    }
    setSent(true);
    setMsg("Wir haben dir einen Anmeldelink geschickt. Klick den Link in deiner Mail — dann bist du drin.");
    setMsgType("info");
  };

  if (sent) return (
    <div className="space-y-4 text-center">
      <div className="text-4xl">📬</div>
      <div className="text-[15px] font-bold" style={{color: "#0a3d5c"}}>Check deine Mails</div>
      <div className="text-[14px] leading-relaxed" style={{color: "#48484a"}}>
        Wir haben dir einen Anmeldelink an <strong>{email}</strong> geschickt.<br/>
        Öffne die Mail und klick auf den Link — dann landest du direkt auf deinem Dashboard.
      </div>
      <div className="text-[12px] font-semibold" style={{color: "#e0524e"}}>
        Bitte auch im Spam-Ordner nachschauen — die erste Mail landet dort oft.
      </div>
      <button onClick={() => { setSent(false); setMsg(null); }} className="text-[13px] font-semibold hover:underline" style={{color: "#0a6db8"}}>
        ← Andere E-Mail nutzen
      </button>
    </div>
  );

  return (
    <form onSubmit={sendLink} className="space-y-4">
      <div>
        <label className="block text-[13px] font-semibold mb-1.5" style={{color: "#0a3d5c"}}>E-Mail-Adresse</label>
        <input type="email" required autoFocus autoComplete="email"
          value={email} onChange={(e) => setEmail(e.target.value)}
          style={{background: "#f5f7fa", color: "#1c1c1e"}}
          className="w-full px-4 py-3 rounded-xl border border-transparent focus:border-spc-mid focus:bg-white outline-none text-[15px]"
          placeholder="du@beispiel.de" />
      </div>
      <button type="submit" disabled={loading || !email}
        style={{background: "#0a3d5c", color: "#ffffff"}}
        className="w-full py-3.5 rounded-2xl font-bold text-[15px] disabled:opacity-50 hover:opacity-90 transition">
        {loading ? "Wird gesendet…" : "Anmeldelink per Mail anfordern"}
      </button>
      <p className="text-[12px] leading-snug" style={{color: "#48484a"}}>
        Du bekommst eine Mail mit einem Link. Nach dem Klick bist du automatisch angemeldet — kein Passwort nötig.
      </p>
      {msg && (
        <div className="text-[13px] rounded-xl p-3 leading-relaxed"
          style={{background: msgType === "error" ? "#fdecea" : "#eef4f8", color: msgType === "error" ? "#c22" : "#1c1c1e"}}>
          {msg}
        </div>
      )}
    </form>
  );
}
