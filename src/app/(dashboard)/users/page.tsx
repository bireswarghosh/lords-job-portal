"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Edit, ShieldOff, Key, MoreHorizontal, UserCog, Filter, X, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { SearchInput } from "@/components/ui/SearchInput";
import { Dropdown } from "@/components/ui/Dropdown";
import { EmptyState } from "@/components/ui/EmptyState";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "@/components/ui/Modal";
import { useAuth } from "@/contexts/auth-context";
import { getUsers, createUser, updateUser, toggleUserActive, deleteUser, resetPassword } from "@/app/actions/users";
import { getCurrentTenantId } from "@/lib/get-tenant";
import { USER_ROLE_LABELS } from "@/lib/constants";
import { formatDateTime } from "@/lib/utils";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  department: string | null;
  phone: string | null;
  isActive: boolean;
  lastLogin: string | null;
  _count?: { candidates: number; remarks: number };
};

const ROLE_VARIANTS: Record<string, "primary" | "info" | "success" | "warning" | "danger" | "default"> = {
  super_admin: "danger",
  tenant_admin: "warning",
  hr_manager: "primary",
  hr_executive: "info",
  recruitment_manager: "success",
  viewer: "default",
};

const EMPTY_FORM = { name: "", email: "", password: "", role: "hr_executive", department: "", phone: "" };

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetUserId, setResetUserId] = useState("");
  const [resetUserName, setResetUserName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetting, setResetting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await getUsers(getCurrentTenantId());
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (res.success) setUsers(res.data as any);
    else setError(res.error || "Failed to load users");
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = users.filter((u) => {
    if (search && !u.name.toLowerCase().includes(search.toLowerCase()) && !u.email.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterRole !== "all" && u.role !== filterRole) return false;
    if (filterStatus !== "all") {
      const isActive = filterStatus === "active";
      if (u.isActive !== isActive) return false;
    }
    return true;
  });

  const activeFilters = (search ? 1 : 0) + (filterRole !== "all" ? 1 : 0) + (filterStatus !== "all" ? 1 : 0);

  const roleCounts = users.reduce((acc, u) => { acc[u.role] = (acc[u.role] || 0) + 1; return acc; }, {} as Record<string, number>);
  const statusCounts = { active: users.filter((u) => u.isActive).length, inactive: users.filter((u) => !u.isActive).length };

  const openAdd = () => { setEditing(null); setForm(EMPTY_FORM); setShowModal(true); };
  const openEdit = (u: User) => { setEditing(u); setForm({ name: u.name, email: u.email, password: "", role: u.role, department: u.department || "", phone: u.phone || "" }); setShowModal(true); };

  const handleSave = async () => {
    if (!form.name || !form.email) return;
    setSaving(true);
    if (editing) {
      const data: Record<string, string> = { name: form.name, email: form.email, role: form.role, department: form.department, phone: form.phone };
      if (form.password) data.password = form.password;
      await updateUser(editing.id, data);
    } else {
      if (!form.password) { setSaving(false); return; }
      await createUser({ name: form.name, email: form.email, password: form.password, role: form.role, department: form.department, phone: form.phone }, getCurrentTenantId());
    }
    setSaving(false);
    setShowModal(false);
    fetchData();
  };

  const handleToggle = async (id: string) => { await toggleUserActive(id); fetchData(); };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    const res = await deleteUser(deleteTarget.id, getCurrentTenantId());
    setDeleting(false);
    if (res.success) {
      setShowDeleteModal(false);
      setDeleteTarget(null);
      fetchData();
    } else {
      setDeleteError(res.error || "Failed to delete user");
    }
  };

  const inputClass = "w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15";

  if (loading) {
    return (
      <div>
        <PageHeader title="HR Users" subtitle="Manage HR team members and their access" />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageHeader title="HR Users" subtitle="Manage HR team members and their access" />
        <EmptyState icon={<UserCog className="w-8 h-8" />} title="Error loading users" description={error} action={<Button onClick={fetchData}>Retry</Button>} />
      </div>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const columns: Column<any>[] = [
    {
      key: "name",
      header: "User",
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <Avatar name={row.name} size="sm" />
          <div>
            <p className="font-medium text-text-primary">{row.name}</p>
            <p className="text-xs text-text-muted">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      sortable: true,
      render: (row) => (
        <Badge variant={ROLE_VARIANTS[row.role] || "default"}>
          {USER_ROLE_LABELS[row.role] || row.role}
        </Badge>
      ),
    },
    {
      key: "department",
      header: "Department",
      sortable: true,
      render: (row) => <span className="text-text-secondary">{row.department || "—"}</span>,
    },
    {
      key: "isActive",
      header: "Status",
      sortable: true,
      render: (row) => (
        <Badge variant={row.isActive ? "success" : "default"} dot>
          {row.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "lastLogin",
      header: "Last Active",
      sortable: true,
      render: (row) => (
        <span className="text-text-secondary text-sm">{row.lastLogin ? formatDateTime(row.lastLogin) : "Never"}</span>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (row) => (
        <Dropdown
          trigger={<Button variant="ghost" size="sm"><MoreHorizontal className="w-4 h-4" /></Button>}
          items={[
            { kind: "item" as const, id: "edit", label: "Edit User", icon: <Edit className="w-4 h-4" /> },
            { kind: "item" as const, id: "toggle", label: row.isActive ? "Deactivate" : "Activate", icon: <ShieldOff className="w-4 h-4" />, danger: row.isActive },
            { kind: "item" as const, id: "reset", label: "Reset Password", icon: <Key className="w-4 h-4" /> },
            { kind: "separator" as const },
            { kind: "item" as const, id: "delete", label: "Delete User", icon: <Trash2 className="w-4 h-4" />, danger: true },
          ]}
          onSelect={(id) => { if (id === "edit") openEdit(row); if (id === "toggle") handleToggle(row.id); if (id === "reset") { setResetUserId(row.id); setResetUserName(row.name); setNewPassword(""); setShowResetModal(true); } if (id === "delete") { setDeleteTarget(row); setDeleteError(null); setShowDeleteModal(true); } }}
          align="right"
        />
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="HR Users"
        subtitle={`${users.length} total · ${filtered.length} shown`}
        actions={<Button iconLeft={<Plus className="w-4 h-4" />} onClick={openAdd}>Add User</Button>}
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {Object.entries(USER_ROLE_LABELS).map(([key, label]) => (
          <div key={key} className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${filterRole === key ? "border-primary bg-primary/5" : "border-border bg-surface hover:border-primary/30"}`} onClick={() => setFilterRole(filterRole === key ? "all" : key)}>
            <p className="text-2xl font-bold text-text-primary">{roleCounts[key] || 0}</p>
            <p className="text-xs text-text-secondary mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
        <SearchInput placeholder="Search users..." onSearch={setSearch} className="w-full sm:w-72" />
        <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className="px-3 py-2 text-sm bg-surface border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary cursor-pointer">
          <option value="all">All Roles</option>
          {currentUser?.role === "super_admin" && <option value="super_admin">Super Admin</option>}
                  <option value="tenant_admin">Hospital Admin</option>
          <option value="hr_manager">HR Manager</option>
          <option value="hr_executive">HR Executive</option>
          <option value="recruitment_manager">Recruitment Manager</option>
          <option value="viewer">Viewer</option>
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2 text-sm bg-surface border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary cursor-pointer">
          <option value="all">All Status</option>
          <option value="active">Active ({statusCounts.active})</option>
          <option value="inactive">Inactive ({statusCounts.inactive})</option>
        </select>
        {activeFilters > 0 && (
          <Button variant="ghost" size="sm" iconLeft={<X className="w-3.5 h-3.5" />} onClick={() => { setSearch(""); setFilterRole("all"); setFilterStatus("all"); }}>
            Clear ({activeFilters})
          </Button>
        )}
      </div>

      <p className="text-sm text-text-muted mb-4">
        Showing <strong className="text-text-primary">{filtered.length}</strong> of {users.length} users
        {activeFilters > 0 && <span className="text-primary ml-1">· {activeFilters} filter{activeFilters > 1 ? "s" : ""} applied</span>}
      </p>

      {filtered.length > 0 ? (
        <DataTable columns={columns} data={filtered as unknown as Record<string, unknown>[]} pagination pageSize={10} striped />
      ) : (
        <EmptyState icon={<UserCog className="w-8 h-8" />} title="No users found" description={activeFilters > 0 ? "Try adjusting your filters or add a new user" : "No users have been created yet"}
          action={activeFilters > 0 ? <Button variant="outline" onClick={() => { setSearch(""); setFilterRole("all"); setFilterStatus("all"); }}>Clear Filters</Button> : <Button onClick={openAdd}>Add User</Button>} />
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} size="md">
        <ModalHeader onClose={() => setShowModal(false)}>{editing ? "Edit User" : "Add User"}</ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Name *</label>
              <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className={inputClass} placeholder="Dr. Priya Sharma" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Email *</label>
              <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className={inputClass} placeholder="priya.sharma@hospital.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">{editing ? "New Password (leave blank to keep)" : "Password *"}</label>
              <input type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} className={inputClass} placeholder="••••••••" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Role</label>
                <select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} className={inputClass}>
                  {currentUser?.role === "super_admin" && <option value="super_admin">Super Admin</option>}
          <option value="tenant_admin">Hospital Admin</option>
                  <option value="hr_manager">HR Manager</option>
                  <option value="hr_executive">HR Executive</option>
                  <option value="recruitment_manager">Recruitment Manager</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Department</label>
                <input value={form.department} onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))} className={inputClass} placeholder="HR" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Phone</label>
              <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className={inputClass} placeholder="+91 98765 43210" />
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button loading={saving} onClick={handleSave}>{editing ? "Update" : "Create"}</Button>
        </ModalFooter>
      </Modal>

      {/* Delete User Modal */}
      <Modal open={showDeleteModal} onClose={() => { setShowDeleteModal(false); setDeleteTarget(null); setDeleteError(null); }} size="sm">
        <ModalHeader onClose={() => { setShowDeleteModal(false); setDeleteTarget(null); setDeleteError(null); }}>Delete User</ModalHeader>
        <ModalBody>
          <div className="text-center py-2">
            <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <p className="text-text-primary font-medium mb-1">Are you sure?</p>
            <p className="text-sm text-text-secondary mb-1">This will permanently delete <strong>{deleteTarget?.name}</strong>.</p>
            {(() => { const c = deleteTarget?._count?.candidates ?? 0; return <p className="text-xs text-text-muted">{c > 0 ? `Assigned to ${c} candidate${c !== 1 ? "s" : ""} (will be unassigned). ` : ""}Remarks and audit history linked to this user may prevent deletion.</p>; })()}
            {deleteError && <p className="text-sm text-red-600 mt-2 font-medium">{deleteError}</p>}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={() => { setShowDeleteModal(false); setDeleteTarget(null); setDeleteError(null); }}>Cancel</Button>
          <Button variant="danger" loading={deleting} onClick={handleDeleteConfirm}>Delete</Button>
        </ModalFooter>
      </Modal>

      {/* Reset Password Modal */}
      <Modal open={showResetModal} onClose={() => setShowResetModal(false)} size="sm">
        <ModalHeader onClose={() => setShowResetModal(false)}>Reset Password</ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <p className="text-sm text-text-secondary">Set a new password for <strong>{resetUserName}</strong></p>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">New Password *</label>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={inputClass} placeholder="Enter new password" autoFocus />
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={() => setShowResetModal(false)}>Cancel</Button>
          <Button loading={resetting} onClick={async () => {
            if (!newPassword) return;
            setResetting(true);
            await resetPassword(resetUserId, newPassword);
            setResetting(false);
            setShowResetModal(false);
          }}>Reset Password</Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
