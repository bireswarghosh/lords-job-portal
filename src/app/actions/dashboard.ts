"use server";

import { db } from "@/lib/db";
import { tenantFilter } from "@/lib/tenant";

function candidateTenantWhere(tenantId?: string | null): Record<string, unknown> {
  if (!tenantId) return {};
  return {
    OR: [{ tenantId }, { job: { tenantId } }],
  };
}

export async function getDashboardStats(tenantId?: string | null) {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const jobTf = tenantFilter(tenantId);
    const candTf = candidateTenantWhere(tenantId);

    const [
      totalVacancies,
      openPositions,
      applicationsToday,
      applicationsThisMonth,
      pendingReview,
      interviewScheduled,
      selected,
      rejected,
    ] = await Promise.all([
      db.job.aggregate({ where: { ...jobTf }, _sum: { vacancies: true } }),
      db.job.count({ where: { ...jobTf, status: "open" } }),
      db.candidate.count({
        where: { AND: [candTf, { applicationDate: { gte: todayStart } }] },
      }),
      db.candidate.count({
        where: { AND: [candTf, { applicationDate: { gte: monthStart } }] },
      }),
      db.candidate.count({ where: { AND: [candTf, { status: "pending_review" }] } }),
      db.candidate.count({ where: { AND: [candTf, { status: "interview_scheduled" }] } }),
      db.candidate.count({ where: { AND: [candTf, { status: "selected" }] } }),
      db.candidate.count({ where: { AND: [candTf, { status: "rejected" }] } }),
    ]);

    return {
      success: true,
      data: {
        totalVacancies: totalVacancies._sum.vacancies ?? 0,
        openPositions,
        applicationsToday,
        applicationsThisMonth,
        pendingReview,
        interviewScheduled,
        selected,
        rejected,
      },
    };
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return { success: false, error: "Failed to fetch dashboard stats" };
  }
}

export async function getHiringFunnelData(tenantId?: string | null) {
  try {
    const candTf = candidateTenantWhere(tenantId);
    const statusCounts = await db.candidate.groupBy({
      by: ["status"],
      where: candTf,
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
    });

    const data = statusCounts.map((item) => ({
      status: item.status,
      count: item._count.id,
    }));

    return { success: true, data };
  } catch (error) {
    console.error("Error fetching hiring funnel data:", error);
    return { success: false, error: "Failed to fetch hiring funnel data" };
  }
}

export async function getDepartmentChartData(tenantId?: string | null) {
  try {
    const departments = await db.department.findMany({
      where: { isActive: true, ...tenantFilter(tenantId) },
      select: {
        name: true,
        code: true,
        color: true,
        openPositions: true,
        _count: { select: { jobs: true } },
      },
      orderBy: { name: "asc" },
    });

    const data = departments.map(
      (d: {
        name: string;
        code: string;
        color: string;
        openPositions: number;
        _count: { jobs: number };
      }) => ({
        name: d.name,
        code: d.code,
        color: d.color,
        openPositions: d.openPositions,
        totalJobs: d._count.jobs,
      })
    );

    return { success: true, data };
  } catch (error) {
    console.error("Error fetching department chart data:", error);
    return { success: false, error: "Failed to fetch department chart data" };
  }
}

export async function getRecentApplicants(limit: number = 10, tenantId?: string | null) {
  try {
    const candidates = await db.candidate.findMany({
      where: candidateTenantWhere(tenantId),
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        job: {
          select: {
            title: true,
            department: { select: { name: true } },
          },
        },
      },
    });

    return { success: true, data: candidates };
  } catch (error) {
    console.error("Error fetching recent applicants:", error);
    return { success: false, error: "Failed to fetch recent applicants" };
  }
}

export async function getUpcomingInterviews(limit: number = 10, tenantId?: string | null) {
  try {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    const itvWhere: Record<string, unknown> = {
      status: "scheduled",
      OR: [
        { date: { gt: todayStr } },
        { date: todayStr },
      ],
    };
    if (tenantId) {
      itvWhere.OR = [
        { tenantId, status: "scheduled", date: { gte: todayStr } },
        { candidate: { tenantId }, status: "scheduled", date: { gte: todayStr } },
      ];
    }

    const interviews = await db.interviewRecord.findMany({
      where: itvWhere,
      take: limit,
      orderBy: [{ date: "asc" }, { time: "asc" }],
      include: {
        candidate: {
          select: {
            fullName: true,
            email: true,
            mobile: true,
            photo: true,
            applicationNumber: true,
          },
        },
      },
    });

    return { success: true, data: interviews };
  } catch (error) {
    console.error("Error fetching upcoming interviews:", error);
    return { success: false, error: "Failed to fetch upcoming interviews" };
  }
}

export async function getKPIDetail(filter: string, tenantId?: string | null) {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const candTf = candidateTenantWhere(tenantId);
    let filterCondition: Record<string, unknown> = {};

    switch (filter) {
      case "applications_today":
        filterCondition = { applicationDate: { gte: todayStart } };
        break;
      case "applications_month":
        filterCondition = { applicationDate: { gte: monthStart } };
        break;
      case "pending_review":
        filterCondition = { status: "pending_review" };
        break;
      case "interview_scheduled":
        filterCondition = { status: "interview_scheduled" };
        break;
      case "selected":
        filterCondition = { status: "selected" };
        break;
      case "rejected":
        filterCondition = { status: "rejected" };
        break;
      case "open_positions":
        return { success: true, data: [], type: "jobs" };
      case "total_vacancies":
        return { success: true, data: [], type: "jobs" };
      default:
        return { success: true, data: [], type: "unknown" };
    }

    const where = tenantId ? { AND: [candTf, filterCondition] } : filterCondition;

    const candidates = await db.candidate.findMany({
      where,
      include: {
        job: {
          select: { title: true, department: { select: { name: true } } },
        },
        assignedHR: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return { success: true, data: candidates, type: "candidates" };
  } catch (error) {
    console.error("Error fetching KPI detail:", error);
    return { success: false, error: "Failed to fetch detail" };
  }
}
