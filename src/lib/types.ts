export type UserRole = 'super_admin' | 'hr_manager' | 'hr_executive' | 'recruitment_manager' | 'viewer';

export type JobStatus = 'open' | 'closed' | 'paused' | 'urgent';
export type EmploymentType = 'full_time' | 'part_time' | 'contract' | 'internship' | 'locum';
export type CandidateStatus =
  | 'new'
  | 'under_review'
  | 'shortlisted'
  | 'interview_scheduled'
  | 'interview_completed'
  | 'offer_sent'
  | 'selected'
  | 'hired'
  | 'rejected'
  | 'cancelled'
  | 'blacklisted'
  | 'hold'
  | 'future_opportunity';

export type InterviewType = 'online' | 'offline' | 'phone' | 'video';
export type CommunicationType = 'whatsapp' | 'email' | 'call' | 'sms' | 'internal_note' | 'interview' | 'document';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  department?: string;
  phone?: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  head: string;
  totalPositions: number;
  openPositions: number;
  color: string;
}

export interface HospitalBranch {
  id: string;
  name: string;
  code: string;
  address: string;
  city: string;
  state: string;
  phone: string;
  email: string;
  isActive: boolean;
}

export interface Job {
  id: string;
  title: string;
  departmentId: string;
  department: string;
  branchId: string;
  branch: string;
  location: string;
  employmentType: EmploymentType;
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
  status: JobStatus;
  applyLink: string;
  createdAt: string;
  updatedAt: string;
  applicationsCount: number;
  isUrgent: boolean;
}

export interface Candidate {
  id: string;
  applicationNumber: string;
  photo?: string;
  fullName: string;
  gender: 'male' | 'female' | 'other';
  dob: string;
  email: string;
  mobile: string;
  whatsapp: string;
  whatsappVerified: boolean;
  emailVerified: boolean;
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
  linkedIn?: string;
  portfolio?: string;
  coverLetter?: string;
  resumeUrl?: string;
  certificates?: string[];
  jobId: string;
  jobTitle: string;
  department: string;
  applicationDate: string;
  status: CandidateStatus;
  score: CandidateScore;
  assignedHR: string;
  tags: string[];
  isFutureCandidate: boolean;
  isBlacklisted: boolean;
  isFavorite: boolean;
  remarks: Remark[];
  communications: Communication[];
  interviewHistory: InterviewRecord[];
  statusHistory: StatusHistoryEntry[];
}

export interface CandidateScore {
  communication: number;
  technicalSkill: number;
  experience: number;
  qualification: number;
  personality: number;
  hospitalCultureFit: number;
  computerKnowledge: number;
  leadership: number;
  confidence: number;
  overall: number;
}

export interface Remark {
  id: string;
  candidateId: string;
  userId: string;
  userName: string;
  type: 'private' | 'public' | 'interview' | 'technical' | 'communication' | 'behavior' | 'medical' | 'salary' | 'availability' | 'reference' | 'documents' | 'overall';
  content: string;
  createdAt: string;
  isPinned: boolean;
  colorLabel?: string;
}

export interface Communication {
  id: string;
  candidateId: string;
  type: CommunicationType;
  direction: 'inbound' | 'outbound';
  content: string;
  timestamp: string;
  status?: 'sent' | 'delivered' | 'opened' | 'clicked' | 'failed';
  userId?: string;
  userName?: string;
}

export interface StatusHistoryEntry {
  id: string;
  candidateId: string;
  fromStatus: CandidateStatus | null;
  toStatus: CandidateStatus;
  userId: string;
  userName: string;
  remarks: string;
  timestamp: string;
}

export interface InterviewRecord {
  id: string;
  candidateId: string;
  candidateName: string;
  jobId: string;
  jobTitle: string;
  type: InterviewType;
  date: string;
  time: string;
  location?: string;
  meetLink?: string;
  zoomLink?: string;
  panelMembers: string[];
  notes: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  reminderSent: boolean;
  rating?: number;
  feedback?: string;
}

export interface Notification {
  id: string;
  type: 'application' | 'interview' | 'status_change' | 'reminder' | 'document';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  candidateId?: string;
  actionUrl?: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  entity: string;
  entityId: string;
  details: string;
  timestamp: string;
  ipAddress?: string;
}

export interface Template {
  id: string;
  name: string;
  type: 'whatsapp' | 'email';
  subject?: string;
  content: string;
  variables: string[];
  createdAt: string;
  updatedAt: string;
}
