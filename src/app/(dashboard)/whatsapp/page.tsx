"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Send, Search, MessageCircle, Clock, CheckCheck, BarChart3, Paperclip, Smile, ChevronDown,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { KPICard } from "@/components/ui/KPICard";
import { EmptyState } from "@/components/ui/EmptyState";
import { getCandidates } from "@/app/actions/candidates";
import { getTemplates } from "@/app/actions/templates";
import { timeAgo, cn } from "@/lib/utils";
import { getCurrentTenantId } from "@/lib/get-tenant";

type Candidate = {
  id: string;
  fullName: string;
  mobile: string;
  communications: { content: string; createdAt: string }[];
  applicationDate: string;
};

type Template = { id: string; name: string; type: string; content: string; };

interface ChatMessage {
  id: string;
  sender: "candidate" | "hr";
  content: string;
  timestamp: string;
  status: "sent" | "delivered" | "read";
}

const MOCK_MESSAGES: ChatMessage[] = [
  { id: "m1", sender: "hr", content: "Hello, we have received your application.", timestamp: "2026-07-10T09:00:00Z", status: "read" },
  { id: "m2", sender: "candidate", content: "Thank you for the update. Looking forward to hearing from you.", timestamp: "2026-07-10T09:15:00Z", status: "read" },
  { id: "m3", sender: "hr", content: "Great! Your profile has been shortlisted. We would like to schedule an interview.", timestamp: "2026-07-12T10:00:00Z", status: "read" },
  { id: "m4", sender: "candidate", content: "That sounds wonderful! When would be a good time?", timestamp: "2026-07-12T10:15:00Z", status: "read" },
];

export default function WhatsAppPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeConversation, setActiveConversation] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showTemplates, setShowTemplates] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [cRes, tRes] = await Promise.all([getCandidates(undefined, getCurrentTenantId()), getTemplates("whatsapp", getCurrentTenantId())]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (cRes.success) setCandidates(cRes.data as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (tRes.success) setTemplates(tRes.data as any);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (candidates.length > 0 && !activeConversation) {
      setActiveConversation(candidates[0].id);
    }
  }, [candidates, activeConversation]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [activeConversation]);

  const selectedCandidate = candidates.find((c) => c.id === activeConversation);

  const filteredCandidates = candidates.filter((c) => {
    if (searchQuery && !c.fullName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const handleSend = () => { if (!messageInput.trim()) return; setMessageInput(""); };

  if (loading) {
    return (
      <div>
        <PageHeader title="WhatsApp Communications" subtitle="Manage candidate conversations via WhatsApp" />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="WhatsApp Communications" subtitle="Manage candidate conversations via WhatsApp" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard icon={<MessageCircle className="w-5 h-5" />} label="Total Conversations" value={candidates.length} change={12} trend={[80, 95, 100, 110, 120, 130, 125]} />
        <KPICard icon={<CheckCheck className="w-5 h-5" />} label="Messages Sent" value="1,198" change={8} trend={[75, 90, 95, 105, 115, 125, 120]} />
        <KPICard icon={<BarChart3 className="w-5 h-5" />} label="Response Rate" value="78%" change={5} trend={[65, 68, 70, 72, 74, 76, 78]} />
        <KPICard icon={<Clock className="w-5 h-5" />} label="Avg Response Time" value="4.2 hrs" change={-15} trend={[6, 5.5, 5, 4.8, 4.5, 4.3, 4.2]} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 border border-border rounded-xl overflow-hidden bg-surface" style={{ height: "600px" }}>
        <div className="border-r border-border flex flex-col">
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input type="text" placeholder="Search conversations..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-3 py-2 text-sm bg-background border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filteredCandidates.map((c) => {
              const lastComm = c.communications?.length > 0 ? c.communications[c.communications.length - 1] : null;
              return (
                <button key={c.id} onClick={() => setActiveConversation(c.id)} className={cn("w-full flex items-center gap-3 px-3 py-3 text-left transition-colors hover:bg-background cursor-pointer border-b border-border/50", activeConversation === c.id && "bg-primary/5 border-l-2 border-l-primary")}>
                  <Avatar name={c.fullName} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-text-primary text-sm truncate">{c.fullName}</span>
                      <span className="text-xs text-text-muted shrink-0">{lastComm ? timeAgo(lastComm.createdAt) : timeAgo(c.applicationDate)}</span>
                    </div>
                    <p className="text-xs text-text-secondary truncate mt-0.5">{lastComm ? lastComm.content : "No messages yet"}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-2 flex flex-col">
          {selectedCandidate ? (
            <>
              <div className="px-4 py-3 border-b border-border flex items-center gap-3">
                <Avatar name={selectedCandidate.fullName} size="sm" />
                <div>
                  <h3 className="font-semibold text-text-primary text-sm">{selectedCandidate.fullName}</h3>
                  <p className="text-xs text-text-muted">{selectedCandidate.mobile}</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
                {MOCK_MESSAGES.map((msg) => (
                  <div key={msg.id} className={cn("flex", msg.sender === "hr" ? "justify-end" : "justify-start")}>
                    <div className={cn("max-w-[75%] rounded-xl px-4 py-2.5 shadow-sm", msg.sender === "hr" ? "bg-primary text-white rounded-br-sm" : "bg-white border border-border text-text-primary rounded-bl-sm")}>
                      <p className="text-sm">{msg.content}</p>
                      <div className={cn("flex items-center justify-end gap-1 mt-1", msg.sender === "hr" ? "text-white/70" : "text-text-muted")}>
                        <span className="text-xs">{timeAgo(msg.timestamp)}</span>
                        {msg.sender === "hr" && <CheckCheck className={cn("w-4 h-4", msg.status === "read" ? "text-white" : "text-white/50")} />}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {showTemplates && (
                <div className="border-t border-border p-3 bg-gray-50/50 max-h-40 overflow-y-auto">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Quick Replies</span>
                    <button onClick={() => setShowTemplates(false)} className="text-xs text-primary hover:underline cursor-pointer">Close</button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {templates.map((t) => (
                      <button key={t.id} onClick={() => { setMessageInput(t.content); setShowTemplates(false); }} className="px-3 py-1.5 text-xs bg-surface border border-border rounded-lg text-text-primary hover:bg-background transition-colors cursor-pointer">{t.name}</button>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-3 border-t border-border">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setShowTemplates(!showTemplates)}>
                    <ChevronDown className={cn("w-4 h-4 transition-transform", showTemplates && "rotate-180")} />
                  </Button>
                  <input type="text" value={messageInput} onChange={(e) => setMessageInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSend()} placeholder="Type a message..." className="flex-1 px-4 py-2 text-sm bg-background border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary" />
                  <Button variant="ghost" size="sm"><Paperclip className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="sm"><Smile className="w-4 h-4" /></Button>
                  <Button size="sm" onClick={handleSend} disabled={!messageInput.trim()}><Send className="w-4 h-4" /></Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <EmptyState icon={<MessageCircle className="w-8 h-8" />} title="Select a conversation" description="Choose a candidate from the list to start chatting" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
