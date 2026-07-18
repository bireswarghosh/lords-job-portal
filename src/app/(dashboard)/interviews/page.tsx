"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Calendar,
  Clock,
  Video,
  Phone,
  MapPin,
  Users,
  Plus,
  MoreHorizontal,
  X,
  FileText,
  ExternalLink,
  Filter,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Tabs, TabPanel } from "@/components/ui/Tabs";
import { SearchInput } from "@/components/ui/SearchInput";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Dropdown } from "@/components/ui/Dropdown";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "@/components/ui/Modal";
import { getInterviews, scheduleInterview, cancelInterview } from "@/app/actions/interviews";
import { getCandidates } from "@/app/actions/candidates";
import { getCurrentTenantId } from "@/lib/get-tenant";
import { INTERVIEW_TYPE_LABELS } from "@/lib/constants";
import { formatDate, cn } from "@/lib/utils";

type Interview = {
  id: string;
  candidateId: string;
  jobId: string | null;
  type: string;
  date: string;
  time: string;
  location: string | null;
  meetLink: string | null;
  zoomLink: string | null;
  panelMembers: string[];
  notes: string | null;
  status: string;
  rating: number | null;
  feedback: string | null;
  candidate: {
    id: string;
    fullName: string;
    job: { title: string } | null;
  };
};

type Candidate = { id: string; fullName: string; job: { title: string } | null };

const TYPE_ICONS: Record<string, React.ReactNode> = {
  video: <Video className="w-4 h-4" />,
  online: <Video className="w-4 h-4" />,
  offline: <MapPin className="w-4 h-4" />,
  phone: <Phone className="w-4 h-4" />,
};

const TYPE_VARIANTS: Record<string, "primary" | "info" | "warning" | "success"> = {
  video: "primary",
  online: "info",
  offline: "warning",
  phone: "success",
};

export default function InterviewsPage() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("upcoming");
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    candidateId: "",
    jobId: "",
    type: "online",
    date: "",
    time: "",
    location: "",
    meetLink: "",
    zoomLink: "",
    panelMembers: "",
    notes: "",
  });
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [notesInterview, setNotesInterview] = useState<Interview | null>(null);
  const [notesContent, setNotesContent] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [interviewsRes, candidatesRes] = await Promise.all([
      getInterviews(undefined, getCurrentTenantId()),
      getCandidates(undefined, getCurrentTenantId()),
    ]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (interviewsRes.success) setInterviews(interviewsRes.data as any);
    else setError(interviewsRes.error || "Failed to load interviews");
    if (candidatesRes.success) {
      const cands = (candidatesRes.data as Candidate[]).map((c) => ({
        id: c.id,
        fullName: c.fullName,
        job: c.job,
      }));
      setCandidates(cands);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const upcoming = interviews.filter((i) => i.status === "scheduled");
  const completed = interviews.filter((i) => i.status === "completed");
  const allFiltered = interviews;

  const filterList = (list: Interview[]) => {
    return list.filter((iv) => {
      if (search && !iv.candidate.fullName.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterType !== "all" && iv.type !== filterType) return false;
      return true;
    });
  };

  const filteredUpcoming = filterList(upcoming);
  const filteredCompleted = filterList(completed);
  const filteredAll = filterList(allFiltered);

  const handleSchedule = async () => {
    if (!scheduleForm.candidateId || !scheduleForm.date || !scheduleForm.time) return;
    setScheduling(true);
    const selectedCandidate = candidates.find((c) => c.id === scheduleForm.candidateId);
    const res = await scheduleInterview({
      candidateId: scheduleForm.candidateId,
      jobId: scheduleForm.jobId || selectedCandidate?.job?.title ? undefined : undefined,
      type: scheduleForm.type,
      date: scheduleForm.date,
      time: scheduleForm.time,
      location: scheduleForm.location || undefined,
      meetLink: scheduleForm.meetLink || undefined,
      zoomLink: scheduleForm.zoomLink || undefined,
      panelMembers: scheduleForm.panelMembers ? scheduleForm.panelMembers.split(",").map((s) => s.trim()) : [],
      notes: scheduleForm.notes || undefined,
    }, getCurrentTenantId());
    setScheduling(false);
    if (res.success) {
      setShowScheduleModal(false);
      setScheduleForm({ candidateId: "", jobId: "", type: "online", date: "", time: "", location: "", meetLink: "", zoomLink: "", panelMembers: "", notes: "" });
      fetchData();
    }
  };

  const handleCancel = async (id: string) => {
    await cancelInterview(id, getCurrentTenantId());
    fetchData();
  };

  const renderInterviewCard = (iv: Interview) => {
    const dropdownItems = [
      ...(iv.status === "scheduled"
        ? [{ kind: "item" as const, id: "cancel", label: "Cancel Interview", icon: <X className="w-4 h-4" />, danger: true }]
        : []),
      { kind: "item" as const, id: "notes", label: "Add Notes", icon: <FileText className="w-4 h-4" /> },
    ];

    return (
      <Card key={iv.id} className="hover:shadow-md transition-shadow">
        <CardBody className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-text-primary truncate">{iv.candidate.fullName}</h3>
                <StatusBadge status={iv.status} />
              </div>
              <p className="text-sm text-text-secondary mb-3">{iv.candidate.job?.title ?? "—"}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2 text-text-secondary">
                  <Calendar className="w-4 h-4 shrink-0" />
                  <span>{formatDate(iv.date)}</span>
                </div>
                <div className="flex items-center gap-2 text-text-secondary">
                  <Clock className="w-4 h-4 shrink-0" />
                  <span>{iv.time}</span>
                </div>
                <div className="flex items-center gap-2 text-text-secondary">
                  {TYPE_ICONS[iv.type] || <Video className="w-4 h-4" />}
                  <Badge variant={TYPE_VARIANTS[iv.type] || "info"}>
                    {INTERVIEW_TYPE_LABELS[iv.type] || iv.type}
                  </Badge>
                </div>
                {iv.panelMembers.length > 0 && (
                  <div className="flex items-center gap-2 text-text-secondary">
                    <Users className="w-4 h-4 shrink-0" />
                    <span className="truncate">{iv.panelMembers.join(", ")}</span>
                  </div>
                )}
              </div>

              {(iv.location || iv.meetLink || iv.zoomLink) && (
                <div className="mt-3 flex items-center gap-2 text-sm">
                  {iv.location && (
                    <div className="flex items-center gap-1.5 text-text-secondary">
                      <MapPin className="w-4 h-4 shrink-0" />
                      <span>{iv.location}</span>
                    </div>
                  )}
                  {(iv.meetLink || iv.zoomLink) && (
                    <a
                      href={iv.meetLink || iv.zoomLink || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-primary hover:text-primary-dark transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Join Meeting</span>
                    </a>
                  )}
                </div>
              )}

              {iv.rating != null && (
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-sm text-text-secondary">Rating:</span>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 10 }, (_, i) => (
                      <div
                        key={i}
                        className={cn(
                          "w-2 h-2 rounded-full",
                          i < iv.rating! ? "bg-primary" : "bg-gray-200"
                        )}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium text-text-primary">{iv.rating}/10</span>
                </div>
              )}

              {iv.feedback && (
                <p className="mt-2 text-sm text-text-secondary italic">&quot;{iv.feedback}&quot;</p>
              )}
            </div>

            <Dropdown
              trigger={
                <Button variant="ghost" size="sm" className="shrink-0">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              }
              items={dropdownItems}
              onSelect={(id) => {
                if (id === "cancel") handleCancel(iv.id);
                if (id === "notes") { setNotesInterview(iv); setNotesContent(iv.notes || ""); setShowNotesModal(true); }
              }}
              align="right"
            />
          </div>
        </CardBody>
      </Card>
    );
  };

  const filterBar = (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
      <SearchInput
        placeholder="Search by candidate name..."
        onSearch={setSearch}
        className="w-full sm:w-72"
      />
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-text-muted" />
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-2 text-sm bg-surface border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary cursor-pointer"
        >
          <option value="all">All Types</option>
          <option value="video">Video</option>
          <option value="online">Online</option>
          <option value="offline">In-Person</option>
          <option value="phone">Phone</option>
        </select>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div>
        <PageHeader title="Interview Management" subtitle="Schedule and manage candidate interviews" />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageHeader title="Interview Management" subtitle="Schedule and manage candidate interviews" />
        <EmptyState
          icon={<Calendar className="w-8 h-8" />}
          title="Error loading interviews"
          description={error}
          action={<Button onClick={fetchData}>Retry</Button>}
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Interview Management"
        subtitle="Schedule and manage candidate interviews"
        actions={
          <Button iconLeft={<Plus className="w-4 h-4" />} onClick={() => setShowScheduleModal(true)}>
            Schedule Interview
          </Button>
        }
      />

      <Tabs
        tabs={[
          { id: "upcoming", label: "Upcoming", count: filteredUpcoming.length },
          { id: "completed", label: "Completed", count: filteredCompleted.length },
          { id: "all", label: "All", count: filteredAll.length },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {filterBar}

      <TabPanel tabId="upcoming" activeTab={activeTab}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUpcoming.length > 0 ? (
            filteredUpcoming.map(renderInterviewCard)
          ) : (
            <EmptyState
              icon={<Calendar className="w-8 h-8" />}
              title="No upcoming interviews"
              description="Schedule interviews to get started"
            />
          )}
        </div>
      </TabPanel>

      <TabPanel tabId="completed" activeTab={activeTab}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCompleted.length > 0 ? (
            filteredCompleted.map(renderInterviewCard)
          ) : (
            <EmptyState
              icon={<Calendar className="w-8 h-8" />}
              title="No completed interviews"
              description="Completed interviews will appear here"
            />
          )}
        </div>
      </TabPanel>

      <TabPanel tabId="all" activeTab={activeTab}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAll.length > 0 ? (
            filteredAll.map(renderInterviewCard)
          ) : (
            <EmptyState
              icon={<Calendar className="w-8 h-8" />}
              title="No interviews found"
              description="No interviews match your filters"
            />
          )}
        </div>
      </TabPanel>

      <Modal open={showScheduleModal} onClose={() => setShowScheduleModal(false)} size="lg">
        <ModalHeader onClose={() => setShowScheduleModal(false)}>Schedule Interview</ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Candidate *</label>
              <select
                value={scheduleForm.candidateId}
                onChange={(e) => {
                  const cid = e.target.value;
                  const cand = candidates.find((c) => c.id === cid);
                  setScheduleForm((f) => ({
                    ...f,
                    candidateId: cid,
                    jobId: cand?.job?.title ? "" : "",
                  }));
                }}
                className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg focus:outline-none focus:border-primary"
              >
                <option value="">Select candidate</option>
                {candidates.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName} — {c.job?.title ?? "N/A"}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Type *</label>
                <select
                  value={scheduleForm.type}
                  onChange={(e) => setScheduleForm((f) => ({ ...f, type: e.target.value }))}
                  className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg focus:outline-none focus:border-primary"
                >
                  <option value="online">Online</option>
                  <option value="video">Video</option>
                  <option value="offline">In-Person</option>
                  <option value="phone">Phone</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Date *</label>
                <input
                  type="date"
                  value={scheduleForm.date}
                  onChange={(e) => setScheduleForm((f) => ({ ...f, date: e.target.value }))}
                  className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg focus:outline-none focus:border-primary"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Time *</label>
                <input
                  type="time"
                  value={scheduleForm.time}
                  onChange={(e) => setScheduleForm((f) => ({ ...f, time: e.target.value }))}
                  className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Location</label>
                <input
                  type="text"
                  value={scheduleForm.location}
                  onChange={(e) => setScheduleForm((f) => ({ ...f, location: e.target.value }))}
                  className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg focus:outline-none focus:border-primary"
                  placeholder="Office / Room number"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Meet Link</label>
                <input
                  type="url"
                  value={scheduleForm.meetLink}
                  onChange={(e) => setScheduleForm((f) => ({ ...f, meetLink: e.target.value }))}
                  className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg focus:outline-none focus:border-primary"
                  placeholder="https://meet.google.com/..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Zoom Link</label>
                <input
                  type="url"
                  value={scheduleForm.zoomLink}
                  onChange={(e) => setScheduleForm((f) => ({ ...f, zoomLink: e.target.value }))}
                  className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg focus:outline-none focus:border-primary"
                  placeholder="https://zoom.us/j/..."
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Panel Members (comma separated)</label>
              <input
                type="text"
                value={scheduleForm.panelMembers}
                onChange={(e) => setScheduleForm((f) => ({ ...f, panelMembers: e.target.value }))}
                className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg focus:outline-none focus:border-primary"
                placeholder="Dr. Sharma, Dr. Patel"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Notes</label>
              <textarea
                value={scheduleForm.notes}
                onChange={(e) => setScheduleForm((f) => ({ ...f, notes: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg focus:outline-none focus:border-primary resize-none"
                placeholder="Any additional notes..."
              />
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={() => setShowScheduleModal(false)}>Cancel</Button>
          <Button loading={scheduling} onClick={handleSchedule}>Schedule Interview</Button>
        </ModalFooter>
      </Modal>

      {/* Add Notes Modal */}
      <Modal open={showNotesModal} onClose={() => setShowNotesModal(false)} size="md">
        <ModalHeader onClose={() => setShowNotesModal(false)}>
          Interview Notes — {notesInterview?.candidate.fullName}
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-sm text-text-secondary">
              <Calendar className="w-4 h-4" />
              <span>{notesInterview ? `${formatDate(notesInterview.date)} at ${notesInterview.time}` : ""}</span>
              <Badge variant="info">{notesInterview?.type}</Badge>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Notes</label>
              <textarea
                value={notesContent}
                onChange={(e) => setNotesContent(e.target.value)}
                rows={6}
                className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg focus:outline-none focus:border-primary resize-none"
                placeholder="Add interview notes, observations, feedback..."
              />
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={() => setShowNotesModal(false)}>Cancel</Button>
          <Button loading={savingNotes} onClick={async () => {
            if (!notesInterview) return;
            setSavingNotes(true);
            const { updateInterview } = await import("@/app/actions/interviews");
            await updateInterview(notesInterview.id, { notes: notesContent });
            setSavingNotes(false);
            setShowNotesModal(false);
            fetchData();
          }}>Save Notes</Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
