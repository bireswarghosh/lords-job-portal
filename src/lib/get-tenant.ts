export function getCurrentTenantId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem("currentUser");
    if (!stored) return null;
    const user = JSON.parse(stored);
    return user.tenantId || null;
  } catch {
    return null;
  }
}
