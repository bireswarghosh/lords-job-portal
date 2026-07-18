"use server";

import { db } from "@/lib/db";
import { tenantFilter } from "@/lib/tenant";

export async function getUsers(tenantId?: string | null) {
  try {
    const users = await db.user.findMany({
      where: { ...tenantFilter(tenantId) },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        department: true,
        phone: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { candidates: true, remarks: true } },
      },
    });

    return { success: true, data: users };
  } catch (error) {
    console.error("Error fetching users:", error);
    return { success: false, error: "Failed to fetch users" };
  }
}

export async function getUserById(id: string) {
  try {
    const user = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        department: true,
        phone: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
        candidates: {
          include: {
            job: true,
          },
          orderBy: { createdAt: "desc" },
        },
        _count: { select: { candidates: true, remarks: true, communications: true } },
      },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    return { success: true, data: user };
  } catch (error) {
    console.error("Error fetching user:", error);
    return { success: false, error: "Failed to fetch user" };
  }
}

export async function createUser(data: {
  name: string;
  email: string;
  password: string;
  role?: string;
  avatar?: string;
  department?: string;
  phone?: string;
  isActive?: boolean;
}, tenantId?: string | null) {
  try {
    const user = await db.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role ?? "hr_executive",
        avatar: data.avatar,
        department: data.department,
        phone: data.phone,
        isActive: data.isActive ?? true,
        tenantId: tenantId ?? null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        department: true,
        phone: true,
        isActive: true,
        createdAt: true,
      },
    });

    return { success: true, data: user };
  } catch (error) {
    console.error("Error creating user:", error);
    return { success: false, error: "Failed to create user" };
  }
}

export async function updateUser(
  id: string,
  data: Partial<{
    name: string;
    email: string;
    password: string;
    role: string;
    avatar: string;
    department: string;
    phone: string;
    isActive: boolean;
  }>,
  tenantId?: string | null
) {
  try {
    const user = await db.user.update({
      where: { id, ...tenantFilter(tenantId) },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        department: true,
        phone: true,
        isActive: true,
        updatedAt: true,
      },
    });

    return { success: true, data: user };
  } catch (error) {
    console.error("Error updating user:", error);
    return { success: false, error: "Failed to update user" };
  }
}

export async function toggleUserActive(id: string, tenantId?: string | null) {
  try {
    const existing = await db.user.findFirst({
      where: { id, ...tenantFilter(tenantId) },
      select: { isActive: true },
    });

    if (!existing) {
      return { success: false, error: "User not found" };
    }

    const user = await db.user.update({
      where: { id },
      data: { isActive: !existing.isActive },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    return { success: true, data: user };
  } catch (error) {
    console.error("Error toggling user active:", error);
    return { success: false, error: "Failed to toggle user active status" };
  }
}

export async function deleteUser(id: string, tenantId?: string | null) {
  try {
    const user = await db.user.findFirst({
      where: { id, ...tenantFilter(tenantId) },
      select: { id: true, name: true, role: true },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    if (user.role === "super_admin") {
      return { success: false, error: "Cannot delete a super admin user" };
    }

    await db.$transaction([
      db.remark.deleteMany({ where: { userId: id } }),
      db.statusHistory.deleteMany({ where: { userId: id } }),
      db.communication.updateMany({ where: { userId: id }, data: { userId: null } }),
      db.candidate.updateMany({ where: { assignedHRId: id }, data: { assignedHRId: null } }),
      db.user.delete({ where: { id } }),
    ]);

    return { success: true, data: { id: user.id, name: user.name } };
  } catch (error) {
    console.error("Error deleting user:", error);
    return { success: false, error: "Failed to delete user" };
  }
}

export async function resetPassword(id: string, newPassword: string, tenantId?: string | null) {
  try {
    const user = await db.user.update({
      where: { id, ...tenantFilter(tenantId) },
      data: { password: newPassword },
      select: { id: true, name: true },
    });
    return { success: true, data: user };
  } catch (error) {
    console.error("Error resetting password:", error);
    return { success: false, error: "Failed to reset password" };
  }
}
