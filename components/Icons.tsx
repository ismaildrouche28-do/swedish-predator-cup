export const Icons = {
  home: (p: any) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12l9-9 9 9M5 10v10h14V10"/></svg>,
  live: (p: any) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18M7 15l4-6 4 3 5-8"/></svg>,
  board: (p: any) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h4"/></svg>,
  fish: (p: any) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12c4-5 10-5 14 0 0 0-5 5-14 0zM22 12l-4-3v6z"/></svg>,
  history: (p: any) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v4l3 2"/></svg>,
  trophy: (p: any) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 4h12v4a6 6 0 01-12 0zM10 14h4v6h-4zM7 20h10"/></svg>,
  stats: (p: any) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="10" width="4" height="10" rx="1"/><rect x="10" y="4" width="4" height="16" rx="1"/><rect x="16" y="14" width="4" height="6" rx="1"/></svg>,
  settings: (p: any) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z"/></svg>,
  plus: (p: any) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>,
  users: (p: any) => <svg {...p} viewBox="0 0 24 24" fill="currentColor"><path d="M12 12a4 4 0 100-8 4 4 0 000 8zM8 14c-3.3 0-6 2.4-6 5.3V21h20v-1.7c0-3-2.7-5.3-6-5.3h-8z" opacity="0.9"/></svg>,
  boat: (p: any) => <svg {...p} viewBox="0 0 24 24" fill="currentColor"><path d="M12 3l7 6h-2v3.4L21 14 19 20a3 3 0 01-1.5.4c-.9 0-1.7-.4-2.3-1a3 3 0 01-4.4 0 3 3 0 01-4.4 0c-.6.6-1.4 1-2.3 1S3 20 3 20l-2-6 4-1.6V9H3l7-6h2zM9 9v2.7l3-.9 3 .9V9H9z" opacity="0.9"/></svg>,
  trophyFilled: (p: any) => <svg {...p} viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h12v4a6 6 0 01-12 0V4zm4 10h4v6h-4v-6zm-3 6h10a1 1 0 010 2H7a1 1 0 010-2z" opacity="0.9"/></svg>,
  fishFilled: (p: any) => <svg {...p} viewBox="0 0 24 24" fill="currentColor"><path d="M2 12c4-5 10-5 14 0 0 0-5 5-14 0zm18 3a3 3 0 01-3-3 3 3 0 013-3v6zM11 9a1 1 0 100 2 1 1 0 000-2z" opacity="0.9"/></svg>,
  back: (p: any) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6"/></svg>,
};

export function FishSvg({ species = "pike", className = "" }: { species?: "perch" | "zander" | "pike"; className?: string }) {
  const paths: any = {
    perch: "M5 25 C 20 12, 55 12, 72 25 C 55 38, 20 38, 5 25 Z M 72 25 L 90 18 M 72 25 L 90 32 M 22 22 A 2 2 0 1 1 22 21.99",
    zander: "M2 25 C 18 8, 62 8, 78 25 C 62 42, 18 42, 2 25 Z M 78 25 L 96 15 M 78 25 L 96 35 M 22 22 A 2 2 0 1 1 22 21.99",
    pike: "M2 25 C 15 5, 65 5, 80 25 C 65 45, 15 45, 2 25 Z M 80 25 L 98 12 M 80 25 L 98 38 M 22 22 A 2 2 0 1 1 22 21.99",
  };
  return (
    <svg className={className} viewBox="0 0 100 50">
      <path d={paths[species]} stroke="currentColor" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function FishPhoto({ species, className = "", alt }: { species: "perch" | "zander" | "pike"; className?: string; alt?: string }) {
  const label = { perch: "Barsch", zander: "Zander", pike: "Hecht" }[species];
  return <img src={`/fish/${species}.png`} alt={alt ?? label} className={className} loading="lazy" />;
}

export function FishThumb({ species, size = 40 }: { species: "perch" | "zander" | "pike"; size?: number }) {
  return (
    <div style={{ width: size, height: size }} className="rounded-full overflow-hidden flex-shrink-0 bg-spc-lighter/40 flex items-center justify-center">
      <img src={`/fish/${species}.png`} alt={species} className="w-full h-full object-contain" loading="lazy" />
    </div>
  );
}
