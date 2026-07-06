"use client";

import React, { useState } from "react";
import { 
  Building2, 
  Users, 
  CreditCard, 
  DollarSign, 
  Activity, 
  CheckCircle, 
  XCircle, 
  Search, 
  Plus, 
  Trash2,
  ExternalLink,
  Loader2,
  Calendar,
  Layers,
  ArrowRightLeft
} from "lucide-react";

interface SchoolData {
  id: string;
  name: string;
  slug: string;
  themeColor: string;
  logo: string | null;
  tagline: string | null;
  isActive: string;
  createdAt: Date;
  subscription: {
    name: string;
    price: number;
  } | null;
  _count: {
    users: number;
  };
}

interface SubscriptionData {
  id: string;
  name: string;
  price: number;
  duration: string;
  maxStudents: number;
  maxTeachers: number;
  features: string; // JSON
  _count: {
    schools: number;
  };
}

interface AuditLogData {
  id: string;
  action: string;
  details: string;
  createdAt: Date;
  user: {
    name: string;
    email: string;
    role: string;
  };
}

interface SuperAdminDashboardProps {
  initialSchools: SchoolData[];
  initialSubscriptions: SubscriptionData[];
  initialAuditLogs: AuditLogData[];
  stats: {
    totalSchools: number;
    totalUsers: number;
    totalRevenue: number;
    activeSubs: number;
  };
}

export default function SuperAdminDashboard({
  initialSchools,
  initialSubscriptions,
  initialAuditLogs,
  stats
}: SuperAdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "schools" | "subscriptions" | "logs">("overview");
  const [schools, setSchools] = useState<SchoolData[]>(initialSchools);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modals / Actions loading state
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  
  // Form states for creating a new school
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSchoolName, setNewSchoolName] = useState("");
  const [newSchoolSlug, setNewSchoolSlug] = useState("");
  const [newSchoolSub, setNewSchoolSub] = useState(initialSubscriptions[0]?.id || "");
  const [createError, setCreateError] = useState<string | null>(null);
  const [createLoading, setCreateLoading] = useState(false);

  // Toggle school active/blocked state
  const handleToggleActive = async (schoolId: string, currentStatus: string) => {
    setActionLoadingId(schoolId);
    const newStatus = currentStatus === "active" ? "blocked" : "active";

    try {
      const response = await fetch("/api/admin/schools", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: schoolId, isActive: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      setSchools(
        schools.map((school) =>
          school.id === schoolId ? { ...school, isActive: newStatus } : school
        )
      );
    } catch (error) {
      console.error("Error updating school status:", error);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Create school handler
  const handleCreateSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError(null);

    try {
      const response = await fetch("/api/admin/schools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newSchoolName,
          slug: newSchoolSlug.toLowerCase(),
          subscriptionId: newSchoolSub,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create school");
      }

      // Add new school to the local state
      setSchools([data.school, ...schools]);
      setShowCreateModal(false);
      setNewSchoolName("");
      setNewSchoolSlug("");
    } catch (err: any) {
      setCreateError(err.message || "An error occurred.");
    } finally {
      setCreateLoading(false);
    }
  };

  // Filters schools based on search
  const filteredSchools = schools.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Welcome Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Super Admin Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            Monitor all academies, active plans, revenue, and system-wide logs.
          </p>
        </div>
        
        {/* Tab Switcher */}
        <div className="flex bg-muted p-1 rounded-lg border border-border text-xs font-semibold shrink-0">
          {[
            { id: "overview", label: "Overview" },
            { id: "schools", label: "Academies" },
            { id: "subscriptions", label: "Plans" },
            { id: "logs", label: "Audit Logs" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-md transition-all ${
                activeTab === tab.id
                  ? "bg-card text-foreground shadow"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* TAB CONTENT: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="space-y-8">
          {/* Dashboard Stats */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-card border border-border p-6 rounded-xl flex items-center gap-4 shadow-sm relative overflow-hidden">
              <div className="p-3 bg-blue-500/10 rounded-lg text-blue-600 dark:text-blue-400">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-extrabold">{stats.totalSchools}</p>
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Total Academies</p>
              </div>
            </div>

            <div className="bg-card border border-border p-6 rounded-xl flex items-center gap-4 shadow-sm">
              <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-600 dark:text-emerald-400">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-extrabold">{stats.totalUsers}</p>
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Registered Users</p>
              </div>
            </div>

            <div className="bg-card border border-border p-6 rounded-xl flex items-center gap-4 shadow-sm">
              <div className="p-3 bg-amber-500/10 rounded-lg text-amber-500">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-extrabold">{stats.activeSubs}</p>
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Active Subscriptions</p>
              </div>
            </div>

            <div className="bg-card border border-border p-6 rounded-xl flex items-center gap-4 shadow-sm">
              <div className="p-3 bg-rose-500/10 rounded-lg text-rose-600 dark:text-rose-400">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-extrabold">${stats.totalRevenue.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Monthly Recurring Rev</p>
              </div>
            </div>
          </div>

          {/* Quick Overview Tables */}
          <div className="grid lg:grid-cols-12 gap-8">
            {/* Recent Schools */}
            <div className="lg:col-span-7 bg-card border border-border rounded-xl shadow-sm p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-border pb-3">
                <h3 className="font-bold text-base flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" />
                  <span>Recent School Registrations</span>
                </h3>
                <button onClick={() => setActiveTab("schools")} className="text-xs font-semibold text-primary hover:underline">
                  View all
                </button>
              </div>

              <div className="divide-y divide-border">
                {schools.slice(0, 4).map((school, idx) => (
                  <div key={idx} className="py-3 flex justify-between items-center text-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center font-bold text-primary">
                        {school.name.charAt(0)}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold">{school.name}</span>
                        <span className="text-xs text-muted-foreground font-mono">slug: {school.slug}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded border">
                        {school.subscription?.name || "No Plan"}
                      </span>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        school.isActive === "active" ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"
                      }`}>
                        {school.isActive}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Subscription Distribution */}
            <div className="lg:col-span-5 bg-card border border-border rounded-xl shadow-sm p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-border pb-3">
                <h3 className="font-bold text-base flex items-center gap-2">
                  <Layers className="w-5 h-5 text-primary" />
                  <span>Plan Analytics</span>
                </h3>
              </div>

              <div className="space-y-4">
                {initialSubscriptions.map((sub, idx) => {
                  const percentage = stats.totalSchools > 0 ? (sub._count.schools / stats.totalSchools) * 100 : 0;
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span>{sub.name} (${sub.price}/mo)</span>
                        <span className="text-muted-foreground">{sub._count.schools} Schools ({Math.round(percentage)}%)</span>
                      </div>
                      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full transition-all" 
                          style={{ width: `${percentage}%` }} 
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: SCHOOLS */}
      {activeTab === "schools" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search schools by name or slug..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>

            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-bold hover:bg-primary-hover shadow flex items-center justify-center gap-1 text-sm shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add Academy</span>
            </button>
          </div>

          {/* Schools Table */}
          <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-muted text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border">
                    <th className="p-4 font-bold">School Name</th>
                    <th className="p-4 font-bold">Slug URL</th>
                    <th className="p-4 font-bold">Plan Tiers</th>
                    <th className="p-4 font-bold">Users</th>
                    <th className="p-4 font-bold">Status</th>
                    <th className="p-4 font-bold">Created At</th>
                    <th className="p-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredSchools.length > 0 ? (
                    filteredSchools.map((school) => (
                      <tr key={school.id} className="hover:bg-muted/30">
                        <td className="p-4 font-bold">{school.name}</td>
                        <td className="p-4 font-mono text-xs text-muted-foreground">{school.slug}</td>
                        <td className="p-4">
                          <span className="font-semibold text-xs bg-muted px-2 py-0.5 border rounded">
                            {school.subscription?.name || "No Plan"}
                          </span>
                        </td>
                        <td className="p-4 text-xs font-semibold text-muted-foreground">{school._count.users} users</td>
                        <td className="p-4">
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                            school.isActive === "active" ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"
                          }`}>
                            {school.isActive}
                          </span>
                        </td>
                        <td className="p-4 text-xs text-muted-foreground">
                          {new Date(school.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => handleToggleActive(school.id, school.isActive)}
                              disabled={actionLoadingId === school.id}
                              className={`p-1.5 rounded border text-xs font-bold shadow-sm transition-all ${
                                school.isActive === "active"
                                  ? "border-rose-500/20 text-rose-600 hover:bg-rose-500/5"
                                  : "border-emerald-500/20 text-emerald-600 hover:bg-emerald-500/5"
                              }`}
                            >
                              {actionLoadingId === school.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : school.isActive === "active" ? (
                                "Block"
                              ) : (
                                "Approve"
                              )}
                            </button>
                            <a
                              href={`/schools/${school.slug}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 rounded border border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                              title="Visit Portal"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-muted-foreground">
                        No academies found matching search queries.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: PLANS */}
      {activeTab === "subscriptions" && (
        <div className="grid md:grid-cols-3 gap-6">
          {initialSubscriptions.map((sub) => (
            <div key={sub.id} className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-extrabold text-xl">{sub.name}</h3>
                  <span className="text-xs bg-primary/10 text-primary font-bold px-2 py-0.5 rounded">
                    {sub._count.schools} Schools
                  </span>
                </div>
                <div className="flex items-baseline gap-1 mb-6 border-b border-border pb-4">
                  <span className="text-3xl font-extrabold">${sub.price}</span>
                  <span className="text-xs text-muted-foreground">/{sub.duration}</span>
                </div>

                <div className="space-y-3.5 text-sm font-semibold mb-6">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Max Students:</span>
                    <span>{sub.maxStudents}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Max Teachers:</span>
                    <span>{sub.maxTeachers}</span>
                  </div>
                  <div className="pt-2">
                    <span className="text-xs text-muted-foreground block mb-2 uppercase tracking-wider font-bold">Enabled Modules:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {JSON.parse(sub.features).map((feat: string, idx: number) => (
                        <span key={idx} className="text-[10px] font-bold bg-muted px-2 py-0.5 rounded border">
                          {feat.replace("_", " ")}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB CONTENT: LOGS */}
      {activeTab === "logs" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="font-bold text-base flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-primary" />
              <span>System Audit Logs</span>
            </h3>
          </div>

          <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-muted text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border">
                    <th className="p-4 font-bold">Timestamp</th>
                    <th className="p-4 font-bold">Actor</th>
                    <th className="p-4 font-bold">Action</th>
                    <th className="p-4 font-bold">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {initialAuditLogs.length > 0 ? (
                    initialAuditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-muted/30">
                        <td className="p-4 text-xs text-muted-foreground font-mono">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-xs">{log.user.name}</span>
                            <span className="text-[10px] text-muted-foreground">{log.user.email} ({log.user.role})</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="text-xs font-extrabold bg-muted px-2 py-0.5 border rounded text-primary">
                            {log.action}
                          </span>
                        </td>
                        <td className="p-4 text-xs text-muted-foreground leading-relaxed">
                          {log.details}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-muted-foreground">
                        No audit logs recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* CREATE SCHOOL MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card text-card-foreground border border-border w-full max-w-md rounded-2xl shadow-2xl p-6 relative animate-in zoom-in duration-200">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute right-4 top-4 p-1.5 rounded-lg border border-border hover:bg-muted"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold mb-1">Create School Academy</h3>
            <p className="text-xs text-muted-foreground mb-6">
              Manually add a school academy and assign a default subscription model.
            </p>

            {createError && (
              <div className="mb-4 p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-lg text-xs flex items-center gap-2">
                <XCircle className="w-4 h-4" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSchool} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground" htmlFor="modal-name">
                  Academy Name
                </label>
                <input
                  id="modal-name"
                  type="text"
                  required
                  placeholder="e.g. Cambridge Academy"
                  value={newSchoolName}
                  onChange={(e) => setNewSchoolName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground" htmlFor="modal-slug">
                  Domain Slug
                </label>
                <input
                  id="modal-slug"
                  type="text"
                  required
                  placeholder="e.g. cambridge"
                  value={newSchoolSlug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground" htmlFor="modal-sub">
                  Subscription Tier
                </label>
                <select
                  id="modal-sub"
                  value={newSchoolSub}
                  onChange={(e) => setNewSchoolSub(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                >
                  {initialSubscriptions.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name} (${sub.price}/mo)
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={createLoading}
                className="w-full py-3.5 mt-4 rounded-lg bg-primary text-primary-foreground font-bold hover:bg-primary-hover shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {createLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating Academy...</span>
                  </>
                ) : (
                  <span>Create Academy</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
