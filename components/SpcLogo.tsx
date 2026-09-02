// SPC Wortmarke — Krone + SPC + Schwedenflagge + Untertitel.
// Kann später durch echtes PNG unter /public/spc-logo.png ersetzt werden (siehe SpcLogoImg).

export function SpcLogoMark({ className = "", showSubtitle = true }: { className?: string; showSubtitle?: boolean }) {
  return (
    <div className={`inline-flex flex-col items-center ${className}`}>
      <svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto block" aria-label="Swedish Predator Cup">
        <defs>
          <linearGradient id="crown-g" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f4c85a" />
            <stop offset="1" stopColor="#c98b1e" />
          </linearGradient>
        </defs>

        {/* Krone */}
        <g transform="translate(160 44)" fill="url(#crown-g)" stroke="#a06f10" strokeWidth="0.6">
          <path d="M -46 8 L -34 -24 L -18 4 L 0 -34 L 18 4 L 34 -24 L 46 8 L 46 22 L -46 22 Z" />
          <circle cx="0" cy="-32" r="3.2" fill="#fff2c6" stroke="#a06f10" strokeWidth="0.5"/>
          <circle cx="-34" cy="-22" r="2.4" fill="#fff2c6" stroke="#a06f10" strokeWidth="0.5"/>
          <circle cx="34" cy="-22" r="2.4" fill="#fff2c6" stroke="#a06f10" strokeWidth="0.5"/>
        </g>

        {/* SPC in kräftigem, kursivem, athletischem Look */}
        <g fontFamily="'Arial Black', 'Helvetica Neue', Impact, system-ui, sans-serif" fontWeight="900" fontStyle="italic" fill="#ffffff">
          <text x="160" y="132" fontSize="88" textAnchor="middle" letterSpacing="-3">
            SPC
          </text>
        </g>

        {/* Schwedenflagge unter dem C (klein, im Fuß der Wortmarke) */}
        <g transform="translate(160 148)">
          <rect x="-16" y="0" width="32" height="18" rx="1.5" fill="#0057b7" />
          <rect x="-16" y="6.5" width="32" height="5" fill="#ffcd00" />
          <rect x="-4" y="0" width="5" height="18" fill="#ffcd00" />
        </g>
      </svg>

      {showSubtitle && (
        <div className="text-white text-[13px] sm:text-[15px] font-bold tracking-[0.32em] mt-3 select-none">
          SWEDISH&nbsp;PREDATOR&nbsp;CUP
        </div>
      )}
    </div>
  );
}

// Kompakt-Logo (für Header / Sidebar / TopBar)
export function SpcLogoCompact({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <svg viewBox="0 0 40 40" width="26" height="26" xmlns="http://www.w3.org/2000/svg" aria-hidden>
        <defs>
          <linearGradient id="crown-cg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f4c85a" />
            <stop offset="1" stopColor="#c98b1e" />
          </linearGradient>
        </defs>
        <g transform="translate(20 14)" fill="url(#crown-cg)" stroke="#a06f10" strokeWidth="0.5">
          <path d="M -12 3 L -9 -6 L -4.5 1 L 0 -9 L 4.5 1 L 9 -6 L 12 3 L 12 6 L -12 6 Z" />
        </g>
        <text x="20" y="34" fontSize="15" fontWeight="900" fontStyle="italic" fontFamily="'Arial Black', Impact, system-ui" textAnchor="middle" fill="#0a3d5c" letterSpacing="-0.5">SPC</text>
      </svg>
      <span className="flex flex-col leading-tight">
        <span className="text-[15px] font-bold text-spc-dark tracking-tight">Swedish Predator Cup</span>
        <span className="text-[10px] font-semibold text-spc-mid">Editio 2026</span>
      </span>
    </span>
  );
}
