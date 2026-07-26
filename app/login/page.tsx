import { LoginForm } from "./LoginForm";
export const dynamic = "force-dynamic";
export default function LoginPage() {
  return (
    <main className="min-h-screen bg-cs-gradient flex flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-cs p-7">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 mb-3">
            <span className="text-3xl">🎣</span>
            <span className="text-xl font-bold text-spc-dark">SPC</span>
          </div>
          <h1 className="text-[22px] font-bold text-spc-dark tracking-tight">Swedish Predator Cup</h1>
          <p className="text-[14px] text-ink-2 mt-1.5">Melde dich mit deiner E-Mail an.</p>
        </div>
        <LoginForm />
      </div>
      <p className="text-[11px] text-white/60 mt-6">Ein digitaler Begleiter für den SPC.</p>
    </main>
  );
}
