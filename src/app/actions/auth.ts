"use server";

import { db } from "@/lib/db";

export async function loginUser({ email, password }: { email: string; password: string }) {
  try {
    const user = await db.user.findFirst({
      where: { email, isActive: true },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        password: true,
        department: true,
        avatar: true,
        tenantId: true,
        tenant: { select: { name: true, slug: true } },
      },
    });

    if (!user) {
      return { success: false, error: "Invalid email or password" };
    }

    if (user.password !== password) {
      return { success: false, error: "Invalid email or password" };
    }

    await db.user.update({ where: { id: user.id }, data: { lastLogin: new Date() } });

    return {
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        avatar: user.avatar,
        tenantId: user.tenantId,
        tenantName: user.tenant?.name || null,
        tenantSlug: user.tenant?.slug || null,
      },
    };
  } catch (error) {
    console.error("Login error:", error);
    return { success: false, error: "Login failed. Please try again." };
  }
}

export async function getTenantUsers(tenantId: string) {
  try {
    const users = await db.user.findMany({
      where: { tenantId },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
      },
    });
    return { success: true, data: users };
  } catch (error) {
    console.error("Error fetching tenant users:", error);
    return { success: false, error: "Failed to fetch users" };
  }
}
