"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ChevronRight, MapPin, Briefcase, IndianRupee, Calendar, Users, Zap,
  Heart, Share2, Copy, Check, Building2, CheckCircle2, ArrowLeft,
  Upload, FileText, Send, Shield, Globe, User, Mail, Phone, MessageSquare,
  Loader2, X,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { getPublicJobs } from "@/app/actions/jobs";
import { getDepartments } from "@/app/actions/departments";
import { createCandidate } from "@/app/actions/candidates";
import { formatCurrency, formatDate } from "@/lib/utils";
import { EMPLOYMENT_TYPE_LABELS, QUALIFICATIONS, LANGUAGES } from "@/lib/constants";
import type { EmploymentType } from "@/lib/types";

function slugify(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

const DEPT_COLORS: Record<string, string> = {
  Cardiology: "bg-red-100 text-red-700", Nursing: "bg-amber-100 text-amber-700",
  Radiology: "bg-purple-100 text-purple-700", Pharmacy: "bg-pink-100 text-pink-700",
  Laboratory: "bg-cyan-100 text-cyan-700", "Emergency Medicine": "bg-orange-100 text-orange-700",
  Administration: "bg-indigo-100 text-indigo-700", ICU: "bg-rose-100 text-rose-700",
};

const EXPERIENCE_OPTIONS = ["0-1 years", "1-3 years", "3-5 years", "5-10 years", "10+ years"];
const NOTICE_PERIOD_OPTIONS = ["Immediate", "15 days", "30 days", "60 days", "90 days"];

interface FormData {
  fullName: string; email: string; mobile: string; whatsapp: string; sameAsMobile: boolean;
  gender: string; dob: string; qualification: string; experience: string;
  currentEmployer: string; currentSalary: string; expectedSalary: string;
  noticePeriod: string; preferredDepartment: string; skills: string;
  cvFileName: string; cvDataUrl: string;
  linkedIn: string; coverLetter: string; languages: string[]; declaration: boolean;
}

const initialFormData: FormData = {
  fullName: "", email: "", mobile: "", whatsapp: "", sameAsMobile: true,
  gender: "", dob: "", qualification: "", experience: "",
  currentEmployer: "", currentSalary: "", expectedSalary: "",
  noticePeriod: "", preferredDepartment: "", skills: "",
  cvFileName: "", cvDataUrl: "", linkedIn: "", coverLetter: "", languages: [], declaration: false,
};

type DBJob = {
  id: string; title: string; location: string; employmentType: string;
  experienceRequired: string; salaryMin: number; salaryMax: number;
  qualification: string; skills: string[]; vacancies: number;
  description: string; responsibilities: string[]; benefits: string[];
  expiryDate: string | null; hiringManager: string; isUrgent: boolean;
  createdAt: Date; status: string; tenantId: string | null;
  department: { id: string; name: string };
  branch: { id: string; name: string; city: string; address: string; phone: string; email: string };
};

type Department = { id: string; name: string };

function JobDetailContent({ params }: { params: Promise<{ slug: string }> }) {
  const searchParams = useSearchParams();
  const jobId = searchParams.get("id");

  const [job, setJob] = useState<DBJob | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);
  const [applicationNumber, setApplicationNumber] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [otpStage, setOtpStage] = useState<"idle" | "sending" | "enter" | "verifying" | "verified">("idle");
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    const jobsRes = await getPublicJobs();
    if (jobsRes.success && jobsRes.data) {
      const found = jobsRes.data.find((j: DBJob) => j.id === jobId || slugify(j.title) === (params as unknown as { slug: string }).slug);
      setJob(found as DBJob | null);
      if (found) {
        const deptRes = await getDepartments((found as DBJob).tenantId);
        if (deptRes.success) setDepartments(deptRes.data as unknown as Department[]);
      }
    }
    setLoading(false);
  }, [jobId, params]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const updateField = (field: keyof FormData, value: string | boolean | string[]) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === "sameAsMobile" && value === true) updated.whatsapp = prev.mobile;
      if (field === "mobile" && prev.sameAsMobile) updated.whatsapp = value as string;
      return updated;
    });
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: false }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setFormData((prev) => ({ ...prev, cvFileName: file.name, cvDataUrl: ev.target?.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const toggleLanguage = (lang: string) => {
    setFormData((prev) => ({
      ...prev,
      languages: prev.languages.includes(lang) ? prev.languages.filter((l) => l !== lang) : [...prev.languages, lang],
    }));
  };

  const sendOtp = () => {
    if (!formData.whatsapp || formData.whatsapp.length < 10) { setOtpError("Enter a valid WhatsApp number"); return; }
    setOtpStage("sending"); setOtpError("");
    setTimeout(() => setOtpStage("enter"), 1500);
  };

  const verifyOtp = () => {
    const otp = otpDigits.join("");
    if (otp.length !== 6) { setOtpError("Enter all 6 digits"); return; }
    setOtpStage("verifying"); setOtpError("");
    setTimeout(() => setOtpStage("verified"), 1500);
  };

  const handleOtpDigit = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const d = [...otpDigits]; d[index] = value.slice(-1); setOtpDigits(d);
    if (value && index < 5) document.getElementById(`otp-${index + 1}`)?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) document.getElementById(`otp-${index - 1}`)?.focus();
  };

  const validate = (): boolean => {
    const e: Record<string, boolean> = {};
    if (!formData.fullName.trim()) e.fullName = true;
    if (!formData.email.trim()) e.email = true;
    if (!formData.mobile.trim()) e.mobile = true;
    if (!formData.gender) e.gender = true;
    if (!formData.qualification) e.qualification = true;
    if (!formData.experience) e.experience = true;
    if (!formData.noticePeriod) e.noticePeriod = true;
    if (!formData.declaration) e.declaration = true;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !job) return;
    setSubmitting(true);

    const skillsArr = formData.skills.split(",").map((s) => s.trim()).filter(Boolean);

    const res = await createCandidate({
      fullName: formData.fullName,
      gender: formData.gender,
      email: formData.email,
      mobile: formData.mobile,
      whatsapp: formData.whatsapp || formData.mobile,
      jobId: job.id,
      dob: formData.dob || undefined,
      qualification: formData.qualification,
      experience: formData.experience,
      currentEmployer: formData.currentEmployer || undefined,
      currentSalary: parseInt(formData.currentSalary) || 0,
      expectedSalary: parseInt(formData.expectedSalary) || 0,
      noticePeriod: formData.noticePeriod,
      preferredDepartment: formData.preferredDepartment || undefined,
      languages: formData.languages,
      skills: skillsArr,
      linkedIn: formData.linkedIn || undefined,
      coverLetter: formData.coverLetter || undefined,
      resumeUrl: formData.cvDataUrl || undefined,
      tags: ["online_application"],
    });

    if (res.success && res.data) {
      setApplicationNumber(res.data.applicationNumber);
      setSubmitted(true);
    } else {
      setErrors({ submit: true });
    }
    setSubmitting(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
          <p className="text-slate-500 mt-3">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-100 rounded-full mb-5"><FileText className="w-8 h-8 text-slate-300" /></div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Job Not Found</h1>
        <p className="text-slate-500 mb-6">The position you&apos;re looking for doesn&apos;t exist or has been removed.</p>
        <Link href="/careers" className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"><ArrowLeft className="w-4 h-4" />Back to All Jobs</Link>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center shadow-xl shadow-slate-100">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6"><CheckCircle2 className="w-10 h-10 text-green-600" /></div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Application Submitted!</h1>
          <p className="text-slate-500 mb-6">Thank you for applying to the <strong>{job.title}</strong> position.</p>
          <div className="bg-slate-50 rounded-xl p-5 mb-8">
            <p className="text-sm text-slate-500 mb-1">Your Application Number</p>
            <p className="text-2xl font-bold text-blue-600 tracking-wide">{applicationNumber}</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-6 mb-8 text-left">
            <h3 className="font-semibold text-slate-900 mb-3">What happens next?</h3>
            <ol className="space-y-2 text-sm text-slate-600">
              <li className="flex items-start gap-3"><span className="flex items-center justify-center w-6 h-6 bg-blue-600 text-white rounded-full text-xs font-bold shrink-0 mt-0.5">1</span>Our HR team will review your application within 3-5 business days.</li>
              <li className="flex items-start gap-3"><span className="flex items-center justify-center w-6 h-6 bg-blue-600 text-white rounded-full text-xs font-bold shrink-0 mt-0.5">2</span>You&apos;ll receive a confirmation via WhatsApp on {formData.whatsapp || "your number"}.</li>
              <li className="flex items-start gap-3"><span className="flex items-center justify-center w-6 h-6 bg-blue-600 text-white rounded-full text-xs font-bold shrink-0 mt-0.5">3</span>If shortlisted, we&apos;ll schedule an interview at your convenience.</li>
            </ol>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/careers/thank-you" className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors">Continue</Link>
            <Link href="/careers" className="px-8 py-3 text-slate-600 font-semibold rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors">Browse More Jobs</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center gap-2 text-sm text-slate-500">
            <Link href="/careers" className="hover:text-blue-600 transition-colors">Careers</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-slate-900 font-medium truncate">{job.title}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Column - Job Details */}
          <div className="flex-1 lg:w-2/3 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-5">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-lg ${DEPT_COLORS[job.department?.name] || "bg-slate-100 text-slate-700"}`}>{job.department?.name}</span>
                    <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 text-slate-600">{EMPLOYMENT_TYPE_LABELS[job.employmentType as EmploymentType] || job.employmentType}</span>
                    {job.isUrgent && <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-600 text-xs font-bold rounded-lg border border-red-100"><Zap className="w-3 h-3" />Urgent Hiring</span>}
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">{job.title}</h1>
                  <div className="flex items-center gap-2 mt-2 text-slate-500"><Building2 className="w-4 h-4" /><span className="text-sm font-medium">{job.branch?.name}</span><span className="text-slate-300">&middot;</span><MapPin className="w-4 h-4" /><span className="text-sm">{job.branch?.city}</span></div>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-slate-50 rounded-xl px-4 py-3"><p className="text-xs text-slate-400 font-medium mb-1">Experience</p><p className="text-sm font-semibold text-slate-700">{job.experienceRequired}</p></div>
                <div className="bg-slate-50 rounded-xl px-4 py-3"><p className="text-xs text-slate-400 font-medium mb-1">Salary Range</p><p className="text-sm font-semibold text-green-700">{formatCurrency(job.salaryMin)} &ndash; {formatCurrency(job.salaryMax)}</p></div>
                <div className="bg-slate-50 rounded-xl px-4 py-3"><p className="text-xs text-slate-400 font-medium mb-1">Vacancies</p><p className="text-sm font-semibold text-slate-700">{job.vacancies}</p></div>
                <div className="bg-slate-50 rounded-xl px-4 py-3"><p className="text-xs text-slate-400 font-medium mb-1">Qualification</p><p className="text-sm font-semibold text-slate-700">{job.qualification}</p></div>
                <div className="bg-slate-50 rounded-xl px-4 py-3"><p className="text-xs text-slate-400 font-medium mb-1">Posted</p><p className="text-sm font-semibold text-slate-700">{formatDate(job.createdAt as unknown as string)}</p></div>
                <div className="bg-slate-50 rounded-xl px-4 py-3"><p className="text-xs text-slate-400 font-medium mb-1">Deadline</p><p className="text-sm font-semibold text-slate-700">{job.expiryDate || "Open"}</p></div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Job Description</h2>
              <p className="text-slate-600 leading-relaxed whitespace-pre-line">{job.description}</p>
            </div>

            {job.responsibilities.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
                <h2 className="text-lg font-bold text-slate-900 mb-4">Key Responsibilities</h2>
                <ul className="space-y-3">{job.responsibilities.map((r, i) => <li key={i} className="flex items-start gap-3 text-sm text-slate-600"><Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />{r}</li>)}</ul>
              </div>
            )}

            {job.skills.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
                <h2 className="text-lg font-bold text-slate-900 mb-4">Required Skills</h2>
                <div className="flex flex-wrap gap-2">{job.skills.map((s) => <span key={s} className="px-3 py-1.5 text-sm font-medium bg-blue-50 text-blue-700 rounded-lg border border-blue-100">{s}</span>)}</div>
              </div>
            )}

            {job.benefits.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
                <h2 className="text-lg font-bold text-slate-900 mb-4">Benefits &amp; Perks</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{job.benefits.map((b) => <div key={b} className="flex items-center gap-3 p-3 bg-green-50 rounded-xl"><Heart className="w-4 h-4 text-green-600 shrink-0" /><span className="text-sm font-medium text-green-800">{b}</span></div>)}</div>
              </div>
            )}

            {job.branch && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
                <h2 className="text-lg font-bold text-slate-900 mb-4">About {job.branch.name}</h2>
                <div className="space-y-3 text-sm text-slate-600">
                  <div className="flex items-start gap-3"><MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" /><span>{job.branch.address}, {job.branch.city}</span></div>
                  <div className="flex items-center gap-3"><Phone className="w-4 h-4 text-slate-400 shrink-0" /><span>{job.branch.phone}</span></div>
                  <div className="flex items-center gap-3"><Mail className="w-4 h-4 text-slate-400 shrink-0" /><span>{job.branch.email}</span></div>
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 mb-5">Share this job</h2>
              <div className="flex flex-wrap gap-3">
                <a href={`https://wa.me/?text=${encodeURIComponent(`Check out this job: ${job.title} at ${job.branch?.name}`)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2.5 bg-green-50 text-green-700 text-sm font-medium rounded-xl border border-green-200 hover:bg-green-100 transition-colors"><MessageSquare className="w-4 h-4" />WhatsApp</a>
                <a href={`mailto:?subject=${encodeURIComponent(`${job.title} at ${job.branch?.name}`)}&body=${encodeURIComponent(`Check out this job: ${job.title}`)}`} className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-50 text-slate-700 text-sm font-medium rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors"><Mail className="w-4 h-4" />Email</a>
                <button onClick={handleCopyLink} className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-50 text-slate-700 text-sm font-medium rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors">
                  {copiedLink ? <><Check className="w-4 h-4 text-green-600" />Copied!</> : <><Copy className="w-4 h-4" />Copy Link</>}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Application Form */}
          <div className="lg:w-1/3">
            <div className="lg:sticky lg:top-24">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5">
                  <h2 className="text-lg font-bold text-white">Apply for this Position</h2>
                  <p className="text-sm text-blue-100 mt-1">Fill in the details below to submit your application</p>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[calc(100vh-220px)] overflow-y-auto">
                  <div>
                    <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 mb-1.5"><User className="w-3.5 h-3.5 text-slate-400" />Full Name <span className="text-red-500">*</span></label>
                    <input type="text" value={formData.fullName} onChange={(e) => updateField("fullName", e.target.value)} placeholder="Enter your full name" className={`w-full px-4 py-2.5 text-sm border rounded-xl bg-slate-50 focus:bg-white transition-colors ${errors.fullName ? "border-red-400 ring-2 ring-red-500/20" : "border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"}`} />
                    {errors.fullName && <p className="text-xs text-red-500 mt-1">Full name is required</p>}
                  </div>

                  <div>
                    <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 mb-1.5"><Mail className="w-3.5 h-3.5 text-slate-400" />Email Address <span className="text-red-500">*</span></label>
                    <input type="email" value={formData.email} onChange={(e) => updateField("email", e.target.value)} placeholder="your.email@example.com" className={`w-full px-4 py-2.5 text-sm border rounded-xl bg-slate-50 focus:bg-white transition-colors ${errors.email ? "border-red-400 ring-2 ring-red-500/20" : "border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"}`} />
                    {errors.email && <p className="text-xs text-red-500 mt-1">Email is required</p>}
                  </div>

                  <div>
                    <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 mb-1.5"><Phone className="w-3.5 h-3.5 text-slate-400" />Mobile Number <span className="text-red-500">*</span></label>
                    <input type="tel" value={formData.mobile} onChange={(e) => updateField("mobile", e.target.value)} placeholder="+91 98765 43210" className={`w-full px-4 py-2.5 text-sm border rounded-xl bg-slate-50 focus:bg-white transition-colors ${errors.mobile ? "border-red-400 ring-2 ring-red-500/20" : "border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"}`} />
                    {errors.mobile && <p className="text-xs text-red-500 mt-1">Mobile number is required</p>}
                  </div>

                  <div>
                    <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 mb-1.5"><MessageSquare className="w-3.5 h-3.5 text-slate-400" />WhatsApp Number</label>
                    <div className="flex items-center gap-3">
                      <input type="tel" value={formData.whatsapp} onChange={(e) => updateField("whatsapp", e.target.value)} disabled={formData.sameAsMobile} placeholder="+91 98765 43210" className={`flex-1 px-4 py-2.5 text-sm border rounded-xl bg-slate-50 focus:bg-white transition-colors ${formData.sameAsMobile ? "bg-slate-100 text-slate-400" : ""} border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500`} />
                      {otpStage === "idle" && !formData.sameAsMobile && formData.whatsapp.length >= 10 && <button type="button" onClick={sendOtp} className="shrink-0 px-4 py-2.5 text-xs font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors">Verify</button>}
                    </div>
                    <label className="flex items-center gap-2 mt-2 cursor-pointer">
                      <input type="checkbox" checked={formData.sameAsMobile} onChange={(e) => updateField("sameAsMobile", e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                      <span className="text-xs text-slate-500">Same as Mobile</span>
                    </label>
                    {otpStage !== "idle" && (
                      <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                        {otpStage === "sending" && <div className="flex items-center gap-2 text-sm text-blue-600"><Loader2 className="w-4 h-4 animate-spin" />Sending OTP...</div>}
                        {otpStage === "enter" && (
                          <div>
                            <p className="text-xs text-slate-500 mb-2">Enter the 6-digit OTP sent to {formData.whatsapp}</p>
                            <div className="flex gap-2">{otpDigits.map((digit, i) => <input key={i} id={`otp-${i}`} type="text" inputMode="numeric" maxLength={1} value={digit} onChange={(e) => handleOtpDigit(i, e.target.value)} onKeyDown={(e) => handleOtpKeyDown(i, e)} className="w-10 h-10 text-center text-sm font-bold border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors" />)}</div>
                            {otpError && <p className="text-xs text-red-500 mt-2">{otpError}</p>}
                            <button type="button" onClick={verifyOtp} className="mt-3 w-full py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors">Verify OTP</button>
                          </div>
                        )}
                        {otpStage === "verifying" && <div className="flex items-center gap-2 text-sm text-blue-600"><Loader2 className="w-4 h-4 animate-spin" />Verifying...</div>}
                        {otpStage === "verified" && <div className="flex items-center gap-2 text-sm text-green-600 font-medium"><CheckCircle2 className="w-5 h-5" />Verified</div>}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-slate-700 mb-2 block">Gender <span className="text-red-500">*</span></label>
                    <div className="flex gap-4">{["male", "female", "other"].map((g) => <label key={g} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm cursor-pointer transition-colors ${formData.gender === g ? "bg-blue-50 border-blue-300 text-blue-700" : "bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300"}`}><input type="radio" name="gender" value={g} checked={formData.gender === g} onChange={(e) => updateField("gender", e.target.value)} className="sr-only" />{g.charAt(0).toUpperCase() + g.slice(1)}</label>)}</div>
                    {errors.gender && <p className="text-xs text-red-500 mt-1">Gender is required</p>}
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Date of Birth</label>
                    <input type="date" value={formData.dob} onChange={(e) => updateField("dob", e.target.value)} className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors" />
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Highest Qualification <span className="text-red-500">*</span></label>
                    <select value={formData.qualification} onChange={(e) => updateField("qualification", e.target.value)} className={`w-full appearance-none px-4 py-2.5 text-sm border rounded-xl bg-slate-50 focus:bg-white transition-colors ${errors.qualification ? "border-red-400 ring-2 ring-red-500/20" : "border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"}`}>
                      <option value="">Select qualification</option>{QUALIFICATIONS.map((q) => <option key={q} value={q}>{q}</option>)}
                    </select>
                    {errors.qualification && <p className="text-xs text-red-500 mt-1">Qualification is required</p>}
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Years of Experience <span className="text-red-500">*</span></label>
                    <select value={formData.experience} onChange={(e) => updateField("experience", e.target.value)} className={`w-full appearance-none px-4 py-2.5 text-sm border rounded-xl bg-slate-50 focus:bg-white transition-colors ${errors.experience ? "border-red-400 ring-2 ring-red-500/20" : "border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"}`}>
                      <option value="">Select experience</option>{EXPERIENCE_OPTIONS.map((e) => <option key={e} value={e}>{e}</option>)}
                    </select>
                    {errors.experience && <p className="text-xs text-red-500 mt-1">Experience is required</p>}
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Current Employer</label>
                    <input type="text" value={formData.currentEmployer} onChange={(e) => updateField("currentEmployer", e.target.value)} placeholder="e.g., Apollo Hospital" className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-sm font-semibold text-slate-700 mb-1.5 block">Current Salary</label><input type="number" value={formData.currentSalary} onChange={(e) => updateField("currentSalary", e.target.value)} placeholder="Monthly CTC" className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors" /></div>
                    <div><label className="text-sm font-semibold text-slate-700 mb-1.5 block">Expected Salary</label><input type="number" value={formData.expectedSalary} onChange={(e) => updateField("expectedSalary", e.target.value)} placeholder="Monthly CTC" className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors" /></div>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Notice Period <span className="text-red-500">*</span></label>
                    <select value={formData.noticePeriod} onChange={(e) => updateField("noticePeriod", e.target.value)} className={`w-full appearance-none px-4 py-2.5 text-sm border rounded-xl bg-slate-50 focus:bg-white transition-colors ${errors.noticePeriod ? "border-red-400 ring-2 ring-red-500/20" : "border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"}`}>
                      <option value="">Select notice period</option>{NOTICE_PERIOD_OPTIONS.map((n) => <option key={n} value={n}>{n}</option>)}
                    </select>
                    {errors.noticePeriod && <p className="text-xs text-red-500 mt-1">Notice period is required</p>}
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Preferred Department</label>
                    <select value={formData.preferredDepartment} onChange={(e) => updateField("preferredDepartment", e.target.value)} className="w-full appearance-none px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors">
                      <option value="">Select department</option>{departments.map((d) => <option key={d.id} value={d.name}>{d.name}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Key Skills</label>
                    <input type="text" value={formData.skills} onChange={(e) => updateField("skills", e.target.value)} placeholder="e.g., Cardiology, ECG, Ventilator" className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors" />
                    <p className="text-xs text-slate-400 mt-1">Separate with commas</p>
                  </div>

                  <div>
                    <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 mb-1.5"><FileText className="w-3.5 h-3.5 text-slate-400" />Upload CV / Resume</label>
                    <div className="relative">
                      <input type="file" accept=".pdf,.doc,.docx" onChange={handleFileUpload} className="peer absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                      <div className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 peer-hover:border-blue-300 peer-hover:bg-blue-50/50 transition-colors">
                        <Upload className="w-6 h-6 text-slate-400 peer-hover:text-blue-500" />
                        <div className="text-center">
                          {formData.cvFileName ? <p className="text-sm font-medium text-green-700">{formData.cvFileName}</p> : <><p className="text-sm font-medium text-slate-600">Click or drag to upload CV</p><p className="text-xs text-slate-400 mt-1">PDF, DOC, DOCX (max 5MB)</p></>}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-slate-700 mb-1.5 block">LinkedIn Profile</label>
                    <input type="url" value={formData.linkedIn} onChange={(e) => updateField("linkedIn", e.target.value)} placeholder="https://linkedin.com/in/yourprofile" className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors" />
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Cover Letter</label>
                    <textarea value={formData.coverLetter} onChange={(e) => updateField("coverLetter", e.target.value)} placeholder="Tell us why you're a great fit for this role..." rows={4} className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors resize-none" />
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-slate-700 mb-2 block">Languages Known</label>
                    <div className="flex flex-wrap gap-2">{LANGUAGES.slice(0, 10).map((lang) => <label key={lang} className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border cursor-pointer transition-colors ${formData.languages.includes(lang) ? "bg-blue-50 border-blue-300 text-blue-700" : "bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300"}`}><input type="checkbox" checked={formData.languages.includes(lang)} onChange={() => toggleLanguage(lang)} className="sr-only" />{lang}</label>)}</div>
                  </div>

                  <div className="pt-2">
                    <label className={`flex items-start gap-3 cursor-pointer p-3 rounded-xl border transition-colors ${errors.declaration ? "bg-red-50 border-red-200" : "bg-slate-50 border-slate-200 hover:bg-slate-100"}`}>
                      <input type="checkbox" checked={formData.declaration} onChange={(e) => updateField("declaration", e.target.checked)} className="w-4 h-4 mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                      <span className="text-sm text-slate-600"><Shield className="inline w-3.5 h-3.5 mr-1 text-slate-400" />I declare that the information provided is accurate and complete to the best of my knowledge. <span className="text-red-500">*</span></span>
                    </label>
                    {errors.declaration && <p className="text-xs text-red-500 mt-1">Please accept the declaration to proceed</p>}
                  </div>

                  {errors.submit && <p className="text-xs text-red-500 text-center">Something went wrong. Please try again.</p>}

                  <button type="submit" disabled={submitting} className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-xl hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-600/25 transition-all text-sm disabled:opacity-50">
                    {submitting ? <><Loader2 className="w-4 h-4 animate-spin" />Submitting...</> : <><Send className="w-4 h-4" />Submit Application</>}
                  </button>
                  <p className="text-xs text-center text-slate-400">Your information is secure and will only be shared with the hiring team.</p>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:hidden fixed bottom-6 right-6 z-40">
        <Link href="/careers" className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white text-sm font-semibold rounded-full shadow-xl shadow-blue-600/30 hover:bg-blue-700 transition-colors"><ArrowLeft className="w-4 h-4" />All Jobs</Link>
      </div>
    </div>
  );
}

export default function JobDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="text-center"><Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" /><p className="text-slate-500 mt-3">Loading...</p></div></div>}>
      <JobDetailContent params={params} />
    </Suspense>
  );
}
