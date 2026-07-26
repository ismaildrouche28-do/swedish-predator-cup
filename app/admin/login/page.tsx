import { AdminLoginForm } from "./AdminLoginForm";
export const dynamic = "force-dynamic";
export default function AdminLoginPage() {
  return (
    <main className="min-h-screen bg-cs-gradient flex flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-cs p-7">
        <div className="text-center mb-6">
          <div className="text-3xl mb-2">🔒</div>
          <h1 className="text-[20px] font-bold text-spc-dark tracking-tight">Admin-Bereich</h1>
          <p className="text-[14px] text-ink-2 mt-1">Gib den Admin-Code ein.</p>
        </div>
        <AdminLoginForm />
        <div className="mt-4 text-center">
          <a href="/profil-waehlen" className="text-[12.5px] text-ink-3 hover:text-spc-mid">← Zur Profil-Auswahl</a>
        </div>
      </div>
    </main>
  );
}
