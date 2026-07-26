"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function AdminLoginForm() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setErr(null);
    const r = await fetch("/api/admin-login", {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ pin }),
    });
    setLoading(false);
    if (!r.ok) { const j = await r.json().catch(() => ({})); return setErr(j.error ?? "Falsch"); }
    router.push("/admin");
    router.refresh();
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <input type="password" required autoFocus value={pin} onChange={(e) => setPin(e.target.value)}
        style={{background: "#f5f7fa", color: "#1c1c1e"}}
        className="w-full px-4 py-3 rounded-xl border border-transparent focus:border-spc-mid focus:bg-white outline-none text-[17px] tracking-wider"
        placeholder="••••••••" />
      <button type="submit" disabled={loading || !pin}
        style={{background: "#0a3d5c", color: "#ffffff"}}
        className="w-full py-3.5 rounded-2xl font-bold text-[15px] disabled:opacity-50">
        {loading ? "Prüfe…" : "Öffnen"}
      </button>
      {err && <div className="text-[13px] rounded-xl p-3" style={{background: "#fdecea", color: "#c22"}}>{err}</div>}
    </form>
  );
}
