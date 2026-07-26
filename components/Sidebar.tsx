"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icons } from "./Icons";

const NAV_BASE = [
  { section: "Wettkampf", items: [
    { href: "/",           label: "Dashboard",       icon: Icons.home },
    { href: "/live",       label: "Live-Ranking",    icon: Icons.live },
    { href: "/scoreboard", label: "Mein Scoreboard", icon: Icons.board },
    { href: "/fang",       label: "Fang erfassen",   icon: Icons.fish },
  ]},
  { section: "Archiv", items: [
    { href: "/historie",   label: "Historie",        icon: Icons.history },
    { href: "/hof",        label: "Hall of Fame",    icon: Icons.trophy },
    { href: "/stats",      label: "Meine Statistik", icon: Icons.stats },
  ]},
  { section: "Konto", items: [
    { href: "/profil",     label: "Mein Profil",     icon: Icons.user },
    { href: "/setup",      label: "Einstellungen",   icon: Icons.settings },
  ]},
];

export function Sidebar({ nickname, avatarUrl, isAdmin }: { nickname: string; avatarUrl?: string | null; isAdmin?: boolean }) {
  const path = usePathname();
  const nav = isAdmin
    ? [...NAV_BASE, { section: "Admin", items: [{ href: "/admin", label: "Verwaltung", icon: Icons.trophyFilled }] }]
    : NAV_BASE;
  return (
    <aside className="hidden lg:flex flex-col bg-white w-[240px] shrink-0 sticky top-0 h-screen overflow-y-auto py-6 px-3 border-r border-black/[0.06]">
      <Link href="/" className="px-3 pb-5 mb-2 border-b border-black/[0.06] flex items-center gap-2.5">
        <span className="text-2xl">🎣</span>
        <div>
          <div className="text-[16px] font-bold text-spc-dark leading-tight tracking-tight">Swedish Predator Cup</div>
          <div className="text-[11px] font-semibold text-spc-mid mt-0.5">Editio 2026</div>
        </div>
      </Link>

      {nav.map(section => (
        <div key={section.section} className="mb-1">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-3 px-3 pt-4 pb-1.5">{section.section}</div>
          {section.items.map(item => {
            const Icon = item.icon;
            const active = path === item.href || (item.href !== "/" && path.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-[14.5px] font-medium transition-colors ${
                  active ? "bg-spc-lighter text-spc-dark" : "text-ink hover:bg-spc-greyLight"
                }`}>
                <Icon className={`w-5 h-5 ${active ? "text-spc-mid" : "text-ink-3"}`} />
                {item.label}
              </Link>
            );
          })}
        </div>
      ))}

      <div className="mt-auto pt-4 border-t border-black/[0.06] px-3 flex items-center gap-2.5">
        <Link href="/profil" className="w-9 h-9 rounded-full bg-spc-lighter overflow-hidden flex items-center justify-center flex-shrink-0">
          {avatarUrl ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" /> :
            <span className="text-[13px] font-bold text-spc-mid">{nickname.slice(0,1).toUpperCase()}</span>}
        </Link>
        <div className="flex-1 min-w-0">
          <div className="text-[12.5px] font-bold text-spc-dark truncate">{nickname}</div>
          <form action="/api/logout" method="post">
            <button className="text-spc-mid text-[11.5px] font-semibold hover:underline">Abmelden →</button>
          </form>
        </div>
      </div>
    </aside>
  );
}
