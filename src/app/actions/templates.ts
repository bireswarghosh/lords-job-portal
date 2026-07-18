"use server";

import { db } from "@/lib/db";
import { tenantFilter } from "@/lib/tenant";

export async function getTemplates(type?: string, tenantId?: string | null) {
  try {
    const where: Record<string, unknown> = { ...tenantFilter(tenantId) };

    if (type) {
      where.type = type;
    }

    const templates = await db.template.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return { success: true, data: templates };
  } catch (error) {
    console.error("Error fetching templates:", error);
    return { success: false, error: "Failed to fetch templates" };
  }
}

export async function createTemplate(data: {
  name: string;
  type: string;
  subject?: string;
  content: string;
  variables?: string[];
}, tenantId?: string | null) {
  try {
    const template = await db.template.create({
      data: {
        name: data.name,
        type: data.type,
        subject: data.subject,
        content: data.content,
        variables: data.variables ?? [],
        tenantId: tenantId ?? null,
      },
    });

    return { success: true, data: template };
  } catch (error) {
    console.error("Error creating template:", error);
    return { success: false, error: "Failed to create template" };
  }
}

export async function updateTemplate(
  id: string,
  data: Partial<{
    name: string;
    type: string;
    subject: string;
    content: string;
    variables: string[];
  }>,
  tenantId?: string | null
) {
  try {
    const template = await db.template.update({
      where: { id, ...tenantFilter(tenantId) },
      data,
    });

    return { success: true, data: template };
  } catch (error) {
    console.error("Error updating template:", error);
    return { success: false, error: "Failed to update template" };
  }
}

export async function deleteTemplate(id: string, tenantId?: string | null) {
  try {
    const tpl = await db.template.findFirst({ where: { id, ...tenantFilter(tenantId) }, select: { id: true } });
    if (!tpl) return { success: false, error: "Template not found" };
    await db.template.delete({ where: { id } });
    return { success: true };
  } catch (error) {
    console.error("Error deleting template:", error);
    return { success: false, error: "Failed to delete template" };
  }
}
