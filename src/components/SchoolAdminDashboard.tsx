"use client";

import React, { useState } from "react";
import {
  Layers,
  Users,
  UserCheck,
  DollarSign,
  Globe,
  Plus,
  Trash2,
  Calendar,
  Layers2,
  BookOpen,
  GraduationCap,
  Sparkles,
  Loader2,
  Save,
  CheckCircle,
  AlertCircle,
  Megaphone,
  Send
} from "lucide-react";

interface TeacherData {
  id: string;
  payrollSalary: number;
  bio: string | null;
  qualifications: string | null;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface StudentData {
  id: string;
  studentId: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  class: {
    name: string;
  } | null;
  parent: {
    user: {
      name: string;
    };
  } | null;
}

interface ParentData {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface ClassData {
  id: string;
  name: string;
  formTeacher: {
    user: {
      name: string;
    };
  } | null;
  _count: {
    students: number;
    subjects: number;
  };
}

interface SubjectData {
  id: string;
  name: string;
  class: {
    name: string;
  };
  teacher: {
    user: {
      name: string;
    };
  } | null;
}

interface SessionData {
  id: string;
  name: string;
  isCurrent: boolean;
}

interface TermData {
  id: string;
  name: string;
  isCurrent: boolean;
  session: {
    name: string;
  };
}

interface FeeData {
  id: string;
  title: string;
  amount: number;
  dueDate: Date;
  _count: {
    payments: number;
  };
}

interface SchoolProfile {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  themeColor: string;
  tagline: string | null;
  about: string | null;
}

interface SchoolAdminDashboardProps {
  teachers: TeacherData[];
  students: StudentData[];
  parents: ParentData[];
  classes: ClassData[];
  subjects: SubjectData[];
  sessions: SessionData[];
  terms: TermData[];
  fees: FeeData[];
  school: SchoolProfile;
}

export default function SchoolAdminDashboard({
  teachers,
  students,
  parents,
  classes,
  subjects,
  sessions,
  terms,
  fees,
  school,
}: SchoolAdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "structure" | "users" | "fees" | "website" | "announcements">("overview");

  // Local State Arrays
  const [localSessions, setLocalSessions] = useState<SessionData[]>(sessions);
  const [localTerms, setLocalTerms] = useState<TermData[]>(terms);
  const [localClasses, setLocalClasses] = useState<ClassData[]>(classes);
  const [localSubjects, setLocalSubjects] = useState<SubjectData[]>(subjects);
  const [localTeachers, setLocalTeachers] = useState<TeacherData[]>(teachers);
  const [localStudents, setLocalStudents] = useState<StudentData[]>(students);
  const [localFees, setLocalFees] = useState<FeeData[]>(fees);
  const [localAnnouncements, setLocalAnnouncements] = useState<any[]>([]);

  // Announcement Form states
  const [annTitle, setAnnTitle] = useState("");
  const [annContent, setAnnContent] = useState("");
  const [annTarget, setAnnTarget] = useState<"ALL" | "TEACHERS" | "STUDENTS">("ALL");

  // loading and notices
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Form states
  const [sessName, setSessName] = useState("");
  const [termName, setTermName] = useState("");
  const [termSessId, setTermSessId] = useState(sessions[0]?.id || "");
  const [className, setClassName] = useState("");
  const [classTeacherId, setClassTeacherId] = useState("");
  const [subName, setSubName] = useState("");
  const [subClassId, setSubClassId] = useState(classes[0]?.id || "");
  const [subTeacherId, setSubTeacherId] = useState("");

  // Website Settings
  const [logoUrl, setLogoUrl] = useState(school.logo || "");
  const [themeColor, setThemeColor] = useState(school.themeColor);
  const [tagline, setTagline] = useState(school.tagline || "");
  const [aboutText, setAboutText] = useState(school.about || "");

  // User Signup states
  const [userTab, setUserTab] = useState<"teacher" | "student" | "parent">("teacher");
  const [uName, setUName] = useState("");
  const [uEmail, setUEmail] = useState("");
  const [uPass, setUPass] = useState("password123"); // default
  // teacher extra
  const [tSalary, setTSalary] = useState(3000);
  const [tBio, setTBio] = useState("");
  const [tQual, setTQual] = useState("");
  // student extra
  const [sParentId, setSParentId] = useState("");
  const [sClassId, setSClassId] = useState("");

  // Fees State
  const [feeTitle, setFeeTitle] = useState("");
  const [feeAmount, setFeeAmount] = useState(100);
  const [feeDate, setFeeDate] = useState("");

  // Report card compilation states
  const [selectedReportStudent, setSelectedReportStudent] = useState<any | null>(null);
  const [reportRemarks, setReportRemarks] = useState("");
  const [compiledReportCardId, setCompiledReportCardId] = useState<string | null>(null);

  const handleCompileReportCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReportStudent) return;
    setIsLoading(true);

    const activeSession = localSessions.find(s => s.isCurrent)?.name || "2026/2027";
    const activeTerm = localTerms.find(t => t.isCurrent)?.name || "First Term";

    try {
      const res = await fetch("/api/admin/report-cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: selectedReportStudent.id,
          termName: activeTerm,
          sessionName: activeSession,
          remarks: reportRemarks,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setCompiledReportCardId(data.reportCard.id);
      triggerFeedback("success", "Student report card compiled successfully!");
      setReportRemarks("");
    } catch (err: any) {
      triggerFeedback("error", err.message || "Failed to compile report card");
    } finally {
      setIsLoading(false);
    }
  };

  const triggerFeedback = (type: "success" | "error", msg: string) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 5000);
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/structure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "session", name: sessName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setLocalSessions([...localSessions, data.session]);
      setSessName("");
      triggerFeedback("success", "Academic Session created successfully!");
    } catch (err: any) {
      triggerFeedback("error", err.message || "Failed to create session");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTerm = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/structure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "term", name: termName, sessionId: termSessId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setLocalTerms([...localTerms, data.term]);
      setTermName("");
      triggerFeedback("success", "Academic Term created successfully!");
    } catch (err: any) {
      triggerFeedback("error", err.message || "Failed to create term");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/structure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "class", name: className, formTeacherId: classTeacherId || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setLocalClasses([...localClasses, data.class]);
      setClassName("");
      triggerFeedback("success", "Classroom created successfully!");
    } catch (err: any) {
      triggerFeedback("error", err.message || "Failed to create class");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/structure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "subject", name: subName, classId: subClassId, teacherId: subTeacherId || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setLocalSubjects([...localSubjects, data.subject]);
      setSubName("");
      triggerFeedback("success", "Subject created and assigned!");
    } catch (err: any) {
      triggerFeedback("error", err.message || "Failed to create subject");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const body: any = {
        name: uName,
        email: uEmail,
        password: uPass,
        role: userTab.toUpperCase(),
      };

      if (userTab === "teacher") {
        body.payrollSalary = tSalary;
        body.bio = tBio;
        body.qualifications = tQual;
      } else if (userTab === "student") {
        body.parentId = sParentId || null;
        body.classId = sClassId || null;
      }

      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (userTab === "teacher") {
        setLocalTeachers([...localTeachers, data.profile]);
      } else if (userTab === "student") {
        setLocalStudents([...localStudents, data.profile]);
      }
      
      // Clear forms
      setUName("");
      setUEmail("");
      setUPass("password123");
      setTBio("");
      setTQual("");
      triggerFeedback("success", `${userTab.charAt(0).toUpperCase() + userTab.slice(1)} account created successfully!`);
    } catch (err: any) {
      triggerFeedback("error", err.message || "Failed to create user");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateFee = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/fees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: feeTitle, amount: parseFloat(feeAmount.toString()), dueDate: feeDate }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setLocalFees([...localFees, data.fee]);
      setFeeTitle("");
      setFeeDate("");
      triggerFeedback("success", "Tuition Invoice issued successfully!");
    } catch (err: any) {
      triggerFeedback("error", err.message || "Failed to create invoice");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateWebsite = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/website", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logo: logoUrl, themeColor, tagline, about: aboutText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      triggerFeedback("success", "Website configurations saved!");
    } catch (err: any) {
      triggerFeedback("error", err.message || "Failed to save configurations");
    } finally {
      setIsLoading(false);
    }
  };

  // Load Announcements bulletins on tab focus
  React.useEffect(() => {
    if (activeTab === "announcements") {
      const fetchAnnouncements = async () => {
        try {
          const res = await fetch("/api/admin/announcements");
          const data = await res.json();
          if (res.ok) {
            setLocalAnnouncements(data.announcements);
          }
        } catch (err) {
          console.error("Failed to load school bulletins:", err);
        }
      };
      fetchAnnouncements();
    }
  }, [activeTab]);

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: annTitle,
          content: annContent,
          target: annTarget,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setLocalAnnouncements([data.announcement, ...localAnnouncements]);
      setAnnTitle("");
      setAnnContent("");
      setAnnTarget("ALL");
      triggerFeedback("success", "School broadcast alert posted successfully!");
    } catch (err: any) {
      triggerFeedback("error", err.message || "Failed to broadcast bulletin alert");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">{school.name} Admin</h1>
          <p className="text-muted-foreground text-sm">
            Configure semesters, class sections, roster registers, tuition billing, and your school website portal.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-muted p-1 rounded-lg border border-border text-xs font-semibold shrink-0">
          {[
            { id: "overview", label: "Overview" },
            { id: "structure", label: "Academic Layout" },
            { id: "users", label: "Users & Accounts" },
            { id: "fees", label: "Billing" },
            { id: "website", label: "Website Builder" },
            { id: "announcements", label: "Bulletins" },
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

      {/* Notifications / Alerts feedback */}
      {feedback && (
        <div className={`p-4 rounded-lg flex items-center gap-3 text-sm border animate-in slide-in-from-top ${
          feedback.type === "success"
            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
            : "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400"
        }`}>
          {feedback.type === "success" ? <CheckCircle className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
          <span>{feedback.msg}</span>
        </div>
      )}

      {/* 1. OVERVIEW TAB */}
      {activeTab === "overview" && (
        <div className="space-y-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-card border border-border p-6 rounded-xl flex items-center gap-4 shadow-sm">
              <div className="p-3 bg-blue-500/10 rounded-lg text-blue-600">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-extrabold">{localStudents.length}</p>
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Students</p>
              </div>
            </div>

            <div className="bg-card border border-border p-6 rounded-xl flex items-center gap-4 shadow-sm">
              <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-600">
                <UserCheck className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-extrabold">{localTeachers.length}</p>
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Teachers</p>
              </div>
            </div>

            <div className="bg-card border border-border p-6 rounded-xl flex items-center gap-4 shadow-sm">
              <div className="p-3 bg-amber-500/10 rounded-lg text-amber-500">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-extrabold">{localClasses.length}</p>
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Classrooms</p>
              </div>
            </div>

            <div className="bg-card border border-border p-6 rounded-xl flex items-center gap-4 shadow-sm">
              <div className="p-3 bg-purple-500/10 rounded-lg text-purple-600">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-extrabold">{localFees.length}</p>
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Invoices Issued</p>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
              <h3 className="font-bold border-b border-border pb-3 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <span>Academic Configurations</span>
              </h3>
              <div className="space-y-3.5 text-sm font-semibold">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current Session:</span>
                  <span>{localSessions.find(s => s.isCurrent)?.name || "None Configured"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current Semester Term:</span>
                  <span>{localTerms.find(t => t.isCurrent)?.name || "None Configured"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subdomain URL Path:</span>
                  <a href={`/schools/${school.slug}`} target="_blank" rel="noreferrer" className="text-primary hover:underline font-mono text-xs">
                    {`/schools/${school.slug}`}
                  </a>
                </div>
              </div>
            </div>
            
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
              <h3 className="font-bold border-b border-border pb-3 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary" />
                <span>Invoice Status Overview</span>
              </h3>
              <div className="space-y-4">
                {localFees.slice(0, 3).map((fee, idx) => (
                  <div key={idx} className="flex justify-between text-xs font-semibold items-center bg-muted p-3 rounded-lg border">
                    <div className="flex flex-col">
                      <span className="font-bold">{fee.title}</span>
                      <span className="text-[10px] text-muted-foreground mt-0.5">Due: {new Date(fee.dueDate).toLocaleDateString()}</span>
                    </div>
                    <span className="text-sm font-extrabold text-foreground">${fee.amount.toFixed(2)}</span>
                  </div>
                ))}
                {localFees.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">No tuition invoices issued.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. ACADEMIC STRUCTURE TAB */}
      {activeTab === "structure" && (
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          
          {/* Create Items Sidebar Forms (5 columns) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Create Session */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-sm flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-primary" />
                <span>1. Add Session Year</span>
              </h3>
              <form onSubmit={handleCreateSession} className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="e.g. 2025/2026"
                  value={sessName}
                  onChange={(e) => setSessName(e.target.value)}
                  className="flex-1 px-3 py-2 bg-muted border border-border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent transition-all"
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-3.5 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:bg-primary-hover shadow shrink-0 flex items-center justify-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create</span>
                </button>
              </form>
            </div>

            {/* Create Term */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-sm flex items-center gap-1.5">
                <Layers2 className="w-4 h-4 text-primary" />
                <span>2. Add Academic Term</span>
              </h3>
              <form onSubmit={handleCreateTerm} className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="e.g. First Term"
                    value={termName}
                    onChange={(e) => setTermName(e.target.value)}
                    className="flex-1 px-3 py-2 bg-muted border border-border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <select
                    value={termSessId}
                    onChange={(e) => setTermSessId(e.target.value)}
                    className="px-2 py-2 bg-muted border border-border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {localSessions.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={isLoading || localSessions.length === 0}
                  className="w-full py-2 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:bg-primary-hover shadow flex items-center justify-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Semester Term</span>
                </button>
              </form>
            </div>

            {/* Create Class */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-sm flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-primary" />
                <span>3. Add Classroom Section</span>
              </h3>
              <form onSubmit={handleCreateClass} className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="e.g. Grade 10 - Science"
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    className="flex-1 px-3 py-2 bg-muted border border-border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <select
                    value={classTeacherId}
                    onChange={(e) => setClassTeacherId(e.target.value)}
                    className="px-2 py-2 bg-muted border border-border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary w-1/3"
                  >
                    <option value="">Form Teacher...</option>
                    {localTeachers.map((t) => (
                      <option key={t.id} value={t.id}>{t.user.name}</option>
                    ))}
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:bg-primary-hover shadow flex items-center justify-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Classroom</span>
                </button>
              </form>
            </div>

            {/* Create Subject */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-sm flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-primary" />
                <span>4. Add & Assign Subject</span>
              </h3>
              <form onSubmit={handleCreateSubject} className="space-y-3">
                <input
                  type="text"
                  required
                  placeholder="e.g. Chemistry"
                  value={subName}
                  onChange={(e) => setSubName(e.target.value)}
                  className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={subClassId}
                    onChange={(e) => setSubClassId(e.target.value)}
                    className="px-2 py-2 bg-muted border border-border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {localClasses.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <select
                    value={subTeacherId}
                    onChange={(e) => setSubTeacherId(e.target.value)}
                    className="px-2 py-2 bg-muted border border-border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">Assign Teacher...</option>
                    {localTeachers.map((t) => (
                      <option key={t.id} value={t.id}>{t.user.name}</option>
                    ))}
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={isLoading || localClasses.length === 0}
                  className="w-full py-2 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:bg-primary-hover shadow flex items-center justify-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Subject Section</span>
                </button>
              </form>
            </div>

          </div>

          {/* List display (7 columns) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Session & Term Listing */}
            <div className="bg-card border border-border rounded-xl shadow-sm p-6 space-y-4">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                <span>Sessions & Semesters</span>
              </h3>
              
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Sessions</span>
                  <div className="divide-y divide-border border rounded-lg bg-muted/20">
                    {localSessions.map((s, idx) => (
                      <div key={idx} className="p-3 flex justify-between items-center text-xs font-semibold">
                        <span>{s.name}</span>
                        {s.isCurrent && <span className="text-[9px] font-bold uppercase bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded">Current</span>}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Active Terms</span>
                  <div className="divide-y divide-border border rounded-lg bg-muted/20">
                    {localTerms.map((t, idx) => (
                      <div key={idx} className="p-3 flex justify-between items-center text-xs font-semibold">
                        <div className="flex flex-col">
                          <span>{t.name}</span>
                          <span className="text-[9px] text-muted-foreground font-medium mt-0.5">Session: {t.session.name}</span>
                        </div>
                        {t.isCurrent && <span className="text-[9px] font-bold uppercase bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded">Active</span>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Classes & Subjects Listing */}
            <div className="bg-card border border-border rounded-xl shadow-sm p-6 space-y-4">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-primary" />
                <span>Classes & Academic Subjects</span>
              </h3>

              <div className="overflow-x-auto border rounded-lg">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-muted text-muted-foreground uppercase text-[9px] tracking-wider border-b border-border">
                      <th className="p-3 font-bold">Class Name</th>
                      <th className="p-3 font-bold">Form Teacher</th>
                      <th className="p-3 font-bold">Roster Count</th>
                      <th className="p-3 font-bold">Subjects Assigned</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {localClasses.map((cls) => {
                      const classSubjects = localSubjects.filter((s) => s.class.name === cls.name);
                      return (
                        <tr key={cls.id} className="hover:bg-muted/10">
                          <td className="p-3 font-bold">{cls.name}</td>
                          <td className="p-3 text-muted-foreground">{cls.formTeacher?.user.name || "None"}</td>
                          <td className="p-3 font-bold text-muted-foreground">{cls._count.students} students</td>
                          <td className="p-3">
                            <div className="flex flex-wrap gap-1">
                              {classSubjects.map((sub, idx) => (
                                <span key={idx} className="bg-muted border text-[9px] font-bold px-1.5 py-0.5 rounded" title={sub.teacher?.user.name || "No teacher"}>
                                  {sub.name}
                                </span>
                              ))}
                              {classSubjects.length === 0 && <span className="text-[10px] text-muted-foreground italic">None</span>}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* 3. USERS & ACCOUNTS TAB */}
      {activeTab === "users" && (
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          
          {/* Sign Up Form (5 columns) */}
          <div className="lg:col-span-5 bg-card border border-border rounded-xl p-6 shadow-sm space-y-6">
            <div className="border-b border-border pb-3 flex justify-between items-center">
              <h3 className="font-bold text-sm">Add User Account</h3>
              <div className="flex bg-muted p-0.5 rounded-lg border text-[10px] font-bold">
                {["teacher", "student", "parent"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setUserTab(tab as any)}
                    className={`px-2.5 py-1 rounded transition-all ${
                      userTab === tab ? "bg-card text-foreground shadow" : "text-muted-foreground"
                    }`}
                  >
                    {tab.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground block">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Richard Hendricks"
                  value={uName}
                  onChange={(e) => setUName(e.target.value)}
                  className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground block">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. richard@piedpiper.com"
                  value={uEmail}
                  onChange={(e) => setUEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground block">Default Password</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. password123"
                  value={uPass}
                  onChange={(e) => setUPass(e.target.value)}
                  className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                />
              </div>

              {/* Teacher fields */}
              {userTab === "teacher" && (
                <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top duration-150">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground block">Payroll Salary ($)</label>
                    <input
                      type="number"
                      value={tSalary}
                      onChange={(e) => setTSalary(parseInt(e.target.value))}
                      className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground block">Qualifications</label>
                    <input
                      type="text"
                      placeholder="e.g. B.Sc, M.Sc"
                      value={tQual}
                      onChange={(e) => setTQual(e.target.value)}
                      className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
              )}

              {/* Student fields */}
              {userTab === "student" && (
                <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top duration-150">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground block">Link Parent</label>
                    <select
                      value={sParentId}
                      onChange={(e) => setSParentId(e.target.value)}
                      className="w-full px-2 py-2 bg-muted border border-border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="">No parent...</option>
                      {parents.map((p) => (
                        <option key={p.id} value={p.id}>{p.user.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground block">Assign Class</label>
                    <select
                      value={sClassId}
                      onChange={(e) => setSClassId(e.target.value)}
                      className="w-full px-2 py-2 bg-muted border border-border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="">No class...</option>
                      {localClasses.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:bg-primary-hover shadow flex items-center justify-center gap-1.5"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                <span>Create User Account</span>
              </button>
            </form>
          </div>

          {/* List display (7 columns) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Teachers Table */}
            <div className="bg-card border border-border rounded-xl shadow-sm p-6 space-y-3">
              <h3 className="font-bold text-sm flex items-center gap-2 text-primary">
                <UserCheck className="w-4 h-4" />
                <span>Teachers & Academic Instructors</span>
              </h3>
              <div className="overflow-x-auto border rounded-lg">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-muted text-muted-foreground uppercase text-[9px] tracking-wider border-b border-border">
                      <th className="p-3 font-bold">Name</th>
                      <th className="p-3 font-bold">Email</th>
                      <th className="p-3 font-bold">Qualifications</th>
                      <th className="p-3 font-bold">Salary</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {localTeachers.map((t) => (
                      <tr key={t.id} className="hover:bg-muted/10">
                        <td className="p-3 font-bold">{t.user.name}</td>
                        <td className="p-3 text-muted-foreground font-mono text-[10px]">{t.user.email}</td>
                        <td className="p-3 text-muted-foreground">{t.qualifications || "N/A"}</td>
                        <td className="p-3 font-bold text-muted-foreground">${t.payrollSalary}/mo</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Students Table */}
            <div className="bg-card border border-border rounded-xl shadow-sm p-6 space-y-3">
              <h3 className="font-bold text-sm flex items-center gap-2 text-primary">
                <Users className="w-4 h-4" />
                <span>Student Roster List</span>
              </h3>
              <div className="overflow-x-auto border rounded-lg">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-muted text-muted-foreground uppercase text-[9px] tracking-wider border-b border-border">
                      <th className="p-3 font-bold">Student ID</th>
                      <th className="p-3 font-bold">Name</th>
                      <th className="p-3 font-bold">Class Section</th>
                      <th className="p-3 font-bold">Parent Guardian</th>
                      <th className="p-3 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {localStudents.map((s) => (
                      <tr key={s.id} className="hover:bg-muted/10">
                        <td className="p-3 font-mono font-bold text-primary">{s.studentId}</td>
                        <td className="p-3 font-bold">{s.user.name}</td>
                        <td className="p-3 text-muted-foreground">{s.class?.name || "Unassigned"}</td>
                        <td className="p-3 text-muted-foreground">{s.parent?.user.name || "None Linked"}</td>
                        <td className="p-3 text-right">
                          {s.class ? (
                            <button
                              onClick={() => {
                                setSelectedReportStudent(s);
                                setCompiledReportCardId(null);
                              }}
                              className="px-2.5 py-1 rounded bg-card hover:bg-muted text-[10px] font-bold border"
                            >
                              Compile Card
                            </button>
                          ) : (
                            <span className="text-[10px] text-muted-foreground italic">No Class</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Compile Report Card Panel */}
            {selectedReportStudent && (
              <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4 animate-in slide-in-from-top duration-200">
                <div className="flex justify-between items-center border-b border-border pb-3">
                  <h4 className="font-extrabold text-sm text-foreground">
                    Compile Report Card: {selectedReportStudent.user.name}
                  </h4>
                  <button 
                    onClick={() => {
                      setSelectedReportStudent(null);
                      setCompiledReportCardId(null);
                    }}
                    className="text-xs font-bold text-muted-foreground hover:text-foreground"
                  >
                    Cancel
                  </button>
                </div>

                {compiledReportCardId ? (
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg text-xs space-y-3 leading-relaxed">
                    <p className="font-bold">Report Card Compiled successfully!</p>
                    <div>
                      <span className="block font-bold">Verification Reference Code (Reference ID):</span>
                      <code className="bg-card px-2 py-1 border rounded font-mono text-[10px] block w-max mt-1 select-all">{compiledReportCardId}</code>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleCompileReportCard} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-muted-foreground block">Principal / Admin remarks</label>
                      <textarea
                        rows={3}
                        required
                        placeholder="Write principal's remarks (e.g. Excellent progress this term. Promoted to Grade 11-A.)"
                        value={reportRemarks}
                        onChange={(e) => setReportRemarks(e.target.value)}
                        className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-xs focus:outline-none resize-none leading-relaxed"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-2.5 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:bg-primary-hover shadow flex items-center justify-center gap-1.5"
                    >
                      {isLoading ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : <Plus className="w-4 h-4" />}
                      <span>Compile & Save</span>
                    </button>
                  </form>
                )}
              </div>
            )}

          </div>

        </div>
      )}

      {/* 4. BILLING & FEES TAB */}
      {activeTab === "fees" && (
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          
          {/* Form (5 columns) */}
          <div className="lg:col-span-5 bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-sm flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-primary" />
              <span>Issue Tuition Invoice Bill</span>
            </h3>
            <form onSubmit={handleCreateFee} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground block">Invoice Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. First Term Tuition Fee"
                  value={feeTitle}
                  onChange={(e) => setFeeTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground block">Bill Amount ($)</label>
                  <input
                    type="number"
                    required
                    value={feeAmount}
                    onChange={(e) => setFeeAmount(parseFloat(e.target.value))}
                    className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground block">Due Date</label>
                  <input
                    type="date"
                    required
                    value={feeDate}
                    onChange={(e) => setFeeDate(e.target.value)}
                    className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:bg-primary-hover shadow flex items-center justify-center gap-1.5"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                <span>Issue Invoice Bill</span>
              </button>
            </form>
          </div>

          {/* List display (7 columns) */}
          <div className="lg:col-span-7 bg-card border border-border rounded-xl shadow-sm p-6 space-y-4">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-primary" />
              <span>Outstanding Invoice Statements</span>
            </h3>

            <div className="overflow-x-auto border rounded-lg">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-muted text-muted-foreground uppercase text-[9px] tracking-wider border-b border-border">
                    <th className="p-3 font-bold">Billing Title</th>
                    <th className="p-3 font-bold">Amount Due</th>
                    <th className="p-3 font-bold">Payment Count</th>
                    <th className="p-3 font-bold">Due Deadline</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {localFees.map((fee) => (
                    <tr key={fee.id} className="hover:bg-muted/10">
                      <td className="p-3 font-bold">{fee.title}</td>
                      <td className="p-3 font-extrabold text-foreground">${fee.amount.toFixed(2)}</td>
                      <td className="p-3 font-semibold text-muted-foreground">{fee._count.payments} paid logs</td>
                      <td className="p-3 text-muted-foreground">{new Date(fee.dueDate).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {localFees.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-muted-foreground italic">
                        No tuition invoices created.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* 5. WEBSITE BUILDER TAB */}
      {activeTab === "website" && (
        <div className="bg-card border border-border rounded-xl shadow-sm p-6 max-w-2xl">
          <h3 className="font-bold text-base border-b border-border pb-3 mb-6 flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            <span>Customize Public School Website Portal</span>
          </h3>

          <form onSubmit={handleUpdateWebsite} className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground block">School Logo URL</label>
                <input
                  type="text"
                  placeholder="https://example.com/logo.png"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground block">Brand Theme Accent Color</label>
                <div className="flex gap-3 items-center">
                  <input
                    type="color"
                    value={themeColor}
                    onChange={(e) => setThemeColor(e.target.value)}
                    className="w-10 h-10 border border-border rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={themeColor}
                    onChange={(e) => setThemeColor(e.target.value)}
                    className="flex-1 px-3 py-2 bg-muted border border-border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground block">School Tagline / Catchphrase</label>
              <input
                type="text"
                placeholder="e.g. Learn at your pace. Grow with live guidance."
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground block">About / Mission Statement Description</label>
              <textarea
                rows={4}
                placeholder="Write a brief history and explanation of your school program..."
                value={aboutText}
                onChange={(e) => setAboutText(e.target.value)}
                className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary resize-none leading-relaxed"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-3 rounded-lg bg-primary text-primary-foreground font-bold hover:bg-primary-hover shadow-md flex items-center justify-center gap-1.5 text-sm"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Save Website Settings</span>
            </button>
          </form>
        </div>
      )}

      {/* 6. ANNOUNCEMENTS & BROADCAST TAB */}
      {activeTab === "announcements" && (
        <div className="grid lg:grid-cols-12 gap-8 items-start animate-in fade-in duration-200">
          
          {/* Creator Form (5 columns) */}
          <div className="lg:col-span-5 bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-sm flex items-center gap-1.5">
              <Megaphone className="w-4 h-4 text-primary" />
              <span>Broadcast Bulletin Alert</span>
            </h3>
            <form onSubmit={handleCreateAnnouncement} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground block">Bulletin Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Midterm Exams Schedule"
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground block">Target Audience</label>
                <select
                  value={annTarget}
                  onChange={(e) => setAnnTarget(e.target.value as any)}
                  className="w-full px-3 py-2.5 bg-muted border border-border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary font-semibold"
                >
                  <option value="ALL">Everyone (ALL)</option>
                  <option value="TEACHERS">Teachers Only</option>
                  <option value="STUDENTS">Students Only</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground block">Bulletin Message</label>
                <textarea
                  rows={5}
                  required
                  placeholder="Write the notification broadcast message detail..."
                  value={annContent}
                  onChange={(e) => setAnnContent(e.target.value)}
                  className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-xs focus:outline-none resize-none leading-relaxed"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-primary text-primary-foreground font-bold hover:bg-primary-hover shadow rounded-lg text-xs flex items-center justify-center gap-1.5"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>Broadcast bulletin</span>
              </button>
            </form>
          </div>

          {/* List display (7 columns) */}
          <div className="lg:col-span-7 bg-card border border-border rounded-xl shadow-sm p-6 space-y-4">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-primary" />
              <span>Broadcast Bulletin Ledger</span>
            </h3>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {localAnnouncements.map((ann) => (
                <div key={ann.id} className="p-4 bg-muted/30 border border-border rounded-xl text-xs space-y-2">
                  <div className="flex justify-between items-center">
                    <h4 className="font-extrabold text-slate-100 text-sm leading-tight truncate max-w-[200px]">{ann.title}</h4>
                    <span className="px-2 py-0.5 bg-primary/10 border border-primary/20 text-primary rounded-[10px] font-bold text-[9px] uppercase tracking-wider">
                      {ann.target}
                    </span>
                  </div>
                  <p className="text-muted-foreground font-medium whitespace-pre-wrap leading-relaxed">
                    {ann.content}
                  </p>
                  <span className="text-[9px] text-muted-foreground block font-mono">
                    Posted: {new Date(ann.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
              {localAnnouncements.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-8 italic font-medium">
                  No bulletins broadcasted yet.
                </p>
              )}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
