"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Edit, Users, Building2, MoreHorizontal, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { SearchInput } from "@/components/ui/SearchInput";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Dropdown } from "@/components/ui/Dropdown";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "@/components/ui/Modal";
import { getDepartments, createDepartment, updateDepartment, deleteDepartment } from "@/app/actions/departments";
import { getCurrentTenantId } from "@/lib/get-tenant";

type Department = {
  id: string;
  name: string;
  code: string;
  head: string | null;
  totalPositions: number;
  openPositions: number;
  color: string;
  isActive: boolean;
  _count?: { jobs: number };
};

const EMPTY_FORM = { name: "", code: "", head: "", totalPositions: 0, openPositions: 0, color: "#6B7280", isActive: true };

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await getDepartments(getCurrentTenantId());
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (res.success) setDepartments(res.data as any);
    else setError(res.error || "Failed to load departments");
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = departments.filter((d) => {
    if (search && !d.name.toLowerCase().includes(search.toLowerCase()) && !d.code.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const openAdd = () => {
    setEditingDept(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (dept: Department) => {
    setEditingDept(dept);
    setForm({ name: dept.name, code: dept.code, head: dept.head ?? "", totalPositions: dept.totalPositions, openPositions: dept.openPositions, color: dept.color, isActive: dept.isActive });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.code) return;
    setSaving(true);
    const res = editingDept
      ? await updateDepartment(editingDept.id, form, getCurrentTenantId())
      : await createDepartment(form, getCurrentTenantId());
    setSaving(false);
    if (res.success) {
      setShowModal(false);
      fetchData();
    }
  };

  const handleDelete = async (id: string) => {
    await deleteDepartment(id);
    fetchData();
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="Departments" subtitle="Manage hospital departments and their positions" />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageHeader title="Departments" subtitle="Manage hospital departments and their positions" />
        <EmptyState
          icon={<Building2 className="w-8 h-8" />}
          title="Error loading departments"
          description={error}
          action={<Button onClick={fetchData}>Retry</Button>}
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Departments"
        subtitle="Manage hospital departments and their positions"
        actions={
          <Button iconLeft={<Plus className="w-4 h-4" />} onClick={openAdd}>
            Add Department
          </Button>
        }
      />

      <div className="mb-6">
        <SearchInput
          placeholder="Search departments..."
          onSearch={setSearch}
          className="w-full sm:w-72"
        />
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((dept) => {
            const fillPct = dept.totalPositions > 0
              ? Math.round(((dept.totalPositions - dept.openPositions) / dept.totalPositions) * 100)
              : 0;

            return (
              <Card key={dept.id} className="hover:shadow-md transition-shadow">
                <CardBody className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${dept.color}15`, color: dept.color }}
                      >
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-text-primary">{dept.name}</h3>
                        <p className="text-xs text-text-muted font-mono">{dept.code}</p>
                      </div>
                    </div>
                    <Dropdown
                      trigger={
                        <Button variant="ghost" size="sm" className="shrink-0">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      }
                      items={[
                        { kind: "item" as const, id: "edit", label: "Edit Department", icon: <Edit className="w-4 h-4" /> },
                        { kind: "separator" as const },
                        { kind: "item" as const, id: "delete", label: "Delete", icon: <Trash2 className="w-4 h-4" />, danger: true },
                      ]}
                      onSelect={(id) => {
                        if (id === "edit") openEdit(dept);
                        if (id === "delete") handleDelete(dept.id);
                      }}
                      align="right"
                    />
                  </div>

                  {dept.head && (
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-text-secondary">Head</span>
                        <span className="font-medium text-text-primary">{dept.head}</span>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-text-secondary">Positions</span>
                      <span className="font-medium text-text-primary">
                        {dept.totalPositions - dept.openPositions}/{dept.totalPositions} filled
                      </span>
                    </div>
                    <ProgressBar
                      value={dept.totalPositions - dept.openPositions}
                      max={dept.totalPositions || 1}
                      size="sm"
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-text-muted">{dept.openPositions} open position{dept.openPositions !== 1 ? "s" : ""}</span>
                      <Badge variant={dept.openPositions > 3 ? "danger" : dept.openPositions > 0 ? "warning" : "success"}>
                        {dept.openPositions > 0 ? "Hiring" : "Staffed"}
                      </Badge>
                    </div>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={<Building2 className="w-8 h-8" />}
          title="No departments found"
          description="Try adjusting your search or add a new department"
          action={<Button iconLeft={<Plus className="w-4 h-4" />} onClick={openAdd}>Add Department</Button>}
        />
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} size="md">
        <ModalHeader onClose={() => setShowModal(false)}>
          {editingDept ? "Edit Department" : "Add Department"}
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Name *</label>
              <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg focus:outline-none focus:border-primary" placeholder="e.g. Cardiology" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Code *</label>
                <input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg focus:outline-none focus:border-primary" placeholder="e.g. CARD" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Head</label>
                <input value={form.head} onChange={(e) => setForm((f) => ({ ...f, head: e.target.value }))} className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg focus:outline-none focus:border-primary" placeholder="Dr. Smith" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Total Positions</label>
                <input type="number" min={0} value={form.totalPositions} onChange={(e) => setForm((f) => ({ ...f, totalPositions: parseInt(e.target.value) || 0 }))} className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Open Positions</label>
                <input type="number" min={0} value={form.openPositions} onChange={(e) => setForm((f) => ({ ...f, openPositions: parseInt(e.target.value) || 0 }))} className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg focus:outline-none focus:border-primary" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Color</label>
              <input type="color" value={form.color} onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))} className="w-12 h-10 rounded border border-border cursor-pointer" />
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button loading={saving} onClick={handleSave}>{editingDept ? "Update" : "Create"}</Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
