"use server";

import { db } from "@/lib/db";
import { tenantFilter } from "@/lib/tenant";

export async function getNotifications(tenantId?: string | null) {
  try {
    const notifications = await db.notification.findMany({
      where: { ...tenantFilter(tenantId) },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, data: notifications };
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return { success: false, error: "Failed to fetch notifications" };
  }
}

export async function markAsRead(id: string, tenantId?: string | null) {
  try {
    const notification = await db.notification.update({
      where: { id, ...tenantFilter(tenantId) },
      data: { read: true },
    });

    return { success: true, data: notification };
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return { success: false, error: "Failed to mark notification as read" };
  }
}

export async function markAllAsRead(tenantId?: string | null) {
  try {
    await db.notification.updateMany({
      where: { ...tenantFilter(tenantId), read: false },
      data: { read: true },
    });

    return { success: true };
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return { success: false, error: "Failed to mark all notifications as read" };
  }
}

export async function getUnreadCount(tenantId?: string | null) {
  try {
    const count = await db.notification.count({
      where: { ...tenantFilter(tenantId), read: false },
    });

    return { success: true, data: count };
  } catch (error) {
    console.error("Error getting unread count:", error);
    return { success: false, error: "Failed to get unread count" };
  }
}
