"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleToggle = () => setCollapsed((prev) => !prev);
  const handleMobileToggle = () => setMobileOpen((prev) => !prev);

  return (
    <div className="min-h-screen bg-background">
      <div className={cn("hidden lg:block")}>
        <Sidebar collapsed={collapsed} onToggle={handleToggle} />
      </div>

      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-40 lg:hidden">
            <Sidebar collapsed={false} onToggle={() => setMobileOpen(false)} />
          </div>
        </>
      )}

      <TopBar
        sidebarCollapsed={collapsed}
        onToggleSidebar={handleToggle}
        onMobileToggle={handleMobileToggle}
      />

      <main
        className={cn(
          "pt-16 min-h-screen transition-all duration-300",
          collapsed ? "lg:pl-[72px]" : "lg:pl-[260px]"
        )}
      >
        <div className="p-4 sm:p-6 lg:p-8 overflow-y-auto">{children}</div>
      </main>
    </div>
  );
}
