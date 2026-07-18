"use server";

import { db } from "@/lib/db";
import { tenantFilter } from "@/lib/tenant";

type InterviewFilter = {
  status?: string;
  candidateId?: string;
  jobId?: string;
};

export async function getInterviews(filters?: InterviewFilter, tenantId?: string | null) {
  try {
    const where: Record<string, unknown> = { ...tenantFilter(tenantId) };

    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.candidateId) {
      where.candidateId = filters.candidateId;
    }
    if (filters?.jobId) {
      where.jobId = filters.jobId;
    }

    const interviews = await db.interviewRecord.findMany({
      where,
      include: {
        candidate: {
          include: {
            job: true,
          },
        },
      },
      orderBy: { date: "asc" },
    });

    return { success: true, data: interviews };
  } catch (error) {
    console.error("Error fetching interviews:", error);
    return { success: false, error: "Failed to fetch interviews" };
  }
}

export async function getInterviewById(id: string, tenantId?: string | null) {
  try {
    const interview = await db.interviewRecord.findFirst({
      where: { id, ...tenantFilter(tenantId) },
      include: {
        candidate: {
          include: {
            job: {
              include: { department: true, branch: true },
            },
            score: true,
          },
        },
      },
    });

    if (!interview) {
      return { success: false, error: "Interview not found" };
    }

    return { success: true, data: interview };
  } catch (error) {
    console.error("Error fetching interview:", error);
    return { success: false, error: "Failed to fetch interview" };
  }
}

export async function scheduleInterview(data: {
  candidateId: string;
  jobId?: string;
  type?: string;
  date: string;
  time: string;
  location?: string;
  meetLink?: string;
  zoomLink?: string;
  panelMembers?: string[];
  notes?: string;
}, tenantId?: string | null) {
  try {
    const [interview] = await db.$transaction([
      db.interviewRecord.create({
        data: {
          tenantId: tenantId ?? null,
          candidateId: data.candidateId,
          jobId: data.jobId,
          type: data.type ?? "online",
          date: data.date,
          time: data.time,
          location: data.location,
          meetLink: data.meetLink,
          zoomLink: data.zoomLink,
          panelMembers: data.panelMembers ?? [],
          notes: data.notes,
        },
        include: {
          candidate: true,
        },
      }),
      db.candidate.update({
        where: { id: data.candidateId },
        data: { status: "interview_scheduled" },
      }),
    ]);

    return { success: true, data: interview };
  } catch (error) {
    console.error("Error scheduling interview:", error);
    return { success: false, error: "Failed to schedule interview" };
  }
}

export async function updateInterview(
  id: string,
  data: Partial<{
    type: string;
    date: string;
    time: string;
    location: string;
    meetLink: string;
    zoomLink: string;
    panelMembers: string[];
    notes: string;
  }>,
  tenantId?: string | null
) {
  try {
    const interview = await db.interviewRecord.update({
      where: { id },
      data,
      include: {
        candidate: true,
      },
    });

    return { success: true, data: interview };
  } catch (error) {
    console.error("Error updating interview:", error);
    return { success: false, error: "Failed to update interview" };
  }
}

export async function cancelInterview(id: string, tenantId?: string | null) {
  try {
    const interview = await db.interviewRecord.update({
      where: { id, ...tenantFilter(tenantId) },
      data: { status: "cancelled" },
      include: {
        candidate: true,
      },
    });

    return { success: true, data: interview };
  } catch (error) {
    console.error("Error cancelling interview:", error);
    return { success: false, error: "Failed to cancel interview" };
  }
}

export async function completeInterview(
  id: string,
  rating: number,
  feedback: string,
  tenantId?: string | null
) {
  try {
    const interview = await db.interviewRecord.update({
      where: { id, ...tenantFilter(tenantId) },
      data: {
        status: "completed",
        rating,
        feedback,
      },
      include: {
        candidate: true,
      },
    });

    return { success: true, data: interview };
  } catch (error) {
    console.error("Error completing interview:", error);
    return { success: false, error: "Failed to complete interview" };
  }
}
