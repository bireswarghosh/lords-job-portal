"use client";

import { useState, useEffect } from "react";
import {
  Briefcase,
  Target,
  FileText,
  TrendingUp,
  Clock,
  Calendar,
  CheckCircle,
  XCircle,
  X,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { KPICard } from "@/components/ui/KPICard";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal, ModalHeader, ModalBody } from "@/components/ui/Modal";
import { getDashboardStats, getHiringFunnelData, getDepartmentChartData, getRecentApplicants, getUpcomingInterviews, getKPIDetail } from "@/app/actions/dashboard";
import { getCurrentTenantId } from "@/lib/get-tenant";
import { formatDate } from "@/lib/utils";

export default function DashboardPage() {
  const [stats, setStats] = useState({ totalVacancies: 0, openPositions: 0, applicationsToday: 0, applicationsThisMonth: 0, pendingReview: 0, interviewScheduled: 0, selected: 0, rejected: 0 });
  const [funnelData, setFunnelData] = useState<{ stage: string; count: number; fill: string }[]>([]);
  const [deptData, setDeptData] = useState<{ name: string; vacancies: number; color: string }[]>([]);
  const [recentApplicants, setRecentApplicants] = useState<{ id: string; fullName: string; email: string; status: string; applicationDate: string; job: { title: string } }[]>([]);
  const [upcomingInterviews, setUpcomingInterviews] = useState<{ id: string; date: string; time: string; type: string; candidate: { fullName: string; id: string }; notes?: string; job?: { title: string } }[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailModal, setDetailModal] = useState<{ open: boolean; title: string; filter: string }>({ open: false, title: "", filter: "" });
  const [detailData, setDetailData] = useState<{ id?: string; fullName: string; applicationNumber: string; email: string; mobile: string; status: string; applicationDate: string; job: { title: string; department: { name: string } }; assignedHR?: { name: string } | null }[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  const openDetail = async (title: string, filter: string) => {
    setDetailModal({ open: true, title, filter });
    setDetailLoading(true);
    const res = await getKPIDetail(filter, getCurrentTenantId());
    if (res.success && res.data) setDetailData(res.data as unknown as typeof detailData);
    else setDetailData([]);
    setDetailLoading(false);
  };

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [statsRes, funnelRes, deptRes, recentRes, interviewRes] = await Promise.all([
        getDashboardStats(getCurrentTenantId()),
        getHiringFunnelData(getCurrentTenantId()),
        getDepartmentChartData(getCurrentTenantId()),
        getRecentApplicants(5, getCurrentTenantId()),
        getUpcomingInterviews(5, getCurrentTenantId()),
      ]);
      if (statsRes.success && statsRes.data) setStats(statsRes.data);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (funnelRes.success && funnelRes.data) setFunnelData(funnelRes.data as any);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (deptRes.success && deptRes.data) setDeptData(deptRes.data as any);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (recentRes.success && recentRes.data) setRecentApplicants(recentRes.data as any);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (interviewRes.success && interviewRes.data) setUpcomingInterviews(interviewRes.data as any);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div>
        <PageHeader title="Dashboard" subtitle="Welcome back, Dr. Priya Sharma" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-28 bg-surface rounded-xl animate-pulse card-shadow" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="h-80 bg-surface rounded-xl animate-pulse card-shadow" />
          <div className="h-80 bg-surface rounded-xl animate-pulse card-shadow" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Welcome back, Dr. Priya Sharma"
        actions={
          <Button variant="primary" iconLeft={<Briefcase className="w-4 h-4" />}>
            New Vacancy
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard icon={<Briefcase className="w-5 h-5" />} label="Total Vacancies" value={stats.totalVacancies} change={12} trend={[4, 6, 5, 8, 7, 6, 8]} onClick={() => openDetail("Total Vacancies", "total_vacancies")} />
        <KPICard icon={<Target className="w-5 h-5 text-green-600" />} label="Open Positions" value={stats.openPositions} change={8} trend={[3, 4, 3, 5, 4, 3, 5]} className="[&>div:first-child]:bg-green-50 [&>div:first-child]:text-green-600" onClick={() => openDetail("Open Positions", "open_positions")} />
        <KPICard icon={<FileText className="w-5 h-5 text-orange-600" />} label="Applications Today" value={stats.applicationsToday} change={0} trend={[2, 0, 3, 1, 0, 2, 1]} className="[&>div:first-child]:bg-orange-50 [&>div:first-child]:text-orange-600" onClick={() => openDetail("Applications Today", "applications_today")} />
        <KPICard icon={<TrendingUp className="w-5 h-5 text-purple-600" />} label="Applications This Month" value={stats.applicationsThisMonth} change={23} trend={[8, 10, 7, 12, 9, 11, 12]} className="[&>div:first-child]:bg-purple-50 [&>div:first-child]:text-purple-600" onClick={() => openDetail("Applications This Month", "applications_month")} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard icon={<Clock className="w-5 h-5 text-yellow-600" />} label="Pending Review" value={stats.pendingReview} change={-5} trend={[5, 4, 6, 3, 4, 3, 3]} className="[&>div:first-child]:bg-yellow-50 [&>div:first-child]:text-yellow-600" onClick={() => openDetail("Pending Review", "pending_review")} />
        <KPICard icon={<Calendar className="w-5 h-5 text-indigo-600" />} label="Interview Scheduled" value={stats.interviewScheduled} change={15} trend={[1, 2, 1, 2, 1, 2, 1]} className="[&>div:first-child]:bg-indigo-50 [&>div:first-child]:text-indigo-600" onClick={() => openDetail("Interview Scheduled", "interview_scheduled")} />
        <KPICard icon={<CheckCircle className="w-5 h-5 text-emerald-600" />} label="Selected" value={stats.selected} change={50} trend={[0, 1, 0, 0, 1, 0, 1]} className="[&>div:first-child]:bg-emerald-50 [&>div:first-child]:text-emerald-600" onClick={() => openDetail("Selected", "selected")} />
        <KPICard icon={<XCircle className="w-5 h-5 text-red-600" />} label="Rejected" value={stats.rejected} change={-10} trend={[2, 1, 3, 1, 0, 1, 1]} className="[&>div:first-child]:bg-red-50 [&>div:first-child]:text-red-600" onClick={() => openDetail("Rejected", "rejected")} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader><h3 className="text-base font-semibold text-text-primary">Hiring Funnel</h3></CardHeader>
          <CardBody>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis type="category" dataKey="stage" width={100} tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "13px" }} />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={28}>
                    {funnelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader><h3 className="text-base font-semibold text-text-primary">Applications by Department</h3></CardHeader>
          <CardBody>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={deptData} cx="50%" cy="50%" innerRadius={55} outerRadius={95} paddingAngle={3} dataKey="vacancies" nameKey="name">
                    {deptData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "13px" }} />
                  <Legend wrapperStyle={{ fontSize: "12px" }} iconType="circle" iconSize={8} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <h3 className="text-base font-semibold text-text-primary">Recent Applicants</h3>
            <Button variant="ghost" size="sm">View All</Button>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-gray-50/50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Candidate</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Position</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentApplicants.map((c) => (
                  <tr key={c.id} className="border-b border-border/50 hover:bg-gray-50/50 transition-colors cursor-pointer">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={c.fullName} size="sm" />
                        <div>
                          <p className="font-medium text-text-primary">{c.fullName}</p>
                          <p className="text-xs text-text-secondary">{c.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-text-secondary">{c.job?.title}</td>
                    <td className="px-4 py-3 text-text-secondary whitespace-nowrap">{formatDate(c.applicationDate)}</td>
                    <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <h3 className="text-base font-semibold text-text-primary">Upcoming Interviews</h3>
            <Button variant="ghost" size="sm">View All</Button>
          </CardHeader>
          <CardBody className="p-0">
            <div className="divide-y divide-border">
              {upcomingInterviews.length === 0 ? (
                <div className="p-8 text-center text-text-secondary text-sm">No upcoming interviews</div>
              ) : (
                upcomingInterviews.map((iv) => (
                  <div key={iv.id} className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50/50 transition-colors cursor-pointer">
                    <Avatar name={iv.candidate?.fullName || ""} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-text-primary truncate">{iv.candidate?.fullName}</p>
                      <p className="text-xs text-text-secondary truncate">{iv.job?.title}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-medium text-text-primary whitespace-nowrap">{formatDate(iv.date)}</p>
                      <p className="text-xs text-text-secondary">{iv.time}</p>
                    </div>
                    <Badge variant={iv.type === "video" ? "info" : iv.type === "offline" ? "success" : iv.type === "phone" ? "warning" : "primary"}>
                      {iv.type}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardBody>
        </Card>
      </div>

      <Modal open={detailModal.open} onClose={() => setDetailModal({ ...detailModal, open: false })} size="lg">
        <ModalHeader onClose={() => setDetailModal({ ...detailModal, open: false })}>
          {detailModal.title}
        </ModalHeader>
        <ModalBody>
          {detailLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : detailData.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-text-secondary">No records found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-text-secondary uppercase">Candidate</th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-text-secondary uppercase">Application</th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-text-secondary uppercase">Position</th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-text-secondary uppercase">Date</th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-text-secondary uppercase">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {detailData.map((c, i) => (
                    <tr key={i} className="border-b border-border/50 hover:bg-gray-50/50 transition-colors cursor-pointer" onClick={() => window.location.href = `/candidates/${c.id || ""}`}>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={c.fullName} size="sm" />
                          <div>
                            <p className="font-medium text-text-primary">{c.fullName}</p>
                            <p className="text-xs text-text-muted">{c.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-text-secondary text-xs">{c.applicationNumber}</td>
                      <td className="px-3 py-2.5">
                        <p className="text-text-primary">{c.job?.title}</p>
                        <p className="text-xs text-text-muted">{c.job?.department?.name}</p>
                      </td>
                      <td className="px-3 py-2.5 text-text-secondary text-xs whitespace-nowrap">{formatDate(c.applicationDate)}</td>
                      <td className="px-3 py-2.5"><StatusBadge status={c.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </ModalBody>
      </Modal>
    </div>
  );
}
