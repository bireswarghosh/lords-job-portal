"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, MoreVertical, Briefcase, Archive, Trash2, Pause, Play, Pencil, Link as LinkIcon, Check, Copy, ExternalLink, FileText } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { SearchInput } from "@/components/ui/SearchInput";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Badge } from "@/components/ui/Badge";
import { KPICard } from "@/components/ui/KPICard";
import { Dropdown } from "@/components/ui/Dropdown";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "@/components/ui/Modal";
import { getJobs, createJob, deleteJob, changeJobStatus } from "@/app/actions/jobs";
import { getDepartments } from "@/app/actions/departments";
import { getBranches } from "@/app/actions/branches";
import { getCurrentTenantId } from "@/lib/get-tenant";
import { useAuth } from "@/contexts/auth-context";
import { formatDate } from "@/lib/utils";
import { EMPLOYMENT_TYPE_LABELS } from "@/lib/constants";

type JobWithRelations = {
  id: string; title: string; status: string; employmentType: string;
  vacancies: number; location: string; createdAt: string; isUrgent: boolean;
  department: { name: string; color: string };
  branch: { name: string };
  _count: { candidates: number };
};

const inputClass = "w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15";
const labelClass = "block text-sm font-medium text-text-primary mb-1.5";

const EMPTY_JOB = {
  title: "", departmentId: "", branchId: "", location: "", employmentType: "full_time",
  experienceRequired: "", salaryMin: 0, salaryMax: 0, qualification: "",
  skills: "", vacancies: 1, description: "", responsibilities: "",
  benefits: "", hiringManager: "", expiryDate: "", isUrgent: false,
};

function slugify(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export default function VacanciesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [copiedJobId, setCopiedJobId] = useState<string | null>(null);

  const applyUrl = user?.tenantSlug
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/careers/t/${user.tenantSlug}`
    : null;
  const directApplyUrl = user?.tenantSlug
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/apply?tenant=${user.tenantSlug}`
    : null;

  const handleCopyUrl = () => {
    if (!applyUrl) return;
    navigator.clipboard.writeText(applyUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const [jobs, setJobs] = useState<JobWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deptFilter, setDeptFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(EMPTY_JOB);
  const [departments, setDepartments] = useState<Array<{ id: string; name: string }>>([]);
  const [branches, setBranches] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    async function load() {
      const [jobsRes, deptRes, branchRes] = await Promise.all([
        getJobs(undefined, getCurrentTenantId()),
        getDepartments(getCurrentTenantId()),
        getBranches(getCurrentTenantId()),
      ]);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (jobsRes.success && jobsRes.data) setJobs(jobsRes.data as any);
      if (deptRes.success) setDepartments(deptRes.data as Array<{ id: string; name: string }>);
      if (branchRes.success) setBranches(branchRes.data as Array<{ id: string; name: string }>);
      setLoading(false);
    }
    load();
  }, []);

  const departmentsList = useMemo(() => [...new Set(jobs.map((j) => j.department?.name).filter(Boolean))], [jobs]);

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const matchesSearch = !search || job.title.toLowerCase().includes(search.toLowerCase()) || job.department?.name?.toLowerCase().includes(search.toLowerCase()) || job.branch?.name?.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || job.status === statusFilter;
      const matchesDept = deptFilter === "all" || job.department?.name === deptFilter;
      const matchesType = typeFilter === "all" || job.employmentType === typeFilter;
      return matchesSearch && matchesStatus && matchesDept && matchesType;
    });
  }, [jobs, search, statusFilter, deptFilter, typeFilter]);

  const stats = useMemo(() => ({
    total: jobs.length,
    open: jobs.filter((j) => j.status === "open").length,
    urgent: jobs.filter((j) => j.status === "urgent" || j.isUrgent).length,
    closed: jobs.filter((j) => j.status === "closed").length,
  }), [jobs]);

  const handleStatusChange = async (jobId: string, newStatus: string) => {
    const res = await changeJobStatus(jobId, newStatus, getCurrentTenantId());
    if (res.success) {
      setJobs((prev) => prev.map((j) => j.id === jobId ? { ...j, status: newStatus } : j));
    }
  };

  const handleCreateJob = async () => {
    if (!form.title || !form.departmentId || !form.branchId) return;
    setCreating(true);
    const res = await createJob({
      title: form.title,
      departmentId: form.departmentId,
      branchId: form.branchId,
      location: form.location,
      employmentType: form.employmentType,
      experienceRequired: form.experienceRequired,
      salaryMin: Number(form.salaryMin),
      salaryMax: Number(form.salaryMax),
      qualification: form.qualification,
      skills: (form.skills as string).split(",").map((s) => s.trim()).filter(Boolean),
      vacancies: Number(form.vacancies),
      description: form.description,
      responsibilities: (form.responsibilities as string).split(",").map((s) => s.trim()).filter(Boolean),
      benefits: (form.benefits as string).split(",").map((s) => s.trim()).filter(Boolean),
      hiringManager: form.hiringManager,
      expiryDate: form.expiryDate as string || undefined,
      isUrgent: form.isUrgent as boolean,
    }, getCurrentTenantId());
    if (res.success) {
      setShowCreateModal(false);
      setForm(EMPTY_JOB);
      const jobsRes = await getJobs(undefined, getCurrentTenantId());
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (jobsRes.success && jobsRes.data) setJobs(jobsRes.data as any);
    }
    setCreating(false);
  };

  const handleDeleteJob = async (jobId: string) => {
    const res = await deleteJob(jobId, getCurrentTenantId());
    if (res.success) setJobs((prev) => prev.filter((j) => j.id !== jobId));
  };

  const columns: Column<Record<string, unknown>>[] = [
    {
      key: "title", header: "Job Title", sortable: true,
      render: (job) => {
        const j = job as unknown as JobWithRelations;
        return (
          <div>
            <p className="font-semibold text-text-primary">{j.title}</p>
            <p className="text-xs text-text-secondary mt-0.5">{j.department?.name}</p>
          </div>
        );
      },
    },
    {
      key: "branch", header: "Branch", sortable: true,
      render: (job) => <span className="text-text-secondary">{(job as unknown as JobWithRelations).branch?.name}</span>,
    },
    {
      key: "employmentType", header: "Type", sortable: true,
      render: (job) => <Badge variant="outline">{EMPLOYMENT_TYPE_LABELS[(job as unknown as JobWithRelations).employmentType] || (job as unknown as JobWithRelations).employmentType}</Badge>,
    },
    {
      key: "vacancies", header: "Vacancies", sortable: true,
      render: (job) => <span className="font-medium text-text-primary">{(job as unknown as JobWithRelations).vacancies}</span>,
    },
    {
      key: "_count", header: "Applications", sortable: true,
      render: (job) => <span className="font-medium text-text-primary">{(job as unknown as JobWithRelations)._count?.candidates ?? 0}</span>,
    },
    {
      key: "status", header: "Status", sortable: true,
      render: (job) => <StatusBadge status={(job as unknown as JobWithRelations).status} />,
    },
    {
      key: "createdAt", header: "Posted", sortable: true,
      render: (job) => <span className="text-text-secondary whitespace-nowrap">{formatDate((job as unknown as JobWithRelations).createdAt)}</span>,
    },
    {
      key: "actions", header: "Actions",
      render: (job) => {
        const j = job as unknown as JobWithRelations;
        const jobPublicUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/careers/${slugify(j.title)}?id=${j.id}`;
        return (
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => { navigator.clipboard.writeText(jobPublicUrl); setCopiedJobId(j.id); setTimeout(() => setCopiedJobId(null), 2000); }} className="p-1.5 rounded-lg text-text-secondary hover:text-primary hover:bg-primary/5 transition-colors cursor-pointer" title="Copy Public Link">
              {copiedJobId === j.id ? <Check className="w-4 h-4 text-green-600" /> : <LinkIcon className="w-4 h-4" />}
            </button>
            <button onClick={() => router.push(`/vacancies/${j.id}`)} className="p-1.5 rounded-lg text-text-secondary hover:text-primary hover:bg-primary/5 transition-colors cursor-pointer" title="Edit">
              <Pencil className="w-4 h-4" />
            </button>
            <Dropdown align="right" trigger={
              <button className="p-1.5 rounded-lg text-text-secondary hover:bg-background transition-colors cursor-pointer" onClick={(e) => e.stopPropagation()}>
                <MoreVertical className="w-4 h-4" />
              </button>
            } items={[
              { kind: "item", id: "copy_link", label: "Copy Public Link", icon: <LinkIcon className="w-4 h-4" /> },
              { kind: "item", id: "pause_toggle", label: j.status === "paused" ? "Resume" : "Pause", icon: j.status === "paused" ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" /> },
              { kind: "item", id: "close", label: "Close Job", icon: <Archive className="w-4 h-4" /> },
              { kind: "separator" },
              { kind: "item", id: "delete", label: "Delete", icon: <Trash2 className="w-4 h-4" />, danger: true },
            ]} onSelect={(id) => {
              if (id === "copy_link") {
                navigator.clipboard.writeText(jobPublicUrl);
                setCopiedJobId(j.id);
                setTimeout(() => setCopiedJobId(null), 2000);
              }
              else if (id === "pause_toggle") handleStatusChange(j.id, j.status === "paused" ? "open" : "paused");
              else if (id === "close") handleStatusChange(j.id, "closed");
              else if (id === "delete") handleDeleteJob(j.id);
            }} />
          </div>
        );
      },
    },
  ];

  if (loading) {
    return (
      <div>
        <PageHeader title="Job Vacancies" subtitle="Loading..." />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-28 bg-surface rounded-xl animate-pulse card-shadow" />)}
        </div>
        <div className="h-96 bg-surface rounded-xl animate-pulse card-shadow" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Job Vacancies"
        subtitle={`${jobs.length} total vacancies across ${departmentsList.length} departments`}
        actions={<Button variant="primary" iconLeft={<Plus className="w-4 h-4" />} onClick={() => setShowCreateModal(true)}>Create Job</Button>}
      />

      {applyUrl && directApplyUrl && (
        <Card className="mb-6">
          <CardBody>
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">Public Apply Links</p>
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 text-blue-600 shrink-0">
                    <LinkIcon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-text-primary">Career Portal</p>
                    <p className="text-xs text-text-secondary truncate">{applyUrl}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <a href={applyUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                    <ExternalLink className="w-3 h-3" />Open
                  </a>
                  <button onClick={() => { navigator.clipboard.writeText(applyUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-text-secondary bg-background border border-border rounded-lg hover:bg-surface transition-colors">
                    {copied ? <><Check className="w-3 h-3 text-green-600" />Copied</> : <><Copy className="w-3 h-3" />Copy</>}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-green-50 text-green-600 shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-text-primary">Direct Apply Form</p>
                    <p className="text-xs text-text-secondary truncate">{directApplyUrl}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <a href={directApplyUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                    <ExternalLink className="w-3 h-3" />Open
                  </a>
                  <button onClick={() => { navigator.clipboard.writeText(directApplyUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-text-secondary bg-background border border-border rounded-lg hover:bg-surface transition-colors">
                    {copied ? <><Check className="w-3 h-3 text-green-600" />Copied</> : <><Copy className="w-3 h-3" />Copy</>}
                  </button>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard icon={<Briefcase className="w-5 h-5" />} label="Total Vacancies" value={stats.total} />
        <KPICard icon={<Briefcase className="w-5 h-5 text-green-600" />} label="Open" value={stats.open} className="[&>div:first-child]:bg-green-50 [&>div:first-child]:text-green-600" />
        <KPICard icon={<Briefcase className="w-5 h-5 text-red-600" />} label="Urgent" value={stats.urgent} className="[&>div:first-child]:bg-red-50 [&>div:first-child]:text-red-600" />
        <KPICard icon={<Briefcase className="w-5 h-5 text-gray-600" />} label="Closed" value={stats.closed} className="[&>div:first-child]:bg-gray-100 [&>div:first-child]:text-gray-600" />
      </div>

      <Card className="mb-6">
        <CardBody>
          <div className="flex flex-wrap items-center gap-3">
            <SearchInput value={search} onSearch={setSearch} placeholder="Search jobs..." className="w-64" />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 text-sm bg-surface border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15">
              <option value="all">All Statuses</option>
              <option value="open">Open</option><option value="urgent">Urgent</option><option value="paused">Paused</option><option value="closed">Closed</option>
            </select>
            <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} className="px-3 py-2 text-sm bg-surface border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15">
              <option value="all">All Departments</option>
              {departmentsList.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-3 py-2 text-sm bg-surface border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15">
              <option value="all">All Types</option>
              {Object.entries(EMPLOYMENT_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            {(statusFilter !== "all" || deptFilter !== "all" || typeFilter !== "all" || search) && (
              <Button variant="ghost" size="sm" onClick={() => { setStatusFilter("all"); setDeptFilter("all"); setTypeFilter("all"); setSearch(""); }}>Clear Filters</Button>
            )}
          </div>
        </CardBody>
      </Card>

      {filteredJobs.length === 0 ? (
        <EmptyState icon={<Briefcase className="w-8 h-8" />} title="No vacancies found" description="Try adjusting your search or filters"
          action={<Button variant="outline" onClick={() => { setStatusFilter("all"); setDeptFilter("all"); setTypeFilter("all"); setSearch(""); }}>Clear Filters</Button>} />
      ) : (
        <Card>
          <DataTable columns={columns} data={filteredJobs as unknown as Record<string, unknown>[]} striped pagination pageSize={10}
            onRowClick={(row) => router.push(`/vacancies/${(row as unknown as JobWithRelations).id}`)} />
        </Card>
      )}

      <Modal open={showCreateModal} onClose={() => setShowCreateModal(false)} size="lg">
        <ModalHeader onClose={() => setShowCreateModal(false)}>Create New Job</ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className={labelClass}>Job Title *</label><input className={inputClass} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Senior Cardiologist" /></div>
              <div><label className={labelClass}>Department *</label><select className={inputClass} value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value })}>
                <option value="">Select Department</option>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select></div>
              <div><label className={labelClass}>Branch *</label><select className={inputClass} value={form.branchId} onChange={(e) => setForm({ ...form, branchId: e.target.value })}>
                <option value="">Select Branch</option>
                {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select></div>
              <div><label className={labelClass}>Location</label><input className={inputClass} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. Mumbai" /></div>
              <div><label className={labelClass}>Employment Type</label><select className={inputClass} value={form.employmentType} onChange={(e) => setForm({ ...form, employmentType: e.target.value })}>
                {Object.entries(EMPLOYMENT_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select></div>
              <div><label className={labelClass}>Vacancies</label><input type="number" className={inputClass} value={form.vacancies} onChange={(e) => setForm({ ...form, vacancies: parseInt(e.target.value) || 1 })} /></div>
              <div><label className={labelClass}>Experience Required</label><input className={inputClass} value={form.experienceRequired} onChange={(e) => setForm({ ...form, experienceRequired: e.target.value })} placeholder="e.g. 5-10 years" /></div>
              <div><label className={labelClass}>Qualification</label><input className={inputClass} value={form.qualification} onChange={(e) => setForm({ ...form, qualification: e.target.value })} placeholder="e.g. MBBS, MD" /></div>
              <div><label className={labelClass}>Min Salary (₹)</label><input type="number" className={inputClass} value={form.salaryMin} onChange={(e) => setForm({ ...form, salaryMin: parseInt(e.target.value) || 0 })} /></div>
              <div><label className={labelClass}>Max Salary (₹)</label><input type="number" className={inputClass} value={form.salaryMax} onChange={(e) => setForm({ ...form, salaryMax: parseInt(e.target.value) || 0 })} /></div>
              <div><label className={labelClass}>Hiring Manager</label><input className={inputClass} value={form.hiringManager} onChange={(e) => setForm({ ...form, hiringManager: e.target.value })} placeholder="e.g. Dr. Priya Sharma" /></div>
              <div><label className={labelClass}>Expiry Date</label><input type="date" className={inputClass} value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} /></div>
            </div>
            <div><label className={labelClass}>Description *</label><textarea rows={3} className={inputClass} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Job description..." /></div>
            <div><label className={labelClass}>Skills (comma-separated)</label><input className={inputClass} value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} placeholder="Cardiology, Interventional, etc." /></div>
            <div><label className={labelClass}>Responsibilities (comma-separated)</label><input className={inputClass} value={form.responsibilities} onChange={(e) => setForm({ ...form, responsibilities: e.target.value })} placeholder="Patient care, Research, etc." /></div>
            <div><label className={labelClass}>Benefits (comma-separated)</label><input className={inputClass} value={form.benefits} onChange={(e) => setForm({ ...form, benefits: e.target.value })} placeholder="Health insurance, etc." /></div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isUrgent as boolean} onChange={(e) => setForm({ ...form, isUrgent: e.target.checked })} className="w-4 h-4 rounded border-border text-primary focus:ring-primary/30" />
              <span className="text-sm font-medium text-text-primary">Urgent Hiring</span>
            </label>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={() => setShowCreateModal(false)}>Cancel</Button>
          <Button loading={creating} onClick={handleCreateJob}>Create Job</Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
