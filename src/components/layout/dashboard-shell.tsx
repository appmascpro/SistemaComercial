import { Sidebar } from "./sidebar";
import { Header } from "./header";
import type { UserProfile } from "@/types/auth";

interface DashboardShellProps {
  children: React.ReactNode;
  user: Pick<UserProfile, "full_name" | "email" | "role">;
}

export function DashboardShell({ children, user }: DashboardShellProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header user={user} />
        <main className="scrollbar-thin flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
