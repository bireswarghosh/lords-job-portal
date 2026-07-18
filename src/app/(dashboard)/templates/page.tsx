"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Edit, Copy, Trash2, MoreHorizontal, MessageCircle, Mail } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Tabs, TabPanel } from "@/components/ui/Tabs";
import { SearchInput } from "@/components/ui/SearchInput";
import { Dropdown } from "@/components/ui/Dropdown";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { getTemplates, createTemplate, updateTemplate, deleteTemplate } from "@/app/actions/templates";
import { formatDate } from "@/lib/utils";
import { getCurrentTenantId } from "@/lib/get-tenant";

type Template = {
  id: string;
  name: string;
  type: string;
  subject: string | null;
  content: string;
  variables: string[];
  createdAt: string;
  updatedAt: string;
};

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("whatsapp");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editTemplate, setEditTemplate] = useState<Template | null>(null);
  const [formName, setFormName] = useState("");
  const [formSubject, setFormSubject] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formType, setFormType] = useState<"whatsapp" | "email">("whatsapp");
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await getTemplates(undefined, getCurrentTenantId());
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (res.success) setTemplates(res.data as any);
    else setError(res.error || "Failed to load templates");
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = templates.filter((t) => {
    if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const whatsappTemplates = filtered.filter((t) => t.type === "whatsapp");
  const emailTemplates = filtered.filter((t) => t.type === "email");

  const openCreateModal = () => {
    setEditTemplate(null); setFormName(""); setFormSubject(""); setFormContent(""); setFormType(activeTab as "whatsapp" | "email"); setShowModal(true);
  };

  const openEditModal = (t: Template) => {
    setEditTemplate(t); setFormName(t.name); setFormSubject(t.subject || ""); setFormContent(t.content); setFormType(t.type as "whatsapp" | "email"); setShowModal(true);
  };

  const handleSave = async () => {
    if (!formName || !formContent) return;
    setSaving(true);
    const data = { name: formName, type: formType, subject: formType === "email" ? formSubject : undefined, content: formContent, variables: [] };
    if (editTemplate) await updateTemplate(editTemplate.id, data, getCurrentTenantId());
    else await createTemplate(data, getCurrentTenantId());
    setSaving(false);
    setShowModal(false);
    fetchData();
  };

  const handleDelete = async (id: string) => { await deleteTemplate(id, getCurrentTenantId()); fetchData(); };

  const inputClass = "w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15";

  const renderTemplateCard = (t: Template) => (
    <Card key={t.id} className="hover:shadow-md transition-shadow">
      <CardBody className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <Badge variant={t.type === "whatsapp" ? "success" : "primary"}>
            {t.type === "whatsapp" ? <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" /> WhatsApp</span> : <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> Email</span>}
          </Badge>
          <Dropdown
            trigger={<Button variant="ghost" size="sm" className="shrink-0"><MoreHorizontal className="w-4 h-4" /></Button>}
            items={[
              { kind: "item" as const, id: "edit", label: "Edit Template", icon: <Edit className="w-4 h-4" /> },
              { kind: "separator" as const },
              { kind: "item" as const, id: "delete", label: "Delete Template", icon: <Trash2 className="w-4 h-4" />, danger: true },
            ]}
            onSelect={(id) => { if (id === "edit") openEditModal(t); if (id === "delete") handleDelete(t.id); }}
            align="right"
          />
        </div>
        <h3 className="font-semibold text-text-primary mb-2">{t.name}</h3>
        {t.subject && <p className="text-sm text-text-secondary mb-1"><span className="font-medium">Subject:</span> {t.subject}</p>}
        <div className="bg-gray-50 rounded-lg p-3 mb-3 text-sm text-text-secondary line-clamp-3">{t.content}</div>
        {t.variables.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {t.variables.map((v) => <Badge key={v} variant="outline" className="text-xs">{`{{${v}}}`}</Badge>)}
          </div>
        )}
        <div className="flex items-center justify-between text-xs text-text-muted">
          <span>Created: {formatDate(t.createdAt)}</span>
          <span>Updated: {formatDate(t.updatedAt)}</span>
        </div>
      </CardBody>
    </Card>
  );

  if (loading) {
    return (
      <div>
        <PageHeader title="Message Templates" subtitle="Create and manage communication templates" />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageHeader title="Message Templates" subtitle="Create and manage communication templates" />
        <EmptyState icon={<MessageCircle className="w-8 h-8" />} title="Error loading templates" description={error} action={<Button onClick={fetchData}>Retry</Button>} />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Message Templates"
        subtitle="Create and manage communication templates"
        actions={<Button iconLeft={<Plus className="w-4 h-4" />} onClick={openCreateModal}>Create Template</Button>}
      />

      <div className="mb-6">
        <SearchInput placeholder="Search templates..." onSearch={setSearch} className="w-full sm:w-72" />
      </div>

      <Tabs
        tabs={[
          { id: "whatsapp", label: "WhatsApp", count: whatsappTemplates.length },
          { id: "email", label: "Email", count: emailTemplates.length },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      <TabPanel tabId="whatsapp" activeTab={activeTab}>
        {whatsappTemplates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{whatsappTemplates.map(renderTemplateCard)}</div>
        ) : (
          <EmptyState icon={<MessageCircle className="w-8 h-8" />} title="No WhatsApp templates" description="Create your first WhatsApp template" />
        )}
      </TabPanel>

      <TabPanel tabId="email" activeTab={activeTab}>
        {emailTemplates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{emailTemplates.map(renderTemplateCard)}</div>
        ) : (
          <EmptyState icon={<Mail className="w-8 h-8" />} title="No email templates" description="Create your first email template" />
        )}
      </TabPanel>

      <Modal open={showModal} onClose={() => setShowModal(false)} size="lg">
        <ModalHeader onClose={() => setShowModal(false)}>{editTemplate ? "Edit Template" : "Create Template"}</ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Template Name</label>
              <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g., Interview Invite" className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Type</label>
              <select value={formType} onChange={(e) => setFormType(e.target.value as "whatsapp" | "email")} className={inputClass}>
                <option value="whatsapp">WhatsApp</option>
                <option value="email">Email</option>
              </select>
            </div>
            {formType === "email" && (
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Subject</label>
                <input type="text" value={formSubject} onChange={(e) => setFormSubject(e.target.value)} placeholder="Email subject line" className={inputClass} />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Content</label>
              <textarea value={formContent} onChange={(e) => setFormContent(e.target.value)} placeholder="Write your template content. Use {{variable}} for dynamic values." rows={6} className={inputClass + " resize-none"} />
              <p className="mt-1 text-xs text-text-muted">Use <code className="bg-gray-100 px-1 rounded">{"{{name}}"}</code>, <code className="bg-gray-100 px-1 rounded">{"{{position}}"}</code>, etc. for dynamic variables.</p>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button loading={saving} onClick={handleSave}>{editTemplate ? "Update" : "Create"}</Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
