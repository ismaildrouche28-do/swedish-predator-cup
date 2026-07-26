"use client";
import { useState, useRef, useEffect } from "react";
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
  const [msgType, setMsgType] = useState<"info" | "error">("info");
  const [loading, setLoading] = useState(false);
  const codeRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (step === "code") codeRef.current?.focus(); }, [step]);

  const showErr = (m: string) => { setMsg(m); setMsgType("error"); };
  const showInfo = (m: string) => { setMsg(m); setMsgType("info"); };

  const sendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setMsg(null);
    const { error } = await supa.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
    setLoading(false);
    if (error) return showErr(friendlyErr(error.message));
    setStep("code");
    showInfo("Wir haben dir einen 6-stelligen Code per E-Mail geschickt. Bitte auch im Spam-Ordner nachschauen.");
  };

  const verifyCode = async (rawCode?: string) => {
    const c = (rawCode ?? code).replace(/\D/g, "").slice(0, 6);
    if (c.length !== 6) return showErr("Bitte den 6-stelligen Code eingeben.");
    setLoading(true); setMsg(null);
    const { error } = await supa.auth.verifyOtp({ email, token: c, type: "email" });
    setLoading(false);
    if (error) return showErr("Code falsch oder abgelaufen: " + error.message);
    router.push("/");
    router.refresh();
  };

  const onCodeChange = (v: string) => {
    const digits = v.replace(/\D/g, "").slice(0, 6);
    setCode(digits);
    if (digits.length === 6) verifyCode(digits);
  };

  const onCodePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      e.preventDefault();
      setCode(pasted);
      verifyCode(pasted);
    }
  };

  return (
    <div className="space-y-4">
      {step === "email" ? (
        <form onSubmit={sendCode} className="space-y-3">
          <label className="block text-[13px] font-semibold" style={{color: "#0a3d5c"}}>E-Mail-Adresse</label>
          <input type="email" required autoFocus autoComplete="email"
            value={email} onChange={(e) => setEmail(e.target.value)}
            style={{background: "#f5f7fa", color: "#1c1c1e"}}
            className="w-full px-4 py-3 rounded-xl border border-transparent focus:border-spc-mid focus:bg-white outline-none text-[15px]"
            placeholder="du@beispiel.de" />
          <p className="text-[12px] font-semibold leading-snug" style={{color: "#e0524e"}}>
            Wichtig: Die Mail landet oft im Spam-Ordner. Wenn du sie nicht siehst, dort nachschauen.
          </p>
          <button type="submit" disabled={loading || !email}
            style={{background: "#0a3d5c", color: "#ffffff"}}
            className="w-full py-3.5 rounded-2xl font-bold text-[15px] disabled:opacity-50 hover:opacity-90 transition">
            {loading ? "Wird gesendet…" : "Code per Mail anfordern"}
          </button>
        </form>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); verifyCode(); }} className="space-y-3">
          <div className="text-[13.5px]" style={{color: "#48484a"}}>
            Code für <strong>{email}</strong>
          </div>
          <input
            ref={codeRef}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="one-time-code"
            required maxLength={6}
            value={code}
            onChange={(e) => onCodeChange(e.target.value)}
            onPaste={onCodePaste}
            style={{background: "#f5f7fa", color: "#0a3d5c"}}
            className="w-full px-4 py-4 rounded-xl border-2 border-transparent focus:border-spc-mid focus:bg-white outline-none text-center text-[32px] tracking-[0.4em] num font-bold"
            placeholder="000000" />
          <button type="submit" disabled={loading || code.length < 6}
            style={{background: "#0a3d5c", color: "#ffffff"}}
            className="w-full py-3.5 rounded-2xl font-bold text-[15px] disabled:opacity-50 hover:opacity-90 transition">
            {loading ? "Prüfe…" : "Anmelden"}
          </button>
          <button type="button" onClick={() => { setStep("email"); setCode(""); setMsg(null); }}
            className="w-full py-2 text-[13px] font-semibold hover:underline" style={{color: "#0a6db8"}}>
            ← Andere E-Mail nutzen
          </button>
        </form>
      )}
      {msg && (
        <div className="text-[13px] rounded-xl p-3 leading-relaxed"
          style={{background: msgType === "error" ? "#fdecea" : "#eef4f8", color: msgType === "error" ? "#c22" : "#1c1c1e"}}>
          {msg}
        </div>
      )}
    </div>
  );
}

function friendlyErr(m: string) {
  if (m.toLowerCase().includes("rate limit")) return "Zu viele Versuche in kurzer Zeit. Bitte 30–60 Sekunden warten und nochmal probieren.";
  return "Fehler: " + m;
}
