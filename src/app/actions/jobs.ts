"use server";

import { db } from "@/lib/db";
import { tenantFilter } from "@/lib/tenant";

type JobFilter = {
  status?: string;
  departmentId?: string;
  employmentType?: string;
  search?: string;
};

export async function getJobs(filters?: JobFilter, tenantId?: string | null) {
  try {
    const where: Record<string, unknown> = { ...tenantFilter(tenantId) };

    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.departmentId) {
      where.departmentId = filters.departmentId;
    }
    if (filters?.employmentType) {
      where.employmentType = filters.employmentType;
    }
    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search, mode: "insensitive" } },
        { location: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    const jobs = await db.job.findMany({
      where,
      include: {
        department: true,
        branch: true,
        _count: { select: { candidates: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, data: jobs };
  } catch (error) {
    console.error("Error fetching jobs:", error);
    return { success: false, error: "Failed to fetch jobs" };
  }
}

export async function getJobById(id: string, tenantId?: string | null) {
  try {
    const job = await db.job.findFirst({
      where: { id, ...tenantFilter(tenantId) },
      include: {
        department: true,
        branch: true,
        _count: { select: { candidates: true } },
      },
    });

    if (!job) {
      return { success: false, error: "Job not found" };
    }

    return { success: true, data: job };
  } catch (error) {
    console.error("Error fetching job:", error);
    return { success: false, error: "Failed to fetch job" };
  }
}

export async function createJob(data: {
  title: string;
  departmentId: string;
  branchId: string;
  location: string;
  employmentType?: string;
  experienceRequired: string;
  salaryMin: number;
  salaryMax: number;
  qualification: string;
  skills?: string[];
  vacancies?: number;
  description: string;
  responsibilities?: string[];
  benefits?: string[];
  expiryDate?: string;
  hiringManager: string;
  status?: string;
  applyLink?: string;
  isUrgent?: boolean;
}, tenantId?: string | null) {
  try {
    const job = await db.job.create({
      data: {
        tenantId: tenantId ?? null,
        title: data.title,
        departmentId: data.departmentId,
        branchId: data.branchId,
        location: data.location,
        employmentType: data.employmentType ?? "full_time",
        experienceRequired: data.experienceRequired,
        salaryMin: data.salaryMin,
        salaryMax: data.salaryMax,
        qualification: data.qualification,
        skills: data.skills ?? [],
        vacancies: data.vacancies ?? 1,
        description: data.description,
        responsibilities: data.responsibilities ?? [],
        benefits: data.benefits ?? [],
        expiryDate: data.expiryDate,
        hiringManager: data.hiringManager,
        status: data.status ?? "open",
        applyLink: data.applyLink,
        isUrgent: data.isUrgent ?? false,
      },
      include: {
        department: true,
        branch: true,
      },
    });

    return { success: true, data: job };
  } catch (error) {
    console.error("Error creating job:", error);
    return { success: false, error: "Failed to create job" };
  }
}

export async function updateJob(
  id: string,
  data: Partial<{
    title: string;
    departmentId: string;
    branchId: string;
    location: string;
    employmentType: string;
    experienceRequired: string;
    salaryMin: number;
    salaryMax: number;
    qualification: string;
    skills: string[];
    vacancies: number;
    description: string;
    responsibilities: string[];
    benefits: string[];
    expiryDate: string;
    hiringManager: string;
    status: string;
    applyLink: string;
    isUrgent: boolean;
  }>,
  tenantId?: string | null
) {
  try {
    const job = await db.job.update({
      where: { id },
      data,
      include: {
        department: true,
        branch: true,
      },
    });

    return { success: true, data: job };
  } catch (error) {
    console.error("Error updating job:", error);
    return { success: false, error: "Failed to update job" };
  }
}

export async function deleteJob(id: string, tenantId?: string | null) {
  try {
    const job = await db.job.findFirst({ where: { id, ...tenantFilter(tenantId) }, select: { id: true } });
    if (!job) return { success: false, error: "Job not found" };
    await db.job.delete({ where: { id } });
    return { success: true };
  } catch (error) {
    console.error("Error deleting job:", error);
    return { success: false, error: "Failed to delete job" };
  }
}

export async function getPublicJobsByTenant(tenantId: string, filters?: { search?: string; departmentId?: string; location?: string; employmentType?: string }) {
  try {
    const where: Record<string, unknown> = { status: { in: ["open", "urgent"] }, tenantId };

    if (filters?.departmentId) {
      where.departmentId = filters.departmentId;
    }
    if (filters?.employmentType) {
      where.employmentType = filters.employmentType;
    }
    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search, mode: "insensitive" } },
        { description: { contains: filters.search, mode: "insensitive" } },
      ];
    }
    if (filters?.location) {
      where.branch = { city: { contains: filters.location, mode: "insensitive" } };
    }

    const jobs = await db.job.findMany({
      where,
      include: {
        department: true,
        branch: true,
        _count: { select: { candidates: true } },
      },
      orderBy: { isUrgent: "desc" },
    });

    return { success: true, data: jobs };
  } catch (error) {
    console.error("Error fetching tenant jobs:", error);
    return { success: false, error: "Failed to fetch jobs" };
  }
}

export async function getPublicJobs(filters?: { search?: string; departmentId?: string; location?: string; employmentType?: string }) {
  try {
    const where: Record<string, unknown> = { status: { in: ["open", "urgent"] } };

    if (filters?.departmentId) {
      where.departmentId = filters.departmentId;
    }
    if (filters?.employmentType) {
      where.employmentType = filters.employmentType;
    }
    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search, mode: "insensitive" } },
        { description: { contains: filters.search, mode: "insensitive" } },
      ];
    }
    if (filters?.location) {
      where.branch = { city: { contains: filters.location, mode: "insensitive" } };
    }

    const jobs = await db.job.findMany({
      where,
      include: {
        department: true,
        branch: true,
        _count: { select: { candidates: true } },
      },
      orderBy: { isUrgent: "desc" },
    });

    return { success: true, data: jobs };
  } catch (error) {
    console.error("Error fetching public jobs:", error);
    return { success: false, error: "Failed to fetch jobs" };
  }
}

export async function changeJobStatus(id: string, status: string, tenantId?: string | null) {
  try {
    const job = await db.job.update({
      where: { id, ...tenantFilter(tenantId) },
      data: { status },
      include: {
        department: true,
        branch: true,
      },
    });

    return { success: true, data: job };
  } catch (error) {
    console.error("Error changing job status:", error);
    return { success: false, error: "Failed to change job status" };
  }
}
