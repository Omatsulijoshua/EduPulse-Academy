"use client";

import React, { useState } from "react";
import {
  Users,
  Calendar,
  BookOpen,
  ClipboardList,
  Plus,
  Loader2,
  CheckCircle,
  FileText,
  UserCheck,
  Award,
  ChevronRight,
  ArrowLeft,
  CalendarDays,
  FileSpreadsheet
} from "lucide-react";

interface StudentRoster {
  id: string;
  studentId: string;
  user: {
    name: string;
    email: string;
  };
}

interface MaterialData {
  id: string;
  title: string;
  fileUrl: string;
  createdAt: Date;
}

interface AssignmentData {
  id: string;
  title: string;
  description: string;
  dueDate: Date;
  fileUrl: string | null;
}

interface SubmissionData {
  id: string;
  submissionText: string | null;
  fileUrl: string | null;
  submittedAt: Date;
  score: number | null;
  feedback: string | null;
  student: {
    user: {
      name: string;
      email: string;
    };
  };
}

interface ClassroomManagerProps {
  subject: {
    id: string;
    name: string;
    class: {
      id: string;
      name: string;
    };
  };
  roster: StudentRoster[];
  initialMaterials: MaterialData[];
  initialAssignments: AssignmentData[];
}

export default function ClassroomManager({
  subject,
  roster,
  initialMaterials,
  initialAssignments,
}: ClassroomManagerProps) {
  const [activeTab, setActiveTab] = useState<"roster" | "attendance" | "materials" | "assignments">("roster");

  // Materials & Assignments local states
  const [materials, setMaterials] = useState<MaterialData[]>(initialMaterials);
  const [assignments, setAssignments] = useState<AssignmentData[]>(initialAssignments);
  
  // Roster attendance logging states
  const [attendanceDate, setAttendanceDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [attendanceRecords, setAttendanceRecords] = useState<
    Record<string, { status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED"; remarks: string }>
  >(() => {
    const records: any = {};
    roster.forEach((s) => {
      records[s.id] = { status: "PRESENT", remarks: "" };
    });
    return records;
  });

  // Action states
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Forms states: Materials
  const [matTitle, setMatTitle] = useState("");
  const [matUrl, setMatUrl] = useState("");

  // Forms states: Assignments
  const [assignTitle, setAssignTitle] = useState("");
  const [assignDesc, setAssignDesc] = useState("");
  const [assignDueDate, setAssignDueDate] = useState("");
  const [assignFile, setAssignFile] = useState("");

  // Grading Queue states
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionData[]>([]);
  const [gradingSubId, setGradingSubId] = useState<string | null>(null);
  const [gradingScore, setGradingScore] = useState<number>(100);
  const [gradingFeedback, setGradingFeedback] = useState("");

  const triggerFeedback = (type: "success" | "error", msg: string) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 5000);
  };

  // 1. Fetch attendance details for date
  const handleFetchAttendance = async (dateVal: string) => {
    setAttendanceDate(dateVal);
    try {
      const res = await fetch(`/api/teacher/attendance?classId=${subject.class.id}&date=${dateVal}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (data.attendance && data.attendance.length > 0) {
        const records: any = {};
        roster.forEach((s) => {
          const match = data.attendance.find((a: any) => a.studentId === s.id);
          records[s.id] = match 
            ? { status: match.status, remarks: match.remarks || "" }
            : { status: "PRESENT", remarks: "" };
        });
        setAttendanceRecords(records);
      }
    } catch (err) {
      console.error("Failed to load attendance logs", err);
    }
  };

  // 2. Save Attendance
  const handleSaveAttendance = async () => {
    setIsLoading(true);
    try {
      const recordsArray = Object.entries(attendanceRecords).map(([studentId, val]) => ({
        studentId,
        status: val.status,
        remarks: val.remarks,
      }));

      const res = await fetch("/api/teacher/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: attendanceDate, records: recordsArray }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      triggerFeedback("success", "Class attendance saved successfully!");
    } catch (err: any) {
      triggerFeedback("error", err.message || "Failed to save attendance");
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Upload Materials
  const handleUploadMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch("/api/teacher/materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: matTitle, fileUrl: matUrl, subjectId: subject.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setMaterials([data.material, ...materials]);
      setMatTitle("");
      setMatUrl("");
      triggerFeedback("success", "Class Notes uploaded!");
    } catch (err: any) {
      triggerFeedback("error", err.message || "Failed to upload notes");
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Create Assignment
  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch("/api/teacher/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: assignTitle,
          description: assignDesc,
          dueDate: assignDueDate,
          fileUrl: assignFile,
          subjectId: subject.id,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setAssignments([data.assignment, ...assignments]);
      setAssignTitle("");
      setAssignDesc("");
      setAssignDueDate("");
      setAssignFile("");
      triggerFeedback("success", "Homework assignment posted successfully!");
    } catch (err: any) {
      triggerFeedback("error", err.message || "Failed to post assignment");
    } finally {
      setIsLoading(false);
    }
  };

  // 5. Fetch submissions for grading queue
  const handleViewSubmissions = async (assignId: string) => {
    setSelectedAssignmentId(assignId);
    setIsLoading(true);
    try {
      const res = await fetch(`/api/teacher/assignments?assignmentId=${assignId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSubmissions(data.submissions);
    } catch (err) {
      console.error("Failed to load submissions", err);
    } finally {
      setIsLoading(false);
    }
  };

  // 6. Submit Grades
  const handleGradeSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradingSubId) return;
    setIsLoading(true);

    try {
      const res = await fetch("/api/teacher/assignments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId: gradingSubId,
          score: gradingScore,
          feedback: gradingFeedback,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Update local submissions list state
      setSubmissions(
        submissions.map((sub) =>
          sub.id === gradingSubId
            ? { ...sub, score: data.submission.score, feedback: data.submission.feedback }
            : sub
        )
      );
      setGradingSubId(null);
      setGradingScore(100);
      setGradingFeedback("");
      triggerFeedback("success", "Homework graded successfully!");
    } catch (err: any) {
      triggerFeedback("error", err.message || "Failed to grade submission");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-4">
        <div>
          <span className="text-xs font-bold bg-primary/10 text-primary px-2.5 py-1 rounded-full uppercase tracking-wider">
            {subject.class.name}
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight mt-2">{subject.name} Manager</h1>
        </div>

        <div className="flex bg-muted p-1 rounded-lg border border-border text-xs font-semibold shrink-0">
          {[
            { id: "roster", label: "Student Roster", icon: <Users className="w-4 h-4" /> },
            { id: "attendance", label: "Attendance Log", icon: <UserCheck className="w-4 h-4" /> },
            { id: "materials", label: "Class Notes", icon: <BookOpen className="w-4 h-4" /> },
            { id: "assignments", label: "Assignments", icon: <ClipboardList className="w-4 h-4" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                setSelectedAssignmentId(null);
              }}
              className={`px-3 py-2 rounded-md transition-all flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? "bg-card text-foreground shadow"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Notices */}
      {feedback && (
        <div className={`p-4 rounded-lg flex items-center gap-3 text-sm border animate-in slide-in-from-top ${
          feedback.type === "success"
            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
            : "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400"
        }`}>
          <CheckCircle className="w-5 h-5 shrink-0" />
          <span>{feedback.msg}</span>
        </div>
      )}

      {/* 1. ROSTER TAB */}
      {activeTab === "roster" && (
        <div className="bg-card border border-border rounded-xl shadow-sm p-6 space-y-4">
          <h3 className="font-bold text-sm flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            <span>Classroom Student Register ({roster.length} Active Students)</span>
          </h3>

          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-muted text-muted-foreground uppercase text-[9px] tracking-wider border-b border-border">
                  <th className="p-3 font-bold">Student ID</th>
                  <th className="p-3 font-bold">Full Name</th>
                  <th className="p-3 font-bold">Email</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {roster.map((s) => (
                  <tr key={s.id} className="hover:bg-muted/10">
                    <td className="p-3 font-mono font-bold text-primary">{s.studentId}</td>
                    <td className="p-3 font-bold text-foreground">{s.user.name}</td>
                    <td className="p-3 text-muted-foreground font-mono text-[10px]">{s.user.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. ATTENDANCE LOG TAB */}
      {activeTab === "attendance" && (
        <div className="bg-card border border-border rounded-xl shadow-sm p-6 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-4">
            <div className="flex items-center gap-3">
              <CalendarDays className="w-5 h-5 text-primary" />
              <div>
                <h3 className="font-bold text-sm">Attendance Log Roster</h3>
                <p className="text-xs text-muted-foreground">Select date to view and update classroom registers.</p>
              </div>
            </div>
            
            <input
              type="date"
              value={attendanceDate}
              onChange={(e) => handleFetchAttendance(e.target.value)}
              className="px-3 py-2 bg-muted border border-border rounded-lg text-xs focus:outline-none focus:ring-1"
            />
          </div>

          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-muted text-muted-foreground uppercase text-[9px] tracking-wider border-b border-border">
                  <th className="p-3 font-bold">Student Name</th>
                  <th className="p-3 font-bold">Status</th>
                  <th className="p-3 font-bold">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {roster.map((student) => {
                  const record = attendanceRecords[student.id] || { status: "PRESENT", remarks: "" };
                  return (
                    <tr key={student.id} className="hover:bg-muted/10">
                      <td className="p-3 font-bold text-foreground">{student.user.name}</td>
                      <td className="p-3">
                        <div className="flex bg-muted p-0.5 rounded-lg border text-[10px] font-bold w-max">
                          {["PRESENT", "ABSENT", "LATE", "EXCUSED"].map((stat) => (
                            <button
                              key={stat}
                              onClick={() =>
                                setAttendanceRecords({
                                  ...attendanceRecords,
                                  [student.id]: { ...record, status: stat as any },
                                })
                              }
                              className={`px-2.5 py-1 rounded transition-all ${
                                record.status === stat
                                  ? stat === "PRESENT"
                                    ? "bg-emerald-500 text-white shadow"
                                    : stat === "ABSENT"
                                    ? "bg-rose-500 text-white shadow"
                                    : "bg-amber-500 text-white shadow"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {stat}
                            </button>
                          ))}
                        </div>
                      </td>
                      <td className="p-3">
                        <input
                          type="text"
                          placeholder="Add remarks..."
                          value={record.remarks}
                          onChange={(e) =>
                            setAttendanceRecords({
                              ...attendanceRecords,
                              [student.id]: { ...record, remarks: e.target.value },
                            })
                          }
                          className="w-full max-w-xs px-2.5 py-1 bg-muted border border-border rounded text-[11px] focus:outline-none"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleSaveAttendance}
              disabled={isLoading}
              className="px-5 py-2.5 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:bg-primary-hover shadow flex items-center justify-center gap-1.5"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Save Attendance Register</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. CLASS NOTES TAB */}
      {activeTab === "materials" && (
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* Uploader Form (5 columns) */}
          <div className="lg:col-span-5 bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-sm flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-primary" />
              <span>Share Notes / Material</span>
            </h3>
            <form onSubmit={handleUploadMaterial} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground block">Material Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chapter 2: Quantum Physics Notes"
                  value={matTitle}
                  onChange={(e) => setMatTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-xs focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground block">Attachment URL</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. https://example.com/notes.pdf"
                  value={matUrl}
                  onChange={(e) => setMatUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-xs focus:outline-none font-mono text-[10px]"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:bg-primary-hover shadow flex items-center justify-center gap-1.5"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                <span>Upload Note</span>
              </button>
            </form>
          </div>

          {/* List display (7 columns) */}
          <div className="lg:col-span-7 bg-card border border-border rounded-xl shadow-sm p-6 space-y-4">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-primary" />
              <span>Shared Classroom Material</span>
            </h3>

            <div className="divide-y divide-border border rounded-lg bg-muted/10">
              {materials.map((mat) => (
                <div key={mat.id} className="p-3.5 flex justify-between items-center text-xs font-semibold">
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-5 h-5 text-red-500" />
                    <div className="flex flex-col">
                      <span>{mat.title}</span>
                      <span className="text-[10px] text-muted-foreground font-medium mt-0.5">
                        Uploaded: {new Date(mat.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <a
                    href={mat.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1 bg-card hover:bg-muted text-[10px] font-bold border rounded shadow-sm"
                  >
                    View File
                  </a>
                </div>
              ))}
              {materials.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-6 italic">No notes uploaded for this subject yet.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. ASSIGNMENTS TAB */}
      {activeTab === "assignments" && (
        <div className="space-y-6">
          
          {/* Main List & Builder */}
          {!selectedAssignmentId ? (
            <div className="grid lg:grid-cols-12 gap-8 items-start">
              
              {/* Creator Form (5 columns) */}
              <div className="lg:col-span-5 bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
                <h3 className="font-bold text-sm flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-primary" />
                  <span>Post Homework Assignment</span>
                </h3>
                <form onSubmit={handleCreateAssignment} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground block">Assignment Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Gravity calculation sheet"
                      value={assignTitle}
                      onChange={(e) => setAssignTitle(e.target.value)}
                      className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-xs focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground block">Due Date</label>
                    <input
                      type="date"
                      required
                      value={assignDueDate}
                      onChange={(e) => setAssignDueDate(e.target.value)}
                      className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-xs focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground block">Attachment URL (Optional)</label>
                    <input
                      type="text"
                      placeholder="https://example.com/homework.pdf"
                      value={assignFile}
                      onChange={(e) => setAssignFile(e.target.value)}
                      className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-xs focus:outline-none font-mono text-[10px]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground block">Description Instructions</label>
                    <textarea
                      rows={3}
                      required
                      placeholder="Explain homework tasks and submission guidelines..."
                      value={assignDesc}
                      onChange={(e) => setAssignDesc(e.target.value)}
                      className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-xs focus:outline-none resize-none leading-relaxed"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:bg-primary-hover shadow flex items-center justify-center gap-1.5"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    <span>Post Assignment</span>
                  </button>
                </form>
              </div>

              {/* List display (7 columns) */}
              <div className="lg:col-span-7 bg-card border border-border rounded-xl shadow-sm p-6 space-y-4">
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-primary" />
                  <span>Posted Homework Assignments</span>
                </h3>

                <div className="grid sm:grid-cols-2 gap-4">
                  {assignments.map((assign) => (
                    <div key={assign.id} className="p-4 bg-muted border border-border rounded-lg flex flex-col justify-between text-xs font-semibold shadow-sm min-h-[140px]">
                      <div>
                        <h4 className="font-bold text-sm text-foreground truncate mb-1">{assign.title}</h4>
                        <p className="text-muted-foreground font-medium line-clamp-2 leading-relaxed mb-3">{assign.description}</p>
                      </div>
                      
                      <div className="flex justify-between items-center border-t border-border/50 pt-2 text-[10px] text-muted-foreground font-bold">
                        <span>Due: {new Date(assign.dueDate).toLocaleDateString()}</span>
                        <button
                          onClick={() => handleViewSubmissions(assign.id)}
                          className="text-primary hover:underline flex items-center gap-0.5"
                        >
                          Grade Queue <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {assignments.length === 0 && (
                    <p className="sm:col-span-2 text-xs text-muted-foreground italic text-center py-6">No homework assignments posted.</p>
                  )}
                </div>
              </div>

            </div>
          ) : (
            // SUBMISSIONS GRADING VIEW QUEUE
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex justify-between items-center border-b border-border pb-3">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedAssignmentId(null)}
                    className="p-1 rounded-lg border border-border hover:bg-muted"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <div>
                    <h3 className="font-bold text-sm">Grading Queue Submissions</h3>
                    <p className="text-xs text-muted-foreground">Select homework to assign grade marks and reviews.</p>
                  </div>
                </div>
              </div>

              <div className="grid lg:grid-cols-12 gap-8 items-start">
                {/* Roster Queue (7 columns) */}
                <div className="lg:col-span-7 bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-muted text-muted-foreground uppercase text-[9px] tracking-wider border-b border-border">
                          <th className="p-3 font-bold">Student Name</th>
                          <th className="p-3 font-bold">Submitted Date</th>
                          <th className="p-3 font-bold">Grade Mark</th>
                          <th className="p-3 font-bold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {submissions.map((sub) => (
                          <tr key={sub.id} className="hover:bg-muted/10">
                            <td className="p-3 font-bold text-foreground">{sub.student.user.name}</td>
                            <td className="p-3 text-muted-foreground">
                              {new Date(sub.submittedAt).toLocaleString()}
                            </td>
                            <td className="p-3">
                              {sub.score !== null ? (
                                <span className="font-bold text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px]">
                                  {sub.score}/100
                                </span>
                              ) : (
                                <span className="text-[10px] text-muted-foreground italic">Ungraded</span>
                              )}
                            </td>
                            <td className="p-3 text-right">
                              <button
                                onClick={() => {
                                  setGradingSubId(sub.id);
                                  setGradingScore(sub.score ?? 100);
                                  setGradingFeedback(sub.feedback || "");
                                }}
                                className="px-2.5 py-1 rounded border border-primary/20 text-primary hover:bg-primary/5 text-[10px] font-bold"
                              >
                                {sub.score !== null ? "Re-grade" : "Grade"}
                              </button>
                            </td>
                          </tr>
                        ))}
                        {submissions.length === 0 && (
                          <tr>
                            <td colSpan={4} className="p-6 text-center text-muted-foreground italic">
                              No student submissions received yet for this assignment.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Grading Panel (5 columns) */}
                {gradingSubId && (
                  <div className="lg:col-span-5 bg-card border border-border rounded-xl p-6 shadow-sm space-y-4 animate-in slide-in-from-top duration-200">
                    <h3 className="font-bold text-sm flex items-center gap-1.5 text-primary">
                      <Award className="w-4 h-4" />
                      <span>Submit Score & Feedback</span>
                    </h3>
                    
                    {/* View submission details */}
                    {(() => {
                      const activeSub = submissions.find(s => s.id === gradingSubId);
                      if (!activeSub) return null;
                      return (
                        <div className="p-3.5 bg-muted rounded-lg border text-xs space-y-3 mb-2 leading-relaxed">
                          <div>
                            <span className="text-[9px] uppercase font-bold text-muted-foreground block mb-0.5">Comments / Text:</span>
                            <p className="text-foreground font-medium whitespace-pre-line">{activeSub.submissionText || "None provided"}</p>
                          </div>
                          {activeSub.fileUrl && (
                            <div>
                              <span className="text-[9px] uppercase font-bold text-muted-foreground block mb-1">Attachment File:</span>
                              <a
                                href={activeSub.fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-primary hover:underline font-mono text-[10px] flex items-center gap-1"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                <span>Download Submission File</span>
                              </a>
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    <form onSubmit={handleGradeSubmission} className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-muted-foreground block">Score Grade (0-100)</label>
                        <input
                          type="number"
                          required
                          max={100}
                          min={0}
                          value={gradingScore}
                          onChange={(e) => setGradingScore(parseInt(e.target.value))}
                          className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-xs focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-muted-foreground block">Teacher Feedback Remarks</label>
                        <textarea
                          rows={3}
                          placeholder="Write remarks, strengths, or improvements..."
                          value={gradingFeedback}
                          onChange={(e) => setGradingFeedback(e.target.value)}
                          className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-xs focus:outline-none resize-none leading-relaxed"
                        />
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setGradingSubId(null)}
                          className="flex-1 py-2 bg-muted hover:bg-muted/80 text-[11px] font-bold border rounded-lg"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isLoading}
                          className="flex-1 py-2 bg-primary text-primary-foreground hover:bg-primary-hover text-[11px] font-bold rounded-lg shadow"
                        >
                          Submit Grade
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
