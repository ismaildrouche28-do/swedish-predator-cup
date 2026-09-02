import Link from "next/link";
import { SpcLogoMark } from "@/components/SpcLogo";

export const dynamic = "force-dynamic";

export default function LoginLanding() {
  return (
    <main className="relative min-h-screen w-full overflow-hidden text-white">
      {/* Hintergrund */}
      <div className="absolute inset-0 z-0">
        <img src="/login-bg.jpg" alt="" className="w-full h-full object-cover" />
        {/* Dark-Gradient von oben (Logo lesbar) und unten (Buttons lesbar) */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/30 to-black/75" />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col px-6 pt-16 pb-10 safe-pt safe-pb">
        <div className="flex-1 flex flex-col items-center justify-start pt-6">
          <SpcLogoMark className="max-w-[280px] sm:max-w-[320px] drop-shadow-[0_6px_20px_rgba(0,0,0,0.55)]" />
        </div>

        {/* Buttons unten */}
        <div className="w-full max-w-sm mx-auto space-y-3">
          <Link
            href="/login/pin"
            className="block w-full text-center py-4 rounded-2xl font-bold text-[16px] tracking-wide bg-spc-dark/95 text-white shadow-lg hover:bg-spc-dark transition backdrop-blur-sm"
          >
            Anmelden
          </Link>
          <Link
            href="/regeln"
            className="block w-full text-center py-4 rounded-2xl font-bold text-[16px] tracking-wide bg-white text-spc-dark shadow-lg hover:bg-white/95 transition"
          >
            Wettkampf entdecken
          </Link>
          <p className="text-center text-[11.5px] text-white/70 pt-2 tracking-widest uppercase">Editio 2026</p>
        </div>
      </div>
    </main>
  );
}
