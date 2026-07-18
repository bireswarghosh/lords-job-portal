"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { DEFAULT_ROLE_PERMISSIONS, type PermissionId } from "@/lib/permissions";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string | null;
  avatar: string | null;
  tenantId?: string | null;
  tenantName?: string | null;
  tenantSlug?: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  role: string;
  permissions: string[];
  isAuthenticated: boolean;
  isLoading: boolean;
  hasPermission: (perm: PermissionId) => boolean;
  hasAnyPermission: (perms: PermissionId[]) => boolean;
  refreshUser: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: "",
  permissions: [],
  isAuthenticated: false,
  isLoading: true,
  hasPermission: () => false,
  hasAnyPermission: () => false,
  refreshUser: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const getPermissions = useCallback((role: string): string[] => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("rolePermissions") : null;
    if (stored) {
      try {
        const customPerms = JSON.parse(stored) as Record<string, string[]>;
        if (customPerms[role]) return customPerms[role];
      } catch {}
    }
    return DEFAULT_ROLE_PERMISSIONS[role] || DEFAULT_ROLE_PERMISSIONS["viewer"];
  }, []);

  const [permissions, setPermissions] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      setPermissions(getPermissions(user.role));
    }
  }, [user, getPermissions]);

  const refreshUser = useCallback(() => {
    try {
      const stored = typeof window !== "undefined" ? localStorage.getItem("currentUser") : null;
      if (stored) {
        const parsed = JSON.parse(stored) as AuthUser;
        setUser(parsed);
        setIsLoading(false);
      } else {
        setUser(null);
        setIsLoading(false);
      }
    } catch {
      setUser(null);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { refreshUser(); }, [refreshUser]);

  const logout = useCallback(() => {
    localStorage.removeItem("currentUser");
    setUser(null);
    router.push("/login");
  }, [router]);

  const hasPermission = useCallback((perm: PermissionId): boolean => {
    return permissions.includes(perm);
  }, [permissions]);

  const hasAnyPermission = useCallback((perms: PermissionId[]): boolean => {
    return perms.some((p) => permissions.includes(p));
  }, [permissions]);

  return (
    <AuthContext.Provider value={{ user, role: user?.role || "", permissions, isAuthenticated: !!user, isLoading, hasPermission, hasAnyPermission, refreshUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
