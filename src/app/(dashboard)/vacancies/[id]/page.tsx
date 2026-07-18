"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Edit3, Trash2, Pause, Play, MapPin, Calendar, IndianRupee, Users, Briefcase, Save, X, Copy, Archive } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "@/components/ui/Modal";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getJobById, updateJob, deleteJob, changeJobStatus } from "@/app/actions/jobs";
import { getDepartments } from "@/app/actions/departments";
import { getBranches } from "@/app/actions/branches";
import { formatDate, formatCurrency } from "@/lib/utils";
import { EMPLOYMENT_TYPE_LABELS } from "@/lib/constants";
import { getCurrentTenantId } from "@/lib/get-tenant";

type JobDetail = {
  id: string; title: string; status: string; employmentType: string;
  vacancies: number; location: string; description: string;
  experienceRequired: string; salaryMin: number; salaryMax: number;
  qualification: string; skills: string[]; responsibilities: string[];
  benefits: string[]; hiringManager: string; isUrgent: boolean;
  expiryDate: string | null; createdAt: string;
  department: { id: string; name: string; color: string };
  branch: { id: string; name: string; city: string };
  _count: { candidates: number };
};

const inputClass = "w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15";
const labelClass = "block text-sm font-medium text-text-primary mb-1.5";

export default function VacancyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [departments, setDepartments] = useState<Array<{ id: string; name: string }>>([]);
  const [branches, setBranches] = useState<Array<{ id: string; name: string }>>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function load() {
      const [jobRes, deptRes, branchRes] = await Promise.all([
        getJobById(id, getCurrentTenantId()),
        getDepartments(getCurrentTenantId()),
        getBranches(getCurrentTenantId()),
      ]);
      if (jobRes.success && jobRes.data) {
        const j = jobRes.data as unknown as JobDetail;
        setJob(j);
        setForm({
          title: j.title, departmentId: j.department?.id, branchId: j.branch?.id,
          location: j.location, employmentType: j.employmentType,
          experienceRequired: j.experienceRequired, salaryMin: j.salaryMin,
          salaryMax: j.salaryMax, qualification: j.qualification,
          skills: j.skills, vacancies: j.vacancies, description: j.description,
          responsibilities: j.responsibilities, benefits: j.benefits,
          hiringManager: j.hiringManager, isUrgent: j.isUrgent,
          expiryDate: j.expiryDate || "", status: j.status,
        });
      }
      if (deptRes.success) setDepartments(deptRes.data as Array<{ id: string; name: string }>);
      if (branchRes.success) setBranches(branchRes.data as Array<{ id: string; name: string }>);
      setLoading(false);
    }
    load();
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    const res = await updateJob(id, {
      title: form.title as string,
      departmentId: form.departmentId as string,
      branchId: form.branchId as string,
      location: form.location as string,
      employmentType: form.employmentType as string,
      experienceRequired: form.experienceRequired as string,
      salaryMin: Number(form.salaryMin),
      salaryMax: Number(form.salaryMax),
      qualification: form.qualification as string,
      skills: form.skills as string[],
      vacancies: Number(form.vacancies),
      description: form.description as string,
      responsibilities: form.responsibilities as string[],
      benefits: form.benefits as string[],
      hiringManager: form.hiringManager as string,
      isUrgent: form.isUrgent as boolean,
      expiryDate: form.expiryDate as string || undefined,
      status: form.status as string,
    }, getCurrentTenantId());
    if (res.success) {
      setJob((prev) => prev ? { ...prev, ...form } as JobDetail : prev);
      setEditing(false);
    }
    setSaving(false);
  };

  const handleStatusChange = async (newStatus: string) => {
    const res = await changeJobStatus(id, newStatus, getCurrentTenantId());
    if (res.success) setJob((prev) => prev ? { ...prev, status: newStatus } : prev);
  };

  const handleDelete = async () => {
    setDeleting(true);
    setDeleteError(null);
    const res = await deleteJob(id, getCurrentTenantId());
    setDeleting(false);
    if (res.success) router.push("/vacancies");
    else setDeleteError(res.error || "Failed to delete job");
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="Loading..." subtitle="" />
        <div className="h-96 bg-surface rounded-xl animate-pulse card-shadow" />
      </div>
    );
  }

  if (!job) {
    return (
      <div>
        <PageHeader title="Job Not Found" subtitle="The requested job does not exist" />
        <Button onClick={() => router.push("/vacancies")}>Back to Vacancies</Button>
      </div>
    );
  }

  const statusActions = [
    job.status !== "open" && { label: "Mark Open", status: "open", icon: <Play className="w-4 h-4" /> },
    job.status !== "paused" && { label: "Pause", status: "paused", icon: <Pause className="w-4 h-4" /> },
    job.status !== "urgent" && { label: "Mark Urgent", status: "urgent", icon: <Briefcase className="w-4 h-4" /> },
    job.status !== "closed" && { label: "Close", status: "closed", icon: <Archive className="w-4 h-4" /> },
  ].filter(Boolean) as Array<{ label: string; status: string; icon: React.ReactNode }>;

  return (
    <div>
      <PageHeader
        title={editing ? "Edit Job" : job.title}
        subtitle={`${job.department?.name} · ${job.branch?.name}`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => router.push("/vacancies")} iconLeft={<ArrowLeft className="w-4 h-4" />}>Back</Button>
            {!editing ? (
              <>
                <Button variant="outline" iconLeft={<Edit3 className="w-4 h-4" />} onClick={() => setEditing(true)}>Edit</Button>
                <DropdownMenu actions={statusActions} onSelect={handleStatusChange} />
                <Button variant="danger" size="sm" onClick={() => setShowDeleteModal(true)} iconLeft={<Trash2 className="w-4 h-4" />}>Delete</Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setEditing(false)} iconLeft={<X className="w-4 h-4" />}>Cancel</Button>
                <Button variant="primary" loading={saving} onClick={handleSave} iconLeft={<Save className="w-4 h-4" />}>Save Changes</Button>
              </>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><h3 className="text-lg font-semibold text-text-primary">Job Details</h3></CardHeader>
            <CardBody>
              {editing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className={labelClass}>Job Title</label><input className={inputClass} value={form.title as string} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
                    <div><label className={labelClass}>Department</label><select className={inputClass} value={form.departmentId as string} onChange={(e) => setForm({ ...form, departmentId: e.target.value })}>
                      <option value="">Select</option>
                      {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select></div>
                    <div><label className={labelClass}>Branch</label><select className={inputClass} value={form.branchId as string} onChange={(e) => setForm({ ...form, branchId: e.target.value })}>
                      <option value="">Select</option>
                      {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select></div>
                    <div><label className={labelClass}>Location</label><input className={inputClass} value={form.location as string} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
                    <div><label className={labelClass}>Employment Type</label><select className={inputClass} value={form.employmentType as string} onChange={(e) => setForm({ ...form, employmentType: e.target.value })}>
                      {Object.entries(EMPLOYMENT_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select></div>
                    <div><label className={labelClass}>Vacancies</label><input type="number" className={inputClass} value={form.vacancies as number} onChange={(e) => setForm({ ...form, vacancies: parseInt(e.target.value) || 1 })} /></div>
                    <div><label className={labelClass}>Experience Required</label><input className={inputClass} value={form.experienceRequired as string} onChange={(e) => setForm({ ...form, experienceRequired: e.target.value })} /></div>
                    <div><label className={labelClass}>Qualification</label><input className={inputClass} value={form.qualification as string} onChange={(e) => setForm({ ...form, qualification: e.target.value })} /></div>
                    <div><label className={labelClass}>Salary Min (₹)</label><input type="number" className={inputClass} value={form.salaryMin as number} onChange={(e) => setForm({ ...form, salaryMin: parseInt(e.target.value) || 0 })} /></div>
                    <div><label className={labelClass}>Salary Max (₹)</label><input type="number" className={inputClass} value={form.salaryMax as number} onChange={(e) => setForm({ ...form, salaryMax: parseInt(e.target.value) || 0 })} /></div>
                    <div><label className={labelClass}>Hiring Manager</label><input className={inputClass} value={form.hiringManager as string} onChange={(e) => setForm({ ...form, hiringManager: e.target.value })} /></div>
                    <div><label className={labelClass}>Expiry Date</label><input type="date" className={inputClass} value={form.expiryDate as string} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} /></div>
                    <div><label className={labelClass}>Status</label><select className={inputClass} value={form.status as string} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                      <option value="open">Open</option><option value="paused">Paused</option><option value="urgent">Urgent</option><option value="closed">Closed</option>
                    </select></div>
                  </div>
                  <div><label className={labelClass}>Description</label><textarea rows={4} className={inputClass} value={form.description as string} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
                  <div><label className={labelClass}>Skills (comma-separated)</label><input className={inputClass} value={(form.skills as string[])?.join(", ")} onChange={(e) => setForm({ ...form, skills: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} /></div>
                  <div><label className={labelClass}>Responsibilities (comma-separated)</label><textarea rows={3} className={inputClass} value={(form.responsibilities as string[])?.join(", ")} onChange={(e) => setForm({ ...form, responsibilities: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} /></div>
                  <div><label className={labelClass}>Benefits (comma-separated)</label><textarea rows={3} className={inputClass} value={(form.benefits as string[])?.join(", ")} onChange={(e) => setForm({ ...form, benefits: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} /></div>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form.isUrgent as boolean} onChange={(e) => setForm({ ...form, isUrgent: e.target.checked })} className="w-4 h-4 rounded border-border text-primary focus:ring-primary/30" />
                      <span className="text-sm font-medium text-text-primary">Urgent Hiring</span>
                    </label>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 text-sm"><MapPin className="w-4 h-4 text-text-muted" /><span className="text-text-secondary">{job.location}</span></div>
                    <div className="flex items-center gap-2 text-sm"><Briefcase className="w-4 h-4 text-text-muted" /><span className="text-text-secondary">{EMPLOYMENT_TYPE_LABELS[job.employmentType] || job.employmentType}</span></div>
                    <div className="flex items-center gap-2 text-sm"><IndianRupee className="w-4 h-4 text-text-muted" /><span className="text-text-secondary">{formatCurrency(job.salaryMin)} - {formatCurrency(job.salaryMax)}</span></div>
                    <div className="flex items-center gap-2 text-sm"><Users className="w-4 h-4 text-text-muted" /><span className="text-text-secondary">{job.experienceRequired}</span></div>
                    <div className="flex items-center gap-2 text-sm"><Calendar className="w-4 h-4 text-text-muted" /><span className="text-text-secondary">Posted {formatDate(job.createdAt)}</span></div>
                    {job.expiryDate && <div className="flex items-center gap-2 text-sm"><Calendar className="w-4 h-4 text-text-muted" /><span className="text-text-secondary">Expires {formatDate(job.expiryDate)}</span></div>}
                  </div>
                  <div className="pt-3 border-t border-border">
                    <h4 className="font-medium text-text-primary mb-2">Description</h4>
                    <p className="text-sm text-text-secondary whitespace-pre-wrap">{job.description}</p>
                  </div>
                  {job.responsibilities?.length > 0 && (
                    <div className="pt-3 border-t border-border">
                      <h4 className="font-medium text-text-primary mb-2">Responsibilities</h4>
                      <ul className="text-sm text-text-secondary space-y-1">{job.responsibilities.map((r, i) => <li key={i}>• {r}</li>)}</ul>
                    </div>
                  )}
                  {job.skills?.length > 0 && (
                    <div className="pt-3 border-t border-border">
                      <h4 className="font-medium text-text-primary mb-2">Skills</h4>
                      <div className="flex flex-wrap gap-2">{job.skills.map((s, i) => <Badge key={i} variant="outline">{s}</Badge>)}</div>
                    </div>
                  )}
                  {job.benefits?.length > 0 && (
                    <div className="pt-3 border-t border-border">
                      <h4 className="font-medium text-text-primary mb-2">Benefits</h4>
                      <ul className="text-sm text-text-secondary space-y-1">{job.benefits.map((b, i) => <li key={i}>✓ {b}</li>)}</ul>
                    </div>
                  )}
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><h3 className="text-lg font-semibold text-text-primary">Overview</h3></CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div className="flex items-center justify-between"><span className="text-sm text-text-secondary">Status</span><StatusBadge status={job.status} /></div>
                <div className="flex items-center justify-between"><span className="text-sm text-text-secondary">Vacancies</span><span className="font-semibold text-text-primary">{job.vacancies}</span></div>
                <div className="flex items-center justify-between"><span className="text-sm text-text-secondary">Applications</span><span className="font-semibold text-text-primary">{job._count?.candidates ?? 0}</span></div>
                <div className="flex items-center justify-between"><span className="text-sm text-text-secondary">Hiring Manager</span><span className="text-sm text-text-primary">{job.hiringManager}</span></div>
                <div className="flex items-center justify-between"><span className="text-sm text-text-secondary">Qualification</span><span className="text-sm text-text-primary">{job.qualification}</span></div>
                {job.isUrgent && <Badge variant="danger">Urgent</Badge>}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader><h3 className="text-lg font-semibold text-text-primary">Quick Actions</h3></CardHeader>
            <CardBody>
              <div className="space-y-2">
                {statusActions.map((action) => (
                  <Button key={action.status} variant="outline" size="sm" className="w-full justify-start" onClick={() => handleStatusChange(action.status)} iconLeft={action.icon}>{action.label}</Button>
                ))}
                <div className="border-t border-border pt-2 mt-2">
                  <Button variant="danger" size="sm" className="w-full justify-start" onClick={() => setShowDeleteModal(true)} iconLeft={<Trash2 className="w-4 h-4" />}>Delete Job</Button>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      <Modal open={showDeleteModal} onClose={() => { setShowDeleteModal(false); setDeleteError(null); }} size="sm">
        <ModalHeader onClose={() => { setShowDeleteModal(false); setDeleteError(null); }}>Delete Job</ModalHeader>
        <ModalBody>
          <div className="text-center py-2">
            <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <p className="text-text-primary font-medium mb-1">Are you sure?</p>
            <p className="text-sm text-text-secondary">This will permanently delete <strong>{job.title}</strong>.</p>
            {job._count?.candidates ? (
              <p className="text-sm text-red-600 mt-2 font-medium">This job has {job._count.candidates} candidate{job._count.candidates !== 1 ? "s" : ""}. Deletion will fail unless all candidates are removed first.</p>
            ) : null}
            {deleteError && <p className="text-sm text-red-600 mt-2 font-medium">{deleteError}</p>}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={() => { setShowDeleteModal(false); setDeleteError(null); }}>Cancel</Button>
          <Button variant="danger" loading={deleting} onClick={handleDelete}>Delete</Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}

function DropdownMenu({ actions, onSelect }: { actions: Array<{ label: string; status: string; icon: React.ReactNode }>; onSelect: (status: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <Button variant="outline" onClick={() => setOpen(!open)}>Change Status ▾</Button>
      {open && (
        <div className="absolute z-50 mt-1 right-0 min-w-[160px] bg-surface rounded-lg border border-border card-shadow py-1">
          {actions.map((a) => (
            <button key={a.status} onClick={() => { onSelect(a.status); setOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-primary hover:bg-background transition-colors cursor-pointer">
              {a.icon}{a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
