export function tenantFilter(tenantId: string | null | undefined): Record<string, unknown> {
  if (!tenantId) return {};
  return { tenantId };
}

export function tenantOrPublicFilter(tenantId: string | null | undefined): Record<string, unknown> {
  if (!tenantId) return {};
  return { OR: [{ tenantId }, { tenantId: null }] };
}
