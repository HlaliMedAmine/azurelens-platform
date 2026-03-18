import { Outlet } from "react-router-dom";
import { DashboardSidebar, DashboardHeader } from "./DashboardSidebar";

interface LayoutProps {
  user:     { name: string; email: string };
  onLogout: () => void;
}

export function DashboardLayout({ user, onLogout }: LayoutProps) {
  return (
    <div className="flex min-h-screen">
      <DashboardSidebar user={user} onLogout={onLogout} />
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader user={user} onLogout={onLogout} />
        <main className="flex-1 p-6 overflow-y-auto scrollbar-thin space-y-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
