"use server";

import { db } from "@/lib/db";
import { tenantFilter } from "@/lib/tenant";

export async function getBranches(tenantId?: string | null) {
  try {
    const branches = await db.hospitalBranch.findMany({
      where: { ...tenantFilter(tenantId) },
      orderBy: { name: "asc" },
      include: {
        _count: { select: { jobs: true } },
      },
    });

    return { success: true, data: branches };
  } catch (error) {
    console.error("Error fetching branches:", error);
    return { success: false, error: "Failed to fetch branches" };
  }
}

export async function createBranch(data: {
  name: string;
  code: string;
  address: string;
  city: string;
  state: string;
  phone: string;
  email: string;
  isActive?: boolean;
}, tenantId?: string | null) {
  try {
    const branch = await db.hospitalBranch.create({
      data: {
        ...data,
        isActive: data.isActive ?? true,
        tenantId: tenantId ?? null,
      },
    });

    return { success: true, data: branch };
  } catch (error) {
    console.error("Error creating branch:", error);
    return { success: false, error: "Failed to create branch" };
  }
}

export async function updateBranch(
  id: string,
  data: Partial<{
    name: string;
    code: string;
    address: string;
    city: string;
    state: string;
    phone: string;
    email: string;
    isActive: boolean;
  }>,
  tenantId?: string | null
) {
  try {
    const branch = await db.hospitalBranch.update({
      where: { id, ...tenantFilter(tenantId) },
      data,
    });

    return { success: true, data: branch };
  } catch (error) {
    console.error("Error updating branch:", error);
    return { success: false, error: "Failed to update branch" };
  }
}

export async function deleteBranch(id: string, tenantId?: string | null) {
  try {
    const branch = await db.hospitalBranch.findFirst({ where: { id, ...tenantFilter(tenantId) }, select: { id: true } });
    if (!branch) return { success: false, error: "Branch not found" };
    await db.hospitalBranch.delete({ where: { id } });
    return { success: true };
  } catch (error) {
    console.error("Error deleting branch:", error);
    return { success: false, error: "Failed to delete branch" };
  }
}
