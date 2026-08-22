import { db } from "@/lib/db";

/**
 * Normalizes a phone number for WhatsApp dispatch (removes non-digits, prepends '91' for 10-digit Indian numbers)
 */
export function normalizePhone(phoneStr?: string | null): string | null {
  if (!phoneStr) return null;
  let cleaned = String(phoneStr).replace(/[+\s-]/g, "").trim();
  if (cleaned.length === 10) {
    cleaned = "91" + cleaned;
  }
  return cleaned.length >= 10 ? cleaned : null;
}

interface WhatsAppSendOptions {
  to: string;
  message: string;
  templateName?: string;
  params?: string[];
  candidateId?: string;
  recipientRole?: "candidate" | "admin" | "hr";
}

/**
 * Core function to send WhatsApp messages using the Appstrice / Meta WABA Gateway
 */
export async function sendWhatsAppNotification(options: WhatsAppSendOptions) {
  const cleanedPhone = normalizePhone(options.to);
  if (!cleanedPhone) {
    console.warn(`[WhatsApp] Invalid phone number "${options.to}". Dispatch skipped.`);
    return { success: false, error: "Invalid phone number" };
  }

  const baseUrl = (process.env.WHATSAPP_API_BASE_URL || "https://bapi.appstrice.com").replace(/\/+$/, "");
  const apiKey = process.env.WHATSAPP_API_KEY || "b093adce8a6262144b7e3c7ea8cdfdea5e59566c301cf0c4c54576bd5ec13c4e";
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID || "6a30ece2edc77e440499b257";

  const templateComponents = (options.params || []).map((val) => ({
    type: "text",
    text: String(val || "N/A").trim() || "N/A",
  }));

  const payload = {
    contact_no: cleanedPhone,
    whatsapp_phone_number_id: phoneId,
    messageType: options.templateName ? "template" : "text",
    templateName: options.templateName || undefined,
    languageCode: "en",
    templateComponents: templateComponents.length > 0 ? [{ type: "body", parameters: templateComponents }] : [],
    message: options.message,
  };

  try {
    console.log(`[WhatsApp] Dispatching message to ${cleanedPhone} (${options.recipientRole || "user"})...`);

    const res = await fetch(`${baseUrl}/api/whatsapp/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": apiKey,
      },
      body: JSON.stringify(payload),
    });

    const responseData = await res.json().catch(() => ({}));
    console.log("[WhatsApp] Gateway response:", responseData);

    // If candidateId is provided, log to Communication table in database
    if (options.candidateId) {
      try {
        await db.communication.create({
          data: {
            candidateId: options.candidateId,
            type: "whatsapp",
            direction: "outbound",
            content: options.message,
            status: res.ok ? "sent" : "failed",
          },
        });
      } catch (dbErr) {
        console.warn("[WhatsApp] Failed to log communication history:", dbErr);
      }
    }

    return { success: res.ok, data: responseData };
  } catch (error) {
    console.error(`[WhatsApp] Failed to dispatch message to ${cleanedPhone}:`, error);

    // Fallback: Still log communication attempt to DB if candidateId exists
    if (options.candidateId) {
      try {
        await db.communication.create({
          data: {
            candidateId: options.candidateId,
            type: "whatsapp",
            direction: "outbound",
            content: options.message,
            status: "failed",
          },
        });
      } catch {}
    }

    return { success: false, error: String(error) };
  }
}

/**
 * Condition 1: WhatsApp alert when candidate submits a Job Application
 */
export async function sendCandidateApplicationWhatsApp(data: {
  candidateId: string;
  fullName: string;
  mobile: string;
  whatsapp?: string;
  jobTitle: string;
  applicationNumber: string;
  tenantName?: string;
  tenantId?: string | null;
}) {
  const recipientPhone = data.whatsapp || data.mobile;
  const companyName = data.tenantName || "Lords Jobs";

  // 1. Message to Candidate
  const candidateMsg = `Hello ${data.fullName}, your application for ${data.jobTitle} at ${companyName} has been submitted successfully! Application No: ${data.applicationNumber}. We will update you on the next steps soon.`;

  await sendWhatsAppNotification({
    to: recipientPhone,
    message: candidateMsg,
    templateName: "candidate_application_submitted",
    params: [data.fullName, data.jobTitle, companyName, data.applicationNumber],
    candidateId: data.candidateId,
    recipientRole: "candidate",
  });

  // 2. Message to Admin / HR
  try {
    const adminUser = await db.user.findFirst({
      where: {
        ...(data.tenantId ? { tenantId: data.tenantId } : {}),
        phone: { not: null },
      },
      select: { phone: true, name: true },
    });

    const adminPhone = adminUser?.phone || process.env.WHATSAPP_ADMIN_PHONE || "918145424329";
    if (adminPhone) {
      const adminMsg = `New Candidate Application: ${data.fullName} has applied for ${data.jobTitle} (${companyName}). Application No: ${data.applicationNumber}. Phone: ${data.mobile}.`;
      await sendWhatsAppNotification({
        to: adminPhone,
        message: adminMsg,
        templateName: "admin_new_candidate_applied",
        params: [data.fullName, data.jobTitle, companyName, data.applicationNumber, data.mobile],
        recipientRole: "admin",
      });
    }
  } catch (err) {
    console.warn("[WhatsApp] Failed to dispatch admin application alert:", err);
  }
}

/**
 * Condition 2: WhatsApp alert when Interview is Scheduled / Rescheduled
 */
export async function sendInterviewScheduledWhatsApp(data: {
  interviewId: string;
  candidateId: string;
}) {
  try {
    const interview = await db.interviewRecord.findUnique({
      where: { id: data.interviewId },
      include: {
        candidate: {
          include: { job: true, tenant: true },
        },
      },
    });

    if (!interview || !interview.candidate) return;

    const cand = interview.candidate;
    const recipientPhone = cand.whatsapp || cand.mobile;
    const companyName = cand.tenant?.name || "Lords Jobs";
    const jobTitle = cand.job?.title || "Job Position";

    // 1. Message to Candidate
    const candidateMsg = `Hello ${cand.fullName}, your interview for ${jobTitle} at ${companyName} is scheduled on ${interview.date} at ${interview.time}. Type: ${interview.type.toUpperCase()}.${interview.meetLink ? ` Link: ${interview.meetLink}` : ""}${interview.location ? ` Location: ${interview.location}` : ""}. Good luck!`;

    await sendWhatsAppNotification({
      to: recipientPhone,
      message: candidateMsg,
      templateName: "interview_scheduled_candidate",
      params: [cand.fullName, jobTitle, companyName, interview.date, interview.time, interview.type, interview.meetLink || interview.location || "N/A"],
      candidateId: cand.id,
      recipientRole: "candidate",
    });

    // 2. Message to Admin / HR
    const adminUser = await db.user.findFirst({
      where: {
        ...(cand.tenantId ? { tenantId: cand.tenantId } : {}),
        phone: { not: null },
      },
      select: { phone: true },
    });

    const adminPhone = adminUser?.phone || process.env.WHATSAPP_ADMIN_PHONE || "918145424329";
    if (adminPhone) {
      const adminMsg = `Interview Scheduled: ${cand.fullName} for ${jobTitle} on ${interview.date} at ${interview.time} (${interview.type}). Candidate Mobile: ${cand.mobile}.`;
      await sendWhatsAppNotification({
        to: adminPhone,
        message: adminMsg,
        templateName: "interview_scheduled_admin",
        params: [cand.fullName, jobTitle, interview.date, interview.time, cand.mobile],
        recipientRole: "admin",
      });
    }
  } catch (error) {
    console.error("[WhatsApp] Error sending interview notification:", error);
  }
}

/**
 * Condition 3: WhatsApp alert when Candidate Evaluation Score is updated
 */
export async function sendCandidateScoreWhatsApp(data: {
  candidateId: string;
  score: { overall: number };
}) {
  try {
    const cand = await db.candidate.findUnique({
      where: { id: data.candidateId },
      include: { job: true, tenant: true },
    });

    if (!cand) return;

    const recipientPhone = cand.whatsapp || cand.mobile;
    const companyName = cand.tenant?.name || "Lords Jobs";
    const jobTitle = cand.job?.title || "Job Position";
    const scoreVal = data.score.overall.toFixed(1);

    // 1. Message to Candidate
    const candidateMsg = `Hello ${cand.fullName}, your interview score evaluation for ${jobTitle} at ${companyName} has been recorded. Overall Rating: ${scoreVal}/10. Thank you for interviewing with us!`;

    await sendWhatsAppNotification({
      to: recipientPhone,
      message: candidateMsg,
      templateName: "candidate_score_updated",
      params: [cand.fullName, jobTitle, companyName, `${scoreVal}/10`],
      candidateId: cand.id,
      recipientRole: "candidate",
    });

    // 2. Message to Admin / HR
    const adminUser = await db.user.findFirst({
      where: {
        ...(cand.tenantId ? { tenantId: cand.tenantId } : {}),
        phone: { not: null },
      },
      select: { phone: true },
    });

    const adminPhone = adminUser?.phone || process.env.WHATSAPP_ADMIN_PHONE || "918145424329";
    if (adminPhone) {
      const adminMsg = `Candidate Score Recorded: ${cand.fullName} scored ${scoreVal}/10 for ${jobTitle} (${companyName}).`;
      await sendWhatsAppNotification({
        to: adminPhone,
        message: adminMsg,
        templateName: "admin_candidate_scored",
        params: [cand.fullName, jobTitle, companyName, `${scoreVal}/10`],
        recipientRole: "admin",
      });
    }
  } catch (error) {
    console.error("[WhatsApp] Error sending score notification:", error);
  }
}
