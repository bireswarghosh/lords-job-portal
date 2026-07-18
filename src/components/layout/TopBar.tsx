"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu, Search, Bell, ChevronRight, X, LogOut, User as UserIcon, Settings,
} from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import NotificationPanel from "./NotificationPanel";
import { getUnreadCount } from "@/app/actions/notifications";

const SIDEBAR_NAV = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Vacancies", href: "/vacancies" },
  { label: "Applications", href: "/applications" },
  { label: "Candidates", href: "/candidates" },
  { label: "Interviews", href: "/interviews" },
  { label: "Email", href: "/email" },
  { label: "Departments", href: "/departments" },
  { label: "Branches", href: "/branches" },
  { label: "Reports", href: "/reports" },
  { label: "Users", href: "/users" },
  { label: "Templates", href: "/templates" },
  { label: "Settings", href: "/settings" },
  { label: "Audit Logs", href: "/audit-logs" },
];

interface TopBarProps {
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  onMobileToggle: () => void;
}

export default function TopBar({ sidebarCollapsed, onToggleSidebar, onMobileToggle }: TopBarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchCount = useCallback(async () => {
    const res = await getUnreadCount();
    if (res.success) setUnreadCount(res.data as number);
  }, []);

  useEffect(() => { fetchCount(); }, [fetchCount]);
  useEffect(() => {
    if (!notificationOpen) fetchCount();
  }, [notificationOpen, fetchCount]);

  const breadcrumbSegments = pathname
    .split("/")
    .filter(Boolean)
    .map((segment) => {
      const navItem = SIDEBAR_NAV.find((item) => item.href === `/${segment}`);
      return {
        label: navItem?.label || segment.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        href: `/${segment}`,
      };
    });

  return (
    <header
      className={cn(
        "fixed top-0 right-0 h-16 bg-surface border-b border-border z-30 flex items-center px-4 gap-4 transition-all duration-300",
        sidebarCollapsed ? "left-[72px]" : "left-[260px]"
      )}
    >
      <div className="flex items-center gap-3">
        <button onClick={onMobileToggle} className="lg:hidden p-2 text-text-secondary hover:text-text-primary hover:bg-background rounded-lg transition-colors" aria-label="Toggle menu">
          <Menu className="w-5 h-5" />
        </button>
        <button onClick={onToggleSidebar} className="hidden lg:flex p-2 text-text-secondary hover:text-text-primary hover:bg-background rounded-lg transition-colors" aria-label="Toggle sidebar">
          <Menu className="w-5 h-5" />
        </button>
        <nav className="hidden sm:flex items-center gap-1 text-sm">
          <Link href="/dashboard" className="text-text-secondary hover:text-text-primary transition-colors">Home</Link>
          {breadcrumbSegments.map((segment, i) => (
            <div key={segment.href} className="flex items-center gap-1">
              <ChevronRight className="w-3.5 h-3.5 text-text-muted" />
              {i === breadcrumbSegments.length - 1 ? (
                <span className="text-text-primary font-medium">{segment.label}</span>
              ) : (
                <Link href={segment.href} className="text-text-secondary hover:text-text-primary transition-colors">{segment.label}</Link>
              )}
            </div>
          ))}
        </nav>
      </div>

      <div className="flex-1 max-w-md mx-auto">
        <div className={cn("relative flex items-center rounded-lg border transition-all duration-200", searchFocused ? "border-primary ring-2 ring-primary/10 bg-white" : "border-border bg-background")}>
          <Search className="w-4 h-4 text-text-muted ml-3 shrink-0" />
          <input type="text" placeholder="Search candidates, jobs, applications..." value={searchValue} onChange={(e) => setSearchValue(e.target.value)} onFocus={() => setSearchFocused(true)} onBlur={() => setSearchFocused(false)} className="w-full bg-transparent text-sm text-text-primary placeholder:text-text-muted px-3 py-2 outline-none" />
          {searchValue && (
            <button onClick={() => setSearchValue("")} className="mr-2 p-1 text-text-muted hover:text-text-primary rounded transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1">
        <div className="relative">
          <button
            onClick={() => { setNotificationOpen(!notificationOpen); setUserMenuOpen(false); }}
            className={cn("relative p-2 rounded-lg transition-colors", notificationOpen ? "bg-primary/10 text-primary" : "text-text-secondary hover:text-text-primary hover:bg-background")}
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-accent text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
          <NotificationPanel isOpen={notificationOpen} onClose={() => setNotificationOpen(false)} onCountChange={fetchCount} />
        </div>



        <div className="relative ml-2">
          {user && <div className="relative ml-2">
            <button
              onClick={() => { setUserMenuOpen(!userMenuOpen); setNotificationOpen(false); }}
              className={cn("flex items-center gap-2.5 py-1.5 pl-1.5 pr-3 rounded-lg transition-colors", userMenuOpen ? "bg-primary/10" : "hover:bg-background")}
            >
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center shrink-0">
                <span className="text-xs font-semibold text-white">{getInitials(user.name)}</span>
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-text-primary leading-tight">{user.name}</p>
                <p className="text-xs text-text-secondary capitalize">{user.role.replace(/_/g, " ")}</p>
              </div>
            </button>

            {userMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-2 w-56 bg-surface border border-border rounded-xl shadow-lg z-50 py-1 animate-slide-in">
                  <div className="px-3 py-2 border-b border-border mb-1">
                    <p className="text-sm font-medium text-text-primary">{user.name}</p>
                    <p className="text-xs text-text-secondary">{user.email}</p>
                  </div>
                  <Link href="/settings?tab=profile" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-3 py-2 text-sm text-text-secondary hover:bg-background hover:text-text-primary transition-colors">
                    <UserIcon className="w-4 h-4" />
                    My Profile
                  </Link>
                  <Link href="/settings" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-3 py-2 text-sm text-text-secondary hover:bg-background hover:text-text-primary transition-colors">
                    <Settings className="w-4 h-4" />
                    Settings
                  </Link>
                  <div className="border-t border-border mt-1 pt-1">
                    <button onClick={() => { setUserMenuOpen(false); logout(); }} className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>}
        </div>
      </div>
    </header>
  );
}
