"use client";
import { useEffect } from "react";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Sichtbar in DevTools + Vercel-Client-Logs
    console.error("[app] server-render error", error);
  }, [error]);

  return (
    <div className="max-w-[560px] mx-auto mt-10 px-4">
      <div className="bg-white rounded-3xl p-6 shadow-cs-sm border border-black/[0.06]">
        <div className="text-[11px] uppercase tracking-widest text-danger font-bold mb-2">Fehler</div>
        <h1 className="text-xl font-bold text-spc-dark mb-1.5">Die Seite konnte nicht geladen werden.</h1>
        <p className="text-[13.5px] text-ink-2 mb-4">
          Etwas ist beim Rendern schiefgelaufen. Ein erneuter Versuch hilft meistens.
        </p>

        <details className="mb-4 bg-spc-greyLight rounded-xl p-3 text-[12px] text-ink-2">
          <summary className="cursor-pointer font-semibold text-spc-dark">Technische Details</summary>
          <div className="mt-2 space-y-1">
            <div><span className="text-ink-3">Nachricht:</span> {error?.message ?? "—"}</div>
            {error?.digest && <div><span className="text-ink-3">Digest:</span> <code>{error.digest}</code></div>}
          </div>
        </details>

        <div className="flex gap-2">
          <button onClick={reset} className="px-4 py-2.5 rounded-xl bg-spc-dark text-white font-bold text-[13.5px] hover:bg-spc-mid transition">
            Nochmal versuchen
          </button>
          <a href="/" className="px-4 py-2.5 rounded-xl bg-spc-lighter text-spc-dark font-bold text-[13.5px] hover:bg-spc-lighter/70 transition">
            Zur Startseite
          </a>
        </div>
      </div>
    </div>
  );
}
