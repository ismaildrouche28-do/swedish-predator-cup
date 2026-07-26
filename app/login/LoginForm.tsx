"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

const supa = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export function LoginForm() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const sendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setMsg(null);
    const { error } = await supa.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
    setLoading(false);
    if (error) return setMsg("Fehler: " + error.message);
    setStep("code");
    setMsg("Wir haben dir einen 6-stelligen Code per E-Mail geschickt. Bitte auch im Spam-Ordner nachschauen.");
  };

  const verifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setMsg(null);
    const { error } = await supa.auth.verifyOtp({ email, token: code, type: "email" });
    setLoading(false);
    if (error) return setMsg("Code falsch oder abgelaufen: " + error.message);
    router.push("/");
    router.refresh();
  };

  return (
    <div className="space-y-4">
      {step === "email" ? (
        <form onSubmit={sendCode} className="space-y-3">
          <label className="block text-[13px] font-semibold text-ink">E-Mail-Adresse</label>
          <input type="email" required autoFocus autoComplete="email"
            value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-fill border border-transparent focus:border-ocean focus:bg-white outline-none text-[15px]"
            placeholder="du@beispiel.de" />
          <p className="text-[12px] font-semibold text-danger leading-snug">
            Wichtig: Die Mail landet oft im Spam-Ordner. Wenn du sie nicht siehst, dort nachschauen.
          </p>
          <button type="submit" disabled={loading || !email}
            className="w-full py-3.5 rounded-xl bg-ocean text-white font-semibold disabled:opacity-50">
            {loading ? "Wird gesendet…" : "Code per Mail anfordern"}
          </button>
        </form>
      ) : (
        <form onSubmit={verifyCode} className="space-y-3">
          <div className="text-[13.5px] text-ink-2">Code für <strong>{email}</strong></div>
          <input type="text" inputMode="numeric" pattern="[0-9]*" required autoFocus maxLength={6}
            value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            className="w-full px-4 py-3 rounded-xl bg-fill border border-transparent focus:border-ocean focus:bg-white outline-none text-center text-[26px] tracking-[0.4em] num font-semibold"
            placeholder="000000" />
          <button type="submit" disabled={loading || code.length < 6}
            className="w-full py-3.5 rounded-xl bg-ocean text-white font-semibold disabled:opacity-50">
            {loading ? "Prüfe…" : "Anmelden"}
          </button>
          <button type="button" onClick={() => { setStep("email"); setCode(""); setMsg(null); }}
            className="w-full py-2 text-[13px] text-ink-2 hover:text-ink">
            ← Andere E-Mail nutzen
          </button>
        </form>
      )}
      {msg && (
        <div className="text-[13px] text-ink-2 bg-fill rounded-lg p-3 leading-relaxed">{msg}</div>
      )}
    </div>
  );
}
