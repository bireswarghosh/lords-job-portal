"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Briefcase, FileText, Users, Calendar, MessageCircle, Mail,
  Building2, Globe, MapPin, BarChart3, UserCog, FileStack, Settings, ScrollText,
  ChevronLeft, ChevronRight, LogOut, type LucideIcon,
} from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import { useAuth, type AuthUser } from "@/contexts/auth-context";

const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard, Briefcase, FileText, Users, Calendar, MessageCircle, Mail,
  Building2, MapPin, BarChart3, UserCog, FileStack, Settings, ScrollText,
};

const SIDEBAR_NAV = [
  { label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard", perm: "dashboard.view" },
  { label: "Vacancies", href: "/vacancies", icon: "Briefcase", perm: "vacancies.view" },
  { label: "Applications", href: "/applications", icon: "FileText", perm: "applications.view" },
  { label: "Candidates", href: "/candidates", icon: "Users", perm: "candidates.view" },
  { label: "Interviews", href: "/interviews", icon: "Calendar", perm: "interviews.view" },
  { label: "Email", href: "/email", icon: "Mail", perm: "email.view" },
  { label: "Departments", href: "/departments", icon: "Building2", perm: "departments.view" },
  { label: "Branches", href: "/branches", icon: "MapPin", perm: "branches.view" },
  { label: "Reports", href: "/reports", icon: "BarChart3", perm: "reports.view" },
  { label: "Users", href: "/users", icon: "UserCog", perm: "users.view" },
  { label: "Templates", href: "/templates", icon: "FileStack", perm: "templates.view" },
  { label: "Settings", href: "/settings", icon: "Settings", perm: "settings.view" },
  { label: "Audit Logs", href: "/audit-logs", icon: "ScrollText", perm: "audit_logs.view" },
  { label: "Clients", href: "/tenants", icon: "Globe", perm: "tenants.view" },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { user, permissions, logout } = useAuth();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  useEffect(() => {
    setHoveredItem(null);
  }, [collapsed]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  const filteredNav = SIDEBAR_NAV.filter((item) => permissions.includes(item.perm));

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-full bg-surface sidebar-shadow z-40 flex flex-col transition-all duration-300 ease-in-out",
        collapsed ? "w-[72px]" : "w-[260px]"
      )}
    >
      <div className="flex items-center h-16 px-4 border-b border-border shrink-0">
        <Link href="/dashboard" className="flex items-center gap-3 min-w-0">
          {(() => {
            const logoKey = user?.tenantId ? `appLogo:${user.tenantId}` : "appLogo";
            const logo = typeof window !== "undefined" ? localStorage.getItem(logoKey) : null;
            if (logo) {
              return <img src={logo} alt="Logo" className="w-9 h-9 rounded-lg object-contain shrink-0" />;
            }
            return (
              <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center shrink-0">
                <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L12 8" /><path d="M8 6L16 6" /><path d="M6 12L18 12" /><path d="M6 12L6 20" /><path d="M18 12L18 20" /><path d="M6 20L18 20" />
                </svg>
              </div>
            );
          })()}
          {!collapsed && <span className="text-lg font-bold text-text-primary whitespace-nowrap overflow-hidden">{user?.tenantName || "HospitalRecruit"}</span>}
        </Link>
      </div>

      <button
        onClick={onToggle}
        className={cn(
          "absolute -right-3 top-20 w-6 h-6 bg-surface border border-border rounded-full flex items-center justify-center shadow-sm hover:bg-background transition-colors z-50",
          "text-text-secondary hover:text-text-primary"
        )}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>

      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {filteredNav.map((item) => {
          const Icon = iconMap[item.icon];
          const active = isActive(item.href);
          const showTooltip = collapsed && hoveredItem === item.href;

          return (
            <div key={item.href} className="relative">
              <Link
                href={item.href}
                onMouseEnter={() => setHoveredItem(item.href)}
                onMouseLeave={() => setHoveredItem(null)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group relative",
                  active ? "bg-primary text-white" : "text-text-secondary hover:bg-background hover:text-text-primary",
                  collapsed && "justify-center px-0 mx-auto w-12"
                )}
              >
                {Icon && <Icon className={cn("w-5 h-5 shrink-0 transition-colors", active ? "text-white" : "text-text-secondary group-hover:text-text-primary")} />}
                {!collapsed && <span className="truncate">{item.label}</span>}
                {collapsed && (
                  <span className={cn(
                    "absolute left-full ml-2 px-2 py-1 bg-text-primary text-white text-xs rounded-md whitespace-nowrap opacity-0 pointer-events-none transition-opacity z-50",
                    showTooltip && "opacity-100"
                  )}>{item.label}</span>
                )}
              </Link>
            </div>
          );
        })}
      </nav>

      {user && <div className="border-t border-border px-3 py-3 shrink-0">
        <div className={cn("flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-background transition-colors cursor-pointer", collapsed && "justify-center px-0")}>
          <div className="w-9 h-9 bg-primary-light rounded-full flex items-center justify-center shrink-0">
            <span className="text-sm font-semibold text-primary">{getInitials(user.name)}</span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">{user.name}</p>
              <p className="text-xs text-text-secondary capitalize">{user.role.replace(/_/g, " ")}</p>
            </div>
          )}
        </div>
        {!collapsed && (
          <button onClick={logout} className="mt-2 flex items-center gap-2 w-full px-3 py-2 text-sm text-text-secondary rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors">
            <LogOut className="w-4 h-4" /><span>Sign Out</span>
          </button>
        )}
        {collapsed && (
          <button onClick={logout} className="mt-2 flex items-center justify-center w-full p-2 text-text-secondary hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" aria-label="Sign Out">
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>}
    </aside>
  );
}
