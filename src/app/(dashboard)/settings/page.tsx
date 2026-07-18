"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Camera, Lock, Shield, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { PageHeader } from "@/components/ui/PageHeader";
import { useAuth } from "@/contexts/auth-context";
import { updateUser } from "@/app/actions/users";
import { ALL_PERMISSIONS, PERMISSION_MODULES, DEFAULT_ROLE_PERMISSIONS } from "@/lib/permissions";
import { USER_ROLE_LABELS } from "@/lib/constants";

const TABS = [
  { id: "profile", label: "Profile" },
  { id: "general", label: "General" },
  { id: "notifications", label: "Notifications" },
  { id: "whatsapp", label: "WhatsApp" },
  { id: "email", label: "Email" },
  { id: "roles", label: "Roles & Permissions" },
  { id: "career", label: "Career Site" },
];

const ROLE_DESCRIPTIONS: Record<string, string> = {
  super_admin: "Full system access — can manage all settings, users, and data",
  tenant_admin: "Hospital-level admin — manage their organization's users and settings",
  hr_manager: "Manage HR operations — full access to candidates, interviews, and reports",
  hr_executive: "Day-to-day HR tasks — manage candidates, schedule interviews, send communications",
  recruitment_manager: "Oversee recruitment — manage vacancies, candidates, and scoring",
  viewer: "Read-only access — view dashboards, candidates, and reports",
};

const ROLE_COLORS: Record<string, string> = {
  super_admin: "bg-red-50 border-red-200 text-red-800",
  tenant_admin: "bg-amber-50 border-amber-200 text-amber-800",
  hr_manager: "bg-blue-50 border-blue-200 text-blue-800",
  hr_executive: "bg-cyan-50 border-cyan-200 text-cyan-800",
  recruitment_manager: "bg-green-50 border-green-200 text-green-800",
  viewer: "bg-gray-50 border-gray-200 text-gray-800",
};

function TestConnectionButton({ type, host, port, user }: { type: "smtp" | "imap"; host: string; port: string; user: string }) {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<"success" | "error" | null>(null);
  const [message, setMessage] = useState("");

  const handleTest = async () => {
    setTesting(true);
    setResult(null);
    // Simulate connection test — in production, this would call a server action
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const hasConfig = host && port && user;
    if (hasConfig) {
      setResult("success");
      setMessage(`${type.toUpperCase()} connection to ${host}:${port} configured. Ready to test when deployed.`);
    } else {
      setResult("error");
      setMessage(`Please fill in all ${type.toUpperCase()} fields before testing.`);
    }
    setTesting(false);
  };

  return (
    <div className="flex items-center gap-3">
      <Button variant="outline" size="sm" onClick={handleTest} disabled={testing}>
        {testing ? <><Loader2 className="w-4 h-4 animate-spin mr-1.5" /> Testing...</> : `Test ${type.toUpperCase()}`}
      </Button>
      {result === "success" && <span className="flex items-center gap-1.5 text-sm text-green-600"><CheckCircle className="w-4 h-4" /> {message}</span>}
      {result === "error" && <span className="flex items-center gap-1.5 text-sm text-red-600"><AlertCircle className="w-4 h-4" /> {message}</span>}
    </div>
  );
}

function RolesPermissionsTab() {
  const { role: currentRole, hasPermission } = useAuth();
  const isSuperAdmin = currentRole === "super_admin";
  const visibleRoles = Object.keys(DEFAULT_ROLE_PERMISSIONS).filter((r) => isSuperAdmin || r !== "super_admin");
  const [selectedRole, setSelectedRole] = useState(isSuperAdmin ? currentRole : visibleRoles[0] || "hr_manager");
  const [rolePerms, setRolePerms] = useState<Record<string, string[]>>(() => {
    try {
      const stored = localStorage.getItem("rolePermissions");
      if (stored) return JSON.parse(stored);
    } catch {}
    return { ...DEFAULT_ROLE_PERMISSIONS };
  });
  const [saved, setSaved] = useState(false);

  const canEditRoles = hasPermission("settings.roles");

  const togglePermission = (role: string, permId: string) => {
    if (!canEditRoles) return;
    setRolePerms((prev) => {
      const current = prev[role] || [];
      const updated = current.includes(permId) ? current.filter((p) => p !== permId) : [...current, permId];
      return { ...prev, [role]: updated };
    });
  };

  const toggleModule = (role: string, module: string) => {
    if (!canEditRoles) return;
    const modulePerms = ALL_PERMISSIONS.filter((p) => p.module === module).map((p) => p.id) as string[];
    setRolePerms((prev) => {
      const current = prev[role] || [];
      const allEnabled = modulePerms.every((p) => current.includes(p));
      const updated = allEnabled ? current.filter((p) => !modulePerms.includes(p)) : [...new Set([...current, ...modulePerms])];
      return { ...prev, [role]: updated };
    });
  };

  const toggleAll = (role: string) => {
    if (!canEditRoles) return;
    setRolePerms((prev) => {
      const current = prev[role] || [];
      const allEnabled = ALL_PERMISSIONS.every((p) => current.includes(p.id as string));
      return { ...prev, [role]: allEnabled ? [] : ALL_PERMISSIONS.map((p) => p.id as string) };
    });
  };

  const handleSave = () => {
    localStorage.setItem("rolePermissions", JSON.stringify(rolePerms));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleResetRole = (role: string) => {
    if (!canEditRoles) return;
    setRolePerms((prev) => ({ ...prev, [role]: [...DEFAULT_ROLE_PERMISSIONS[role]] }));
  };

  const selectedPerms = rolePerms[selectedRole] || [];

  return (
    <div className="space-y-6">
      {/* Role Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {visibleRoles.map((role) => {
          const count = (rolePerms[role] || []).length;
          const total = ALL_PERMISSIONS.length;
          const isSelected = selectedRole === role;
          return (
            <button
              key={role}
              onClick={() => setSelectedRole(role)}
              className={`text-left p-4 rounded-xl border-2 transition-all ${isSelected ? "border-primary ring-2 ring-primary/15 bg-primary/5" : "border-border hover:border-primary/30 bg-surface"}`}
            >
              <Badge variant={isSelected ? "primary" : "default"} className="mb-2">{count}/{total}</Badge>
              <p className="font-semibold text-sm text-text-primary capitalize">{USER_ROLE_LABELS[role] || role}</p>
              <p className="text-xs text-text-secondary mt-1 line-clamp-2">{ROLE_DESCRIPTIONS[role]}</p>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                <div className="bg-primary h-1.5 rounded-full transition-all" style={{ width: `${(count / total) * 100}%` }} />
              </div>
            </button>
          );
        })}
      </div>

      {/* Permission Matrix */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                {USER_ROLE_LABELS[selectedRole]} Permissions
              </h3>
              <p className="text-sm text-text-secondary mt-1">
                {selectedPerms.length} of {ALL_PERMISSIONS.length} permissions enabled
                {!canEditRoles && <span className="text-amber-600 ml-2">(You don't have permission to edit roles)</span>}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {canEditRoles && (
                <>
                  <Button variant="ghost" size="sm" onClick={() => handleResetRole(selectedRole)}>Reset to Default</Button>
                  <Button variant="ghost" size="sm" onClick={() => toggleAll(selectedRole)}>
                    {ALL_PERMISSIONS.every((p) => selectedPerms.includes(p.id as string)) ? "Deselect All" : "Select All"}
                  </Button>
                  <Button variant="primary" size="sm" onClick={handleSave}>{saved ? "Saved!" : "Save Permissions"}</Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardBody className="p-0">
          <div className="divide-y divide-border">
            {PERMISSION_MODULES.map((module) => {
              const modulePerms = ALL_PERMISSIONS.filter((p) => p.module === module);
              const enabledCount = modulePerms.filter((p) => selectedPerms.includes(p.id as string)).length;
              const allEnabled = modulePerms.every((p) => selectedPerms.includes(p.id as string));

              return (
                <div key={module} className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleModule(selectedRole, module)}
                        disabled={!canEditRoles}
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${allEnabled ? "bg-primary border-primary" : "border-gray-300 bg-white"} ${canEditRoles ? "cursor-pointer hover:border-primary" : "cursor-not-allowed opacity-50"}`}
                      >
                        {allEnabled && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                      </button>
                      <span className="font-semibold text-sm text-text-primary">{module}</span>
                      <Badge variant={allEnabled ? "success" : enabledCount > 0 ? "warning" : "default"}>
                        {enabledCount}/{modulePerms.length}
                      </Badge>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 ml-8">
                    {modulePerms.map((perm) => {
                      const isEnabled = selectedPerms.includes(perm.id);
                      return (
                        <label
                          key={perm.id}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors ${isEnabled ? "bg-primary/5 text-primary" : "bg-gray-50 text-text-secondary"} ${canEditRoles ? "hover:bg-primary/10" : "cursor-not-allowed opacity-60"}`}
                        >
                          <input
                            type="checkbox"
                            checked={isEnabled}
                            onChange={() => togglePermission(selectedRole, perm.id)}
                            disabled={!canEditRoles}
                            className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary/30 cursor-pointer disabled:cursor-not-allowed"
                          />
                          <span className="truncate">{perm.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </CardBody>
      </Card>

      {/* Role Summary */}
      <Card>
        <CardHeader><h3 className="text-lg font-semibold text-text-primary">Role Summary</h3></CardHeader>
        <CardBody>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-semibold text-text-primary">Role</th>
                  <th className="text-left py-3 px-4 font-semibold text-text-primary">Permissions</th>
                  {PERMISSION_MODULES.map((m) => <th key={m} className="text-center py-3 px-2 font-semibold text-text-primary text-xs">{m}</th>)}
                </tr>
              </thead>
              <tbody>
                {visibleRoles.map((role, i) => {
                  const perms = rolePerms[role] || [];
                  return (
                    <tr key={role} className={`border-b border-border/50 ${i % 2 === 0 ? "bg-gray-50/50" : ""}`}>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Badge variant={role === selectedRole ? "primary" : "default"}>{USER_ROLE_LABELS[role]}</Badge>
                          {role === currentRole && <span className="text-xs text-primary font-medium">(You)</span>}
                        </div>
                      </td>
                      <td className="py-3 px-4"><span className="font-semibold text-text-primary">{perms.length}</span><span className="text-text-muted">/{ALL_PERMISSIONS.length}</span></td>
                      {PERMISSION_MODULES.map((m) => {
                        const modulePerms = ALL_PERMISSIONS.filter((p) => p.module === m);
                        const moduleCount = modulePerms.filter((p) => perms.includes(p.id as string)).length;
                        const allIn = moduleCount === modulePerms.length;
                        return (
                          <td key={m} className="text-center py-3 px-2">
                            {allIn ? <span className="text-green-600 font-bold">All</span> : moduleCount > 0 ? <span className="text-amber-600">{moduleCount}/{modulePerms.length}</span> : <span className="text-text-muted">—</span>}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

function getSettingsKey(tenantId?: string | null): string {
  return tenantId ? `appSettings:${tenantId}` : "appSettings";
}

function loadSettings<T>(key: string, defaults: T, tenantId?: string | null): T {
  if (typeof window === "undefined") return defaults;
  try {
    const stored = localStorage.getItem(getSettingsKey(tenantId));
    if (stored) {
      const all = JSON.parse(stored);
      if (all[key]) return all[key] as T;
    }
  } catch {}
  return defaults;
}

function saveSettings(key: string, value: unknown, tenantId?: string | null) {
  if (typeof window === "undefined") return;
  try {
    const storageKey = getSettingsKey(tenantId);
    const stored = localStorage.getItem(storageKey);
    const all = stored ? JSON.parse(stored) : {};
    all[key] = value;
    localStorage.setItem(storageKey, JSON.stringify(all));
  } catch {}
}

function SettingsContent() {
  const searchParams = useSearchParams();
  const { user, refreshUser } = useAuth();
  const tenantId = user?.tenantId;
  const [activeTab, setActiveTab] = useState("profile");
  const [saved, setSaved] = useState(false);
  const [savedTab, setSavedTab] = useState<string | null>(null);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && TABS.some((t) => t.id === tab)) setActiveTab(tab);
  }, [searchParams]);

  const [profile, setProfile] = useState(() => loadSettings("profile", {
    name: user?.name || "",
    email: user?.email || "",
    phone: "",
    department: user?.department || "",
    role: user?.role ? (USER_ROLE_LABELS[user.role] || user.role) : "",
    language: "English",
    timezone: "Asia/Kolkata",
  }, tenantId));

  const [passwords, setPasswords] = useState({ current: "", newPass: "", confirm: "" });

  const [general, setGeneral] = useState(() => loadSettings("general", {
    hospitalName: user?.tenantName || "City Central Hospital Network",
    language: "English",
    timezone: "Asia/Kolkata",
    dateFormat: "DD/MM/YYYY",
    currency: "INR",
    logo: "",
  }, tenantId));

  const [notifications, setNotifications] = useState(() => loadSettings("notifications", {
    emailNotifications: true,
    whatsappNotifications: true,
    browserNotifications: false,
    interviewReminders: true,
    applicationUpdates: true,
  }, tenantId));

  const [whatsapp, setWhatsapp] = useState(() => loadSettings("whatsapp", {
    apiKey: "whatsapp_api_key_xxx",
    phoneNumber: "+91 98765 43210",
    webhookUrl: "https://api.hospital.com/webhook/whatsapp",
    connected: true,
  }, tenantId));

  const [email, setEmail] = useState(() => loadSettings("email", {
    smtpHost: "smtp.gmail.com",
    smtpPort: "587",
    smtpUser: "hr@hospital.com",
    smtpPassword: "********",
    fromName: "HospitalRecruit HR",
    fromEmail: "hr@hospital.com",
    imapHost: "imap.gmail.com",
    imapPort: "993",
    imapUser: "hr@hospital.com",
    imapPassword: "********",
  }, tenantId));

  const [careerSite, setCareerSite] = useState(() => loadSettings("careerSite", {
    url: "https://careers.hospital.com",
    customDomain: "",
    themeColor: "#0D6EFD",
    enabled: true,
  }, tenantId));

  const handleSave = async () => {
    const t = activeTab;
    switch (t) {
      case "profile":
        saveSettings("profile", profile, tenantId);
        if (user) {
          const stored = localStorage.getItem("currentUser");
          if (stored) {
            const current = JSON.parse(stored);
            current.name = profile.name;
            current.email = profile.email;
            localStorage.setItem("currentUser", JSON.stringify(current));
          }
          await updateUser(user.id, { name: profile.name, email: profile.email });
          refreshUser();
        }
        break;
      case "general":
        saveSettings("general", general, tenantId);
        localStorage.setItem(tenantId ? `appLogo:${tenantId}` : "appLogo", general.logo);
        break;
      case "notifications": saveSettings("notifications", notifications, tenantId); break;
      case "whatsapp": saveSettings("whatsapp", whatsapp, tenantId); break;
      case "email": saveSettings("email", email, tenantId); break;
      case "career": saveSettings("careerSite", careerSite, tenantId); break;
    }
    setSavedTab(t);
    setSaved(true);
    setTimeout(() => { setSaved(false); setSavedTab(null); }, 2000);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setGeneral((g) => ({ ...g, logo: dataUrl }));
    };
    reader.readAsDataURL(file);
  };

  const inputClass = "w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15";
  const labelClass = "block text-sm font-medium text-text-primary mb-1.5";

  const renderTab = () => {
    switch (activeTab) {
      case "profile":
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-text-primary">My Profile</h3>
                  <Button variant="primary" onClick={handleSave}>{saved ? "Saved!" : "Save Changes"}</Button>
                </div>
              </CardHeader>
              <CardBody>
                <div className="flex items-center gap-6 mb-6 pb-6 border-b border-border">
                  <div className="relative">
                    <Avatar name={profile.name} size="xl" />
                    <button className="absolute bottom-0 right-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center border-2 border-surface hover:bg-primary-dark transition-colors">
                      <Camera className="w-4 h-4" />
                    </button>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-text-primary">{profile.name}</h3>
                    <p className="text-sm text-text-secondary">{profile.email}</p>
                    <Badge variant="primary" className="mt-2">{profile.role}</Badge>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div><label className={labelClass}>Full Name</label><input className={inputClass} value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} /></div>
                  <div><label className={labelClass}>Email</label><input type="email" className={inputClass} value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} /></div>
                  <div><label className={labelClass}>Phone</label><input className={inputClass} value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} /></div>
                  <div><label className={labelClass}>Department</label><input className={inputClass} value={profile.department} readOnly /></div>
                  <div><label className={labelClass}>Language</label><select className={inputClass} value={profile.language} onChange={(e) => setProfile({ ...profile, language: e.target.value })}>{["English", "Hindi", "Tamil", "Telugu"].map((l) => <option key={l}>{l}</option>)}</select></div>
                  <div><label className={labelClass}>Timezone</label><select className={inputClass} value={profile.timezone} onChange={(e) => setProfile({ ...profile, timezone: e.target.value })}><option>Asia/Kolkata</option><option>Asia/Dubai</option><option>Europe/London</option></select></div>
                </div>
              </CardBody>
            </Card>
            <Card>
              <CardHeader><h3 className="text-lg font-semibold text-text-primary">Change Password</h3></CardHeader>
              <CardBody>
                <div className="max-w-md space-y-4">
                  <div><label className={labelClass}>Current Password</label><input type="password" className={inputClass} value={passwords.current} onChange={(e) => setPasswords({ ...passwords, current: e.target.value })} placeholder="Enter current password" /></div>
                  <div><label className={labelClass}>New Password</label><input type="password" className={inputClass} value={passwords.newPass} onChange={(e) => setPasswords({ ...passwords, newPass: e.target.value })} placeholder="Enter new password" /></div>
                  <div><label className={labelClass}>Confirm Password</label><input type="password" className={inputClass} value={passwords.confirm} onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })} placeholder="Confirm new password" /></div>
                  <Button variant="primary" iconLeft={<Lock className="w-4 h-4" />} onClick={handleSave}>{saved ? "Updated!" : "Update Password"}</Button>
                </div>
              </CardBody>
            </Card>
          </div>
        );
      case "general":
        return (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div><h3 className="text-lg font-semibold text-text-primary">General Settings</h3><p className="text-sm text-text-secondary mt-1">Configure basic hospital information</p></div>
                <Button variant="primary" onClick={handleSave}>{saved ? "Saved!" : "Save Changes"}</Button>
              </div>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div><label className={labelClass}>Hospital Name</label><input className={inputClass} value={general.hospitalName} onChange={(e) => setGeneral({ ...general, hospitalName: e.target.value })} /></div>
                <div><label className={labelClass}>Default Language</label><select className={inputClass} value={general.language} onChange={(e) => setGeneral({ ...general, language: e.target.value })}>{["English", "Hindi", "Tamil", "Telugu", "Kannada", "Malayalam"].map((l) => <option key={l}>{l}</option>)}</select></div>
                <div><label className={labelClass}>Timezone</label><select className={inputClass} value={general.timezone} onChange={(e) => setGeneral({ ...general, timezone: e.target.value })}><option>Asia/Kolkata</option><option>Asia/Dubai</option><option>Europe/London</option></select></div>
                <div><label className={labelClass}>Date Format</label><select className={inputClass} value={general.dateFormat} onChange={(e) => setGeneral({ ...general, dateFormat: e.target.value })}><option>DD/MM/YYYY</option><option>MM/DD/YYYY</option><option>YYYY-MM-DD</option></select></div>
                <div><label className={labelClass}>Currency</label><select className={inputClass} value={general.currency} onChange={(e) => setGeneral({ ...general, currency: e.target.value })}><option>INR</option><option>USD</option><option>EUR</option></select></div>
                <div><label className={labelClass}>Hospital Logo</label><div className="flex items-center gap-3">{general.logo ? <img src={general.logo} alt="Logo" className="w-12 h-12 rounded-lg object-contain border border-border" /> : <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-text-muted text-xs">Logo</div>}<label className="px-3 py-1.5 text-sm font-medium border border-border rounded-lg cursor-pointer hover:bg-background transition-colors">Upload<input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} /></label></div></div>
              </div>
            </CardBody>
          </Card>
        );
      case "notifications":
        return (
          <Card>
            <CardHeader><div className="flex items-center justify-between"><div><h3 className="text-lg font-semibold text-text-primary">Notification Settings</h3><p className="text-sm text-text-secondary mt-1">Configure notification preferences</p></div><Button variant="primary" onClick={handleSave}>{saved ? "Saved!" : "Save Changes"}</Button></div></CardHeader>
            <CardBody>
              <div className="space-y-3">
                {Object.entries({ emailNotifications: ["Email Notifications", "Send notifications via email"], whatsappNotifications: ["WhatsApp Notifications", "Send notifications via WhatsApp"], browserNotifications: ["Browser Notifications", "Show browser push notifications"], interviewReminders: ["Interview Reminders", "Reminders before scheduled interviews"], applicationUpdates: ["Application Updates", "Status change notifications"] }).map(([key, [label, desc]]) => (
                  <div key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div><p className="font-medium text-text-primary">{label}</p><p className="text-sm text-text-secondary">{desc}</p></div>
                    <button onClick={() => setNotifications({ ...notifications, [key]: !notifications[key as keyof typeof notifications] })} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${notifications[key as keyof typeof notifications] ? "bg-primary" : "bg-gray-300"}`}>
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notifications[key as keyof typeof notifications] ? "translate-x-6" : "translate-x-1"}`} />
                    </button>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        );
      case "whatsapp":
        return (
          <Card>
            <CardHeader><div className="flex items-center justify-between"><div><h3 className="text-lg font-semibold text-text-primary">WhatsApp Integration</h3><p className="text-sm text-text-secondary mt-1">Configure WhatsApp Business API</p></div><Button variant="primary" onClick={handleSave}>{saved ? "Saved!" : "Save Changes"}</Button></div></CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                <div><label className={labelClass}>API Key</label><input type="password" className={inputClass} value={whatsapp.apiKey} onChange={(e) => setWhatsapp({ ...whatsapp, apiKey: e.target.value })} /></div>
                <div><label className={labelClass}>Phone Number</label><input className={inputClass} value={whatsapp.phoneNumber} onChange={(e) => setWhatsapp({ ...whatsapp, phoneNumber: e.target.value })} /></div>
                <div className="md:col-span-2"><label className={labelClass}>Webhook URL</label><input className={inputClass} value={whatsapp.webhookUrl} onChange={(e) => setWhatsapp({ ...whatsapp, webhookUrl: e.target.value })} /></div>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3"><div className={`w-3 h-3 rounded-full ${whatsapp.connected ? "bg-green-500" : "bg-red-500"}`} /><span className="font-medium text-text-primary">Status:</span><Badge variant={whatsapp.connected ? "success" : "danger"}>{whatsapp.connected ? "Connected" : "Disconnected"}</Badge></div>
                <Button variant="outline" size="sm">Test Connection</Button>
              </div>
            </CardBody>
          </Card>
        );
      case "email":
        return (
          <Card>
            <CardHeader><div className="flex items-center justify-between"><div><h3 className="text-lg font-semibold text-text-primary">Email Integration</h3><p className="text-sm text-text-secondary mt-1">Configure SMTP and IMAP settings</p></div><Button variant="primary" onClick={handleSave}>{saved ? "Saved!" : "Save Changes"}</Button></div></CardHeader>
            <CardBody>
              <div className="mb-6">
                <h4 className="font-semibold text-text-primary mb-3">SMTP Settings (Sending)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div><label className={labelClass}>SMTP Host</label><input className={inputClass} value={email.smtpHost} onChange={(e) => setEmail({ ...email, smtpHost: e.target.value })} placeholder="smtp.gmail.com" /></div>
                  <div><label className={labelClass}>SMTP Port</label><input className={inputClass} value={email.smtpPort} onChange={(e) => setEmail({ ...email, smtpPort: e.target.value })} placeholder="587" /></div>
                  <div><label className={labelClass}>SMTP User</label><input className={inputClass} value={email.smtpUser} onChange={(e) => setEmail({ ...email, smtpUser: e.target.value })} placeholder="hr@hospital.com" /></div>
                  <div><label className={labelClass}>SMTP Password</label><input type="password" className={inputClass} value={email.smtpPassword} onChange={(e) => setEmail({ ...email, smtpPassword: e.target.value })} /></div>
                  <div><label className={labelClass}>From Name</label><input className={inputClass} value={email.fromName} onChange={(e) => setEmail({ ...email, fromName: e.target.value })} /></div>
                  <div><label className={labelClass}>From Email</label><input className={inputClass} value={email.fromEmail} onChange={(e) => setEmail({ ...email, fromEmail: e.target.value })} /></div>
                </div>
                <div className="mt-4">
                  <TestConnectionButton type="smtp" host={email.smtpHost} port={email.smtpPort} user={email.smtpUser} />
                </div>
              </div>
              <div className="mb-6 pt-6 border-t border-border">
                <h4 className="font-semibold text-text-primary mb-3">IMAP Settings (Receiving)</h4>
                <p className="text-sm text-text-secondary mb-4">Configure IMAP to receive and sync emails from your inbox into the system.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div><label className={labelClass}>IMAP Host</label><input className={inputClass} value={email.imapHost} onChange={(e) => setEmail({ ...email, imapHost: e.target.value })} placeholder="imap.gmail.com" /></div>
                  <div><label className={labelClass}>IMAP Port</label><input className={inputClass} value={email.imapPort} onChange={(e) => setEmail({ ...email, imapPort: e.target.value })} placeholder="993" /></div>
                  <div><label className={labelClass}>IMAP User</label><input className={inputClass} value={email.imapUser} onChange={(e) => setEmail({ ...email, imapUser: e.target.value })} placeholder="hr@hospital.com" /></div>
                  <div><label className={labelClass}>IMAP Password</label><input type="password" className={inputClass} value={email.imapPassword} onChange={(e) => setEmail({ ...email, imapPassword: e.target.value })} /></div>
                </div>
                <div className="mt-4">
                  <TestConnectionButton type="imap" host={email.imapHost} port={email.imapPort} user={email.imapUser} />
                </div>
                <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h5 className="font-medium text-blue-800 text-sm mb-1">IMAP Configuration Tips</h5>
                  <ul className="text-xs text-blue-700 space-y-1">
                    <li>• <strong>Gmail:</strong> Host: imap.gmail.com, Port: 993, Use app password</li>
                    <li>• <strong>Outlook:</strong> Host: outlook.office365.com, Port: 993</li>
                    <li>• <strong>Yahoo:</strong> Host: imap.mail.yahoo.com, Port: 993</li>
                    <li>• Enable 2FA and generate an app password for better security</li>
                  </ul>
                </div>
              </div>
            </CardBody>
          </Card>
        );
      case "roles":
        return <RolesPermissionsTab />;

      case "career":
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader><div className="flex items-center justify-between"><div><h3 className="text-lg font-semibold text-text-primary">Career Site</h3><p className="text-sm text-text-secondary mt-1">Configure your public career site</p></div><Button variant="primary" onClick={handleSave}>{saved ? "Saved!" : "Save Changes"}</Button></div></CardHeader>
              <CardBody>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                  <div><label className={labelClass}>Career Site URL</label><input className={inputClass} value={careerSite.url} onChange={(e) => setCareerSite({ ...careerSite, url: e.target.value })} /></div>
                  <div><label className={labelClass}>Custom Domain</label><input className={inputClass} placeholder="careers.yourdomain.com" value={careerSite.customDomain} onChange={(e) => setCareerSite({ ...careerSite, customDomain: e.target.value })} /></div>
                  <div>
                    <label className={labelClass}>Theme Color</label>
                    <div className="flex items-center gap-3">
                      <input type="color" value={careerSite.themeColor} onChange={(e) => setCareerSite({ ...careerSite, themeColor: e.target.value })} className="w-10 h-10 border rounded cursor-pointer" />
                      <input className={inputClass} value={careerSite.themeColor} onChange={(e) => setCareerSite({ ...careerSite, themeColor: e.target.value })} />
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div><p className="font-medium text-text-primary">Enable Career Site</p><p className="text-sm text-text-secondary">Make your career site publicly accessible</p></div>
                  <button onClick={() => setCareerSite({ ...careerSite, enabled: !careerSite.enabled })} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${careerSite.enabled ? "bg-primary" : "bg-gray-300"}`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${careerSite.enabled ? "translate-x-6" : "translate-x-1"}`} />
                  </button>
                </div>
              </CardBody>
            </Card>
            <Card>
              <CardHeader><h3 className="text-lg font-semibold text-text-primary">Theme Preview</h3></CardHeader>
              <CardBody>
                <div className="rounded-xl border border-border overflow-hidden">
                  <div className="px-6 py-4 text-white font-semibold text-lg" style={{ backgroundColor: careerSite.themeColor }}>
                    {general.hospitalName || "Hospital Name"}
                  </div>
                  <div className="px-6 py-4 bg-white border-b border-border">
                    <div className="flex items-center gap-4 text-sm">
                      <span className="font-medium" style={{ color: careerSite.themeColor }}>Open Positions</span>
                      <span className="text-gray-500">About Us</span>
                      <span className="text-gray-500">Contact</span>
                    </div>
                  </div>
                  <div className="px-6 py-8 bg-gray-50">
                    <div className="max-w-md">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Join Our Team</h3>
                      <p className="text-sm text-gray-600 mb-4">We are looking for talented professionals to join our healthcare team.</p>
                      <button className="px-4 py-2 rounded-lg text-white text-sm font-medium" style={{ backgroundColor: careerSite.themeColor }}>View Open Positions</button>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-text-muted mt-3">Live preview — changes apply when you save</p>
              </CardBody>
            </Card>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div>
      <PageHeader title="Settings" subtitle="Configure your recruitment system" />
      <div className="flex border-b border-border mb-6 overflow-x-auto">
        {TABS.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${activeTab === tab.id ? "border-primary text-primary" : "border-transparent text-text-secondary hover:text-text-primary"}`}>
            {tab.label}
          </button>
        ))}
      </div>
      {renderTab()}
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>}>
      <SettingsContent />
    </Suspense>
  );
}
