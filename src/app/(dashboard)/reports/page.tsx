"use client";

import { useState, useEffect, useCallback } from "react";
import {
  FileText, Users, Clock, TrendingUp, Download,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Tabs, TabPanel } from "@/components/ui/Tabs";
import { KPICard } from "@/components/ui/KPICard";
import { Dropdown } from "@/components/ui/Dropdown";
import { EmptyState } from "@/components/ui/EmptyState";
import { getCandidates } from "@/app/actions/candidates";
import { getJobs } from "@/app/actions/jobs";
import { getDepartments } from "@/app/actions/departments";
import { getCurrentTenantId } from "@/lib/get-tenant";

type Candidate = { id: string; status: string; applicationDate: string; };
type Job = { id: string; title: string; status: string; department?: { name: string } | null; };
type Department = { id: string; name: string; totalPositions: number; openPositions: number; };

export default function ReportsPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [cRes, jRes, dRes] = await Promise.all([getCandidates(undefined, getCurrentTenantId()), getJobs(undefined, getCurrentTenantId()), getDepartments(getCurrentTenantId())]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (cRes.success) setCandidates(cRes.data as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (jRes.success) setJobs(jRes.data as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (dRes.success) setDepartments(dRes.data as any);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <div>
        <PageHeader title="Reports & Analytics" subtitle="Recruitment insights and performance metrics" />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  const totalApplications = candidates.length;
  const hiredCount = candidates.filter((c) => c.status === "hired" || c.status === "selected").length;

  const monthlyData = (() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const now = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 6 + i, 1);
      const monthIdx = d.getMonth();
      const year = d.getFullYear();
      const count = candidates.filter((c) => {
        const cd = new Date(c.applicationDate);
        return cd.getMonth() === monthIdx && cd.getFullYear() === year;
      }).length;
      return { month: months[monthIdx], applications: count, hires: Math.round(count * 0.2) };
    });
  })();

  const departmentHiring = departments.map((d) => ({
    name: d.name.length > 15 ? d.name.substring(0, 15) + "..." : d.name,
    fullName: d.name,
    open: d.openPositions,
    filled: d.totalPositions - d.openPositions,
    total: d.totalPositions,
  }));

  const statusDistribution = (() => {
    const counts: Record<string, number> = {};
    candidates.forEach((c) => { counts[c.status] = (counts[c.status] || 0) + 1; });
    const colors: Record<string, string> = { new: "#3B82F6", reviewed: "#F59E0B", shortlisted: "#8B5CF6", interview_scheduled: "#EC4899", offer_extended: "#F97316", hired: "#10B981", selected: "#10B981", rejected: "#EF4444", on_hold: "#6B7280", withdrawn: "#9CA3AF" };
    return Object.entries(counts).map(([name, value]) => ({ name: name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()), value, color: colors[name] || "#6B7280" }));
  })();

  const sourceData = [
    { name: "LinkedIn", value: 35, color: "#3B82F6" },
    { name: "Indeed", value: 25, color: "#10B981" },
    { name: "Referral", value: 20, color: "#F59E0B" },
    { name: "Website", value: 12, color: "#8B5CF6" },
    { name: "Walk-in", value: 8, color: "#EF4444" },
  ];

  const exportItems = [
    { kind: "item" as const, id: "pdf", label: "Export as PDF" },
    { kind: "item" as const, id: "excel", label: "Export as Excel" },
    { kind: "item" as const, id: "csv", label: "Export as CSV" },
  ];

  return (
    <div>
      <PageHeader
        title="Reports & Analytics"
        subtitle="Recruitment insights and performance metrics"
        actions={
          <Dropdown trigger={<Button variant="outline" iconLeft={<Download className="w-4 h-4" />}>Export</Button>} items={exportItems} onSelect={(id) => console.log(`Export as ${id}`)} align="right" />
        }
      />

      <Tabs tabs={[{ id: "overview", label: "Overview" }, { id: "department", label: "Department" }, { id: "source", label: "Source" }, { id: "performance", label: "Performance" }]} activeTab={activeTab} onChange={setActiveTab} />

      <TabPanel tabId="overview" activeTab={activeTab}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KPICard icon={<FileText className="w-5 h-5" />} label="Total Applications" value={totalApplications} change={12} trend={[10, 15, 12, 18, 22, 20, 25]} />
          <KPICard icon={<Clock className="w-5 h-5" />} label="Avg Time to Hire" value="18 days" change={-8} trend={[22, 20, 19, 21, 18, 19, 18]} />
          <KPICard icon={<TrendingUp className="w-5 h-5" />} label="Offer Acceptance Rate" value="85%" change={5} trend={[78, 80, 82, 79, 83, 84, 85]} />
          <KPICard icon={<Users className="w-5 h-5" />} label="Candidates Hired" value={hiredCount} change={15} trend={[3, 4, 5, 4, 6, 7, 8]} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><h3 className="font-semibold text-text-primary">Applications Over Time</h3></CardHeader>
            <CardBody>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyData}>
                    <defs>
                      <linearGradient id="colorApps" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorHires" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                    <YAxis tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                    <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #E5E7EB", borderRadius: "8px", fontSize: "12px" }} />
                    <Legend />
                    <Area type="monotone" dataKey="applications" stroke="#3B82F6" fill="url(#colorApps)" strokeWidth={2} />
                    <Area type="monotone" dataKey="hires" stroke="#10B981" fill="url(#colorHires)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader><h3 className="font-semibold text-text-primary">Source Distribution</h3></CardHeader>
            <CardBody>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={sourceData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value" label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ""} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                      {sourceData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #E5E7EB", borderRadius: "8px", fontSize: "12px" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardBody>
          </Card>
        </div>
      </TabPanel>

      <TabPanel tabId="department" activeTab={activeTab}>
        {departmentHiring.length > 0 ? (
          <Card>
            <CardHeader><h3 className="font-semibold text-text-primary">Department-wise Hiring</h3></CardHeader>
            <CardBody>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={departmentHiring} layout="vertical" margin={{ left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis type="number" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} stroke="#9CA3AF" width={120} />
                    <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #E5E7EB", borderRadius: "8px", fontSize: "12px" }} />
                    <Legend />
                    <Bar dataKey="filled" stackId="a" fill="#10B981" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="open" stackId="a" fill="#FCA5A5" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardBody>
          </Card>
        ) : (
          <EmptyState icon={<FileText className="w-8 h-8" />} title="No department data" description="Add departments to see hiring data" />
        )}
      </TabPanel>

      <TabPanel tabId="source" activeTab={activeTab}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><h3 className="font-semibold text-text-primary">Applications by Source</h3></CardHeader>
            <CardBody>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={sourceData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value">
                      {sourceData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #E5E7EB", borderRadius: "8px", fontSize: "12px" }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardHeader><h3 className="font-semibold text-text-primary">Source Performance</h3></CardHeader>
            <CardBody>
              <div className="space-y-4">
                {sourceData.map((source) => (
                  <div key={source.name} className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: source.color }} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-text-primary">{source.name}</span>
                        <span className="text-sm text-text-secondary">{source.value}%</span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${source.value}%`, backgroundColor: source.color }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>
      </TabPanel>

      <TabPanel tabId="performance" activeTab={activeTab}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><h3 className="font-semibold text-text-primary">Status Distribution</h3></CardHeader>
            <CardBody>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusDistribution} cx="50%" cy="50%" outerRadius={100} paddingAngle={2} dataKey="value" label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ""} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                      {statusDistribution.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #E5E7EB", borderRadius: "8px", fontSize: "12px" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardHeader><h3 className="font-semibold text-text-primary">Recruitment Funnel</h3></CardHeader>
            <CardBody>
              <div className="space-y-3">
                {[
                  { stage: "Applications", count: totalApplications, pct: 100 },
                  { stage: "Screened", count: Math.round(totalApplications * 0.7), pct: 70 },
                  { stage: "Shortlisted", count: Math.round(totalApplications * 0.4), pct: 40 },
                  { stage: "Interviewed", count: Math.round(totalApplications * 0.25), pct: 25 },
                  { stage: "Offered", count: Math.round(totalApplications * 0.15), pct: 15 },
                  { stage: "Hired", count: hiredCount, pct: totalApplications > 0 ? Math.round((hiredCount / totalApplications) * 100) : 0 },
                ].map((item) => (
                  <div key={item.stage} className="flex items-center gap-3">
                    <span className="w-24 text-sm text-text-secondary shrink-0">{item.stage}</span>
                    <div className="flex-1">
                      <div className="w-full h-6 bg-gray-100 rounded overflow-hidden">
                        <div className="h-full rounded bg-primary/80 flex items-center justify-end pr-2 transition-all duration-500" style={{ width: `${item.pct}%` }}>
                          <span className="text-xs font-medium text-white">{item.count}</span>
                        </div>
                      </div>
                    </div>
                    <span className="w-10 text-right text-xs text-text-muted">{item.pct}%</span>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>
      </TabPanel>
    </div>
  );
}
