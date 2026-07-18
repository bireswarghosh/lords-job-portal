"use server";

import { db } from "@/lib/db";
import { tenantFilter } from "@/lib/tenant";

export async function getDepartments(tenantId?: string | null) {
  try {
    const departments = await db.department.findMany({
      where: { ...tenantFilter(tenantId) },
      orderBy: { name: "asc" },
      include: {
        _count: { select: { jobs: true } },
      },
    });

    return { success: true, data: departments };
  } catch (error) {
    console.error("Error fetching departments:", error);
    return { success: false, error: "Failed to fetch departments" };
  }
}

export async function createDepartment(data: {
  name: string;
  code: string;
  head?: string;
  totalPositions?: number;
  openPositions?: number;
  color?: string;
  isActive?: boolean;
}, tenantId?: string | null) {
  try {
    const department = await db.department.create({
      data: {
        ...data,
        totalPositions: data.totalPositions ?? 0,
        openPositions: data.openPositions ?? 0,
        color: data.color ?? "#6B7280",
        isActive: data.isActive ?? true,
        tenantId: tenantId ?? null,
      },
    });

    return { success: true, data: department };
  } catch (error) {
    console.error("Error creating department:", error);
    return { success: false, error: "Failed to create department" };
  }
}

export async function updateDepartment(
  id: string,
  data: Partial<{
    name: string;
    code: string;
    head: string;
    totalPositions: number;
    openPositions: number;
    color: string;
    isActive: boolean;
  }>,
  tenantId?: string | null
) {
  try {
    const department = await db.department.update({
      where: { id, ...tenantFilter(tenantId) },
      data,
    });

    return { success: true, data: department };
  } catch (error) {
    console.error("Error updating department:", error);
    return { success: false, error: "Failed to update department" };
  }
}

export async function deleteDepartment(id: string, tenantId?: string | null) {
  try {
    const dept = await db.department.findFirst({ where: { id, ...tenantFilter(tenantId) }, select: { id: true } });
    if (!dept) return { success: false, error: "Department not found" };
    await db.department.delete({ where: { id } });
    return { success: true };
  } catch (error) {
    console.error("Error deleting department:", error);
    return { success: false, error: "Failed to delete department" };
  }
}
