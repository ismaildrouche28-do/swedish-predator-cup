"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setErr(null);
    const r = await fetch("/api/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ pin }),
    });
    setLoading(false);
    if (!r.ok) {
      const j = await r.json().catch(() => ({}));
      return setErr(j.error ?? "Falscher Code");
    }
    router.push("/profil-waehlen");
    router.refresh();
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="block text-[13px] font-semibold mb-1.5" style={{color: "#0a3d5c"}}>Zugangscode</label>
        <input type="password" required autoFocus value={pin} onChange={(e) => setPin(e.target.value)}
          style={{background: "#f5f7fa", color: "#1c1c1e"}}
          className="w-full px-4 py-3 rounded-xl border border-transparent focus:border-spc-mid focus:bg-white outline-none text-[17px] tracking-wider"
          placeholder="••••••••" />
      </div>
      <button type="submit" disabled={loading || !pin}
        style={{background: "#0a3d5c", color: "#ffffff"}}
        className="w-full py-3.5 rounded-2xl font-bold text-[15px] disabled:opacity-50 hover:opacity-90 transition">
        {loading ? "Prüfe…" : "Öffnen"}
      </button>
      <p className="text-[12px] leading-snug" style={{color: "#48484a"}}>
        Der Code ist geräteweise gültig (30 Tage). Bekommst du vom Wettkampf-Admin.
      </p>
      {err && <div className="text-[13px] rounded-xl p-3" style={{background: "#fdecea", color: "#c22"}}>{err}</div>}
    </form>
  );
}
