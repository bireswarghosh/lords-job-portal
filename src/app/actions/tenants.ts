"use server";

import { db } from "@/lib/db";

export async function getTenants() {
  try {
    const tenants = await db.tenant.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { users: true, jobs: true, candidates: true } },
      },
    });
    return { success: true, data: tenants };
  } catch (error) {
    console.error("Error fetching tenants:", error);
    return { success: false, error: "Failed to fetch tenants" };
  }
}

export async function getTenantBySlug(slug: string) {
  try {
    const tenant = await db.tenant.findUnique({
      where: { slug },
      select: { id: true, name: true, slug: true, logo: true, isActive: true },
    });
    if (!tenant || !tenant.isActive) return { success: false, error: "Tenant not found" };
    return { success: true, data: tenant };
  } catch (error) {
    console.error("Error fetching tenant by slug:", error);
    return { success: false, error: "Failed to fetch tenant" };
  }
}

export async function getTenantById(id: string) {
  try {
    const tenant = await db.tenant.findUnique({
      where: { id },
      include: {
        _count: { select: { users: true, jobs: true, candidates: true } },
        users: {
          select: { id: true, name: true, email: true, role: true, isActive: true, lastLogin: true },
          orderBy: { name: "asc" },
        },
      },
    });
    if (!tenant) return { success: false, error: "Tenant not found" };
    return { success: true, data: tenant };
  } catch (error) {
    console.error("Error fetching tenant:", error);
    return { success: false, error: "Failed to fetch tenant" };
  }
}

export async function createTenant(data: {
  name: string;
  slug: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  plan?: string;
  maxUsers?: number;
  maxJobs?: number;
}) {
  try {
    const existing = await db.tenant.findUnique({ where: { slug: data.slug } });
    if (existing) return { success: false, error: "A client with this slug already exists" };

    const tenant = await db.tenant.create({ data });
    return { success: true, data: tenant };
  } catch (error) {
    console.error("Error creating tenant:", error);
    return { success: false, error: "Failed to create client" };
  }
}

export async function updateTenant(
  id: string,
  data: Partial<{
    name: string;
    slug: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    plan: string;
    isActive: boolean;
    maxUsers: number;
    maxJobs: number;
  }>
) {
  try {
    const tenant = await db.tenant.update({
      where: { id },
      data,
    });
    return { success: true, data: tenant };
  } catch (error) {
    console.error("Error updating tenant:", error);
    return { success: false, error: "Failed to update client" };
  }
}

export async function deleteTenant(id: string) {
  try {
    await db.tenant.delete({ where: { id } });
    return { success: true };
  } catch (error) {
    console.error("Error deleting tenant:", error);
    return { success: false, error: "Failed to delete client" };
  }
}

export async function toggleTenantActive(id: string) {
  try {
    const existing = await db.tenant.findUnique({ where: { id }, select: { isActive: true } });
    if (!existing) return { success: false, error: "Tenant not found" };

    const tenant = await db.tenant.update({
      where: { id },
      data: { isActive: !existing.isActive },
    });
    return { success: true, data: tenant };
  } catch (error) {
    console.error("Error toggling tenant:", error);
    return { success: false, error: "Failed to toggle client status" };
  }
}

export async function createTenantAdminUser(data: {
  tenantId: string;
  name: string;
  email: string;
  password: string;
}) {
  try {
    const cleanEmail = data.email.trim().toLowerCase();
    const cleanPassword = data.password.trim();

    const existing = await db.user.findFirst({
      where: {
        email: { equals: cleanEmail, mode: "insensitive" },
        tenantId: data.tenantId,
      },
    });

    if (existing) {
      return { success: false, error: "A user with this email already exists for this client." };
    }

    const user = await db.user.create({
      data: {
        tenantId: data.tenantId,
        name: data.name.trim(),
        email: cleanEmail,
        password: cleanPassword,
        role: "tenant_admin",
        isActive: true,
      },
    });
    return { success: true, data: user };
  } catch (error) {
    console.error("Error creating tenant admin:", error);
    return { success: false, error: "Failed to create admin user" };
  }
}
