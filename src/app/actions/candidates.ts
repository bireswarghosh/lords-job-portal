"use server";

import { db } from "@/lib/db";
import { tenantFilter } from "@/lib/tenant";

type CandidateFilter = {
  status?: string;
  departmentId?: string;
  jobId?: string;
  search?: string;
  isFavorite?: boolean;
  isBlacklisted?: boolean;
  assignedHRId?: string;
};

export async function getCandidates(filters?: CandidateFilter, tenantId?: string | null) {
  try {
    const where: Record<string, unknown> = {
      ...tenantFilter(tenantId),
    };

    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.jobId) {
      where.jobId = filters.jobId;
    }
    if (filters?.assignedHRId) {
      where.assignedHRId = filters.assignedHRId;
    }
    if (filters?.isFavorite !== undefined) {
      where.isFavorite = filters.isFavorite;
    }
    if (filters?.isBlacklisted !== undefined) {
      where.isBlacklisted = filters.isBlacklisted;
    }
    if (filters?.departmentId) {
      where.job = { departmentId: filters.departmentId };
    }
    if (filters?.search) {
      where.OR = [
        { fullName: { contains: filters.search, mode: "insensitive" } },
        { email: { contains: filters.search, mode: "insensitive" } },
        { mobile: { contains: filters.search, mode: "insensitive" } },
        { applicationNumber: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    const candidates = await db.candidate.findMany({
      where,
      include: {
        job: {
          include: { department: true, branch: true },
        },
        score: true,
        assignedHR: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, data: candidates };
  } catch (error) {
    console.error("Error fetching candidates:", error);
    return { success: false, error: "Failed to fetch candidates" };
  }
}

export async function getCandidateById(id: string, tenantId?: string | null) {
  try {
    const candidate = await db.candidate.findFirst({
      where: { id, ...tenantFilter(tenantId) },
      include: {
        job: {
          include: { department: true, branch: true },
        },
        score: true,
        remarks: {
          include: { user: true },
          orderBy: { createdAt: "desc" },
        },
        communications: {
          include: { user: true },
          orderBy: { createdAt: "desc" },
        },
        statusHistory: {
          include: { user: true },
          orderBy: { createdAt: "desc" },
        },
        interviews: {
          orderBy: { date: "desc" },
        },
        assignedHR: true,
      },
    });

    if (!candidate) {
      return { success: false, error: "Candidate not found" };
    }

    return { success: true, data: candidate };
  } catch (error) {
    console.error("Error fetching candidate:", error);
    return { success: false, error: "Failed to fetch candidate" };
  }
}

async function generateApplicationNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `APP-${year}-`;

  const lastCandidate = await db.candidate.findFirst({
    where: {
      applicationNumber: { startsWith: prefix },
    },
    orderBy: { applicationNumber: "desc" },
  });

  let seq = 1;
  if (lastCandidate) {
    const lastNum = parseInt(lastCandidate.applicationNumber.split("-")[2] ?? "0", 10);
    seq = lastNum + 1;
  }

  return `${prefix}${String(seq).padStart(3, "0")}`;
}

export async function createCandidate(data: {
  fullName: string;
  gender: string;
  email: string;
  mobile: string;
  whatsapp: string;
  jobId: string;
  dob?: string;
  address?: string;
  city?: string;
  state?: string;
  pin?: string;
  qualification?: string;
  experience?: string;
  currentEmployer?: string;
  currentSalary?: number;
  expectedSalary?: number;
  noticePeriod?: string;
  preferredDepartment?: string;
  preferredLocation?: string;
  languages?: string[];
  skills?: string[];
  linkedIn?: string;
  portfolio?: string;
  coverLetter?: string;
  resumeUrl?: string;
  certificates?: string[];
  photo?: string;
  tags?: string[];
  assignedHRId?: string;
}, tenantId?: string | null) {
  try {
    const applicationNumber = await generateApplicationNumber();

    const candidate = await db.candidate.create({
      data: {
        applicationNumber,
        tenantId: tenantId ?? null,
        fullName: data.fullName,
        gender: data.gender,
        email: data.email,
        mobile: data.mobile,
        whatsapp: data.whatsapp,
        jobId: data.jobId,
        dob: data.dob,
        address: data.address,
        city: data.city,
        state: data.state,
        pin: data.pin,
        qualification: data.qualification,
        experience: data.experience,
        currentEmployer: data.currentEmployer,
        currentSalary: data.currentSalary ?? 0,
        expectedSalary: data.expectedSalary ?? 0,
        noticePeriod: data.noticePeriod,
        preferredDepartment: data.preferredDepartment,
        preferredLocation: data.preferredLocation,
        languages: data.languages ?? [],
        skills: data.skills ?? [],
        linkedIn: data.linkedIn,
        portfolio: data.portfolio,
        coverLetter: data.coverLetter,
        resumeUrl: data.resumeUrl,
        certificates: data.certificates ?? [],
        photo: data.photo,
        tags: data.tags ?? [],
        assignedHRId: data.assignedHRId,
      },
      include: {
        job: true,
      },
    });

    return { success: true, data: candidate };
  } catch (error) {
    console.error("Error creating candidate:", error);
    return { success: false, error: "Failed to create candidate" };
  }
}

export async function updateCandidate(
  id: string,
  data: Partial<{
    fullName: string;
    gender: string;
    email: string;
    mobile: string;
    whatsapp: string;
    jobId: string;
    dob: string;
    address: string;
    city: string;
    state: string;
    pin: string;
    qualification: string;
    experience: string;
    currentEmployer: string;
    currentSalary: number;
    expectedSalary: number;
    noticePeriod: string;
    preferredDepartment: string;
    preferredLocation: string;
    languages: string[];
    skills: string[];
    linkedIn: string;
    portfolio: string;
    coverLetter: string;
    resumeUrl: string;
    certificates: string[];
    photo: string;
    tags: string[];
    assignedHRId: string;
    isFutureCandidate: boolean;
    whatsappVerified: boolean;
    emailVerified: boolean;
  }>,
  tenantId?: string | null
) {
  try {
    const candidate = await db.candidate.update({
      where: { id, ...tenantFilter(tenantId) },
      data,
      include: {
        job: true,
      },
    });

    return { success: true, data: candidate };
  } catch (error) {
    console.error("Error updating candidate:", error);
    return { success: false, error: "Failed to update candidate" };
  }
}

export async function deleteCandidate(id: string, tenantId?: string | null) {
  try {
    const existing = await db.candidate.findFirst({
      where: { id, ...tenantFilter(tenantId) },
      select: { id: true },
    });

    if (!existing) {
      return { success: false, error: "Candidate not found" };
    }

    await db.candidate.delete({ where: { id } });
    return { success: true };
  } catch (error) {
    console.error("Error deleting candidate:", error);
    return { success: false, error: "Failed to delete candidate" };
  }
}

export async function changeCandidateStatus(
  id: string,
  toStatus: string,
  userId: string,
  remarks?: string,
  tenantId?: string | null
) {
  try {
    const existing = await db.candidate.findFirst({
      where: { id, ...tenantFilter(tenantId) },
      select: { status: true },
    });

    if (!existing) {
      return { success: false, error: "Candidate not found" };
    }

    const [candidate] = await db.$transaction([
      db.candidate.update({
        where: { id },
        data: { status: toStatus },
      }),
      db.statusHistory.create({
        data: {
          candidateId: id,
          userId,
          fromStatus: existing.status,
          toStatus,
          remarks,
        },
      }),
    ]);

    return { success: true, data: candidate };
  } catch (error) {
    console.error("Error changing candidate status:", error);
    return { success: false, error: "Failed to change candidate status" };
  }
}

export async function addRemark(
  candidateId: string,
  userId: string,
  type: string,
  content: string,
  isPinned?: boolean,
  tenantId?: string | null
) {
  try {
    const existing = await db.candidate.findFirst({
      where: { id: candidateId, ...tenantFilter(tenantId) },
      select: { id: true },
    });

    if (!existing) {
      return { success: false, error: "Candidate not found" };
    }

    const remark = await db.remark.create({
      data: {
        candidateId,
        userId,
        type,
        content,
        isPinned: isPinned ?? false,
      },
      include: { user: true },
    });

    return { success: true, data: remark };
  } catch (error) {
    console.error("Error adding remark:", error);
    return { success: false, error: "Failed to add remark" };
  }
}

export async function addCommunication(
  candidateId: string,
  type: string,
  direction: string,
  content: string,
  userId?: string,
  tenantId?: string | null
) {
  try {
    const existing = await db.candidate.findFirst({
      where: { id: candidateId, ...tenantFilter(tenantId) },
      select: { id: true },
    });

    if (!existing) {
      return { success: false, error: "Candidate not found" };
    }

    const communication = await db.communication.create({
      data: {
        candidateId,
        type,
        direction,
        content,
        userId,
      },
      include: { user: true },
    });

    return { success: true, data: communication };
  } catch (error) {
    console.error("Error adding communication:", error);
    return { success: false, error: "Failed to add communication" };
  }
}

export async function updateCandidateScore(
  candidateId: string,
  scores: {
    communication?: number;
    technicalSkill?: number;
    experience?: number;
    qualification?: number;
    personality?: number;
    hospitalCultureFit?: number;
    computerKnowledge?: number;
    leadership?: number;
    confidence?: number;
  },
  tenantId?: string | null
) {
  try {
    const existing = await db.candidate.findFirst({
      where: { id: candidateId, ...tenantFilter(tenantId) },
      select: { id: true },
    });

    if (!existing) {
      return { success: false, error: "Candidate not found" };
    }
    const fields = [
      "communication",
      "technicalSkill",
      "experience",
      "qualification",
      "personality",
      "hospitalCultureFit",
      "computerKnowledge",
      "leadership",
      "confidence",
    ] as const;

    const updatedFields: Record<string, number> = {};
    for (const field of fields) {
      if (scores[field] !== undefined) {
        updatedFields[field] = scores[field]!;
      }
    }

    const values = Object.values(updatedFields);
    const overall = values.length > 0
      ? values.reduce((a, b) => a + b, 0) / values.length
      : 0;

    const score = await db.candidateScore.upsert({
      where: { candidateId },
      create: {
        candidateId,
        ...updatedFields,
        overall,
      },
      update: {
        ...updatedFields,
        overall,
      },
    });

    return { success: true, data: score };
  } catch (error) {
    console.error("Error updating candidate score:", error);
    return { success: false, error: "Failed to update candidate score" };
  }
}

export async function toggleFavorite(candidateId: string, tenantId?: string | null) {
  try {
    const candidate = await db.candidate.findFirst({
      where: { id: candidateId, ...tenantFilter(tenantId) },
      select: { isFavorite: true },
    });

    if (!candidate) {
      return { success: false, error: "Candidate not found" };
    }

    const updated = await db.candidate.update({
      where: { id: candidateId },
      data: { isFavorite: !candidate.isFavorite },
    });

    return { success: true, data: updated };
  } catch (error) {
    console.error("Error toggling favorite:", error);
    return { success: false, error: "Failed to toggle favorite" };
  }
}

export async function toggleBlacklist(candidateId: string, tenantId?: string | null) {
  try {
    const candidate = await db.candidate.findFirst({
      where: { id: candidateId, ...tenantFilter(tenantId) },
      select: { isBlacklisted: true },
    });

    if (!candidate) {
      return { success: false, error: "Candidate not found" };
    }

    const updated = await db.candidate.update({
      where: { id: candidateId },
      data: { isBlacklisted: !candidate.isBlacklisted },
    });

    return { success: true, data: updated };
  } catch (error) {
    console.error("Error toggling blacklist:", error);
    return { success: false, error: "Failed to toggle blacklist" };
  }
}

export async function assignHR(candidateId: string, userId: string, tenantId?: string | null) {
  try {
    const candidate = await db.candidate.update({
      where: { id: candidateId, ...tenantFilter(tenantId) },
      data: { assignedHRId: userId },
      include: { assignedHR: true },
    });

    return { success: true, data: candidate };
  } catch (error) {
    console.error("Error assigning HR:", error);
    return { success: false, error: "Failed to assign HR" };
  }
}

export async function bulkUpdateStatus(
  candidateIds: string[],
  status: string,
  userId: string,
  remarks?: string,
  tenantId?: string | null
) {
  try {
    const candidates = await db.candidate.findMany({
      where: { id: { in: candidateIds }, ...tenantFilter(tenantId) },
      select: { id: true, status: true },
    });

    await db.$transaction([
      db.candidate.updateMany({
        where: { id: { in: candidateIds } },
        data: { status },
      }),
      ...candidates.map((c: { id: string; status: string }) =>
        db.statusHistory.create({
          data: {
            candidateId: c.id,
            userId,
            fromStatus: c.status,
            toStatus: status,
            remarks,
          },
        })
      ),
    ]);

    return { success: true, data: { updated: candidates.length } };
  } catch (error) {
    console.error("Error bulk updating status:", error);
    return { success: false, error: "Failed to bulk update status" };
  }
}
