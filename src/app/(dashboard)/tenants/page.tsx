"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Edit, ShieldOff, MoreHorizontal, Building2, Users, Briefcase, X, Eye, EyeOff } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { SearchInput } from "@/components/ui/SearchInput";
import { Dropdown } from "@/components/ui/Dropdown";
import { EmptyState } from "@/components/ui/EmptyState";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "@/components/ui/Modal";
import { useAuth } from "@/contexts/auth-context";
import { getTenants, createTenant, updateTenant, toggleTenantActive, deleteTenant, createTenantAdminUser } from "@/app/actions/tenants";
import { formatDate } from "@/lib/utils";

type Tenant = {
  id: string;
  name: string;
  slug: string;
  email: string;
  phone: string | null;
  logo: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  plan: string;
  isActive: boolean;
  maxUsers: number;
  maxJobs: number;
  createdAt: Date;
  _count?: { users: number; jobs: number; candidates: number };
};

const PLAN_VARIANTS: Record<string, "primary" | "info" | "success" | "warning" | "danger" | "default"> = {
  starter: "default",
  growth: "info",
  enterprise: "warning",
};

const EMPTY_FORM = { name: "", slug: "", email: "", phone: "", address: "", city: "", state: "", plan: "starter", maxUsers: 10, maxJobs: 50 };

export default function TenantsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterPlan, setFilterPlan] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Tenant | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminForm, setAdminForm] = useState({ tenantId: "", tenantName: "", name: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [adminCreating, setAdminCreating] = useState(false);
  const [adminCreated, setAdminCreated] = useState<{ email: string; password: string } | null>(null);

  useEffect(() => {
    if (!authLoading && user && user.role !== "super_admin") {
      router.push("/dashboard");
    }
  }, [user, authLoading, router]);

  if (authLoading || !user || user.role !== "super_admin") {
    return (
      <div>
        <PageHeader title="Clients" subtitle="Manage tenant clients" />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await getTenants();
    if (res.success) setTenants(res.data as unknown as Tenant[]);
    else setError(res.error || "Failed to load clients");
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = tenants.filter((t) => {
    if (search && !t.name.toLowerCase().includes(search.toLowerCase()) && !t.slug.toLowerCase().includes(search.toLowerCase()) && !t.email.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterPlan !== "all" && t.plan !== filterPlan) return false;
    if (filterStatus !== "all") {
      const isActive = filterStatus === "active";
      if (t.isActive !== isActive) return false;
    }
    return true;
  });

  const activeFilters = (search ? 1 : 0) + (filterPlan !== "all" ? 1 : 0) + (filterStatus !== "all" ? 1 : 0);

  const planCounts = tenants.reduce((acc, t) => { acc[t.plan] = (acc[t.plan] || 0) + 1; return acc; }, {} as Record<string, number>);
  const statusCounts = { active: tenants.filter((t) => t.isActive).length, inactive: tenants.filter((t) => !t.isActive).length };

  const openAdd = () => { setEditing(null); setForm(EMPTY_FORM); setShowModal(true); };
  const openEdit = (t: Tenant) => { setEditing(t); setForm({ name: t.name, slug: t.slug, email: t.email, phone: t.phone || "", address: t.address || "", city: t.city || "", state: t.state || "", plan: t.plan, maxUsers: t.maxUsers, maxJobs: t.maxJobs }); setShowModal(true); };

  const handleSave = async () => {
    if (!form.name || !form.slug || !form.email) return;
    setSaving(true);
    if (editing) {
      await updateTenant(editing.id, form);
    } else {
      await createTenant(form);
    }
    setSaving(false);
    setShowModal(false);
    fetchData();
  };

  const handleToggle = async (id: string) => { await toggleTenantActive(id); fetchData(); };

  const openAdminModal = (tenant: Tenant) => {
    setAdminForm({ tenantId: tenant.id, tenantName: tenant.name, name: "", email: "", password: generatePassword() });
    setAdminCreated(null);
    setShowAdminModal(true);
  };

  const generatePassword = () => Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 6).toUpperCase();

  const handleCreateAdmin = async () => {
    if (!adminForm.name || !adminForm.email || !adminForm.password) return;
    setAdminCreating(true);
    const res = await createTenantAdminUser({ tenantId: adminForm.tenantId, name: adminForm.name, email: adminForm.email, password: adminForm.password });
    setAdminCreating(false);
    if (res.success) {
      setAdminCreated({ email: adminForm.email, password: adminForm.password });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this client? All associated data will be lost.")) return;
    await deleteTenant(id);
    fetchData();
  };

  const inputClass = "w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15";

  if (loading) {
    return (
      <div>
        <PageHeader title="Clients" subtitle="Manage tenant clients" />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  const columns: Column<Record<string, unknown>>[] = [
    {
      key: "name",
      header: "Client",
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
            <Building2 className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="font-medium text-text-primary">{row.name as string}</p>
            <p className="text-xs text-text-muted">{row.slug as string} &middot; {(row as Tenant).email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "plan",
      header: "Plan",
      sortable: true,
      render: (row) => (
        <Badge variant={PLAN_VARIANTS[row.plan as string] || "default"}>
          {(row.plan as string).charAt(0).toUpperCase() + (row.plan as string).slice(1)}
        </Badge>
      ),
    },
    {
      key: "_count",
      header: "Stats",
      render: (row) => {
        const cnt = row._count as { users: number; jobs: number; candidates: number } | undefined;
        return (
          <div className="flex items-center gap-3 text-sm text-text-secondary">
            <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{cnt?.users || 0}</span>
            <span className="flex items-center gap-1"><Briefcase className="w-3.5 h-3.5" />{cnt?.jobs || 0}</span>
          </div>
        );
      },
    },
    {
      key: "isActive",
      header: "Status",
      sortable: true,
      render: (row) => (
        <Badge variant={(row as Tenant).isActive ? "success" : "default"} dot>
          {(row as Tenant).isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "createdAt",
      header: "Created",
      sortable: true,
      render: (row) => <span className="text-text-secondary text-sm">{formatDate((row as Tenant).createdAt as unknown as string)}</span>,
    },
    {
      key: "actions",
      header: "",
      render: (row) => {
        const t = row as Tenant;
        return (
          <Dropdown
            trigger={<Button variant="ghost" size="sm"><MoreHorizontal className="w-4 h-4" /></Button>}
            items={[
              { kind: "item" as const, id: "edit", label: "Edit Client", icon: <Edit className="w-4 h-4" /> },
              { kind: "item" as const, id: "toggle", label: t.isActive ? "Deactivate" : "Activate", icon: <ShieldOff className="w-4 h-4" />, danger: t.isActive },
              { kind: "item" as const, id: "admin", label: "Create Admin User", icon: <Users className="w-4 h-4" /> },
              { kind: "separator" as const },
              { kind: "item" as const, id: "delete", label: "Delete Client", icon: <X className="w-4 h-4" />, danger: true },
            ]}
            onSelect={(id) => { if (id === "edit") openEdit(t); if (id === "toggle") handleToggle(t.id); if (id === "admin") openAdminModal(t); if (id === "delete") handleDelete(t.id); }}
            align="right"
          />
        );
      },
    },
  ];

  return (
    <div>
      <PageHeader
        title="Clients"
        subtitle={`${tenants.length} total · ${filtered.length} shown`}
        actions={<Button iconLeft={<Plus className="w-4 h-4" />} onClick={openAdd}>Add Client</Button>}
      />

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
        {["starter", "growth", "enterprise"].map((plan) => (
          <div key={plan} className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${filterPlan === plan ? "border-primary bg-primary/5" : "border-border bg-surface hover:border-primary/30"}`} onClick={() => setFilterPlan(filterPlan === plan ? "all" : plan)}>
            <p className="text-2xl font-bold text-text-primary">{planCounts[plan] || 0}</p>
            <p className="text-xs text-text-secondary mt-0.5 capitalize">{plan}</p>
          </div>
        ))}
        <div className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${filterStatus === "active" ? "border-green-500 bg-green-50" : "border-border bg-surface hover:border-green-300"}`} onClick={() => setFilterStatus(filterStatus === "active" ? "all" : "active")}>
          <p className="text-2xl font-bold text-green-600">{statusCounts.active}</p>
          <p className="text-xs text-text-secondary mt-0.5">Active</p>
        </div>
        <div className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${filterStatus === "inactive" ? "border-red-500 bg-red-50" : "border-border bg-surface hover:border-red-300"}`} onClick={() => setFilterStatus(filterStatus === "inactive" ? "all" : "inactive")}>
          <p className="text-2xl font-bold text-red-600">{statusCounts.inactive}</p>
          <p className="text-xs text-text-secondary mt-0.5">Inactive</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
        <SearchInput placeholder="Search clients..." onSearch={setSearch} className="w-full sm:w-72" />
        <select value={filterPlan} onChange={(e) => setFilterPlan(e.target.value)} className="px-3 py-2 text-sm bg-surface border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary cursor-pointer">
          <option value="all">All Plans</option>
          <option value="starter">Starter</option>
          <option value="growth">Growth</option>
          <option value="enterprise">Enterprise</option>
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2 text-sm bg-surface border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary cursor-pointer">
          <option value="all">All Status</option>
          <option value="active">Active ({statusCounts.active})</option>
          <option value="inactive">Inactive ({statusCounts.inactive})</option>
        </select>
        {activeFilters > 0 && (
          <Button variant="ghost" size="sm" iconLeft={<X className="w-3.5 h-3.5" />} onClick={() => { setSearch(""); setFilterPlan("all"); setFilterStatus("all"); }}>
            Clear ({activeFilters})
          </Button>
        )}
      </div>

      <p className="text-sm text-text-muted mb-4">
        Showing <strong className="text-text-primary">{filtered.length}</strong> of {tenants.length} clients
        {activeFilters > 0 && <span className="text-primary ml-1">&middot; {activeFilters} filter{activeFilters > 1 ? "s" : ""} applied</span>}
      </p>

      {filtered.length > 0 ? (
        <DataTable columns={columns} data={filtered as unknown as Record<string, unknown>[]} pagination pageSize={10} striped />
      ) : (
        <EmptyState icon={<Building2 className="w-8 h-8" />} title="No clients found" description={activeFilters > 0 ? "Try adjusting your filters" : "No clients registered yet"}
          action={activeFilters > 0 ? <Button variant="outline" onClick={() => { setSearch(""); setFilterPlan("all"); setFilterStatus("all"); }}>Clear Filters</Button> : <Button onClick={openAdd}>Add Client</Button>} />
      )}

      {/* Add/Edit Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} size="lg">
        <ModalHeader onClose={() => setShowModal(false)}>{editing ? "Edit Client" : "Register New Client"}</ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Organization Name *</label>
                <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className={inputClass} placeholder="City Hospital" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Slug *</label>
                <input value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} className={inputClass} placeholder="city-hospital" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Email *</label>
                <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className={inputClass} placeholder="admin@cityhospital.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Phone</label>
                <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className={inputClass} placeholder="+91 98765 43210" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">City</label>
                <input value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} className={inputClass} placeholder="Mumbai" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">State</label>
                <input value={form.state} onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))} className={inputClass} placeholder="Maharashtra" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Address</label>
              <input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} className={inputClass} placeholder="123 Main Street" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Plan</label>
                <select value={form.plan} onChange={(e) => setForm((f) => ({ ...f, plan: e.target.value }))} className={inputClass}>
                  <option value="starter">Starter</option>
                  <option value="growth">Growth</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Max Users</label>
                <input type="number" value={form.maxUsers} onChange={(e) => setForm((f) => ({ ...f, maxUsers: parseInt(e.target.value) || 0 }))} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Max Jobs</label>
                <input type="number" value={form.maxJobs} onChange={(e) => setForm((f) => ({ ...f, maxJobs: parseInt(e.target.value) || 0 }))} className={inputClass} />
              </div>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button loading={saving} onClick={handleSave}>{editing ? "Update" : "Register"}</Button>
        </ModalFooter>
      </Modal>

      {/* Create Admin User Modal */}
      <Modal open={showAdminModal} onClose={() => { setShowAdminModal(false); setAdminCreated(null); }} size="md">
        <ModalHeader onClose={() => { setShowAdminModal(false); setAdminCreated(null); }}>
          {adminCreated ? "Admin User Created" : `Create Admin for ${adminForm.tenantName}`}
        </ModalHeader>
        <ModalBody>
          {adminCreated ? (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800 font-medium mb-2">Admin user created successfully!</p>
                <p className="text-xs text-green-700">Share these credentials with the client:</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg border border-border space-y-2">
                <div>
                  <span className="text-xs font-medium text-text-secondary">Login URL</span>
                  <p className="text-sm font-mono text-text-primary">{typeof window !== "undefined" ? window.location.origin : ""}/login</p>
                </div>
                <div>
                  <span className="text-xs font-medium text-text-secondary">Email</span>
                  <p className="text-sm font-mono text-text-primary">{adminCreated.email}</p>
                </div>
                <div>
                  <span className="text-xs font-medium text-text-secondary">Password</span>
                  <p className="text-sm font-mono text-text-primary">{adminCreated.password}</p>
                </div>
              </div>
              <Button variant="primary" onClick={() => { setShowAdminModal(false); setAdminCreated(null); }}>Done</Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-text-secondary">Create a super admin user for <strong>{adminForm.tenantName}</strong>. This user will have full access to manage this client&apos;s recruitment system.</p>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Admin Name *</label>
                <input value={adminForm.name} onChange={(e) => setAdminForm((f) => ({ ...f, name: e.target.value }))} className={inputClass} placeholder="Dr. Admin" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Admin Email *</label>
                <input type="email" value={adminForm.email} onChange={(e) => setAdminForm((f) => ({ ...f, email: e.target.value }))} className={inputClass} placeholder="admin@cityhospital.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Password</label>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} value={adminForm.password} onChange={(e) => setAdminForm((f) => ({ ...f, password: e.target.value }))} className={inputClass + " pr-10"} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-text-muted mt-1">Auto-generated. You can change it.</p>
              </div>
            </div>
          )}
        </ModalBody>
        {!adminCreated && (
          <ModalFooter>
            <Button variant="outline" onClick={() => setShowAdminModal(false)}>Cancel</Button>
            <Button loading={adminCreating} onClick={handleCreateAdmin}>Create Admin</Button>
          </ModalFooter>
        )}
      </Modal>
    </div>
  );
}
