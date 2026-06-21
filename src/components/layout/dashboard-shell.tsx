import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { MobileBottomNav } from "./mobile-bottom-nav";
import type { UserProfile } from "@/types/auth";

interface DashboardShellProps {
  children: React.ReactNode;
  user: Pick<UserProfile, "full_name" | "email" | "role">;
}

export function DashboardShell({ children, user }: DashboardShellProps) {
  return (
    <div className="flex h-[100dvh] overflow-hidden bg-slate-50">
      <div className="hidden lg:flex">
        <Sidebar user={user} />
      </div>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header user={user} />
        <main className="scrollbar-thin flex-1 overflow-y-auto p-4 pb-24 sm:p-6 lg:pb-6">
          {children}
        </main>
      </div>

      <MobileBottomNav />
    </div>
  );
}
