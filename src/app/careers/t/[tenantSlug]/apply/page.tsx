"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Send, User, Mail, Phone, MessageSquare, Upload, Shield,
  CheckCircle2, Loader2, ArrowLeft, Briefcase, FileText,
} from "lucide-react";
import { getPublicJobsByTenant } from "@/app/actions/jobs";
import { getTenantBySlug } from "@/app/actions/tenants";
import { createCandidate } from "@/app/actions/candidates";
import { QUALIFICATIONS, LANGUAGES } from "@/lib/constants";

type DBJob = {
  id: string; title: string;
  department: { name: string };
  branch: { name: string; city: string };
};

const EXPERIENCE_OPTIONS = ["0-1 years", "1-3 years", "3-5 years", "5-10 years", "10+ years"];
const NOTICE_PERIOD_OPTIONS = ["Immediate", "15 days", "30 days", "60 days", "90 days"];

interface FormData {
  fullName: string; email: string; mobile: string; whatsapp: string; sameAsMobile: boolean;
  gender: string; dob: string; qualification: string; experience: string;
  currentEmployer: string; currentSalary: string; expectedSalary: string;
  noticePeriod: string; skills: string;
  cvFileName: string; cvDataUrl: string;
  linkedIn: string; coverLetter: string; languages: string[]; declaration: boolean;
  jobId: string;
}

const initialFormData: FormData = {
  fullName: "", email: "", mobile: "", whatsapp: "", sameAsMobile: true,
  gender: "", dob: "", qualification: "", experience: "",
  currentEmployer: "", currentSalary: "", expectedSalary: "",
  noticePeriod: "", skills: "",
  cvFileName: "", cvDataUrl: "", linkedIn: "", coverLetter: "", languages: [], declaration: false,
  jobId: "",
};

export default function TenantApplyPage() {
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;

  const [tenant, setTenant] = useState<{ id: string; name: string; logo?: string } | null>(null);
  const [jobs, setJobs] = useState<DBJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [tenantError, setTenantError] = useState(false);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);
  const [applicationNumber, setApplicationNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const tenantRes = await getTenantBySlug(tenantSlug);
    if (!tenantRes.success) { setTenantError(true); setLoading(false); return; }
    const t = tenantRes.data as { id: string; name: string; logo?: string };
    setTenant(t);
    const jobsRes = await getPublicJobsByTenant(t.id);
    if (jobsRes.success) setJobs(jobsRes.data as unknown as DBJob[]);
    setLoading(false);
  }, [tenantSlug]);

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

  const validate = (): boolean => {
    const e: Record<string, boolean> = {};
    if (!formData.jobId) e.jobId = true;
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
    if (!validate()) return;
    setSubmitting(true);

    const skillsArr = formData.skills.split(",").map((s) => s.trim()).filter(Boolean);

    const res = await createCandidate({
      fullName: formData.fullName,
      gender: formData.gender,
      email: formData.email,
      mobile: formData.mobile,
      whatsapp: formData.whatsapp || formData.mobile,
      jobId: formData.jobId,
      dob: formData.dob || undefined,
      qualification: formData.qualification,
      experience: formData.experience,
      currentEmployer: formData.currentEmployer || undefined,
      currentSalary: parseInt(formData.currentSalary) || 0,
      expectedSalary: parseInt(formData.expectedSalary) || 0,
      noticePeriod: formData.noticePeriod,
      languages: formData.languages,
      skills: skillsArr,
      linkedIn: formData.linkedIn || undefined,
      coverLetter: formData.coverLetter || undefined,
      resumeUrl: formData.cvDataUrl || undefined,
      tags: ["online_application", tenantSlug],
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center"><Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" /><p className="text-slate-500 mt-3">Loading...</p></div>
      </div>
    );
  }

  if (tenantError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Page Not Found</h1>
          <p className="text-slate-500 mb-6">This application portal doesn&apos;t exist.</p>
          <Link href="/careers" className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors">Browse All Jobs</Link>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 flex items-center justify-center px-4 py-16">
        <div className="max-w-lg w-full bg-white rounded-3xl border border-slate-200 p-8 sm:p-10 text-center shadow-xl shadow-slate-100/50">
          <div className="relative inline-flex items-center justify-center w-24 h-24 mb-6">
            <div className="absolute inset-0 bg-green-100 rounded-full animate-ping opacity-30" />
            <div className="relative flex items-center justify-center w-24 h-24 bg-green-100 rounded-full"><CheckCircle2 className="w-12 h-12 text-green-600" /></div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2">Application Submitted!</h1>
          <p className="text-slate-500 mb-6">Thank you for applying to <strong>{tenant?.name}</strong>.</p>
          <div className="bg-slate-50 rounded-xl p-5 mb-8">
            <p className="text-sm text-slate-500 mb-1">Your Application Number</p>
            <p className="text-2xl font-bold text-blue-600 tracking-wide">{applicationNumber}</p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href={`/careers/t/${tenantSlug}`} className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors">Browse More Jobs</Link>
            <Link href="/careers" className="px-8 py-3 text-slate-600 font-semibold rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors">All Openings</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href={`/careers/t/${tenantSlug}`} className="flex items-center gap-3 group">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-md">
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 4v4" /><path d="M10 6h4" /><path d="M12 14v4" /><path d="M10 16h4" />
                <path d="M4 12h4" /><path d="M6 10v4" /><path d="M16 12h4" /><path d="M18 10v4" />
              </svg>
            </div>
            <span className="text-lg font-bold text-slate-900">{tenant?.name || "LordsJobs"}</span>
          </Link>
          <Link href={`/careers/t/${tenantSlug}`} className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 transition-colors">
            <ArrowLeft className="w-4 h-4" />Back to Jobs
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900">Apply to {tenant?.name}</h1>
          <p className="text-slate-500 mt-2">Submit your application for a position</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5">
            <h2 className="text-lg font-bold text-white flex items-center gap-2"><FileText className="w-5 h-5" />Application Form</h2>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            <div>
              <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 mb-1.5"><Briefcase className="w-3.5 h-3.5 text-slate-400" />Position <span className="text-red-500">*</span></label>
              <select value={formData.jobId} onChange={(e) => updateField("jobId", e.target.value)} className={`w-full appearance-none px-4 py-2.5 text-sm border rounded-xl bg-slate-50 focus:bg-white transition-colors ${errors.jobId ? "border-red-400 ring-2 ring-red-500/20" : "border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"}`}>
                <option value="">Select a position</option>
                {jobs.map((job) => (
                  <option key={job.id} value={job.id}>{job.title} - {job.branch?.city} ({job.department?.name})</option>
                ))}
              </select>
              {errors.jobId && <p className="text-xs text-red-500 mt-1">Please select a position</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 mb-1.5"><User className="w-3.5 h-3.5 text-slate-400" />Full Name <span className="text-red-500">*</span></label>
                <input type="text" value={formData.fullName} onChange={(e) => updateField("fullName", e.target.value)} placeholder="Enter your full name" className={`w-full px-4 py-2.5 text-sm border rounded-xl bg-slate-50 focus:bg-white transition-colors ${errors.fullName ? "border-red-400 ring-2 ring-red-500/20" : "border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"}`} />
                {errors.fullName && <p className="text-xs text-red-500 mt-1">Full name is required</p>}
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 mb-1.5"><Mail className="w-3.5 h-3.5 text-slate-400" />Email <span className="text-red-500">*</span></label>
                <input type="email" value={formData.email} onChange={(e) => updateField("email", e.target.value)} placeholder="your@email.com" className={`w-full px-4 py-2.5 text-sm border rounded-xl bg-slate-50 focus:bg-white transition-colors ${errors.email ? "border-red-400 ring-2 ring-red-500/20" : "border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"}`} />
                {errors.email && <p className="text-xs text-red-500 mt-1">Email is required</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 mb-1.5"><Phone className="w-3.5 h-3.5 text-slate-400" />Mobile <span className="text-red-500">*</span></label>
                <input type="tel" value={formData.mobile} onChange={(e) => updateField("mobile", e.target.value)} placeholder="+91 98765 43210" className={`w-full px-4 py-2.5 text-sm border rounded-xl bg-slate-50 focus:bg-white transition-colors ${errors.mobile ? "border-red-400 ring-2 ring-red-500/20" : "border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"}`} />
                {errors.mobile && <p className="text-xs text-red-500 mt-1">Mobile is required</p>}
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 mb-1.5"><MessageSquare className="w-3.5 h-3.5 text-slate-400" />WhatsApp</label>
                <input type="tel" value={formData.whatsapp} onChange={(e) => updateField("whatsapp", e.target.value)} disabled={formData.sameAsMobile} placeholder="+91 98765 43210" className={`w-full px-4 py-2.5 text-sm border rounded-xl bg-slate-50 focus:bg-white transition-colors ${formData.sameAsMobile ? "bg-slate-100 text-slate-400" : ""} border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500`} />
                <label className="flex items-center gap-2 mt-2 cursor-pointer">
                  <input type="checkbox" checked={formData.sameAsMobile} onChange={(e) => updateField("sameAsMobile", e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                  <span className="text-xs text-slate-500">Same as Mobile</span>
                </label>
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700 mb-2 block">Gender <span className="text-red-500">*</span></label>
              <div className="flex gap-4">{["male", "female", "other"].map((g) => (
                <label key={g} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm cursor-pointer transition-colors ${formData.gender === g ? "bg-blue-50 border-blue-300 text-blue-700" : "bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300"}`}>
                  <input type="radio" name="gender" value={g} checked={formData.gender === g} onChange={(e) => updateField("gender", e.target.value)} className="sr-only" />{g.charAt(0).toUpperCase() + g.slice(1)}
                </label>
              ))}</div>
              {errors.gender && <p className="text-xs text-red-500 mt-1">Gender is required</p>}
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Date of Birth</label>
              <input type="date" value={formData.dob} onChange={(e) => updateField("dob", e.target.value)} className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors" />
            </div>

            <div className="border-t border-slate-100 pt-6">
              <h3 className="text-base font-bold text-slate-900 mb-4">Professional Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Qualification <span className="text-red-500">*</span></label>
                  <select value={formData.qualification} onChange={(e) => updateField("qualification", e.target.value)} className={`w-full appearance-none px-4 py-2.5 text-sm border rounded-xl bg-slate-50 focus:bg-white transition-colors ${errors.qualification ? "border-red-400 ring-2 ring-red-500/20" : "border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"}`}>
                    <option value="">Select</option>{QUALIFICATIONS.map((q) => <option key={q} value={q}>{q}</option>)}
                  </select>
                  {errors.qualification && <p className="text-xs text-red-500 mt-1">Required</p>}
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Experience <span className="text-red-500">*</span></label>
                  <select value={formData.experience} onChange={(e) => updateField("experience", e.target.value)} className={`w-full appearance-none px-4 py-2.5 text-sm border rounded-xl bg-slate-50 focus:bg-white transition-colors ${errors.experience ? "border-red-400 ring-2 ring-red-500/20" : "border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"}`}>
                    <option value="">Select</option>{EXPERIENCE_OPTIONS.map((e) => <option key={e} value={e}>{e}</option>)}
                  </select>
                  {errors.experience && <p className="text-xs text-red-500 mt-1">Required</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-5">
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Current Employer</label>
                  <input type="text" value={formData.currentEmployer} onChange={(e) => updateField("currentEmployer", e.target.value)} placeholder="e.g., Apollo Hospital" className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors" />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Notice Period <span className="text-red-500">*</span></label>
                  <select value={formData.noticePeriod} onChange={(e) => updateField("noticePeriod", e.target.value)} className={`w-full appearance-none px-4 py-2.5 text-sm border rounded-xl bg-slate-50 focus:bg-white transition-colors ${errors.noticePeriod ? "border-red-400 ring-2 ring-red-500/20" : "border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"}`}>
                    <option value="">Select</option>{NOTICE_PERIOD_OPTIONS.map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                  {errors.noticePeriod && <p className="text-xs text-red-500 mt-1">Required</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-5">
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Current Salary</label>
                  <input type="number" value={formData.currentSalary} onChange={(e) => updateField("currentSalary", e.target.value)} placeholder="Monthly" className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors" />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Expected Salary</label>
                  <input type="number" value={formData.expectedSalary} onChange={(e) => updateField("expectedSalary", e.target.value)} placeholder="Monthly" className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors" />
                </div>
              </div>

              <div className="mt-5">
                <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Skills</label>
                <input type="text" value={formData.skills} onChange={(e) => updateField("skills", e.target.value)} placeholder="e.g., Cardiology, ECG" className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors" />
                <p className="text-xs text-slate-400 mt-1">Comma-separated</p>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-6">
              <h3 className="text-base font-bold text-slate-900 mb-4">Documents</h3>
              <div className="mb-5">
                <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 mb-1.5"><FileText className="w-3.5 h-3.5 text-slate-400" />CV / Resume</label>
                <div className="relative">
                  <input type="file" accept=".pdf,.doc,.docx" onChange={handleFileUpload} className="peer absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                  <div className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 peer-hover:border-blue-300 peer-hover:bg-blue-50/50 transition-colors">
                    <Upload className="w-6 h-6 text-slate-400 peer-hover:text-blue-500" />
                    {formData.cvFileName ? <p className="text-sm font-medium text-green-700">{formData.cvFileName}</p> : <><p className="text-sm font-medium text-slate-600">Upload CV</p><p className="text-xs text-slate-400 mt-1">PDF, DOC (max 5MB)</p></>}
                  </div>
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-1.5 block">LinkedIn</label>
                <input type="url" value={formData.linkedIn} onChange={(e) => updateField("linkedIn", e.target.value)} placeholder="https://linkedin.com/in/..." className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors" />
              </div>
              <div className="mt-5">
                <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Cover Letter</label>
                <textarea value={formData.coverLetter} onChange={(e) => updateField("coverLetter", e.target.value)} placeholder="Why you&apos;d be a great fit..." rows={4} className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors resize-none" />
              </div>
              <div className="mt-5">
                <label className="text-sm font-semibold text-slate-700 mb-2 block">Languages</label>
                <div className="flex flex-wrap gap-2">{LANGUAGES.slice(0, 10).map((lang) => (
                  <label key={lang} className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border cursor-pointer transition-colors ${formData.languages.includes(lang) ? "bg-blue-50 border-blue-300 text-blue-700" : "bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300"}`}>
                    <input type="checkbox" checked={formData.languages.includes(lang)} onChange={() => toggleLanguage(lang)} className="sr-only" />{lang}
                  </label>
                ))}</div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-6">
              <label className={`flex items-start gap-3 cursor-pointer p-3 rounded-xl border transition-colors ${errors.declaration ? "bg-red-50 border-red-200" : "bg-slate-50 border-slate-200 hover:bg-slate-100"}`}>
                <input type="checkbox" checked={formData.declaration} onChange={(e) => updateField("declaration", e.target.checked)} className="w-4 h-4 mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                <span className="text-sm text-slate-600"><Shield className="inline w-3.5 h-3.5 mr-1 text-slate-400" />I confirm the information provided is accurate. <span className="text-red-500">*</span></span>
              </label>
              {errors.declaration && <p className="text-xs text-red-500 mt-1">Please accept</p>}
            </div>

            {errors.submit && <p className="text-xs text-red-500 text-center">Something went wrong. Try again.</p>}

            <button type="submit" disabled={submitting} className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-xl hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-600/25 transition-all text-sm disabled:opacity-50">
              {submitting ? <><Loader2 className="w-4 h-4 animate-spin" />Submitting...</> : <><Send className="w-4 h-4" />Submit Application</>}
            </button>
            <p className="text-xs text-center text-slate-400">Your information is secure and will only be shared with the hiring team.</p>
          </div>
        </form>
      </div>
    </div>
  );
}
