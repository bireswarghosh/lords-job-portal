"use client";

import { useState, useEffect, useCallback } from "react";
import { Download, ScrollText } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { SearchInput } from "@/components/ui/SearchInput";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { getAuditLogs } from "@/app/actions/audit-logs";
import { getCurrentTenantId } from "@/lib/get-tenant";
import { formatDateTime } from "@/lib/utils";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AuditLog = Record<string, any>;

const ACTION_COLORS: Record<string, string> = {
  "Status Change": "bg-blue-100 text-blue-700",
  "Remark Added": "bg-gray-100 text-gray-700",
  "Interview Scheduled": "bg-purple-100 text-purple-700",
  "Candidate Rejected": "bg-red-100 text-red-700",
  "Candidate Hired": "bg-green-100 text-green-700",
  "Job Created": "bg-cyan-100 text-cyan-700",
  "Candidate Created": "bg-blue-100 text-blue-700",
  Login: "bg-yellow-100 text-yellow-700",
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterAction, setFilterAction] = useState("all");
  const [filterEntity, setFilterEntity] = useState("all");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await getAuditLogs({ limit: 100 }, getCurrentTenantId());
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (res.success) setLogs(res.data as any);
    else setError(res.error || "Failed to load audit logs");
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const uniqueActions = [...new Set(logs.map((l) => l.action))];
  const uniqueEntities = [...new Set(logs.map((l) => l.entity))];

  const filtered = logs.filter((l) => {
    if (search && !l.userName?.toLowerCase().includes(search.toLowerCase()) && !l.details.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterAction !== "all" && l.action !== filterAction) return false;
    if (filterEntity !== "all" && l.entity !== filterEntity) return false;
    return true;
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const columns: Column<any>[] = [
    {
      key: "createdAt",
      header: "Timestamp",
      sortable: true,
      render: (row) => <span className="text-sm text-text-secondary whitespace-nowrap">{formatDateTime(row.createdAt)}</span>,
    },
    {
      key: "userName",
      header: "User",
      sortable: true,
      render: (row) => <span className="font-medium text-text-primary">{row.userName || "System"}</span>,
    },
    {
      key: "action",
      header: "Action",
      sortable: true,
      render: (row) => <Badge className={ACTION_COLORS[row.action] || "bg-gray-100 text-gray-700"}>{row.action}</Badge>,
    },
    {
      key: "entity",
      header: "Entity",
      sortable: true,
      render: (row) => <Badge variant="outline">{row.entity}</Badge>,
    },
    {
      key: "details",
      header: "Details",
      render: (row) => <span className="text-sm text-text-secondary max-w-xs truncate block">{row.details}</span>,
    },
    {
      key: "ipAddress",
      header: "IP Address",
      render: (row) => <span className="text-sm text-text-muted font-mono">{row.ipAddress || "—"}</span>,
    },
  ];

  if (loading) {
    return (
      <div>
        <PageHeader title="Audit Logs" subtitle="Track all system activities and changes" />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageHeader title="Audit Logs" subtitle="Track all system activities and changes" />
        <EmptyState icon={<ScrollText className="w-8 h-8" />} title="Error loading audit logs" description={error} action={<Button onClick={fetchData}>Retry</Button>} />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Audit Logs"
        subtitle="Track all system activities and changes"
        actions={<Button variant="outline" iconLeft={<Download className="w-4 h-4" />}>Export</Button>}
      />

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
        <SearchInput placeholder="Search logs..." onSearch={setSearch} className="w-full sm:w-72" />
        <select value={filterAction} onChange={(e) => setFilterAction(e.target.value)} className="px-3 py-2 text-sm bg-surface border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary cursor-pointer">
          <option value="all">All Actions</option>
          {uniqueActions.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        <select value={filterEntity} onChange={(e) => setFilterEntity(e.target.value)} className="px-3 py-2 text-sm bg-surface border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary cursor-pointer">
          <option value="all">All Entities</option>
          {uniqueEntities.map((e) => <option key={e} value={e}>{e}</option>)}
        </select>
      </div>

      {filtered.length > 0 ? (
        <DataTable columns={columns} data={filtered as unknown as Record<string, unknown>[]} pagination pageSize={10} striped />
      ) : (
        <EmptyState icon={<ScrollText className="w-8 h-8" />} title="No audit logs found" description="Try adjusting your search or filters" />
      )}
    </div>
  );
}
