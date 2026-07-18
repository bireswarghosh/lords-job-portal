"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Phone, MessageCircle, Mail, Download, Calendar, Star, MapPin, Building2, Send, Pin, Eye, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { PageHeader } from "@/components/ui/PageHeader";
import { getCandidateById, addRemark, addCommunication, updateCandidateScore } from "@/app/actions/candidates";
import { getCurrentTenantId } from "@/lib/get-tenant";
import { formatDate, formatDateTime, getScoreColor, getScoreBgColor, timeAgo } from "@/lib/utils";
import { CANDIDATE_STATUS_LABELS } from "@/lib/constants";

type CandidateData = {
  id: string; applicationNumber: string; fullName: string; gender: string; dob?: string;
  email: string; mobile: string; whatsapp: string; whatsappVerified: boolean; emailVerified: boolean;
  address?: string; city?: string; state?: string; pin?: string;
  qualification?: string; experience?: string; currentEmployer?: string;
  currentSalary: number; expectedSalary: number; noticePeriod?: string;
  languages: string[]; skills: string[]; linkedIn?: string; coverLetter?: string;
  status: string; applicationDate: string; tags: string[];
  job: { id: string; title: string; department?: { name: string }; branch?: { name: string; city: string } };
  score: { communication: number; technicalSkill: number; experience: number; qualification: number; personality: number; hospitalCultureFit: number; computerKnowledge: number; leadership: number; confidence: number; overall: number } | null;
  assignedHR?: { id: string; name: string } | null;
  remarks: { id: string; type: string; content: string; isPinned: boolean; colorLabel?: string; createdAt: string; user: { name: string } }[];
  communications: { id: string; type: string; direction: string; content: string; status?: string; createdAt: string; user?: { name: string } }[];
  statusHistory: { id: string; fromStatus: string | null; toStatus: string; remarks?: string; createdAt: string; user: { name: string } }[];
  interviews: { id: string; type: string; date: string; time: string; location?: string; meetLink?: string; panelMembers: string[]; notes?: string; status: string; rating?: number; feedback?: string }[];
};

const TAB_LIST = [
  { id: "overview", label: "Overview" },
  { id: "timeline", label: "Timeline" },
  { id: "remarks", label: "Remarks" },
  { id: "score", label: "Score" },
  { id: "communications", label: "Communications" },
  { id: "interviews", label: "Interviews" },
  { id: "documents", label: "Documents" },
];

const SCORE_PARAMS = [
  { key: "communication", label: "Communication" }, { key: "technicalSkill", label: "Technical Skill" },
  { key: "experience", label: "Experience" }, { key: "qualification", label: "Qualification" },
  { key: "personality", label: "Personality" }, { key: "hospitalCultureFit", label: "Culture Fit" },
  { key: "computerKnowledge", label: "Computer Knowledge" }, { key: "leadership", label: "Leadership" },
  { key: "confidence", label: "Confidence" },
];

export default function CandidateProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [candidate, setCandidate] = useState<CandidateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [remarkType, setRemarkType] = useState("overall");
  const [remarkContent, setRemarkContent] = useState("");
  const [commType, setCommType] = useState("whatsapp");
  const [commContent, setCommContent] = useState("");
  const [scoreEditing, setScoreEditing] = useState(false);
  const [scoreForm, setScoreForm] = useState<Record<string, number>>({});
  const [scoreSaving, setScoreSaving] = useState(false);
  const [pdfPreview, setPdfPreview] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await getCandidateById(id, getCurrentTenantId());
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (res.success && res.data) setCandidate(res.data as any);
      setLoading(false);
    }
    load();
  }, [id]);

  const handleAddRemark = async () => {
    if (!remarkContent.trim()) return;
    const res = await addRemark(id, "u1", remarkType, remarkContent, undefined, getCurrentTenantId());
    if (res.success && candidate) {
      const newRemark = { id: Date.now().toString(), type: remarkType, content: remarkContent, isPinned: false, createdAt: new Date().toISOString(), user: { name: "Dr. Priya Sharma" } };
      setCandidate({ ...candidate, remarks: [newRemark, ...candidate.remarks] });
      setRemarkContent("");
    }
  };

  const handleAddComm = async () => {
    if (!commContent.trim()) return;
    const res = await addCommunication(id, commType, "outbound", commContent, "u1", getCurrentTenantId());
    if (res.success && candidate) {
      const newComm = { id: Date.now().toString(), type: commType, direction: "outbound", content: commContent, createdAt: new Date().toISOString(), user: { name: "Dr. Priya Sharma" } };
      setCandidate({ ...candidate, communications: [newComm, ...candidate.communications] });
      setCommContent("");
    }
  };

  const startScoreEdit = () => {
    if (!score) return;
    setScoreForm({
      communication: score.communication || 0,
      technicalSkill: score.technicalSkill || 0,
      experience: score.experience || 0,
      qualification: score.qualification || 0,
      personality: score.personality || 0,
      hospitalCultureFit: score.hospitalCultureFit || 0,
      computerKnowledge: score.computerKnowledge || 0,
      leadership: score.leadership || 0,
      confidence: score.confidence || 0,
    });
    setScoreEditing(true);
  };

  const handleSaveScore = async () => {
    setScoreSaving(true);
    const res = await updateCandidateScore(id, scoreForm, getCurrentTenantId());
    if (res.success && candidate) {
      const values = Object.values(scoreForm);
      const overall = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
      setCandidate({ ...candidate, score: { ...candidate.score, ...scoreForm, overall } as CandidateData["score"] });
      setScoreEditing(false);
    }
    setScoreSaving(false);
  };

  const generateResumePDF = () => {
    if (!candidate) return;
    const content = [
      "CANDIDATE RESUME",
      "═".repeat(50),
      "",
      `Name: ${candidate.fullName}`,
      `Application: ${candidate.applicationNumber}`,
      `Email: ${candidate.email}`,
      `Mobile: ${candidate.mobile}`,
      `WhatsApp: ${candidate.whatsapp}`,
      `Gender: ${candidate.gender}`,
      candidate.dob ? `DOB: ${candidate.dob}` : "",
      "",
      "PROFESSIONAL DETAILS",
      "─".repeat(30),
      `Position Applied: ${candidate.job?.title}`,
      `Department: ${candidate.job?.department?.name}`,
      `Qualification: ${candidate.qualification || "N/A"}`,
      `Experience: ${candidate.experience || "N/A"}`,
      `Current Employer: ${candidate.currentEmployer || "N/A"}`,
      `Current Salary: ₹${(candidate.currentSalary || 0).toLocaleString()}`,
      `Expected Salary: ₹${(candidate.expectedSalary || 0).toLocaleString()}`,
      `Notice Period: ${candidate.noticePeriod || "N/A"}`,
      "",
      "SKILLS & LANGUAGES",
      "─".repeat(30),
      `Skills: ${candidate.skills.join(", ") || "N/A"}`,
      `Languages: ${candidate.languages.join(", ") || "N/A"}`,
      "",
      candidate.coverLetter ? `COVER LETTER\n${"─".repeat(30)}\n${candidate.coverLetter}` : "",
      "",
      `Generated on ${new Date().toLocaleDateString("en-IN")}`,
    ].filter(Boolean).join("\n");

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${candidate.fullName.replace(/\s/g, "_")}_Resume.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div className="p-8"><div className="h-96 bg-surface rounded-xl animate-pulse card-shadow" /></div>;
  if (!candidate) return <div className="p-8 text-center"><p className="text-text-secondary text-lg">Candidate not found</p><Button variant="primary" onClick={() => router.back()} className="mt-4">Go Back</Button></div>;

  const score = candidate.score;
  const inputClass = "w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15";

  return (
    <div>
      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary mb-4 transition-colors cursor-pointer">
        <ArrowLeft className="w-4 h-4" /> Back to Candidates
      </button>

      <div className="bg-surface rounded-xl border border-border p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <Avatar name={candidate.fullName} size="xl" />
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-text-primary">{candidate.fullName}</h1>
              <StatusBadge status={candidate.status} />
              {score && <span className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-bold ${getScoreBgColor(score.overall)} ${getScoreColor(score.overall)}`}>{score.overall.toFixed(1)}</span>}
            </div>
            <p className="text-text-secondary mt-1">{candidate.applicationNumber} &middot; {candidate.job?.title}</p>
            <div className="flex items-center gap-4 mt-2 text-sm text-text-secondary">
              <span>{candidate.job?.department?.name}</span>
              <span>&middot;</span>
              <span>Applied {formatDate(candidate.applicationDate)}</span>
              {candidate.whatsappVerified && <Badge variant="success" dot>WhatsApp Verified</Badge>}
              {candidate.emailVerified && <Badge variant="primary" dot>Email Verified</Badge>}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border">
          <a href={`tel:${candidate.mobile}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-border rounded-lg text-text-secondary hover:bg-background hover:text-text-primary transition-colors">
            <Phone className="w-3.5 h-3.5" /> Call
          </a>
          <a href={`https://wa.me/${candidate.whatsapp.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-border rounded-lg text-text-secondary hover:bg-background hover:text-text-primary transition-colors">
            <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
          </a>
          <a href={`mailto:${candidate.email}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-border rounded-lg text-text-secondary hover:bg-background hover:text-text-primary transition-colors">
            <Mail className="w-3.5 h-3.5" /> Email
          </a>
          <button
            onClick={generateResumePDF}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-border rounded-lg text-text-secondary hover:bg-background hover:text-text-primary transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Resume
          </button>
          <button
            onClick={() => router.push(`/interviews`)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-border rounded-lg text-text-secondary hover:bg-background hover:text-text-primary transition-colors cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5" /> Schedule Interview
          </button>
        </div>
      </div>

      <div className="flex border-b border-border mb-6 overflow-x-auto">
        {TAB_LIST.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${activeTab === tab.id ? "border-primary text-primary" : "border-transparent text-text-secondary hover:text-text-primary"}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><h3 className="font-semibold text-text-primary">Personal Information</h3></CardHeader>
            <CardBody>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {[
                  ["Full Name", candidate.fullName], ["Email", candidate.email], ["Mobile", candidate.mobile],
                  ["WhatsApp", candidate.whatsapp], ["Gender", candidate.gender], ["DOB", candidate.dob || "-"],
                  ["Address", [candidate.address, candidate.city, candidate.state, candidate.pin].filter(Boolean).join(", ") || "-"],
                ].map(([label, value]) => (
                  <div key={label}><p className="text-text-secondary mb-0.5">{label}</p><p className="font-medium text-text-primary">{value}</p></div>
                ))}
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardHeader><h3 className="font-semibold text-text-primary">Professional Details</h3></CardHeader>
            <CardBody>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {[
                  ["Qualification", candidate.qualification || "-"], ["Experience", candidate.experience || "-"],
                  ["Current Employer", candidate.currentEmployer || "-"], ["Current Salary", `₹${(candidate.currentSalary || 0).toLocaleString()}`],
                  ["Expected Salary", `₹${(candidate.expectedSalary || 0).toLocaleString()}`], ["Notice Period", candidate.noticePeriod || "-"],
                  ["Assigned HR", candidate.assignedHR?.name || "Unassigned"],
                ].map(([label, value]) => (
                  <div key={label}><p className="text-text-secondary mb-0.5">{label}</p><p className="font-medium text-text-primary">{value}</p></div>
                ))}
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardHeader><h3 className="font-semibold text-text-primary">Skills & Languages</h3></CardHeader>
            <CardBody>
              <div className="mb-4"><p className="text-sm text-text-secondary mb-2">Skills</p><div className="flex flex-wrap gap-2">{candidate.skills.map((s) => <Badge key={s} variant="primary">{s}</Badge>)}</div></div>
              <div><p className="text-sm text-text-secondary mb-2">Languages</p><div className="flex flex-wrap gap-2">{candidate.languages.map((l) => <Badge key={l} variant="outline">{l}</Badge>)}</div></div>
            </CardBody>
          </Card>
          <Card>
            <CardHeader><h3 className="font-semibold text-text-primary">Job Details</h3></CardHeader>
            <CardBody>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-text-secondary mb-0.5">Position</p><p className="font-medium text-text-primary">{candidate.job?.title}</p></div>
                <div><p className="text-text-secondary mb-0.5">Department</p><p className="font-medium text-text-primary">{candidate.job?.department?.name}</p></div>
                <div><p className="text-text-secondary mb-0.5">Branch</p><p className="font-medium text-text-primary">{candidate.job?.branch?.name}</p></div>
                <div><p className="text-text-secondary mb-0.5">City</p><p className="font-medium text-text-primary">{candidate.job?.branch?.city}</p></div>
              </div>
              {candidate.tags.length > 0 && <div className="mt-4"><p className="text-sm text-text-secondary mb-2">Tags</p><div className="flex flex-wrap gap-2">{candidate.tags.map((t) => <Badge key={t} variant="default">{t}</Badge>)}</div></div>}
            </CardBody>
          </Card>
        </div>
      )}

      {activeTab === "timeline" && (
        <Card>
          <CardHeader><h3 className="font-semibold text-text-primary">Status Timeline</h3></CardHeader>
          <CardBody>
            <div className="space-y-4">
              {candidate.statusHistory.map((sh) => (
                <div key={sh.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full bg-primary mt-1" />
                    <div className="w-px flex-1 bg-border" />
                  </div>
                  <div className="pb-6">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={sh.toStatus} />
                      <span className="text-xs text-text-muted">{timeAgo(sh.createdAt)}</span>
                    </div>
                    {sh.remarks && <p className="text-sm text-text-secondary mt-1">{sh.remarks}</p>}
                    <p className="text-xs text-text-muted mt-1">by {sh.user?.name} &middot; {formatDateTime(sh.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {activeTab === "remarks" && (
        <div className="space-y-6">
          <Card>
            <CardHeader><h3 className="font-semibold text-text-primary">Add Remark</h3></CardHeader>
            <CardBody>
              <div className="flex gap-3 mb-3">
                <select value={remarkType} onChange={(e) => setRemarkType(e.target.value)} className={inputClass + " w-48"}>
                  {["overall", "technical", "communication", "behavior", "medical", "salary", "availability", "reference", "documents"].map((t) => <option key={t} value={t}>{t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</option>)}
                </select>
              </div>
              <textarea value={remarkContent} onChange={(e) => setRemarkContent(e.target.value)} rows={3} placeholder="Write your remark..." className={inputClass + " resize-none"} />
              <Button variant="primary" size="sm" className="mt-3" onClick={handleAddRemark}>Add Remark</Button>
            </CardBody>
          </Card>
          {candidate.remarks.map((r) => (
            <Card key={r.id}>
              <CardBody>
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={r.isPinned ? "primary" : "outline"}>{r.type}</Badge>
                      {r.isPinned && <Pin className="w-3 h-3 text-primary" />}
                      <span className="text-sm font-medium text-text-primary">{r.user?.name}</span>
                      <span className="text-xs text-text-muted">{timeAgo(r.createdAt)}</span>
                    </div>
                    <p className="text-sm text-text-primary">{r.content}</p>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {activeTab === "score" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-text-primary">Candidate Score</h3>
              {!scoreEditing && (
                <Button variant="primary" size="sm" onClick={startScoreEdit}>
                  {score ? "Edit Score" : "Add Score"}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardBody>
            {scoreEditing ? (
              <div className="space-y-4 max-w-xl mx-auto">
                {SCORE_PARAMS.map((p) => (
                  <div key={p.key}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-text-primary">{p.label}</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={0}
                          max={10}
                          value={scoreForm[p.key] || 0}
                          onChange={(e) => {
                            const val = Math.min(10, Math.max(0, parseInt(e.target.value) || 0));
                            setScoreForm({ ...scoreForm, [p.key]: val });
                          }}
                          className="w-20 px-2 py-1 text-sm text-center bg-surface border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                        />
                        <span className="text-xs text-text-muted">/10</span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={10}
                      step={1}
                      value={scoreForm[p.key] || 0}
                      onChange={(e) => setScoreForm({ ...scoreForm, [p.key]: parseInt(e.target.value) })}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                  </div>
                ))}
                <div className="flex items-center justify-center pt-4 border-t border-border">
                  <span className="text-sm text-text-secondary mr-4">Overall: </span>
                  <span className={`text-lg font-bold ${getScoreColor(Object.values(scoreForm).reduce((a, b) => a + b, 0) / 9)}`}>
                    {(Object.values(scoreForm).reduce((a, b) => a + b, 0) / 9).toFixed(1)}
                  </span>
                </div>
                <div className="flex justify-center gap-3 pt-2">
                  <Button variant="outline" onClick={() => setScoreEditing(false)}>Cancel</Button>
                  <Button variant="primary" onClick={handleSaveScore} disabled={scoreSaving}>
                    {scoreSaving ? "Saving..." : "Save Score"}
                  </Button>
                </div>
              </div>
            ) : score ? (
              <div>
                <div className="text-center mb-6">
                  <span className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl text-2xl font-bold ${getScoreBgColor(score.overall)} ${getScoreColor(score.overall)}`}>{score.overall.toFixed(1)}</span>
                  <p className="text-sm text-text-secondary mt-2">Overall Score</p>
                </div>
                <div className="space-y-4 max-w-xl mx-auto">
                  {SCORE_PARAMS.map((p) => {
                    const val = score[p.key as keyof typeof score] as number;
                    return (
                      <div key={p.key}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-text-primary">{p.label}</span>
                          <span className={`text-sm font-semibold ${getScoreColor(val)}`}>{val}/10</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div className={`h-2.5 rounded-full ${val >= 8 ? "bg-green-500" : val >= 6 ? "bg-blue-500" : val >= 4 ? "bg-yellow-500" : "bg-red-500"}`} style={{ width: `${val * 10}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-text-secondary mb-4">No score assigned yet</p>
                <Button variant="primary" onClick={startScoreEdit}>Add Score</Button>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {activeTab === "communications" && (
        <div className="space-y-6">
          <Card>
            <CardHeader><h3 className="font-semibold text-text-primary">Send Message</h3></CardHeader>
            <CardBody>
              <div className="flex gap-3 mb-3">
                <select value={commType} onChange={(e) => setCommType(e.target.value)} className={inputClass + " w-40"}>
                  <option value="whatsapp">WhatsApp</option><option value="email">Email</option><option value="sms">SMS</option>
                </select>
              </div>
              <div className="flex gap-2">
                <textarea value={commContent} onChange={(e) => setCommContent(e.target.value)} rows={2} placeholder="Type your message..." className={inputClass + " resize-none flex-1"} />
                <Button variant="primary" onClick={handleAddComm} iconLeft={<Send className="w-4 h-4" />}>Send</Button>
              </div>
            </CardBody>
          </Card>
          {candidate.communications.map((c) => (
            <div key={c.id} className={`flex ${c.direction === "outbound" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-lg p-4 rounded-xl ${c.direction === "outbound" ? "bg-primary text-white" : "bg-gray-100 text-text-primary"}`}>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant={c.type === "whatsapp" ? "success" : c.type === "email" ? "primary" : "outline"} className={c.direction === "outbound" ? "bg-white/20 text-white border-white/30" : ""}>{c.type}</Badge>
                  <span className="text-xs opacity-70">{timeAgo(c.createdAt)}</span>
                </div>
                <p className="text-sm">{c.content}</p>
                {c.status && <p className="text-xs opacity-60 mt-1">{c.status}</p>}
              </div>
            </div>
          ))}
          {candidate.communications.length === 0 && <p className="text-center text-text-secondary py-8">No communications yet</p>}
        </div>
      )}

      {activeTab === "interviews" && (
        <div className="space-y-6">
          {candidate.interviews.map((iv) => (
            <Card key={iv.id}>
              <CardBody>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={iv.type === "video" ? "info" : iv.type === "offline" ? "success" : "primary"}>{iv.type}</Badge>
                      <StatusBadge status={iv.status === "scheduled" ? "interview_scheduled" : iv.status === "completed" ? "interview_completed" : "cancelled"} />
                    </div>
                    <p className="font-medium text-text-primary">{formatDate(iv.date)} at {iv.time}</p>
                    {iv.location && <p className="text-sm text-text-secondary mt-1 flex items-center gap-1"><MapPin className="w-3 h-3" />{iv.location}</p>}
                    {iv.meetLink && <p className="text-sm text-primary mt-1">{iv.meetLink}</p>}
                    <p className="text-sm text-text-secondary mt-1">Panel: {iv.panelMembers.join(", ")}</p>
                    {iv.notes && <p className="text-sm text-text-muted mt-1">{iv.notes}</p>}
                    {iv.rating && <div className="mt-2 flex items-center gap-1">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`w-4 h-4 ${i < (iv.rating || 0) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`} />)}</div>}
                    {iv.feedback && <p className="text-sm text-text-secondary mt-1 italic">&quot;{iv.feedback}&quot;</p>}
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
          {candidate.interviews.length === 0 && <Card><CardBody><p className="text-center text-text-secondary py-8">No interviews scheduled</p></CardBody></Card>}
        </div>
      )}

      {activeTab === "documents" && (
        <>
          <Card>
            <CardHeader><h3 className="font-semibold text-text-primary">Documents</h3></CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <p className="font-medium text-text-primary">Resume / CV</p>
                      <p className="text-sm text-text-secondary">{candidate.fullName.replace(/\s/g, "_")}_Resume.pdf</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={generateResumePDF} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-border rounded-lg text-text-secondary hover:bg-background hover:text-text-primary transition-colors cursor-pointer">
                      <Download className="w-3.5 h-3.5" /> Download
                    </button>
                    <button onClick={() => setPdfPreview(true)} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-border rounded-lg text-text-secondary hover:bg-background hover:text-text-primary transition-colors cursor-pointer">
                      <Eye className="w-3.5 h-3.5" /> Preview
                    </button>
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="font-medium text-text-primary mb-2">Certificates</p>
                  <p className="text-sm text-text-secondary">No certificates uploaded</p>
                </div>
                {candidate.coverLetter && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="font-medium text-text-primary mb-2">Cover Letter</p>
                    <p className="text-sm text-text-secondary whitespace-pre-wrap">{candidate.coverLetter}</p>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>

          {pdfPreview && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setPdfPreview(false)}>
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-red-600" />
                    <h3 className="font-semibold text-text-primary">{candidate.fullName} - Resume</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={generateResumePDF} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-border rounded-lg text-text-secondary hover:bg-background transition-colors cursor-pointer">
                      <Download className="w-3.5 h-3.5" /> Download
                    </button>
                    <button onClick={() => setPdfPreview(false)} className="p-2 rounded-lg text-text-secondary hover:bg-background transition-colors cursor-pointer">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-auto p-8">
                  <div className="max-w-2xl mx-auto bg-white">
                    <div className="text-center border-b-2 border-gray-800 pb-4 mb-6">
                      <h1 className="text-2xl font-bold text-gray-900">{candidate.fullName}</h1>
                      <p className="text-gray-600 mt-1">{candidate.email} | {candidate.mobile}</p>
                      {candidate.address && <p className="text-gray-500 text-sm">{[candidate.address, candidate.city, candidate.state, candidate.pin].filter(Boolean).join(", ")}</p>}
                    </div>

                    <div className="mb-6">
                      <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider border-b border-gray-300 pb-1 mb-3">Professional Summary</h2>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div><span className="text-gray-500">Position:</span> <span className="text-gray-800 font-medium">{candidate.job?.title}</span></div>
                        <div><span className="text-gray-500">Department:</span> <span className="text-gray-800 font-medium">{candidate.job?.department?.name}</span></div>
                        <div><span className="text-gray-500">Qualification:</span> <span className="text-gray-800 font-medium">{candidate.qualification || "N/A"}</span></div>
                        <div><span className="text-gray-500">Experience:</span> <span className="text-gray-800 font-medium">{candidate.experience || "N/A"}</span></div>
                        <div><span className="text-gray-500">Current Employer:</span> <span className="text-gray-800 font-medium">{candidate.currentEmployer || "N/A"}</span></div>
                        <div><span className="text-gray-500">Notice Period:</span> <span className="text-gray-800 font-medium">{candidate.noticePeriod || "N/A"}</span></div>
                      </div>
                    </div>

                    <div className="mb-6">
                      <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider border-b border-gray-300 pb-1 mb-3">Skills</h2>
                      <div className="flex flex-wrap gap-2">
                        {candidate.skills.map((s) => <span key={s} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">{s}</span>)}
                      </div>
                    </div>

                    <div className="mb-6">
                      <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider border-b border-gray-300 pb-1 mb-3">Languages</h2>
                      <p className="text-sm text-gray-700">{candidate.languages.join(", ")}</p>
                    </div>

                    {candidate.coverLetter && (
                      <div className="mb-6">
                        <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider border-b border-gray-300 pb-1 mb-3">Cover Letter</h2>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{candidate.coverLetter}</p>
                      </div>
                    )}

                    <div className="text-xs text-gray-400 text-center mt-8 pt-4 border-t border-gray-200">
                      Application: {candidate.applicationNumber} | Generated: {new Date().toLocaleDateString("en-IN")}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
