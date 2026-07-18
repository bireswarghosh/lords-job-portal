"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Mail, Send, CheckCircle, MousePointerClick, AlertCircle, Paperclip, Smile, ChevronDown, Inbox, Trash2, Star, Archive, MailOpen, Forward, Reply, Clock, ChevronRight,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { KPICard } from "@/components/ui/KPICard";
import { EmptyState } from "@/components/ui/EmptyState";
import { SearchInput } from "@/components/ui/SearchInput";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "@/components/ui/Modal";
import { getTemplates } from "@/app/actions/templates";
import { getEmailStats, getEmailCommunications } from "@/app/actions/email";
import { addCommunication } from "@/app/actions/candidates";
import { timeAgo, formatDateTime, cn } from "@/lib/utils";
import { getCurrentTenantId } from "@/lib/get-tenant";

type Template = { id: string; name: string; type: string; subject: string | null; content: string; };

interface EmailRecord {
  id: string;
  subject: string;
  recipient: string;
  recipientEmail: string;
  status: "sent" | "delivered" | "opened" | "clicked" | "bounced" | "read" | "archived" | "deleted";
  date: string;
  snippet: string;
  direction?: string;
  starred?: boolean;
  mailbox?: string;
}

type DBEmail = {
  id: string;
  content: string;
  direction: string;
  status: string | null;
  createdAt: string;
  candidate?: { fullName: string; email: string; id: string } | null;
  user?: { name: string } | null;
};

const STATUS_BADGES: Record<string, { variant: "success" | "info" | "warning" | "danger" | "default"; label: string }> = {
  sent: { variant: "default", label: "Sent" },
  delivered: { variant: "info", label: "Delivered" },
  opened: { variant: "success", label: "Opened" },
  clicked: { variant: "warning", label: "Clicked" },
  bounced: { variant: "danger", label: "Bounced" },
  read: { variant: "success", label: "Read" },
  archived: { variant: "default", label: "Archived" },
  deleted: { variant: "danger", label: "Deleted" },
};

const MAILBOXES = [
  { id: "inbox", label: "Inbox", icon: Inbox, filter: (e: EmailRecord) => e.direction !== "outbound" && e.status !== "deleted" },
  { id: "sent", label: "Sent", icon: Send, filter: (e: EmailRecord) => e.direction === "outbound" && e.status !== "deleted" },
  { id: "starred", label: "Starred", icon: Star, filter: (e: EmailRecord) => e.starred && e.status !== "deleted" },
  { id: "archived", label: "Archived", icon: Archive, filter: (e: EmailRecord) => e.status === "archived" },
  { id: "trash", label: "Trash", icon: Trash2, filter: (e: EmailRecord) => e.status === "deleted" },
];

export default function EmailPage() {
  const [emailTemplates, setEmailTemplates] = useState<Template[]>([]);
  const [emailStats, setEmailStats] = useState({ totalSent: 0, totalReceived: 0, delivered: 0, bounced: 0, opened: 0, clicked: 0 });
  const [dbEmails, setDbEmails] = useState<DBEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeMailbox, setActiveMailbox] = useState("inbox");
  const [showCompose, setShowCompose] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [composeRecipient, setComposeRecipient] = useState("");
  const [composeRecipientId, setComposeRecipientId] = useState("");
  const [showTemplateDropdown, setShowTemplateDropdown] = useState(false);
  const [sending, setSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [tRes, statsRes, emailsRes] = await Promise.all([
      getTemplates("email", getCurrentTenantId()),
      getEmailStats(),
      getEmailCommunications(),
    ]);
    if (tRes.success) setEmailTemplates(tRes.data as Template[]);
    if (statsRes.success) setEmailStats(statsRes.data as typeof emailStats);
    if (emailsRes.success) setDbEmails(emailsRes.data as unknown as DBEmail[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const displayEmails: EmailRecord[] = dbEmails.length > 0
    ? dbEmails.map((e) => ({
        id: e.id,
        subject: e.content.substring(0, 60) + (e.content.length > 60 ? "..." : ""),
        recipient: e.candidate?.fullName || e.user?.name || "Unknown",
        recipientEmail: e.candidate?.email || "",
        status: (e.status as EmailRecord["status"]) || "sent",
        date: e.createdAt,
        snippet: e.content,
        direction: e.direction,
        starred: false,
        mailbox: e.direction === "outbound" ? "sent" : "inbox",
      }))
    : [
        { id: "e1", subject: "Offer Letter - Senior Cardiologist", recipient: "Rahul Verma", recipientEmail: "rahul.verma@email.com", status: "opened", date: "2026-07-15T11:00:00Z", snippet: "Dear Rahul, We are pleased to offer you the position of Senior Cardiologist...", direction: "outbound", starred: true, mailbox: "sent" },
        { id: "e2", subject: "Interview Invite - ICU Nurse Position", recipient: "Sneha Reddy", recipientEmail: "sneha.reddy@email.com", status: "clicked", date: "2026-07-14T10:00:00Z", snippet: "Dear Sneha, you have been shortlisted for the ICU Nurse position...", direction: "outbound", mailbox: "sent" },
        { id: "e3", subject: "Application Update - Radiologist", recipient: "Amit Patel", recipientEmail: "amit.patel@email.com", status: "delivered", date: "2026-07-13T09:00:00Z", snippet: "Dear Amit, Thank you for your interest in the Radiologist position...", direction: "outbound", mailbox: "sent" },
        { id: "e4", subject: "Re: Application for Emergency Physician", recipient: "Fatima Khan", recipientEmail: "fatima.khan@email.com", status: "read", date: "2026-07-14T11:00:00Z", snippet: "Dear Fatima, We are delighted to extend an offer for Emergency Physician...", direction: "inbound", mailbox: "inbox" },
        { id: "e5", subject: "Re: Documents for Lab Technician Application", recipient: "Deepak Singh", recipientEmail: "deepak.singh@email.com", status: "read", date: "2026-07-14T08:30:00Z", snippet: "Dear Team, please find attached my documents as requested...", direction: "inbound", mailbox: "inbox" },
        { id: "e6", subject: "Document Request - Hospital Administrator", recipient: "Vikash Kumar", recipientEmail: "vikash.k@email.com", status: "bounced", date: "2026-07-12T14:00:00Z", snippet: "Dear Vikash, please share the following documents for your application...", direction: "outbound", starred: true, mailbox: "sent" },
      ];

  const currentMailbox = MAILBOXES.find((m) => m.id === activeMailbox) || MAILBOXES[0];
  const mailboxEmails = displayEmails.filter(currentMailbox.filter);
  const filteredEmails = mailboxEmails.filter((e) => {
    if (search && !e.subject.toLowerCase().includes(search.toLowerCase()) && !e.recipient.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const mailboxCounts = MAILBOXES.reduce((acc, m) => {
    acc[m.id] = displayEmails.filter(m.filter).length;
    return acc;
  }, {} as Record<string, number>);

  const selectedEmailData = displayEmails.find((e) => e.id === selectedEmail);

  const handleSendEmail = async () => {
    if (!composeBody) return;
    setSending(true);
    if (composeRecipientId) {
      await addCommunication(composeRecipientId, "email", "outbound", `Subject: ${composeSubject}\n\n${composeBody}`, undefined, getCurrentTenantId());
    }
    setSending(false);
    setSentSuccess(true);
    setTimeout(() => {
      setShowCompose(false);
      setSentSuccess(false);
      setComposeSubject("");
      setComposeBody("");
      setComposeRecipient("");
      fetchData();
    }, 1500);
  };

  const handleReply = (email: EmailRecord) => {
    setComposeRecipient(email.recipient);
    setComposeRecipientId("");
    setComposeSubject(`Re: ${email.subject}`);
    setComposeBody("");
    setShowCompose(true);
    setSelectedEmail(null);
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="Email Communications" subtitle="Manage email communications with candidates" />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Email Communications" subtitle="Manage email communications with candidates"
        actions={<Button variant="primary" iconLeft={<Mail className="w-4 h-4" />} onClick={() => setShowCompose(true)}>Compose</Button>} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard icon={<Mail className="w-5 h-5" />} label="Emails Sent" value={emailStats.totalSent} change={10} trend={[60, 65, 70, 72, 78, 82, 85]} />
        <KPICard icon={<CheckCircle className="w-5 h-5" />} label="Opened" value={emailStats.opened} change={8} trend={[40, 45, 48, 52, 55, 60, 64]} />
        <KPICard icon={<MousePointerClick className="w-5 h-5" />} label="Clicked" value={emailStats.clicked} change={12} trend={[15, 18, 20, 22, 24, 25, 23]} />
        <KPICard icon={<AlertCircle className="w-5 h-5" />} label="Bounced" value={emailStats.bounced} change={-20} trend={[5, 6, 8, 7, 4, 3, 2]} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Mailbox Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardBody className="p-2">
              <div className="space-y-0.5">
                {MAILBOXES.map((mailbox) => {
                  const Icon = mailbox.icon;
                  const count = mailboxCounts[mailbox.id] || 0;
                  return (
                    <button
                      key={mailbox.id}
                      onClick={() => { setActiveMailbox(mailbox.id); setSelectedEmail(null); }}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer",
                        activeMailbox === mailbox.id
                          ? "bg-primary/10 text-primary"
                          : "text-text-secondary hover:bg-background hover:text-text-primary"
                      )}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="flex-1 text-left">{mailbox.label}</span>
                      {count > 0 && (
                        <span className={cn(
                          "px-2 py-0.5 text-xs rounded-full font-medium",
                          activeMailbox === mailbox.id ? "bg-primary/20 text-primary" : "bg-gray-100 text-text-secondary"
                        )}>{count}</span>
                      )}
                    </button>
                  );
                })}
              </div>
              <div className="mt-4 pt-4 border-t border-border px-3">
                <p className="text-xs text-text-muted mb-2">Storage</p>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: `${Math.min((emailStats.totalSent / 1000) * 100, 100)}%` }} />
                </div>
                <p className="text-xs text-text-muted mt-1">{emailStats.totalSent + emailStats.totalReceived} of 1,000 emails</p>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Email List + Detail */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-text-primary">{currentMailbox.label}</h3>
                  <Badge variant="default">{filteredEmails.length}</Badge>
                </div>
                <SearchInput placeholder="Search emails..." onSearch={setSearch} className="w-64" />
              </div>
            </CardHeader>
            <CardBody className="p-0">
              {filteredEmails.length > 0 ? (
                <div className="divide-y divide-border">
                  {filteredEmails.map((email) => {
                    const statusInfo = STATUS_BADGES[email.status] || STATUS_BADGES.sent;
                    const isExpanded = selectedEmail === email.id;
                    return (
                      <div key={email.id}>
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={() => setSelectedEmail(isExpanded ? null : email.id)}
                          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setSelectedEmail(isExpanded ? null : email.id); }}
                          className={cn(
                            "w-full px-4 py-3 text-left hover:bg-background transition-colors cursor-pointer",
                            isExpanded && "bg-primary/5"
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex items-center gap-2 shrink-0 mt-0.5">
                              {email.direction === "outbound" ? (
                                <Send className="w-4 h-4 text-primary" />
                              ) : (
                                <Inbox className="w-4 h-4 text-green-600" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={cn("text-sm truncate", email.status !== "read" && email.direction === "inbound" ? "font-semibold text-text-primary" : "font-medium text-text-primary")}>{email.subject}</span>
                                <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                              </div>
                              <p className="text-xs text-text-secondary">{email.direction === "outbound" ? `To: ${email.recipient}` : `From: ${email.recipient}`} {email.recipientEmail ? `(${email.recipientEmail})` : ""}</p>
                              <p className="text-xs text-text-muted mt-1 line-clamp-1">{email.snippet}</p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {email.starred && <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />}
                              <span className="text-xs text-text-muted whitespace-nowrap">{timeAgo(email.date)}</span>
                            </div>
                          </div>
                        </div>
                        {isExpanded && (
                          <div className="px-4 pb-4 pt-2 border-t border-border/50 ml-10">
                            <p className="text-sm text-text-secondary whitespace-pre-wrap mb-3">{email.snippet}</p>
                            <div className="flex items-center gap-3 text-xs text-text-muted mb-3">
                              <span>{formatDateTime(email.date)}</span>
                              <Badge variant="outline">{email.direction === "outbound" ? "Outgoing" : "Incoming"}</Badge>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" iconLeft={<Reply className="w-3.5 h-3.5" />} onClick={(e) => { e.stopPropagation(); handleReply(email); }}>Reply</Button>
                              <Button size="sm" variant="ghost" iconLeft={<Forward className="w-3.5 h-3.5" />} onClick={(e) => e.stopPropagation()}>Forward</Button>
                              <Button size="sm" variant="ghost" iconLeft={<Archive className="w-3.5 h-3.5" />} onClick={(e) => e.stopPropagation()}>Archive</Button>
                              <Button size="sm" variant="ghost" iconLeft={<Trash2 className="w-3.5 h-3.5" />} onClick={(e) => e.stopPropagation()}>Delete</Button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <EmptyState icon={<Mail className="w-8 h-8" />} title={`No emails in ${currentMailbox.label.toLowerCase()}`} description="No emails match your search criteria" />
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Compose Modal */}
      <Modal open={showCompose} onClose={() => setShowCompose(false)} size="lg">
        <ModalHeader onClose={() => setShowCompose(false)}>Compose Email</ModalHeader>
        <ModalBody>
          {sentSuccess ? (
            <div className="flex flex-col items-center justify-center py-12">
              <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
              <h3 className="text-lg font-semibold text-text-primary">Email Sent!</h3>
              <p className="text-sm text-text-secondary mt-1">Your email has been sent successfully.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">To</label>
                <input type="email" value={composeRecipient} onChange={(e) => setComposeRecipient(e.target.value)} placeholder="candidate@email.com" className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" />
              </div>
              <div className="relative">
                <label className="block text-sm font-medium text-text-primary mb-1.5">Template</label>
                <button onClick={() => setShowTemplateDropdown(!showTemplateDropdown)} className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg text-text-primary text-left flex items-center justify-between cursor-pointer hover:border-primary/50 transition-colors">
                  <span className="text-text-muted">Select a template...</span>
                  <ChevronDown className="w-4 h-4 text-text-muted" />
                </button>
                {showTemplateDropdown && (
                  <div className="absolute z-10 mt-1 w-full bg-surface border border-border rounded-lg shadow-lg py-1 max-h-48 overflow-y-auto">
                    {emailTemplates.map((t) => (
                      <button key={t.id} onClick={() => { setComposeSubject(t.subject || ""); setComposeBody(t.content); setShowTemplateDropdown(false); }} className="w-full px-3 py-2 text-sm text-text-primary hover:bg-background text-left cursor-pointer">{t.name}</button>
                    ))}
                    {emailTemplates.length === 0 && <p className="px-3 py-2 text-sm text-text-muted">No email templates</p>}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Subject</label>
                <input type="text" value={composeSubject} onChange={(e) => setComposeSubject(e.target.value)} placeholder="Email subject" className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Body</label>
                <textarea value={composeBody} onChange={(e) => setComposeBody(e.target.value)} placeholder="Write your email content..." rows={10} className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 resize-none" />
              </div>
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm"><Paperclip className="w-4 h-4" /> Attach</Button>
                  <Button variant="ghost" size="sm"><Smile className="w-4 h-4" /></Button>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={() => setShowCompose(false)}>Discard</Button>
                  <Button iconLeft={<Send className="w-4 h-4" />} loading={sending} onClick={handleSendEmail}>Send</Button>
                </div>
              </div>
            </div>
          )}
        </ModalBody>
      </Modal>
    </div>
  );
}
