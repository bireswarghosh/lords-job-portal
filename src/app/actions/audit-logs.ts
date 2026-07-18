"use server";

import { db } from "@/lib/db";
import { tenantFilter } from "@/lib/tenant";

type AuditLogFilter = {
  entity?: string;
  action?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
};

export async function getAuditLogs(filters?: AuditLogFilter, tenantId?: string | null) {
  try {
    const where: Record<string, unknown> = { ...tenantFilter(tenantId) };

    if (filters?.entity) {
      where.entity = filters.entity;
    }
    if (filters?.action) {
      where.action = filters.action;
    }
    if (filters?.userId) {
      where.userId = filters.userId;
    }
    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        (where.createdAt as Record<string, unknown>).gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        (where.createdAt as Record<string, unknown>).lte = new Date(filters.endDate);
      }
    }

    const take = filters?.limit ?? 50;
    const skip = filters?.offset ?? 0;

    const [logs, total] = await Promise.all([
      db.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take,
        skip,
      }),
      db.auditLog.count({ where }),
    ]);

    const userIds = [...new Set(logs.map((l) => l.userId))];
    const users = userIds.length > 0
      ? await db.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true } })
      : [];
    const userMap = Object.fromEntries(users.map((u) => [u.id, u.name]));

    const data = logs.map((log) => ({
      ...log,
      userName: userMap[log.userId] || "System",
    }));

    return { success: true, data, total };
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return { success: false, error: "Failed to fetch audit logs" };
  }
}
