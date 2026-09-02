import Link from "next/link";
import { LoginForm } from "../LoginForm";
import { SpcLogoMark } from "@/components/SpcLogo";

export const dynamic = "force-dynamic";

export default function PinPage() {
  return (
    <main className="relative min-h-screen w-full overflow-hidden text-white">
      <div className="absolute inset-0 z-0">
        <img src="/login-bg.jpg" alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/55 to-black/85" />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col px-6 pt-10 pb-10 safe-pt safe-pb">
        <div className="w-full max-w-sm mx-auto">
          <Link href="/login" className="inline-flex items-center gap-1.5 text-white/85 text-[13px] font-semibold mb-6 hover:text-white transition">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
            Zurück
          </Link>
          <div className="flex justify-center mb-6">
            <SpcLogoMark className="max-w-[210px] drop-shadow-[0_4px_16px_rgba(0,0,0,0.5)]" showSubtitle={false} />
          </div>
          <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 shadow-2xl text-spc-dark">
            <h1 className="text-[20px] font-bold text-spc-dark tracking-tight text-center">Zugangscode</h1>
            <p className="text-[13px] text-ink-2 mt-1 mb-5 text-center">Bekommst du vom Admin.</p>
            <LoginForm />
          </div>
        </div>
      </div>
    </main>
  );
}
