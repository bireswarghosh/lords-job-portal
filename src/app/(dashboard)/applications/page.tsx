"use client";

import { useState, useEffect, useCallback } from "react";
import { FileText, Eye, X, CalendarDays } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Avatar } from "@/components/ui/Avatar";
import { SearchInput } from "@/components/ui/SearchInput";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal, ModalHeader, ModalBody } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { getCandidates } from "@/app/actions/candidates";
import { getCurrentTenantId } from "@/lib/get-tenant";
import { CANDIDATE_STATUS_LABELS } from "@/lib/constants";
import { formatDate, cn } from "@/lib/utils";

type Candidate = {
  id: string;
  fullName: string;
  email: string;
  mobile: string;
  status: string;
  createdAt: string;
  qualification: string | null;
  experience: string | null;
  job: { title: string; department: { name: string } | null } | null;
  score: { overall: number } | null;
};

export default function ApplicationsPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await getCandidates(undefined, getCurrentTenantId());
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (res.success) setCandidates(res.data as any);
    else setError(res.error || "Failed to load candidates");
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const activeFilterCount = (search ? 1 : 0) + (statusFilter !== "all" ? 1 : 0) + (dateFrom ? 1 : 0) + (dateTo ? 1 : 0);

  const filtered = candidates.filter((c) => {
    if (search && !c.fullName.toLowerCase().includes(search.toLowerCase()) && !c.email.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    if (dateFrom || dateTo) {
      const appDate = new Date(c.createdAt);
      if (dateFrom) { const from = new Date(dateFrom); from.setHours(0, 0, 0, 0); if (appDate < from) return false; }
      if (dateTo) { const to = new Date(dateTo); to.setHours(23, 59, 59, 999); if (appDate > to) return false; }
    }
    return true;
  });

  const columns: Column<Record<string, unknown>>[] = [
    {
      key: "name",
      header: "Candidate",
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <Avatar name={row.fullName as string} size="sm" />
          <div>
            <p className="font-medium text-text-primary">{row.fullName as string}</p>
            <p className="text-xs text-text-secondary">{row.email as string}</p>
          </div>
        </div>
      ),
    },
    {
      key: "job",
      header: "Position",
      sortable: true,
      render: (row) => {
        const c = row as unknown as Candidate;
        return <span className="text-text-secondary">{c.job?.title ?? "—"}</span>;
      },
    },
    {
      key: "department",
      header: "Department",
      sortable: true,
      render: (row) => {
        const c = row as unknown as Candidate;
        return <span className="text-text-secondary">{c.job?.department?.name ?? "—"}</span>;
      },
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (row) => <StatusBadge status={row.status as string} />,
    },
    {
      key: "createdAt",
      header: "Date Applied",
      sortable: true,
      render: (row) => <span className="text-text-secondary whitespace-nowrap">{formatDate(row.createdAt as string)}</span>,
    },
    {
      key: "score",
      header: "Score",
      sortable: true,
      render: (row) => {
        const c = row as unknown as Candidate;
        const score = c.score?.overall;
        if (score == null) return <span className="text-text-muted">—</span>;
        return (
          <span className={cn("font-semibold", score >= 8 ? "text-green-600" : score >= 6 ? "text-blue-600" : score >= 4 ? "text-yellow-600" : "text-red-600")}>
            {Number(score).toFixed(1)}
          </span>
        );
      },
    },
  ];

  if (loading) {
    return (
      <div>
        <PageHeader title="Applications" subtitle="Manage all candidate applications" />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageHeader title="Applications" subtitle="Manage all candidate applications" />
        <EmptyState
          icon={<FileText className="w-8 h-8" />}
          title="Error loading applications"
          description={error}
          action={<Button onClick={fetchData}>Retry</Button>}
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Applications"
        subtitle={`${filtered.length} candidate application${filtered.length !== 1 ? "s" : ""}`}
      />

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
        <SearchInput
          placeholder="Search by name or email..."
          onSearch={setSearch}
          className="w-full sm:w-72"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm bg-surface border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary cursor-pointer"
        >
          <option value="all">All Status</option>
          {Object.entries(CANDIDATE_STATUS_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <div className="flex items-center gap-1.5">
          <CalendarDays className="w-4 h-4 text-text-muted shrink-0" />
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
            className="px-2 py-2 text-sm bg-surface border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" title="From date" />
          <span className="text-text-muted text-sm">to</span>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
            className="px-2 py-2 text-sm bg-surface border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" title="To date" />
        </div>
        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" iconLeft={<X className="w-3.5 h-3.5" />}
            onClick={() => { setStatusFilter("all"); setSearch(""); setDateFrom(""); setDateTo(""); }}>
            Clear ({activeFilterCount})
          </Button>
        )}
      </div>

      {filtered.length > 0 ? (
        <Card>
          <DataTable
            columns={columns}
            data={filtered as unknown as Record<string, unknown>[]}
            striped
            pagination
            pageSize={10}
            onRowClick={(row) => setSelectedCandidate(row as unknown as Candidate)}
          />
        </Card>
      ) : (
        <EmptyState
          icon={<FileText className="w-8 h-8" />}
          title="No applications found"
          description="Try adjusting your filters"
        />
      )}

      <Modal open={!!selectedCandidate} onClose={() => setSelectedCandidate(null)} size="lg">
        {selectedCandidate && (
          <>
            <ModalHeader onClose={() => setSelectedCandidate(null)}>Candidate Summary</ModalHeader>
            <ModalBody>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar name={selectedCandidate.fullName} size="lg" />
                  <div>
                    <h3 className="text-lg font-semibold text-text-primary">{selectedCandidate.fullName}</h3>
                    <p className="text-sm text-text-secondary">{selectedCandidate.email}</p>
                    <p className="text-sm text-text-secondary">{selectedCandidate.mobile}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-text-secondary">Position:</span> <span className="font-medium ml-2">{selectedCandidate.job?.title ?? "—"}</span></div>
                  <div><span className="text-text-secondary">Department:</span> <span className="font-medium ml-2">{selectedCandidate.job?.department?.name ?? "—"}</span></div>
                  <div><span className="text-text-secondary">Status:</span> <span className="ml-2"><StatusBadge status={selectedCandidate.status} /></span></div>
                  <div><span className="text-text-secondary">Score:</span> <span className="font-medium ml-2">{selectedCandidate.score?.overall != null ? Number(selectedCandidate.score.overall).toFixed(1) : "—"}</span></div>
                  <div><span className="text-text-secondary">Qualification:</span> <span className="font-medium ml-2">{selectedCandidate.qualification ?? "—"}</span></div>
                  <div><span className="text-text-secondary">Experience:</span> <span className="font-medium ml-2">{selectedCandidate.experience ?? "—"}</span></div>
                  <div><span className="text-text-secondary">Applied:</span> <span className="font-medium ml-2">{formatDate(selectedCandidate.createdAt)}</span></div>
                </div>
              </div>
            </ModalBody>
          </>
        )}
      </Modal>
    </div>
  );
}
