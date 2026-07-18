export const CANDIDATE_STATUS_LABELS: Record<string, string> = {
  new: 'New',
  under_review: 'Under Review',
  shortlisted: 'Shortlisted',
  interview_scheduled: 'Interview Scheduled',
  interview_completed: 'Interview Completed',
  offer_sent: 'Offer Sent',
  selected: 'Selected',
  hired: 'Hired',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
  blacklisted: 'Blacklisted',
  hold: 'Hold',
  future_opportunity: 'Future Opportunity',
};

export const CANDIDATE_STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  under_review: 'bg-yellow-100 text-yellow-700',
  shortlisted: 'bg-indigo-100 text-indigo-700',
  interview_scheduled: 'bg-purple-100 text-purple-700',
  interview_completed: 'bg-cyan-100 text-cyan-700',
  offer_sent: 'bg-orange-100 text-orange-700',
  selected: 'bg-green-100 text-green-700',
  hired: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-600',
  blacklisted: 'bg-red-200 text-red-800',
  hold: 'bg-amber-100 text-amber-700',
  future_opportunity: 'bg-teal-100 text-teal-700',
};

export const JOB_STATUS_LABELS: Record<string, string> = {
  open: 'Open',
  closed: 'Closed',
  paused: 'Paused',
  urgent: 'Urgent Hiring',
};

export const JOB_STATUS_COLORS: Record<string, string> = {
  open: 'bg-green-100 text-green-700',
  closed: 'bg-gray-100 text-gray-600',
  paused: 'bg-yellow-100 text-yellow-700',
  urgent: 'bg-red-100 text-red-700',
};

export const EMPLOYMENT_TYPE_LABELS: Record<string, string> = {
  full_time: 'Full Time',
  part_time: 'Part Time',
  contract: 'Contract',
  internship: 'Internship',
  locum: 'Locum',
};

export const USER_ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  tenant_admin: 'Hospital Admin',
  hr_manager: 'HR Manager',
  hr_executive: 'HR Executive',
  recruitment_manager: 'Recruitment Manager',
  viewer: 'Viewer',
};

export const INTERVIEW_TYPE_LABELS: Record<string, string> = {
  online: 'Online',
  offline: 'In-Person',
  phone: 'Phone',
  video: 'Video',
};

export const SCORE_PARAMETERS = [
  { key: 'communication', label: 'Communication' },
  { key: 'technicalSkill', label: 'Technical Skill' },
  { key: 'experience', label: 'Experience' },
  { key: 'qualification', label: 'Qualification' },
  { key: 'personality', label: 'Personality' },
  { key: 'hospitalCultureFit', label: 'Hospital Culture Fit' },
  { key: 'computerKnowledge', label: 'Computer Knowledge' },
  { key: 'leadership', label: 'Leadership' },
  { key: 'confidence', label: 'Confidence' },
] as const;

export const SIDEBAR_NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard' },
  { label: 'Vacancies', href: '/vacancies', icon: 'Briefcase' },
  { label: 'Applications', href: '/applications', icon: 'FileText' },
  { label: 'Candidates', href: '/candidates', icon: 'Users' },
  { label: 'Interviews', href: '/interviews', icon: 'Calendar' },
  { label: 'WhatsApp', href: '/whatsapp', icon: 'MessageCircle' },
  { label: 'Email', href: '/email', icon: 'Mail' },
  { label: 'Departments', href: '/departments', icon: 'Building2' },
  { label: 'Branches', href: '/branches', icon: 'MapPin' },
  { label: 'Reports', href: '/reports', icon: 'BarChart3' },
  { label: 'Users', href: '/users', icon: 'UserCog' },
  { label: 'Templates', href: '/templates', icon: 'FileStack' },
  { label: 'Settings', href: '/settings', icon: 'Settings' },
  { label: 'Audit Logs', href: '/audit-logs', icon: 'ScrollText' },
];

export const DEPARTMENTS = [
  'Emergency Medicine',
  'Cardiology',
  'Orthopedics',
  'Neurology',
  'Pediatrics',
  'Oncology',
  'Radiology',
  'Nursing',
  'Pharmacy',
  'Laboratory',
  'Administration',
  'ICU',
  'Surgery',
  'Anesthesiology',
  'Pathology',
];

export const STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Chandigarh',
];

export const QUALIFICATIONS = [
  'MBBS', 'MD', 'MS', 'DM', 'MCh', 'BDS', 'BAMS', 'BHMS',
  'B.Sc Nursing', 'M.Sc Nursing', 'GNM', 'ANM',
  'B.Pharm', 'M.Pharm', 'Pharm.D',
  'B.Sc Lab Tech', 'M.Sc Lab Tech',
  'BPT', 'MPT',
  'B.Sc Radiology', 'M.Sc Radiology',
  'MBA Healthcare', 'MPH', 'MHA',
  'BCA', 'MCA', 'B.Tech', 'M.Tech',
  '12th Pass', 'Graduate', 'Post Graduate', 'PhD',
];

export const LANGUAGES = [
  'English', 'Hindi', 'Tamil', 'Telugu', 'Kannada', 'Malayalam',
  'Bengali', 'Marathi', 'Gujarati', 'Punjabi', 'Odia', 'Assamese',
  'Urdu', 'Sanskrit', 'Konkani', 'Manipuri', 'Nepali', 'Sindhi',
];
