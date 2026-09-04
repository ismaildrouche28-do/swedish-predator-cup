"use client";
import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Icons } from "./Icons";
import { SpcLogoCompact } from "./SpcLogo";

const NAV = [
  { href: "/",           label: "Home",            icon: Icons.home },
  { href: "/live",       label: "Live-Ranking",    icon: Icons.live },
  { href: "/scoreboard", label: "Mein Scoreboard", icon: Icons.board },
  { href: "/fang",       label: "Fang erfassen",   icon: Icons.fish },
  { href: "/historie",   label: "Historie",        icon: Icons.history },
  { href: "/hof",        label: "Hall of Fame",    icon: Icons.trophy },
  { href: "/stats",      label: "Meine Statistik", icon: Icons.stats },
  { href: "/regelwerk",  label: "Regeln",          icon: Icons.book },
  { href: "/profil",     label: "Mein Profil",     icon: Icons.user },
];

export function TopBar({ nickname, avatarUrl, isAdmin }: { nickname: string; avatarUrl?: string | null; isAdmin?: boolean }) {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  const initial = (nickname ?? "?").slice(0, 1).toUpperCase();
  const nav = isAdmin ? [
    ...NAV,
    { href: "/admin",              label: "Admin · Übersicht",     icon: Icons.trophyFilled },
    { href: "/admin/wettkampf-neu",label: "Admin · Wettkampf aufbauen", icon: Icons.settings },
    { href: "/admin/wettkampf",    label: "Admin · Wettkampf steuern",  icon: Icons.live },
  ] : NAV;
  return (
    <>
      <header className="lg:hidden blur-bar sticky top-0 z-30 border-b border-black/[0.10] flex items-center justify-between px-4 safe-pt pb-3">
        <button onClick={() => setOpen(true)} aria-label="Menü öffnen" className="w-9 h-9 -ml-2 flex items-center justify-center rounded-lg hover:bg-spc-greyLight">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-spc-dark">
            <path d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        </button>
        <Link href="/" className="flex items-center gap-2">
          <SpcLogoCompact />
        </Link>
        <Link href="/profil" className="w-9 h-9 rounded-full bg-spc-mid text-white flex items-center justify-center text-[13px] font-bold overflow-hidden">
          {avatarUrl ? <img src={avatarUrl} alt="" className="w-full h-full object-cover"/> : initial}
        </Link>
      </header>

      {/* Overlay-Drawer */}
      {open && (
        <>
          <div onClick={() => setOpen(false)} className="lg:hidden fixed inset-0 bg-black/40 z-40" />
          <aside className="lg:hidden fixed top-0 left-0 bottom-0 w-[280px] bg-white z-50 shadow-2xl overflow-y-auto safe-pt">
            <div className="px-4 pb-4 border-b border-black/[0.06] flex items-center justify-between">
              <SpcLogoCompact />
              <button onClick={() => setOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-spc-greyLight text-ink-3 text-[20px]">×</button>
            </div>
            <nav className="p-2">
              {nav.map(item => {
                const Icon = item.icon;
                const active = path === item.href || (item.href !== "/" && path.startsWith(item.href));
                return (
                  <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14.5px] font-medium ${
                      active ? "bg-spc-lighter text-spc-dark" : "text-ink hover:bg-spc-greyLight"
                    }`}>
                    <Icon className={`w-5 h-5 ${active ? "text-spc-mid" : "text-ink-3"}`} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="p-3 mt-2 border-t border-black/[0.06]">
              <form action="/api/logout" method="post">
                <button className="text-spc-mid text-[13px] font-semibold hover:underline">Profil wechseln →</button>
              </form>
            </div>
          </aside>
        </>
      )}
    </>
  );
}
