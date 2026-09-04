// SPC Wortmarke — echte Logo-Datei /public/spc-logo.png
// Wird auf hellen wie dunklen Hintergründen genutzt.

export function SpcLogoMark({ className = "", showSubtitle = true }: { className?: string; showSubtitle?: boolean }) {
  // showSubtitle beibehalten für Rückwärtskompatibilität — Untertitel ist im PNG bereits enthalten.
  return (
    <div className={`inline-flex flex-col items-center ${className}`}>
      <img src="/spc-logo.png" alt="Swedish Predator Cup" className="w-full h-auto block select-none" />
    </div>
  );
}

// Kompakt-Logo (für Sidebar-Header)
export function SpcLogoCompact({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center ${className}`}>
      <img src="/spc-logo.png" alt="Swedish Predator Cup" className="h-10 w-auto select-none" />
    </span>
  );
}

// Nur-Logo für den TopBar-Header
export function SpcLogoBrandOnly({ className = "" }: { className?: string }) {
  return (
    <img src="/spc-logo.png" alt="SPC" className={`select-none ${className}`} />
  );
}
