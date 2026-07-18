"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, LayoutGrid, Table as TableIcon, Columns3, MessageCircle, Mail, XCircle, Download, Star, Phone, MoreVertical, Users, CalendarDays, X, FileText, FileSpreadsheet } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { SearchInput } from "@/components/ui/SearchInput";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Dropdown } from "@/components/ui/Dropdown";
import { EmptyState } from "@/components/ui/EmptyState";
import { getCandidates, createCandidate, changeCandidateStatus } from "@/app/actions/candidates";
import { useAuth } from "@/contexts/auth-context";
import { getJobs } from "@/app/actions/jobs";
import { getCurrentTenantId } from "@/lib/get-tenant";
import { CANDIDATE_STATUS_LABELS } from "@/lib/constants";
import { getScoreColor, getScoreBgColor } from "@/lib/utils";

type CandidateRow = {
  id: string; applicationNumber: string; fullName: string; status: string;
  email: string; mobile: string; whatsapp: string;
  experience?: string; qualification?: string; whatsappVerified: boolean;
  isFavorite: boolean; applicationDate: string;
  job: { title: string; department: { name: string } };
  score: { overall: number } | null;
  assignedHR: { name: string } | null;
};

type ViewMode = "table" | "cards" | "kanban";
const PIPELINE_COLUMNS = [
  { id: "new", label: "NEW", color: "border-t-cyan-500" },
  { id: "under_review", label: "APPLIED", color: "border-t-yellow-500" },
  { id: "interview_scheduled", label: "INTERVIEWED", color: "border-t-purple-500" },
  { id: "hired", label: "HIRED", color: "border-t-emerald-500" },
  { id: "rejected", label: "REJECTED", color: "border-t-red-500" },
  { id: "cancelled", label: "CANCELED", color: "border-t-gray-400" },
];

export default function CandidatesPage() {
  const router = useRouter();
  const [candidates, setCandidates] = useState<CandidateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewMode>("table");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showAddModal, setShowAddModal] = useState(false);
  const [jobs, setJobs] = useState<Array<{ id: string; title: string }>>([]);
  const [addForm, setAddForm] = useState({ fullName: "", email: "", mobile: "", whatsapp: "", gender: "male", jobId: "", qualification: "", experience: "" });
  const [adding, setAdding] = useState(false);
  const [draggedCandidate, setDraggedCandidate] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    async function load() {
      const [candRes, jobsRes] = await Promise.all([
        getCandidates(undefined, getCurrentTenantId()),
        getJobs(undefined, getCurrentTenantId()),
      ]);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (candRes.success && candRes.data) setCandidates(candRes.data as any);
      if (jobsRes.success) setJobs(jobsRes.data as Array<{ id: string; title: string }>);
      setLoading(false);
    }
    load();
  }, []);

  const departments = useMemo(() => [...new Set(candidates.map((c) => c.job?.department?.name).filter(Boolean))], [candidates]);

  const filtered = useMemo(() => {
    return candidates.filter((c) => {
      const matchSearch = !search || c.fullName.toLowerCase().includes(search.toLowerCase()) || c.job?.title?.toLowerCase().includes(search.toLowerCase()) || c.applicationNumber.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || c.status === statusFilter;
      let matchDateRange = true;
      if (dateFrom || dateTo) {
        const appDate = new Date(c.applicationDate);
        if (dateFrom) {
          const from = new Date(dateFrom);
          from.setHours(0, 0, 0, 0);
          if (appDate < from) matchDateRange = false;
        }
        if (dateTo) {
          const to = new Date(dateTo);
          to.setHours(23, 59, 59, 999);
          if (appDate > to) matchDateRange = false;
        }
      }
      return matchSearch && matchStatus && matchDateRange;
    });
  }, [candidates, search, statusFilter, dateFrom, dateTo]);

  const activeFilterCount = (search ? 1 : 0) + (statusFilter !== "all" ? 1 : 0) + (dateFrom ? 1 : 0) + (dateTo ? 1 : 0);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const columns: Column<Record<string, unknown>>[] = [
    { key: "select", header: "", className: "w-10", render: (c) => <input type="checkbox" checked={selectedIds.has((c as unknown as CandidateRow).id)} onChange={() => toggleSelect((c as unknown as CandidateRow).id)} onClick={(e) => e.stopPropagation()} className="w-4 h-4 rounded border-border text-primary focus:ring-primary/30 cursor-pointer" /> },
    {
      key: "fullName", header: "Candidate", sortable: true,
      render: (c) => { const cr = c as unknown as CandidateRow; return <div className="flex items-center gap-3"><Avatar name={cr.fullName} size="sm" /><div><p className="font-medium text-text-primary">{cr.fullName}</p><p className="text-xs text-text-secondary">{cr.applicationNumber}</p></div></div>; },
    },
    { key: "jobTitle", header: "Position", sortable: true, render: (c) => { const cr = c as unknown as CandidateRow; return <div><p className="text-text-primary">{cr.job?.title}</p><p className="text-xs text-text-secondary">{cr.job?.department?.name}</p></div>; } },
    { key: "experience", header: "Experience", sortable: true, render: (c) => <span className="text-text-secondary">{(c as unknown as CandidateRow).experience || "-"}</span> },
    { key: "qualification", header: "Qualification", sortable: true, render: (c) => <span className="text-text-secondary">{(c as unknown as CandidateRow).qualification || "-"}</span> },
    { key: "whatsappVerified", header: "WhatsApp", render: (c) => (c as unknown as CandidateRow).whatsappVerified ? <Badge variant="success" dot>Verified</Badge> : <Badge>Not Verified</Badge> },
    { key: "status", header: "Status", sortable: true, render: (c) => <StatusBadge status={(c as unknown as CandidateRow).status} /> },
    {
      key: "score", header: "Score", sortable: true,
      render: (c) => { const s = (c as unknown as CandidateRow).score?.overall || 0; return <span className={`inline-flex items-center justify-center w-9 h-9 rounded-lg text-sm font-bold ${getScoreBgColor(s)} ${getScoreColor(s)}`}>{s.toFixed(1)}</span>; },
    },
    {
      key: "actions", header: "", className: "w-12",
      render: (c) => {
        const cr = c as unknown as CandidateRow;
        return <Dropdown align="right" trigger={<button className="p-1.5 rounded-lg text-text-secondary hover:bg-background transition-colors cursor-pointer" onClick={(e) => e.stopPropagation()}><MoreVertical className="w-4 h-4" /></button>}
          items={[{ kind: "item", id: "view", label: "View Profile" }, { kind: "item", id: "whatsapp", label: "Send WhatsApp", icon: <MessageCircle className="w-4 h-4" /> }, { kind: "item", id: "email", label: "Send Email", icon: <Mail className="w-4 h-4" /> }, { kind: "separator" }, { kind: "item", id: "reject", label: "Reject", icon: <XCircle className="w-4 h-4" />, danger: true }]}
          onSelect={(id) => { if (id === "view") router.push(`/candidates/${cr.id}`); }} />;
      },
    },
  ];

  const handleDrop = async (candidateId: string, toStatus: string) => {
    if (!user?.id) return;
    setDraggedCandidate(null);
    setDragOverStatus(null);
    const res = await changeCandidateStatus(candidateId, toStatus, user.id, "Moved via pipeline drag-and-drop", getCurrentTenantId());
    if (res.success) {
      const candRes = await getCandidates(undefined, getCurrentTenantId());
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (candRes.success && candRes.data) setCandidates(candRes.data as any);
    }
  };

  const handleCreateCandidate = async () => {
    if (!addForm.fullName || !addForm.email || !addForm.mobile || !addForm.jobId) return;
    setAdding(true);
    const res = await createCandidate({
      ...addForm,
      whatsapp: addForm.whatsapp || addForm.mobile,
    }, getCurrentTenantId());
    if (res.success) {
      const candRes = await getCandidates(undefined, getCurrentTenantId());
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (candRes.success && candRes.data) setCandidates(candRes.data as any);
      setShowAddModal(false);
      setAddForm({ fullName: "", email: "", mobile: "", whatsapp: "", gender: "male", jobId: "", qualification: "", experience: "" });
    }
    setAdding(false);
  };

  const exportCandidates = (format: "pdf" | "excel") => {
    const data = filtered.map((c, i) => ({
      "#": i + 1,
      "Application No": c.applicationNumber,
      "Name": c.fullName,
      "Email": c.email,
      "Mobile": c.mobile,
      "Position": c.job?.title,
      "Department": c.job?.department?.name,
      "Experience": c.experience || "-",
      "Qualification": c.qualification || "-",
      "Status": CANDIDATE_STATUS_LABELS[c.status] || c.status,
      "Score": c.score?.overall != null ? c.score.overall.toFixed(1) : "-",
      "Applied Date": c.applicationDate,
    }));

    if (format === "pdf") {
      const printWindow = window.open("", "_blank");
      if (!printWindow) return;
      const tableRows = data.map((row) =>
        `<tr>${Object.values(row).map((v) => `<td style="border:1px solid #ddd;padding:6px 10px;font-size:13px">${v}</td>`).join("")}</tr>`
      ).join("\n");
      const headers = Object.keys(data[0] || {}).map((h) => `<th style="border:1px solid #ddd;padding:8px 10px;background:#f3f4f6;font-weight:600;font-size:13px;text-align:left">${h}</th>`).join("");
      printWindow.document.write(`
        <html><head><title>Candidates Export</title></head>
        <body style="font-family:Arial,sans-serif;padding:20px">
          <h2 style="margin-bottom:4px">Candidates Report</h2>
          <p style="color:#666;font-size:13px;margin-bottom:16px">${data.length} candidates &middot; ${new Date().toLocaleDateString()}</p>
          <table style="border-collapse:collapse;width:100%">${headers ? `<thead><tr>${headers}</tr></thead>` : ""}<tbody>${tableRows}</tbody></table>
          <script>window.onload=function(){window.print();}<\/script>
        </body></html>
      `);
      printWindow.document.close();
    } else {
      const csvHeaders = Object.keys(data[0] || []).join(",");
      const csvRows = data.map((row) => Object.values(row).map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","));
      const csv = [csvHeaders, ...csvRows].join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `candidates_${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(link.href);
    }
  };

  if (loading) {
    return <div><PageHeader title="Candidates" subtitle="Loading..." /><div className="h-96 bg-surface rounded-xl animate-pulse card-shadow" /></div>;
  }

  return (
    <div>
      <PageHeader title="Candidates" subtitle={`${filtered.length} candidates`}
        actions={<div className="flex items-center gap-2">
          <Dropdown align="right" trigger={<Button variant="outline" iconLeft={<Download className="w-4 h-4" />}>Export</Button>}
            items={[
              { kind: "item", id: "pdf", label: "Export as PDF", icon: <FileText className="w-4 h-4" /> },
              { kind: "item", id: "excel", label: "Export as Excel", icon: <FileSpreadsheet className="w-4 h-4" /> },
            ]}
            onSelect={(id) => {
              if (id === "pdf") exportCandidates("pdf");
              if (id === "excel") exportCandidates("excel");
            }} />
          <Button variant="primary" iconLeft={<Plus className="w-4 h-4" />} onClick={() => setShowAddModal(true)}>Add Candidate</Button>
        </div>} />

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex bg-gray-100 rounded-lg p-0.5">
          {([["table", "Table", TableIcon], ["cards", "Cards", LayoutGrid], ["kanban", "Kanban", Columns3]] as const).map(([v, label, Icon]) => (
            <button key={v} onClick={() => setView(v)} className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors cursor-pointer ${view === v ? "bg-surface text-text-primary shadow-sm" : "text-text-secondary hover:text-text-primary"}`}><Icon className="w-4 h-4" />{label}</button>
          ))}
        </div>
      </div>

      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 p-3 mb-4 bg-primary/5 border border-primary/20 rounded-lg">
          <span className="text-sm font-medium text-primary">{selectedIds.size} selected</span>
          <div className="flex items-center gap-2 ml-auto">
            <Button variant="outline" size="sm" iconLeft={<MessageCircle className="w-3.5 h-3.5" />}>Bulk WhatsApp</Button>
            <Button variant="outline" size="sm" iconLeft={<Mail className="w-3.5 h-3.5" />}>Bulk Email</Button>
            <Button variant="danger" size="sm" iconLeft={<XCircle className="w-3.5 h-3.5" />}>Reject</Button>
            <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>Clear</Button>
          </div>
        </div>
      )}

      <Card className="mb-6">
        <CardBody>
          <div className="flex flex-wrap items-center gap-3">
            <SearchInput value={search} onSearch={setSearch} placeholder="Search candidates..." className="w-64" />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 text-sm bg-surface border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15">
              <option value="all">All Statuses</option>
              {Object.entries(CANDIDATE_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <div className="flex items-center gap-1.5">
              <CalendarDays className="w-4 h-4 text-text-muted shrink-0" />
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="px-2 py-2 text-sm bg-surface border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" title="From date" />
              <span className="text-text-muted text-sm">to</span>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="px-2 py-2 text-sm bg-surface border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" title="To date" />
            </div>
            {activeFilterCount > 0 && (
              <Button variant="ghost" size="sm" iconLeft={<X className="w-3.5 h-3.5" />} onClick={() => { setStatusFilter("all"); setSearch(""); setDateFrom(""); setDateTo(""); }}>
                Clear ({activeFilterCount})
              </Button>
            )}
          </div>
        </CardBody>
      </Card>

      {view === "table" && (
        <Card>
          <DataTable columns={columns} data={filtered as unknown as Record<string, unknown>[]} striped pagination pageSize={10} onRowClick={(row) => router.push(`/candidates/${(row as unknown as CandidateRow).id}`)} />
        </Card>
      )}

      {view === "cards" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((c) => (
            <Card key={c.id} className="group cursor-pointer relative transition-all duration-300 hover:shadow-[0_0_20px_6px_rgba(59,130,246,0.15)] hover:ring-2 hover:ring-primary/20 hover:-translate-y-0.5" onClick={() => router.push(`/candidates/${c.id}`)}>
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              <CardBody>
                <div className="flex items-start gap-3 mb-3">
                  <Avatar name={c.fullName} size="lg" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-text-primary truncate">{c.fullName}</p>
                    <p className="text-xs text-text-secondary truncate">{c.applicationNumber}</p>
                  </div>
                  {c.isFavorite && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 shrink-0" />}
                </div>
                <p className="text-sm text-text-secondary mb-1">{c.job?.title}</p>
                <p className="text-xs text-text-muted mb-3">{c.job?.department?.name} &middot; {c.experience}</p>
                <div className="flex items-center justify-between mb-3">
                  <StatusBadge status={c.status} />
                  <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs font-bold ${getScoreBgColor(c.score?.overall || 0)} ${getScoreColor(c.score?.overall || 0)}`}>{(c.score?.overall || 0).toFixed(1)}</span>
                </div>
                <div className="flex items-center gap-2 pt-3 border-t border-border">
                  <a href={`tel:${c.mobile}`} onClick={(e) => e.stopPropagation()} className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-text-secondary hover:bg-background hover:text-text-primary transition-colors"><Phone className="w-3.5 h-3.5" /></a>
                  <a href={`https://wa.me/${c.whatsapp?.replace(/[^0-9]/g, "") || c.mobile.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-text-secondary hover:bg-background hover:text-text-primary transition-colors"><MessageCircle className="w-3.5 h-3.5" /></a>
                  <a href={`mailto:${c.email}`} onClick={(e) => e.stopPropagation()} className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-text-secondary hover:bg-background hover:text-text-primary transition-colors"><Mail className="w-3.5 h-3.5" /></a>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {view === "kanban" && (
        <div className="flex gap-4 overflow-x-auto pb-4 min-h-[calc(100vh-280px)]">
          {PIPELINE_COLUMNS.map((col) => {
            const items = filtered.filter((c) => c.status === col.id);
            const isDragOver = dragOverStatus === col.id;
            return (
              <div key={col.id} className="flex-shrink-0 w-72 flex flex-col"
                onDragOver={(e) => { e.preventDefault(); setDragOverStatus(col.id); }}
                onDragLeave={() => setDragOverStatus(null)}
                onDrop={(e) => { e.preventDefault(); const id = e.dataTransfer.getData("candidateId"); if (id) handleDrop(id, col.id); }}>
                <div className={`bg-surface rounded-xl border border-border/50 border-t-2 ${col.color} flex flex-col flex-1 transition-shadow ${isDragOver ? "shadow-lg ring-2 ring-primary/30" : ""}`}>
                  <div className="px-4 py-3 flex items-center justify-between border-b border-border/40">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-text-primary">{col.label}</span>
                      <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] rounded-full bg-gray-100 text-xs font-bold text-text-secondary px-1.5">{items.length}</span>
                    </div>
                  </div>
                  <div className="px-3 pb-3 pt-2 space-y-2 flex-1 overflow-y-auto min-h-[120px]"
                    onDragOver={(e) => e.preventDefault()}>
                    {items.length === 0 ? (
                      <div className={`flex items-center justify-center h-24 rounded-lg border-2 border-dashed transition-colors ${isDragOver ? "border-primary/40 bg-primary/5" : "border-border/40"}`}>
                        <p className="text-xs text-text-muted">{isDragOver ? "Drop here" : "No candidates"}</p>
                      </div>
                    ) : items.map((c) => (
                      <div key={c.id} draggable
                        onDragStart={(e) => { e.dataTransfer.setData("candidateId", c.id); setDraggedCandidate(c.id); }}
                        onDragEnd={() => { setDraggedCandidate(null); setDragOverStatus(null); }}
                        className={`rounded-lg border transition-all duration-300 cursor-grab active:cursor-grabbing ${draggedCandidate === c.id ? "opacity-50 scale-95 shadow-sm border-primary/30" : "border-transparent hover:shadow-[0_0_16px_4px_rgba(59,130,246,0.12)] hover:ring-1 hover:ring-primary/15 hover:border-primary/10"}`}
                        onClick={() => router.push(`/candidates/${c.id}`)}>
                        <div className="p-3">
                          <div className="flex items-center gap-2 mb-1.5">
                            <Avatar name={c.fullName} size="sm" />
                            <div className="min-w-0 flex-1"><p className="text-sm font-medium text-text-primary truncate">{c.fullName}</p></div>
                          </div>
                          <p className="text-xs text-text-secondary truncate mb-2">{c.job?.title}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-text-muted">{c.experience || "-"}</span>
                            <span className={`inline-flex items-center justify-center w-7 h-7 rounded-md text-xs font-bold ${getScoreBgColor(c.score?.overall || 0)} ${getScoreColor(c.score?.overall || 0)}`}>{(c.score?.overall || 0).toFixed(1)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {filtered.length === 0 && view !== "kanban" && (
        <EmptyState icon={<Users className="w-8 h-8" />} title="No candidates found" description="Try adjusting your search or filters"
          action={<Button variant="outline" onClick={() => { setStatusFilter("all"); setSearch(""); setDateFrom(""); setDateTo(""); }}>Clear Filters</Button>} />
      )}

      {/* Add Candidate Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowAddModal(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 relative max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowAddModal(false)} className="absolute top-4 right-4 text-text-muted hover:text-text-primary p-1"><X className="w-5 h-5" /></button>
            <h2 className="text-lg font-semibold mb-5">Add Candidate</h2>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Full Name *</label>
                  <input type="text" value={addForm.fullName} onChange={(e) => setAddForm({ ...addForm, fullName: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" placeholder="John Doe" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Gender *</label>
                  <select value={addForm.gender} onChange={(e) => setAddForm({ ...addForm, gender: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary cursor-pointer">
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Email *</label>
                  <input type="email" value={addForm.email} onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" placeholder="john@example.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Mobile *</label>
                  <input type="text" value={addForm.mobile} onChange={(e) => setAddForm({ ...addForm, mobile: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" placeholder="+91 9876543210" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">WhatsApp</label>
                <input type="text" value={addForm.whatsapp} onChange={(e) => setAddForm({ ...addForm, whatsapp: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" placeholder="Same as mobile if left empty" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Position / Job *</label>
                <select value={addForm.jobId} onChange={(e) => setAddForm({ ...addForm, jobId: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary cursor-pointer">
                  <option value="">Select position...</option>
                  {jobs.map((j) => <option key={j.id} value={j.id}>{j.title}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Qualification</label>
                  <input type="text" value={addForm.qualification} onChange={(e) => setAddForm({ ...addForm, qualification: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" placeholder="B.Sc Nursing" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Experience</label>
                  <input type="text" value={addForm.experience} onChange={(e) => setAddForm({ ...addForm, experience: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" placeholder="2 years" />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-border">
              <Button variant="ghost" onClick={() => setShowAddModal(false)}>Cancel</Button>
              <Button variant="primary" disabled={adding || !addForm.fullName || !addForm.email || !addForm.mobile || !addForm.jobId}
                onClick={handleCreateCandidate}>{adding ? "Adding..." : "Add Candidate"}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
