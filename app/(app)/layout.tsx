import { requireAuth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { BottomNav } from "@/components/BottomNav";
import { TopBar } from "@/components/TopBar";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAuth();
  if (!user.onboarding_done) redirect("/onboarding");
  const nick = user.nickname ?? user.name;
  return (
    <div className="grid lg:grid-cols-[240px_1fr] min-h-screen bg-spc-greyLight">
      <Sidebar nickname={nick} />
      <div>
        <TopBar nickname={nick} />
        <main className="pb-28 lg:pb-10 min-h-screen">
          <div className="max-w-[1120px] mx-auto px-4 lg:px-8 pt-4 lg:pt-6">
            {children}
          </div>
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
