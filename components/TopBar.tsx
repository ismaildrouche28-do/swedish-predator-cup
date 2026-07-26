"use client";
import Link from "next/link";

export function TopBar({ nickname, avatarUrl }: { nickname: string; avatarUrl?: string | null }) {
  const initial = (nickname ?? "?").slice(0, 1).toUpperCase();
  return (
    <header className="lg:hidden blur-bar sticky top-0 z-30 border-b border-black/[0.10] flex items-center justify-between px-4 safe-pt pb-3">
      <Link href="/" className="flex items-center gap-2">
        <span className="text-xl">🎣</span>
        <span className="text-[15px] font-bold text-spc-dark tracking-tight">Swedish Predator Cup</span>
      </Link>
      <Link href="/profil" className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-spc-greyLight text-ink-2 text-[12px] font-semibold hover:bg-spc-lighter transition">
        <span className="w-7 h-7 rounded-full bg-spc-mid text-white flex items-center justify-center text-[11px] font-bold overflow-hidden">
          {avatarUrl ? <img src={avatarUrl} alt="" className="w-full h-full object-cover"/> : initial}
        </span>
        <span className="max-w-[80px] truncate hidden sm:inline">{nickname}</span>
      </Link>
    </header>
  );
}
