import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // Clean existing data
  await prisma.communication.deleteMany();
  await prisma.remark.deleteMany();
  await prisma.statusHistory.deleteMany();
  await prisma.interviewRecord.deleteMany();
  await prisma.candidateScore.deleteMany();
  await prisma.candidate.deleteMany();
  await prisma.job.deleteMany();
  await prisma.department.deleteMany();
  await prisma.hospitalBranch.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.template.deleteMany();
  await prisma.user.deleteMany();

  // Create users
  const superAdmin = await prisma.user.create({
    data: { id: "u0", name: "Super Admin", email: "appstrice@gmail.com", password: "123456", role: "super_admin", department: "Administration" },
  });
  const user1 = await prisma.user.create({
    data: { id: "u1", name: "Dr. Priya Sharma", email: "priya.sharma@hospital.com", password: "hashed_password", role: "hr_manager", department: "HR", phone: "+91 98765 43210" },
  });
  const user2 = await prisma.user.create({
    data: { id: "u2", name: "Dr. Rajesh Kumar", email: "rajesh.kumar@hospital.com", password: "hashed_password", role: "hr_executive", department: "Emergency Medicine", phone: "+91 98765 43211" },
  });
  const user3 = await prisma.user.create({
    data: { id: "u3", name: "Mr. Ravi Kumar", email: "ravi.kumar@hospital.com", password: "hashed_password", role: "super_admin", department: "Administration", phone: "+91 98765 43212" },
  });
  const user4 = await prisma.user.create({
    data: { id: "u4", name: "Sr. Mary Thomas", email: "mary.thomas@hospital.com", password: "hashed_password", role: "hr_manager", department: "Nursing", phone: "+91 98765 43213" },
  });
  const user5 = await prisma.user.create({
    data: { id: "u5", name: "Dr. Vikram Singh", email: "vikram.singh@hospital.com", password: "hashed_password", role: "recruitment_manager", department: "Radiology", phone: "+91 98765 43214" },
  });

  console.log("Users created.");

  // Create departments
  const depts = await Promise.all([
    prisma.department.create({ data: { id: "d1", name: "Emergency Medicine", code: "EM", head: "Dr. Rajesh Kumar", totalPositions: 15, openPositions: 4, color: "#EF4444" } }),
    prisma.department.create({ data: { id: "d2", name: "Cardiology", code: "CD", head: "Dr. Ananya Patel", totalPositions: 12, openPositions: 3, color: "#3B82F6" } }),
    prisma.department.create({ data: { id: "d3", name: "Orthopedics", code: "OR", head: "Dr. Suresh Menon", totalPositions: 8, openPositions: 2, color: "#10B981" } }),
    prisma.department.create({ data: { id: "d4", name: "Nursing", code: "NU", head: "Sr. Mary Thomas", totalPositions: 40, openPositions: 12, color: "#F59E0B" } }),
    prisma.department.create({ data: { id: "d5", name: "Radiology", code: "RD", head: "Dr. Vikram Singh", totalPositions: 6, openPositions: 1, color: "#8B5CF6" } }),
    prisma.department.create({ data: { id: "d6", name: "Pharmacy", code: "PH", head: "Dr. Meera Joshi", totalPositions: 8, openPositions: 3, color: "#EC4899" } }),
    prisma.department.create({ data: { id: "d7", name: "Laboratory", code: "LB", head: "Dr. Arun Nair", totalPositions: 10, openPositions: 2, color: "#06B6D4" } }),
    prisma.department.create({ data: { id: "d8", name: "Administration", code: "AD", head: "Mr. Ravi Kumar", totalPositions: 10, openPositions: 2, color: "#6366F1" } }),
    prisma.department.create({ data: { id: "d9", name: "ICU", code: "IC", head: "Dr. Deepa Gupta", totalPositions: 20, openPositions: 5, color: "#EF4444" } }),
    prisma.department.create({ data: { id: "d10", name: "Surgery", code: "SR", head: "Dr. Mohan Das", totalPositions: 10, openPositions: 2, color: "#14B8A6" } }),
  ]);
  console.log("Departments created.");

  // Create branches
  const branches = await Promise.all([
    prisma.hospitalBranch.create({ data: { id: "b1", name: "City Central Hospital", code: "CCH", address: "123 Medical Center Road", city: "Mumbai", state: "Maharashtra", phone: "+91 22 2345 6789", email: "info@citycentral.com" } }),
    prisma.hospitalBranch.create({ data: { id: "b2", name: "Lakeside Medical Center", code: "LMC", address: "45 Lake View Avenue", city: "Bangalore", state: "Karnataka", phone: "+91 80 2345 6789", email: "info@lakeside.com" } }),
    prisma.hospitalBranch.create({ data: { id: "b3", name: "Green Valley Hospital", code: "GVH", address: "78 Hill Station Road", city: "Chennai", state: "Tamil Nadu", phone: "+91 44 2345 6789", email: "info@greenvalley.com" } }),
    prisma.hospitalBranch.create({ data: { id: "b4", name: "Metro Health Institute", code: "MHI", address: "90 Metro Boulevard", city: "Delhi", state: "Delhi", phone: "+91 11 2345 6789", email: "info@metrohealth.com" } }),
  ]);
  console.log("Branches created.");

  // Create jobs
  const jobs = await Promise.all([
    prisma.job.create({ data: { id: "j1", title: "Senior Cardiologist", departmentId: "d2", branchId: "b1", location: "Mumbai", employmentType: "full_time", experienceRequired: "8-12 years", salaryMin: 250000, salaryMax: 450000, qualification: "MD, DM Cardiology", skills: ["Interventional Cardiology", "Echocardiography", "Cardiac CT"], vacancies: 2, description: "We are looking for an experienced Cardiologist to join our team.", responsibilities: ["Lead cardiac procedures", "Mentor junior doctors", "Conduct research"], benefits: ["Health Insurance", "Continuing Education", "Research Opportunities"], expiryDate: "2026-09-30", hiringManager: "Dr. Ananya Patel", status: "open", isUrgent: true, applyLink: "/careers/senior-cardiologist" } }),
    prisma.job.create({ data: { id: "j2", title: "ICU Nurse", departmentId: "d4", branchId: "b2", location: "Bangalore", employmentType: "full_time", experienceRequired: "3-5 years", salaryMin: 45000, salaryMax: 75000, qualification: "B.Sc Nursing, Critical Care Certificate", skills: ["Critical Care", "Ventilator Management", "Patient Monitoring"], vacancies: 8, description: "Join our ICU team providing critical care nursing.", responsibilities: ["Monitor critical patients", "Administer medications", "Coordinate with doctors"], benefits: ["Health Insurance", "Night Shift Allowance", "Meals"], expiryDate: "2026-08-15", hiringManager: "Sr. Mary Thomas", status: "urgent", isUrgent: true, applyLink: "/careers/icu-nurse" } }),
    prisma.job.create({ data: { id: "j3", title: "Radiologist", departmentId: "d5", branchId: "b1", location: "Mumbai", employmentType: "full_time", experienceRequired: "5-8 years", salaryMin: 180000, salaryMax: 300000, qualification: "MD Radiology", skills: ["MRI", "CT Scan", "X-Ray", "Ultrasound"], vacancies: 1, description: "Expert radiologist for our diagnostic imaging center.", responsibilities: ["Interpret imaging studies", "Report findings", "Guide procedures"], benefits: ["Health Insurance", "Research Opportunities"], expiryDate: "2026-10-30", hiringManager: "Dr. Vikram Singh", status: "open", isUrgent: false, applyLink: "/careers/radiologist" } }),
    prisma.job.create({ data: { id: "j4", title: "Pharmacist", departmentId: "d6", branchId: "b3", location: "Chennai", employmentType: "full_time", experienceRequired: "2-4 years", salaryMin: 35000, salaryMax: 55000, qualification: "B.Pharm / M.Pharm", skills: ["Drug Dispensing", "Inventory Management", "Patient Counseling"], vacancies: 3, description: "Hospital pharmacist for our pharmacy department.", responsibilities: ["Dispense medications", "Manage inventory", "Counsel patients"], benefits: ["Health Insurance", "Meals"], expiryDate: "2026-08-30", hiringManager: "Dr. Meera Joshi", status: "open", isUrgent: false, applyLink: "/careers/pharmacist" } }),
    prisma.job.create({ data: { id: "j5", title: "Lab Technician", departmentId: "d7", branchId: "b4", location: "Delhi", employmentType: "full_time", experienceRequired: "1-3 years", salaryMin: 28000, salaryMax: 45000, qualification: "B.Sc Medical Lab Technology", skills: ["Hematology", "Biochemistry", "Microbiology"], vacancies: 4, description: "Medical laboratory technician for our diagnostic lab.", responsibilities: ["Perform lab tests", "Maintain equipment", "Report results"], benefits: ["Health Insurance", "Transport Allowance"], expiryDate: "2026-09-15", hiringManager: "Dr. Arun Nair", status: "paused", isUrgent: false, applyLink: "/careers/lab-technician" } }),
    prisma.job.create({ data: { id: "j6", title: "Emergency Physician", departmentId: "d1", branchId: "b1", location: "Mumbai", employmentType: "full_time", experienceRequired: "5-10 years", salaryMin: 200000, salaryMax: 350000, qualification: "MD Emergency Medicine", skills: ["Trauma Care", "ACLS", "ATLS", "Emergency Procedures"], vacancies: 3, description: "Emergency physician for our Level 1 trauma center.", responsibilities: ["Treat emergency patients", "Lead trauma team", "Triage patients"], benefits: ["Health Insurance", "Night Shift Allowance", "Continuing Education"], expiryDate: "2026-12-31", hiringManager: "Dr. Rajesh Kumar", status: "urgent", isUrgent: true, applyLink: "/careers/emergency-physician" } }),
    prisma.job.create({ data: { id: "j7", title: "Hospital Administrator", departmentId: "d8", branchId: "b2", location: "Bangalore", employmentType: "full_time", experienceRequired: "10-15 years", salaryMin: 150000, salaryMax: 280000, qualification: "MHA / MBA Healthcare", skills: ["Hospital Operations", "Budget Management", "Compliance", "Team Leadership"], vacancies: 1, description: "Senior hospital administrator to oversee operations.", responsibilities: ["Manage hospital operations", "Ensure compliance", "Lead admin team"], benefits: ["Health Insurance", "Performance Bonus", "Company Car"], expiryDate: "2026-11-30", hiringManager: "Mr. Ravi Kumar", status: "open", isUrgent: false, applyLink: "/careers/hospital-administrator" } }),
    prisma.job.create({ data: { id: "j8", title: "Pediatric Nurse", departmentId: "d4", branchId: "b3", location: "Chennai", employmentType: "full_time", experienceRequired: "2-5 years", salaryMin: 40000, salaryMax: 65000, qualification: "B.Sc Nursing, Pediatric Nursing Certificate", skills: ["Pediatric Care", "Child Psychology", "Vaccination"], vacancies: 5, description: "Nursing staff for our pediatric ward.", responsibilities: ["Care for pediatric patients", "Educate parents", "Maintain records"], benefits: ["Health Insurance", "Meals", "Night Shift Allowance"], expiryDate: "2026-09-30", hiringManager: "Sr. Mary Thomas", status: "open", isUrgent: false, applyLink: "/careers/pediatric-nurse" } }),
  ]);
  console.log("Jobs created.");

  // Create candidates with scores, remarks, communications, status history
  const c1 = await prisma.candidate.create({
    data: {
      id: "c1", applicationNumber: "APP-2026-001", fullName: "Rahul Verma", gender: "male", dob: "1988-05-15",
      email: "rahul.verma@email.com", mobile: "+91 98765 10001", whatsapp: "+91 98765 10001", whatsappVerified: true, emailVerified: true,
      address: "45 MG Road", city: "Mumbai", state: "Maharashtra", pin: "400001",
      qualification: "MD Cardiology", experience: "10 years", currentEmployer: "Apollo Hospital", currentSalary: 220000, expectedSalary: 350000,
      noticePeriod: "30 days", preferredDepartment: "Cardiology", preferredLocation: "Mumbai",
      languages: ["English", "Hindi", "Marathi"], skills: ["Interventional Cardiology", "Echocardiography", "Cardiac CT"],
      linkedIn: "linkedin.com/in/rahulverma",
      jobId: "j1", applicationDate: new Date("2026-07-10"), status: "shortlisted", assignedHRId: "u1", tags: ["top_candidate", "senior"],
      score: { create: { communication: 8, technicalSkill: 9, experience: 9, qualification: 9, personality: 8, hospitalCultureFit: 7, computerKnowledge: 6, leadership: 8, confidence: 8, overall: 8.1 } },
      remarks: { createMany: { data: [
        { id: "r1", userId: "u1", type: "overall", content: "Excellent candidate with strong interventional cardiology background.", isPinned: true, colorLabel: "green" },
        { id: "r2", userId: "u2", type: "technical", content: "Strong technical skills. 15 papers in peer-reviewed journals.", isPinned: false },
      ]}},
      communications: { createMany: { data: [
        { id: "cm1", type: "whatsapp", direction: "outbound", content: "Hello Rahul, we received your application for Senior Cardiologist.", status: "delivered", createdAt: new Date("2026-07-10T09:00:00Z") },
        { id: "cm2", type: "whatsapp", direction: "inbound", content: "Thank you for the update.", createdAt: new Date("2026-07-10T09:15:00Z") },
      ]}},
      statusHistory: { createMany: { data: [
        { id: "sh1", userId: "u1", fromStatus: null, toStatus: "new", remarks: "Application submitted", createdAt: new Date("2026-07-10T08:00:00Z") },
        { id: "sh2", userId: "u1", fromStatus: "new", toStatus: "under_review", remarks: "Reviewing application", createdAt: new Date("2026-07-11T10:00:00Z") },
        { id: "sh3", userId: "u1", fromStatus: "under_review", toStatus: "shortlisted", remarks: "Strong profile", createdAt: new Date("2026-07-12T14:00:00Z") },
      ]}},
      interviews: { create: { id: "iv1", type: "video", date: "2026-07-20", time: "10:00", meetLink: "https://meet.google.com/abc-defg-hij", panelMembers: ["Dr. Ananya Patel", "Dr. Rajesh Kumar"], notes: "Initial screening", status: "scheduled", reminderSent: true } },
    },
  });

  const c2 = await prisma.candidate.create({
    data: {
      id: "c2", applicationNumber: "APP-2026-002", fullName: "Sneha Reddy", gender: "female", dob: "1992-08-20",
      email: "sneha.reddy@email.com", mobile: "+91 98765 10002", whatsapp: "+91 98765 10002", whatsappVerified: true, emailVerified: false,
      address: "12 Koramangala", city: "Bangalore", state: "Karnataka", pin: "560034",
      qualification: "B.Sc Nursing", experience: "4 years", currentEmployer: "Manipal Hospital", currentSalary: 50000, expectedSalary: 70000,
      noticePeriod: "15 days", languages: ["English", "Hindi", "Kannada"], skills: ["Critical Care", "Ventilator Management"],
      jobId: "j2", applicationDate: new Date("2026-07-08"), status: "interview_scheduled", assignedHRId: "u1", tags: ["icu_specialist"],
      score: { create: { communication: 7, technicalSkill: 8, experience: 7, qualification: 7, personality: 8, hospitalCultureFit: 8, computerKnowledge: 5, leadership: 6, confidence: 7, overall: 7.1 } },
      remarks: { create: { id: "r3", userId: "u1", type: "overall", content: "Good ICU nursing experience.", isPinned: true } },
      communications: { create: { id: "cm4", type: "whatsapp", direction: "outbound", content: "Hi Sneha, your application has been received.", status: "delivered", createdAt: new Date("2026-07-08T10:00:00Z") } },
      statusHistory: { createMany: { data: [
        { id: "sh4", userId: "u1", fromStatus: null, toStatus: "new", remarks: "Application submitted", createdAt: new Date("2026-07-08T09:00:00Z") },
        { id: "sh5", userId: "u1", fromStatus: "new", toStatus: "shortlisted", remarks: "Good experience", createdAt: new Date("2026-07-09T11:00:00Z") },
        { id: "sh6", userId: "u1", fromStatus: "shortlisted", toStatus: "interview_scheduled", remarks: "Interview scheduled", createdAt: new Date("2026-07-10T09:00:00Z") },
      ]}},
      interviews: { create: { id: "iv2", type: "online", date: "2026-07-18", time: "14:00", zoomLink: "https://zoom.us/j/123456789", panelMembers: ["Sr. Mary Thomas"], notes: "Practical assessment", status: "scheduled", reminderSent: false } },
    },
  });

  await prisma.candidate.create({
    data: {
      id: "c3", applicationNumber: "APP-2026-003", fullName: "Amit Patel", gender: "male", dob: "1985-03-10",
      email: "amit.patel@email.com", mobile: "+91 98765 10003", whatsapp: "+91 98765 10003", whatsappVerified: true, emailVerified: true,
      qualification: "MD Radiology", experience: "7 years", currentEmployer: "Fortis Hospital", currentSalary: 180000, expectedSalary: 280000,
      noticePeriod: "30 days", languages: ["English", "Hindi", "Gujarati"], skills: ["MRI", "CT Scan", "Ultrasound"],
      jobId: "j3", applicationDate: new Date("2026-07-05"), status: "interview_completed", assignedHRId: "u5", tags: ["experienced"],
      score: { create: { communication: 7, technicalSkill: 8, experience: 8, qualification: 8, personality: 7, hospitalCultureFit: 7, computerKnowledge: 7, leadership: 6, confidence: 7, overall: 7.3 } },
      interviews: { create: { id: "iv3", type: "video", date: "2026-07-12", time: "14:00", panelMembers: ["Dr. Vikram Singh"], notes: "Technical interview", status: "completed", rating: 7, feedback: "Good knowledge" } },
      statusHistory: { createMany: { data: [
        { id: "sh7", userId: "u1", fromStatus: null, toStatus: "new", remarks: "Application submitted", createdAt: new Date("2026-07-05T08:00:00Z") },
        { id: "sh8", userId: "u1", fromStatus: "new", toStatus: "shortlisted", remarks: "Good experience", createdAt: new Date("2026-07-06T10:00:00Z") },
        { id: "sh9", userId: "u1", fromStatus: "shortlisted", toStatus: "interview_scheduled", createdAt: new Date("2026-07-08T09:00:00Z") },
        { id: "sh10", userId: "u1", fromStatus: "interview_scheduled", toStatus: "interview_completed", remarks: "Interview completed", createdAt: new Date("2026-07-12T15:00:00Z") },
      ]}},
    },
  });

  await prisma.candidate.create({
    data: {
      id: "c4", applicationNumber: "APP-2026-004", fullName: "Kavitha Krishnan", gender: "female", dob: "1990-11-25",
      email: "kavitha.k@email.com", mobile: "+91 98765 10004", whatsapp: "+91 98765 10004", whatsappVerified: false, emailVerified: true,
      qualification: "B.Pharm", experience: "3 years", currentEmployer: "Apollo Pharmacy", currentSalary: 35000, expectedSalary: 50000,
      noticePeriod: "Immediate", languages: ["English", "Tamil", "Hindi"], skills: ["Drug Dispensing", "Inventory Management"],
      jobId: "j4", applicationDate: new Date("2026-07-12"), status: "new",
      score: { create: { communication: 6, technicalSkill: 6, experience: 5, qualification: 6, personality: 7, hospitalCultureFit: 6, computerKnowledge: 5, leadership: 4, confidence: 5, overall: 5.6 } },
      statusHistory: { create: { id: "sh11", userId: "u1", fromStatus: null, toStatus: "new", remarks: "Application submitted", createdAt: new Date("2026-07-12T08:00:00Z") } },
    },
  });

  await prisma.candidate.create({
    data: {
      id: "c5", applicationNumber: "APP-2026-005", fullName: "Deepak Singh", gender: "male", dob: "1995-01-30",
      email: "deepak.singh@email.com", mobile: "+91 98765 10005", whatsapp: "+91 98765 10005", whatsappVerified: true, emailVerified: true,
      qualification: "B.Sc Medical Lab Technology", experience: "2 years", currentEmployer: "Lal PathLabs", currentSalary: 28000, expectedSalary: 42000,
      noticePeriod: "15 days", languages: ["English", "Hindi", "Punjabi"], skills: ["Hematology", "Biochemistry"],
      jobId: "j5", applicationDate: new Date("2026-07-14"), status: "under_review", assignedHRId: "u1", tags: ["entry_level"],
      score: { create: { communication: 6, technicalSkill: 7, experience: 5, qualification: 6, personality: 7, hospitalCultureFit: 7, computerKnowledge: 6, leadership: 4, confidence: 6, overall: 6.0 } },
      statusHistory: { createMany: { data: [
        { id: "sh12", userId: "u1", fromStatus: null, toStatus: "new", remarks: "Application submitted", createdAt: new Date("2026-07-14T08:00:00Z") },
        { id: "sh13", userId: "u1", fromStatus: "new", toStatus: "under_review", remarks: "Reviewing resume", createdAt: new Date("2026-07-15T10:00:00Z") },
      ]}},
    },
  });

  await prisma.candidate.create({
    data: {
      id: "c6", applicationNumber: "APP-2026-006", fullName: "Fatima Khan", gender: "female", dob: "1987-07-12",
      email: "fatima.khan@email.com", mobile: "+91 98765 10006", whatsapp: "+91 98765 10006", whatsappVerified: true, emailVerified: true,
      qualification: "MD Emergency Medicine", experience: "8 years", currentEmployer: "Bombay Hospital", currentSalary: 200000, expectedSalary: 320000,
      noticePeriod: "60 days", languages: ["English", "Hindi", "Urdu"], skills: ["Trauma Care", "ACLS", "ATLS", "Leadership"],
      jobId: "j6", applicationDate: new Date("2026-07-02"), status: "offer_sent", assignedHRId: "u2", tags: ["top_candidate", "leadership"],
      score: { create: { communication: 9, technicalSkill: 9, experience: 9, qualification: 9, personality: 8, hospitalCultureFit: 8, computerKnowledge: 7, leadership: 9, confidence: 9, overall: 8.6 } },
      remarks: { create: { id: "r4", userId: "u2", type: "overall", content: "Outstanding candidate. 8 years ER experience.", isPinned: true, colorLabel: "green" } },
      interviews: { create: { id: "iv4", type: "offline", date: "2026-07-08", time: "11:00", location: "City Central Hospital, Mumbai", panelMembers: ["Dr. Rajesh Kumar", "Dr. Priya Sharma", "Mr. Ravi Kumar"], notes: "Panel interview", status: "completed", rating: 9, feedback: "Exceptional" } },
      statusHistory: { createMany: { data: [
        { id: "sh14", userId: "u1", fromStatus: null, toStatus: "new", remarks: "Application submitted", createdAt: new Date("2026-07-02T08:00:00Z") },
        { id: "sh15", userId: "u1", fromStatus: "new", toStatus: "shortlisted", remarks: "Impressive profile", createdAt: new Date("2026-07-03T10:00:00Z") },
        { id: "sh16", userId: "u1", fromStatus: "shortlisted", toStatus: "interview_scheduled", createdAt: new Date("2026-07-05T09:00:00Z") },
        { id: "sh17", userId: "u1", fromStatus: "interview_scheduled", toStatus: "interview_completed", remarks: "Excellent interview", createdAt: new Date("2026-07-08T13:00:00Z") },
        { id: "sh18", userId: "u1", fromStatus: "interview_completed", toStatus: "offer_sent", remarks: "Offer letter sent", createdAt: new Date("2026-07-14T11:00:00Z") },
      ]}},
    },
  });

  await prisma.candidate.create({
    data: {
      id: "c7", applicationNumber: "APP-2026-007", fullName: "Vikash Kumar", gender: "male", dob: "1993-04-18",
      email: "vikash.k@email.com", mobile: "+91 98765 10007", whatsapp: "+91 98765 10007", whatsappVerified: true, emailVerified: false,
      qualification: "MHA", experience: "12 years", currentEmployer: "Narayana Health", currentSalary: 160000, expectedSalary: 250000,
      noticePeriod: "30 days", languages: ["English", "Hindi", "Kannada"], skills: ["Hospital Operations", "Budget Management"],
      jobId: "j7", applicationDate: new Date("2026-07-06"), status: "selected", assignedHRId: "u3", tags: ["senior", "leadership"],
      score: { create: { communication: 8, technicalSkill: 7, experience: 9, qualification: 8, personality: 8, hospitalCultureFit: 9, computerKnowledge: 7, leadership: 9, confidence: 8, overall: 8.2 } },
      statusHistory: { createMany: { data: [
        { id: "sh19", userId: "u1", fromStatus: null, toStatus: "new", remarks: "Application submitted", createdAt: new Date("2026-07-06T08:00:00Z") },
        { id: "sh20", userId: "u1", fromStatus: "new", toStatus: "selected", remarks: "Fast-tracked", createdAt: new Date("2026-07-14T16:00:00Z") },
      ]}},
    },
  });

  await prisma.candidate.create({
    data: {
      id: "c8", applicationNumber: "APP-2026-008", fullName: "Priyanka Das", gender: "female", dob: "1994-09-05",
      email: "priyanka.d@email.com", mobile: "+91 98765 10008", whatsapp: "+91 98765 10008", whatsappVerified: true, emailVerified: true,
      qualification: "B.Sc Nursing", experience: "3 years", currentEmployer: "AMRI Hospital", currentSalary: 38000, expectedSalary: 55000,
      noticePeriod: "15 days", languages: ["English", "Hindi", "Bengali"], skills: ["Pediatric Care", "Vaccination"],
      jobId: "j8", applicationDate: new Date("2026-07-13"), status: "new",
      score: { create: { communication: 7, technicalSkill: 6, experience: 5, qualification: 6, personality: 8, hospitalCultureFit: 7, computerKnowledge: 5, leadership: 4, confidence: 6, overall: 6.0 } },
      statusHistory: { create: { id: "sh21", userId: "u1", fromStatus: null, toStatus: "new", remarks: "Application submitted", createdAt: new Date("2026-07-13T08:00:00Z") } },
    },
  });

  await prisma.candidate.create({
    data: {
      id: "c9", applicationNumber: "APP-2026-009", fullName: "Arjun Nair", gender: "male", dob: "1991-12-01",
      email: "arjun.nair@email.com", mobile: "+91 98765 10009", whatsapp: "+91 98765 10009", whatsappVerified: false, emailVerified: false,
      qualification: "GNM", experience: "2 years", currentEmployer: "St. Johns Hospital", currentSalary: 30000, expectedSalary: 48000,
      noticePeriod: "Immediate", languages: ["English", "Hindi", "Malayalam"], skills: ["ICU Nursing"],
      jobId: "j2", applicationDate: new Date("2026-07-15"), status: "rejected", assignedHRId: "u1",
      score: { create: { communication: 5, technicalSkill: 5, experience: 4, qualification: 4, personality: 6, hospitalCultureFit: 5, computerKnowledge: 4, leadership: 3, confidence: 5, overall: 4.7 } },
      remarks: { create: { id: "r5", userId: "u1", type: "overall", content: "Insufficient experience for ICU role.", isPinned: false } },
      statusHistory: { createMany: { data: [
        { id: "sh22", userId: "u1", fromStatus: null, toStatus: "new", remarks: "Application submitted", createdAt: new Date("2026-07-15T08:00:00Z") },
        { id: "sh23", userId: "u1", fromStatus: "new", toStatus: "rejected", remarks: "Does not meet requirements", createdAt: new Date("2026-07-16T10:00:00Z") },
      ]}},
    },
  });

  await prisma.candidate.create({
    data: {
      id: "c10", applicationNumber: "APP-2026-010", fullName: "Meera Iyer", gender: "female", dob: "1989-06-22",
      email: "meera.iyer@email.com", mobile: "+91 98765 10010", whatsapp: "+91 98765 10010", whatsappVerified: true, emailVerified: true,
      qualification: "M.Sc Nursing", experience: "6 years", currentEmployer: "Apollo Hospitals", currentSalary: 55000, expectedSalary: 72000,
      noticePeriod: "30 days", languages: ["English", "Tamil", "Hindi"], skills: ["Critical Care", "Nursing Management"],
      jobId: "j2", applicationDate: new Date("2026-07-03"), status: "hired", assignedHRId: "u4", tags: ["hired", "senior"],
      score: { create: { communication: 8, technicalSkill: 8, experience: 8, qualification: 8, personality: 9, hospitalCultureFit: 9, computerKnowledge: 7, leadership: 8, confidence: 8, overall: 8.2 } },
      statusHistory: { createMany: { data: [
        { id: "sh24", userId: "u1", fromStatus: null, toStatus: "new", remarks: "Application submitted", createdAt: new Date("2026-07-03T08:00:00Z") },
        { id: "sh25", userId: "u1", fromStatus: "new", toStatus: "hired", remarks: "Fast-track hire", createdAt: new Date("2026-07-12T16:00:00Z") },
      ]}},
    },
  });

  await prisma.candidate.create({
    data: {
      id: "c11", applicationNumber: "APP-2026-011", fullName: "Suresh Menon", gender: "male", dob: "1986-02-14",
      email: "suresh.m@email.com", mobile: "+91 98765 10011", whatsapp: "+91 98765 10011", whatsappVerified: true, emailVerified: true,
      qualification: "MBBS, MS Orthopedics", experience: "10 years", currentEmployer: "Amrita Hospital", currentSalary: 200000, expectedSalary: 350000,
      noticePeriod: "45 days", languages: ["English", "Hindi", "Malayalam"], skills: ["Joint Replacement", "Sports Medicine"],
      jobId: "j3", applicationDate: new Date("2026-07-01"), status: "future_opportunity", assignedHRId: "u1", tags: ["future_talent", "senior"],
      isFutureCandidate: true,
      score: { create: { communication: 8, technicalSkill: 9, experience: 9, qualification: 9, personality: 7, hospitalCultureFit: 7, computerKnowledge: 6, leadership: 8, confidence: 8, overall: 8.0 } },
      remarks: { create: { id: "r6", userId: "u1", type: "overall", content: "Excellent surgeon. Added to talent pool.", isPinned: true, colorLabel: "blue" } },
      statusHistory: { createMany: { data: [
        { id: "sh26", userId: "u1", fromStatus: null, toStatus: "new", remarks: "Application submitted", createdAt: new Date("2026-07-01T08:00:00Z") },
        { id: "sh27", userId: "u1", fromStatus: "new", toStatus: "future_opportunity", remarks: "Added to talent pool", createdAt: new Date("2026-07-05T10:00:00Z") },
      ]}},
    },
  });

  await prisma.candidate.create({
    data: {
      id: "c12", applicationNumber: "APP-2026-012", fullName: "Neha Gupta", gender: "female", dob: "1996-10-08",
      email: "neha.g@email.com", mobile: "+91 98765 10012", whatsapp: "+91 98765 10012", whatsappVerified: true, emailVerified: true,
      qualification: "B.Sc Lab Technology", experience: "1 year", currentEmployer: "Quest Diagnostics", currentSalary: 22000, expectedSalary: 35000,
      noticePeriod: "Immediate", languages: ["English", "Hindi"], skills: ["Hematology"],
      jobId: "j5", applicationDate: new Date("2026-07-16"), status: "new",
      score: { create: { communication: 6, technicalSkill: 5, experience: 3, qualification: 5, personality: 7, hospitalCultureFit: 6, computerKnowledge: 6, leadership: 3, confidence: 5, overall: 5.1 } },
      statusHistory: { create: { id: "sh28", userId: "u1", fromStatus: null, toStatus: "new", remarks: "Application submitted", createdAt: new Date("2026-07-16T08:00:00Z") } },
    },
  });

  console.log("Candidates created.");

  // Create notifications
  await prisma.notification.createMany({ data: [
    { id: "n1", type: "application", title: "New Application", message: "Neha Gupta applied for Lab Technician", read: false, candidateId: "c12" },
    { id: "n2", type: "interview", title: "Interview Tomorrow", message: "Interview with Sneha Reddy tomorrow at 2:00 PM", read: false, candidateId: "c2" },
    { id: "n3", type: "status_change", title: "Candidate Hired", message: "Meera Iyer has been hired", read: true, candidateId: "c10" },
    { id: "n4", type: "reminder", title: "Follow Up Required", message: "Follow up with Fatima Khan regarding offer", read: false, candidateId: "c6" },
  ]});

  // Create templates
  await prisma.template.createMany({ data: [
    { id: "t1", name: "Application Received", type: "whatsapp", content: "Hello {{name}}, thank you for applying for {{position}} at {{hospital}}.", variables: ["name", "position", "hospital"] },
    { id: "t2", name: "Interview Invite", type: "whatsapp", content: "Dear {{name}}, you have been shortlisted. Interview on {{date}} at {{time}}.", variables: ["name", "position", "date", "time", "location"] },
    { id: "t3", name: "Document Request", type: "whatsapp", content: "Hi {{name}}, please share: {{documents}}", variables: ["name", "documents"] },
    { id: "t4", name: "Offer Letter", type: "email", subject: "Offer Letter - {{position}} at {{hospital}}", content: "Dear {{name}},\n\nWe are pleased to offer you {{position}}.\n\nBest regards,\nHR Team", variables: ["name", "position", "hospital"] },
    { id: "t5", name: "Rejection", type: "email", subject: "Application Update - {{position}}", content: "Dear {{name}},\n\nWe have decided to move forward with other candidates.\n\nBest regards,\nHR Team", variables: ["name", "position"] },
  ]});

  // Create audit logs
  await prisma.auditLog.createMany({ data: [
    { id: "a1", userId: "u1", action: "Status Change", entity: "Candidate", entityId: "c6", details: "Changed status to Offer Sent for Fatima Khan", createdAt: new Date("2026-07-14T11:00:00Z") },
    { id: "a2", userId: "u1", action: "Remark Added", entity: "Candidate", entityId: "c1", details: "Added overall remark for Rahul Verma", createdAt: new Date("2026-07-11T10:30:00Z") },
    { id: "a3", userId: "u2", action: "Interview Scheduled", entity: "Candidate", entityId: "c1", details: "Scheduled video interview for Rahul Verma", createdAt: new Date("2026-07-15T11:00:00Z") },
    { id: "a4", userId: "u1", action: "Candidate Rejected", entity: "Candidate", entityId: "c9", details: "Rejected Arjun Nair", createdAt: new Date("2026-07-16T10:00:00Z") },
    { id: "a5", userId: "u1", action: "Login", entity: "User", entityId: "u1", details: "Priya Sharma logged in", createdAt: new Date("2026-07-17T08:30:00Z") },
    { id: "a6", userId: "u4", action: "Candidate Hired", entity: "Candidate", entityId: "c10", details: "Meera Iyer hired", createdAt: new Date("2026-07-12T16:00:00Z") },
    { id: "a7", userId: "u1", action: "Job Created", entity: "Vacancy", entityId: "j6", details: "Created Emergency Physician position", createdAt: new Date("2026-07-01T09:00:00Z") },
  ]});

  console.log("Seed completed!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
