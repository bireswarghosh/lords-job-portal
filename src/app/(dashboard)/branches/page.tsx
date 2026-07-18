"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, MapPin, Phone, Mail, Edit, MoreHorizontal, Trash2, Building2 } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { SearchInput } from "@/components/ui/SearchInput";
import { Dropdown } from "@/components/ui/Dropdown";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "@/components/ui/Modal";
import { getBranches, createBranch, updateBranch, deleteBranch } from "@/app/actions/branches";
import { getCurrentTenantId } from "@/lib/get-tenant";

type Branch = {
  id: string;
  name: string;
  code: string;
  address: string;
  city: string;
  state: string;
  phone: string;
  email: string;
  isActive: boolean;
  _count?: { jobs: number };
};

const EMPTY_FORM = { name: "", code: "", address: "", city: "", state: "", phone: "", email: "", isActive: true };

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Branch | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Branch | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await getBranches(getCurrentTenantId());
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (res.success) setBranches(res.data as any);
    else setError(res.error || "Failed to load branches");
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = branches.filter((b) => {
    if (search && !b.name.toLowerCase().includes(search.toLowerCase()) && !b.city.toLowerCase().includes(search.toLowerCase()) && !b.code.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const openAdd = () => { setEditing(null); setForm(EMPTY_FORM); setShowModal(true); };
  const openEdit = (b: Branch) => { setEditing(b); setForm({ name: b.name, code: b.code, address: b.address, city: b.city, state: b.state, phone: b.phone, email: b.email, isActive: b.isActive }); setShowModal(true); };

  const handleSave = async () => {
    if (!form.name || !form.code || !form.city) return;
    setSaving(true);
    const res = editing ? await updateBranch(editing.id, form, getCurrentTenantId()) : await createBranch(form, getCurrentTenantId());
    setSaving(false);
    if (res.success) { setShowModal(false); fetchData(); }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    const res = await deleteBranch(deleteTarget.id, getCurrentTenantId());
    setDeleting(false);
    if (res.success) {
      setDeleteTarget(null);
      fetchData();
    } else {
      setDeleteError(res.error || "Failed to delete branch");
    }
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="Hospital Branches" subtitle="Manage hospital branch locations" />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageHeader title="Hospital Branches" subtitle="Manage hospital branch locations" />
        <EmptyState icon={<Building2 className="w-8 h-8" />} title="Error loading branches" description={error} action={<Button onClick={fetchData}>Retry</Button>} />
      </div>
    );
  }

  const inputClass = "w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15";

  return (
    <div>
      <PageHeader
        title="Hospital Branches"
        subtitle="Manage hospital branch locations"
        actions={<Button iconLeft={<Plus className="w-4 h-4" />} onClick={openAdd}>Add Branch</Button>}
      />

      <div className="mb-6">
        <SearchInput placeholder="Search branches..." onSearch={setSearch} className="w-full sm:w-72" />
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((branch) => (
            <Card key={branch.id} className="hover:shadow-md transition-shadow">
              <CardBody className="p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-text-primary">{branch.name}</h3>
                      <Badge variant={branch.isActive ? "success" : "default"} dot>{branch.isActive ? "Active" : "Inactive"}</Badge>
                    </div>
                    <p className="text-xs text-text-muted font-mono">{branch.code}</p>
                  </div>
                  <Dropdown
                    trigger={<Button variant="ghost" size="sm" className="shrink-0"><MoreHorizontal className="w-4 h-4" /></Button>}
                    items={[
                      { kind: "item" as const, id: "edit", label: "Edit Branch", icon: <Edit className="w-4 h-4" /> },
                      { kind: "separator" as const },
                      { kind: "item" as const, id: "delete", label: "Delete", icon: <Trash2 className="w-4 h-4" />, danger: true },
                    ]}
                    onSelect={(id) => { if (id === "edit") openEdit(branch); if (id === "delete") { setDeleteError(null); setDeleteTarget(branch); } }}
                    align="right"
                  />
                </div>
                <div className="space-y-2.5 text-sm">
                  <div className="flex items-start gap-2 text-text-secondary">
                    <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <p>{branch.address}</p>
                      <p>{branch.city}, {branch.state}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-text-secondary">
                    <Phone className="w-4 h-4 shrink-0" /><span>{branch.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-text-secondary">
                    <Mail className="w-4 h-4 shrink-0" /><span className="truncate">{branch.email}</span>
                  </div>
                </div>
                {branch._count && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <span className="text-xs text-text-muted">{branch._count.jobs} job{branch._count.jobs !== 1 ? "s" : ""} posted</span>
                  </div>
                )}
              </CardBody>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<MapPin className="w-8 h-8" />}
          title="No branches found"
          description="Try adjusting your search or add a new branch"
          action={<Button iconLeft={<Plus className="w-4 h-4" />} onClick={openAdd}>Add Branch</Button>}
        />
      )}

      <Modal open={deleteTarget !== null} onClose={() => { setDeleteTarget(null); setDeleteError(null); }} size="sm">
        <ModalHeader onClose={() => { setDeleteTarget(null); setDeleteError(null); }}>Delete Branch</ModalHeader>
        <ModalBody>
          <div className="text-center py-2">
            <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <p className="text-text-primary font-medium mb-1">Are you sure?</p>
            <p className="text-sm text-text-secondary">This will permanently delete <strong>{deleteTarget?.name}</strong>.</p>
            {deleteTarget?._count?.jobs ? (
              <p className="text-sm text-red-600 mt-2 font-medium">This branch has {deleteTarget._count.jobs} associated job{deleteTarget._count.jobs !== 1 ? "s" : ""}. Deletion will fail unless all jobs are removed first.</p>
            ) : null}
            {deleteError && <p className="text-sm text-red-600 mt-2 font-medium">{deleteError}</p>}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={() => { setDeleteTarget(null); setDeleteError(null); }}>Cancel</Button>
          <Button variant="danger" loading={deleting} onClick={handleDeleteConfirm}>Delete</Button>
        </ModalFooter>
      </Modal>

      <Modal open={showModal} onClose={() => setShowModal(false)} size="md">
        <ModalHeader onClose={() => setShowModal(false)}>{editing ? "Edit Branch" : "Add Branch"}</ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Name *</label>
                <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className={inputClass} placeholder="City Central Hospital" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Code *</label>
                <input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} className={inputClass} placeholder="CCH-001" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Address</label>
              <input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} className={inputClass} placeholder="123 Medical District" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">City *</label>
                <input value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} className={inputClass} placeholder="Mumbai" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">State</label>
                <input value={form.state} onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))} className={inputClass} placeholder="Maharashtra" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Phone</label>
                <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className={inputClass} placeholder="+91 22 1234 5678" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Email</label>
                <input value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className={inputClass} placeholder="branch@hospital.com" />
              </div>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button loading={saving} onClick={handleSave}>{editing ? "Update" : "Create"}</Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
