"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Search, MapPin, Briefcase, IndianRupee, ChevronDown, Calendar, Users, Zap, X, SlidersHorizontal, Loader2,
} from "lucide-react";
import { getPublicJobsByTenant } from "@/app/actions/jobs";
import { getTenantBySlug } from "@/app/actions/tenants";
import { formatCurrency } from "@/lib/utils";
import { EMPLOYMENT_TYPE_LABELS } from "@/lib/constants";
import type { EmploymentType } from "@/lib/types";

function slugify(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function daysSince(date: Date): string {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return `${diff}d ago`;
  if (diff < 30) return `${Math.floor(diff / 7)}w ago`;
  return `${Math.floor(diff / 30)}mo ago`;
}

const DEPT_COLORS: Record<string, string> = {
  Cardiology: "bg-red-50 text-red-700 border-red-200",
  Nursing: "bg-amber-50 text-amber-700 border-amber-200",
  Radiology: "bg-purple-50 text-purple-700 border-purple-200",
  Pharmacy: "bg-pink-50 text-pink-700 border-pink-200",
  Laboratory: "bg-cyan-50 text-cyan-700 border-cyan-200",
  "Emergency Medicine": "bg-orange-50 text-orange-700 border-orange-200",
  Administration: "bg-indigo-50 text-indigo-700 border-indigo-200",
  ICU: "bg-rose-50 text-rose-700 border-rose-200",
  Orthopedics: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Surgery: "bg-teal-50 text-teal-700 border-teal-200",
};

type DBJob = {
  id: string; title: string; location: string; employmentType: string;
  experienceRequired: string; salaryMin: number; salaryMax: number;
  qualification: string; skills: string[]; vacancies: number;
  description: string; isUrgent: boolean; createdAt: Date; status: string;
  department: { id: string; name: string }; branch: { id: string; name: string; city: string; address: string; phone: string; email: string };
  _count: { candidates: number };
};

export default function TenantCareersPage() {
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;

  const [tenant, setTenant] = useState<{ id: string; name: string; logo?: string } | null>(null);
  const [jobs, setJobs] = useState<DBJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [tenantError, setTenantError] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [heroSearch, setHeroSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const tenantRes = await getTenantBySlug(tenantSlug);
    if (!tenantRes.success) {
      setTenantError(true);
      setLoading(false);
      return;
    }
    const t = tenantRes.data as { id: string; name: string; logo?: string };
    setTenant(t);
    const jobsRes = await getPublicJobsByTenant(t.id);
    if (jobsRes.success) setJobs(jobsRes.data as unknown as DBJob[]);
    setLoading(false);
  }, [tenantSlug]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const locations = useMemo(() => [...new Set(jobs.map((j) => j.branch?.city).filter(Boolean))], [jobs]);
  const departments = useMemo(() => [...new Set(jobs.map((j) => j.department?.name).filter(Boolean))], [jobs]);

  const activeFilters = [
    departmentFilter !== "all" && departmentFilter,
    locationFilter !== "all" && locationFilter,
    typeFilter !== "all" && typeFilter,
    searchQuery,
  ].filter(Boolean).length;

  const clearAllFilters = () => {
    setDepartmentFilter("all");
    setLocationFilter("all");
    setTypeFilter("all");
    setSearchQuery("");
    setHeroSearch("");
  };

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const matchesSearch = !heroSearch && (!searchQuery || job.title.toLowerCase().includes(searchQuery.toLowerCase()) || job.department?.name?.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesHero = !heroSearch || job.title.toLowerCase().includes(heroSearch.toLowerCase()) || job.department?.name?.toLowerCase().includes(heroSearch.toLowerCase()) || job.location?.toLowerCase().includes(heroSearch.toLowerCase());
      const matchesDept = departmentFilter === "all" || job.department?.name === departmentFilter;
      const matchesLoc = locationFilter === "all" || job.branch?.city === locationFilter;
      const matchesType = typeFilter === "all" || job.employmentType === typeFilter;
      return matchesSearch && matchesHero && matchesDept && matchesLoc && matchesType;
    });
  }, [jobs, heroSearch, searchQuery, departmentFilter, locationFilter, typeFilter]);

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setHeroSearch(searchQuery);
    document.getElementById("job-listings")?.scrollIntoView({ behavior: "smooth" });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
          <p className="text-slate-500 mt-3">Loading...</p>
        </div>
      </div>
    );
  }

  if (tenantError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center max-w-md">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-100 rounded-full mb-5"><Search className="w-8 h-8 text-slate-300" /></div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Page Not Found</h1>
          <p className="text-slate-500 mb-6">This careers portal doesn&apos;t exist or is no longer active.</p>
          <Link href="/careers" className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors">Browse All Jobs</Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-indigo-400/10 rounded-full blur-3xl" />
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "40px 40px" }} />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="text-center max-w-3xl mx-auto">
            {tenant?.logo && <img src={tenant.logo} alt={tenant.name} className="h-12 mx-auto mb-4" />}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-4 leading-tight">
              Careers at <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-cyan-200">{tenant?.name}</span>
            </h1>
            <p className="text-lg sm:text-xl text-blue-100/80 mb-10 max-w-2xl mx-auto leading-relaxed">
              Explore career opportunities at {tenant?.name}. Join our team and make a difference.
            </p>
            <form onSubmit={handleHeroSearch} className="relative max-w-2xl mx-auto">
              <div className="flex items-center bg-white rounded-2xl shadow-2xl shadow-black/20 p-1.5">
                <div className="flex items-center gap-3 flex-1 px-4">
                  <Search className="w-5 h-5 text-slate-400 shrink-0" />
                  <input type="text" placeholder="Search by title or department..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full py-3 text-slate-900 placeholder-slate-400 text-sm sm:text-base bg-transparent outline-none" />
                  {searchQuery && <button type="button" onClick={() => { setSearchQuery(""); setHeroSearch(""); }} className="p-1 hover:bg-slate-100 rounded-full transition-colors"><X className="w-4 h-4 text-slate-400" /></button>}
                </div>
                <button type="submit" className="px-6 sm:px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-md shadow-blue-600/30 text-sm sm:text-base shrink-0">Search Jobs</button>
              </div>
            </form>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-50 to-transparent" />
      </section>

      <section id="job-listings" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{heroSearch ? `Results for "${heroSearch}"` : "Open Positions"}</h2>
            <p className="text-sm text-slate-500 mt-1">Showing <span className="font-semibold text-slate-700">{filteredJobs.length}</span> {filteredJobs.length === 1 ? "position" : "positions"}</p>
          </div>
          <button onClick={() => setShowFilters(!showFilters)} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
            <SlidersHorizontal className="w-4 h-4" /> Filters
            {activeFilters > 0 && <span className="flex items-center justify-center w-5 h-5 text-[10px] font-bold bg-blue-600 text-white rounded-full">{activeFilters}</span>}
          </button>
        </div>

        {showFilters && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-8 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Department</label>
                <div className="relative">
                  <select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)} className="w-full appearance-none bg-slate-50 border border-slate-200 text-sm rounded-xl px-4 py-2.5 pr-10 text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors">
                    <option value="all">All Departments</option>
                    {departments.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Location</label>
                <div className="relative">
                  <select value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)} className="w-full appearance-none bg-slate-50 border border-slate-200 text-sm rounded-xl px-4 py-2.5 pr-10 text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors">
                    <option value="all">All Locations</option>
                    {locations.map((loc) => <option key={loc} value={loc}>{loc}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Employment Type</label>
                <div className="relative">
                  <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="w-full appearance-none bg-slate-50 border border-slate-200 text-sm rounded-xl px-4 py-2.5 pr-10 text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors">
                    <option value="all">All Types</option>
                    {(Object.entries(EMPLOYMENT_TYPE_LABELS) as [EmploymentType, string][]).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>
            {activeFilters > 0 && (
              <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-100">
                <button onClick={clearAllFilters} className="text-xs text-red-600 hover:text-red-700 font-medium">Clear all</button>
              </div>
            )}
          </div>
        )}

        {filteredJobs.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-100 rounded-full mb-5"><Search className="w-8 h-8 text-slate-300" /></div>
            <h3 className="text-xl font-semibold text-slate-700 mb-2">No positions found</h3>
            <p className="text-slate-400 mb-6 max-w-md mx-auto">Try adjusting your filters or search terms.</p>
            <button onClick={clearAllFilters} className="px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors">Clear All Filters</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {filteredJobs.map((job) => (
              <Link key={job.id} href={`/careers/${slugify(job.title)}?id=${job.id}`} className="group relative bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-xl hover:shadow-slate-200/60 hover:border-slate-300 transition-all duration-300">
                {job.isUrgent && (
                  <div className="absolute top-4 right-4">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-600 text-xs font-bold rounded-lg border border-red-100"><Zap className="w-3 h-3" />Urgent Hiring</span>
                  </div>
                )}
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors pr-24 leading-snug">{job.title}</h3>
                  <p className="text-sm text-slate-500 mt-1">{job.branch?.name}</p>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-lg border ${DEPT_COLORS[job.department?.name] || "bg-slate-50 text-slate-700 border-slate-200"}`}>{job.department?.name}</span>
                  <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-50 text-slate-600 border border-slate-200">{EMPLOYMENT_TYPE_LABELS[job.employmentType as EmploymentType] || job.employmentType}</span>
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3 mb-5">
                  <div className="flex items-center gap-2 text-sm text-slate-500"><MapPin className="w-4 h-4 text-slate-400 shrink-0" />{job.branch?.city}</div>
                  <div className="flex items-center gap-2 text-sm text-slate-500"><Briefcase className="w-4 h-4 text-slate-400 shrink-0" />{job.experienceRequired}</div>
                  <div className="flex items-center gap-2 text-sm"><IndianRupee className="w-4 h-4 text-green-600 shrink-0" /><span className="font-semibold text-slate-700">{formatCurrency(job.salaryMin)}</span><span className="text-slate-400">&ndash;</span><span className="font-semibold text-slate-700">{formatCurrency(job.salaryMax)}</span></div>
                  <div className="flex items-center gap-2 text-sm text-slate-500"><Users className="w-4 h-4 text-slate-400 shrink-0" />{job.vacancies} {job.vacancies === 1 ? "vacancy" : "vacancies"}</div>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2 text-xs text-slate-400"><Calendar className="w-3.5 h-3.5" />Posted {daysSince(job.createdAt)}</div>
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 group-hover:text-blue-700 transition-colors">
                    View Details
                    <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
