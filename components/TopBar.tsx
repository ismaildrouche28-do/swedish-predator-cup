"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icons } from "./Icons";

export function TopBar({ nickname }: { nickname: string }) {
  const path = usePathname();
  const profileActive = path.startsWith("/profil");
  const initial = (nickname ?? "?").slice(0, 1).toUpperCase();
  return (
    <header className="lg:hidden blur-bar sticky top-0 z-30 border-b border-black/[0.10] flex items-center justify-between px-4 safe-pt pb-3">
      <Link href="/" className="flex items-center gap-2">
        <span className="text-xl">🎣</span>
        <span className="text-[15px] font-bold text-spc-dark tracking-tight">Swedish Predator Cup</span>
      </Link>
      <form action="/api/logout" method="post">
        <button title={nickname} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[12px] font-semibold transition
          ${profileActive ? "bg-spc-lighter text-spc-dark" : "bg-spc-greyLight text-ink-2"}`}>
          <span className="w-6 h-6 rounded-full bg-spc-mid text-white flex items-center justify-center text-[11px] font-bold">{initial}</span>
          <span className="max-w-[80px] truncate">{nickname}</span>
        </button>
      </form>
    </header>
  );
}
