"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icons } from "./Icons";

const ITEMS = [
  { href: "/",         label: "Home",  icon: Icons.home },
  { href: "/live",     label: "Live",  icon: Icons.live },
  { href: "/fang",     label: "Fang",  icon: Icons.fish },
  { href: "/scoreboard",label: "Board", icon: Icons.board },
  { href: "/hof",      label: "Ruhm",  icon: Icons.trophy },
];

export function BottomNav() {
  const path = usePathname();
  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 blur-bar border-t border-black/[0.10] flex justify-around px-2 pt-2 safe-pb">
      {ITEMS.map(item => {
        const Icon = item.icon;
        const active = path === item.href || (item.href !== "/" && path.startsWith(item.href));
        return (
          <Link key={item.href} href={item.href}
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg ${active ? "text-spc-mid" : "text-ink-3"}`}>
            <Icon className="w-[22px] h-[22px]" />
            <span className="text-[10.5px] font-semibold">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
