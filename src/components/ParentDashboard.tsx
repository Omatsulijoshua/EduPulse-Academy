"use client";

import React, { useState } from "react";
import {
  Users,
  Calendar,
  BookOpen,
  ClipboardList,
  Award,
  Loader2,
  CheckCircle,
  FileText,
  DollarSign,
  AlertCircle,
  Heart,
  ChevronRight,
  Printer,
  ArrowLeft,
  User,
  CreditCard
} from "lucide-react";
import Logo from "@/components/Logo";

interface ChildCourse {
  id: string;
  course: {
    title: string;
    description: string;
  };
  progress: number;
  isCompleted: boolean;
}

interface ChildAttendance {
  id: string;
  date: string;
  status: string;
  remarks: string | null;
}

interface ChildInvoice {
  id: string;
  title: string;
  amount: number;
  dueDate: string;
  status: string;
  paidAt: string | null;
}

interface ChildExam {
  id: string;
  exam: { title: string };
  score: number;
  isGraded: boolean;
}

interface ChildAssignment {
  id: string;
  assignment: { title: string; subject: { name: string } };
  score: number | null;
  feedback: string | null;
}

interface ChildReportCard {
  id: string;
  termName: string;
  sessionName: string;
  gpa: number;
  remarks: string;
  createdAt: string;
}

interface ChildData {
  id: string;
  studentId: string;
  user: {
    name: string;
    email: string;
  };
  class: {
    name: string;
    formTeacher: {
      user: { name: string };
    } | null;
  } | null;
  enrollments: ChildCourse[];
  attendance: ChildAttendance[];
  invoices: ChildInvoice[];
  attempts: ChildExam[];
  submissions: ChildAssignment[];
  reportCards: ChildReportCard[];
}

interface ParentDashboardProps {
  parentName: string;
  children: ChildData[];
}

export default function ParentDashboard({
  parentName,
  children: initialChildren,
}: ParentDashboardProps) {
  const [childrenList, setChildrenList] = useState<ChildData[]>(initialChildren);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(
    initialChildren.length > 0 ? initialChildren[0].id : null
  );

  const [isLoading, setIsLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // Active child report card view state
  const [activeReportCard, setActiveReportCard] = useState<ChildReportCard | null>(null);

  const activeChild = childrenList.find((c) => c.id === selectedChildId);

  const handlePayInvoice = (invoiceId: string) => {
    if (!selectedChildId) return;
    window.location.href = `/checkout?feeId=${invoiceId}&studentId=${selectedChildId}`;
  };

  // Calculate attendance ratios
  const attendanceRatio = activeChild
    ? (() => {
        const total = activeChild.attendance.length;
        if (total === 0) return { percent: 100, present: 0, total: 0 };
        const present = activeChild.attendance.filter(
          (a) => a.status === "PRESENT" || a.status === "LATE"
        ).length;
        return {
          percent: Math.round((present / total) * 100),
          present,
          total,
        };
      })()
    : { percent: 100, present: 0, total: 0 };

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200 print:p-0 print:m-0 print:bg-white print:text-black">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-4 print:hidden">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Parent Portal</h1>
          <p className="text-muted-foreground text-sm font-semibold">
            Welcome back, <span className="text-foreground font-bold">{parentName}</span>. Monitor children performance logs and settle tuition bills.
          </p>
        </div>
      </div>

      {msg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg text-sm flex items-center gap-2 print:hidden">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <span>{msg}</span>
        </div>
      )}

      {childrenList.length > 0 ? (
        <div className="grid lg:grid-cols-12 gap-8 items-start print:block">
          
          {/* Left panel: Linked Children Cards (4 columns) */}
          <div className="lg:col-span-4 space-y-4 print:hidden">
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">
              Linked Children
            </span>
            
            <div className="space-y-3">
              {childrenList.map((child) => {
                const active = child.id === selectedChildId;
                return (
                  <button
                    key={child.id}
                    onClick={() => {
                      setSelectedChildId(child.id);
                      setActiveReportCard(null);
                    }}
                    className={`w-full p-4 text-left border rounded-xl flex items-center gap-3.5 transition-all shadow-sm ${
                      active
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card text-foreground border-border hover:border-slate-300"
                    }`}
                  >
                    <div className={`p-2.5 rounded-lg ${active ? "bg-white/10" : "bg-muted"}`}>
                      <User className="w-5 h-5" />
                    </div>
                    <div className="truncate">
                      <p className="font-extrabold text-sm truncate">{child.user.name}</p>
                      <p className={`text-[10px] font-semibold mt-0.5 ${active ? "text-primary-foreground/75" : "text-muted-foreground"}`}>
                        Class: {child.class?.name || "None"} &bull; {child.studentId}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right panel: Selected Child overview sheets (8 columns) */}
          {activeChild && (
            <div className="lg:col-span-8 space-y-6 print:w-full">
              
              {/* REPORT CARD ACTIVE TEMPLATE OVERVIEW */}
              {activeReportCard ? (
                <div className="space-y-6">
                  {/* Action buttons */}
                  <div className="flex justify-between items-center border-b border-border pb-3 print:hidden">
                    <button
                      onClick={() => setActiveReportCard(null)}
                      className="px-3.5 py-1.5 bg-muted hover:bg-muted/80 border text-xs font-bold rounded-lg flex items-center gap-1 transition-all"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back to Dashboard</span>
                    </button>
                    <button
                      onClick={handlePrintReport}
                      className="px-3.5 py-1.5 bg-primary text-primary-foreground font-bold hover:bg-primary-hover shadow rounded-lg text-xs flex items-center gap-1.5 transition-all"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Print Report Card</span>
                    </button>
                  </div>

                  {/* PREMIUM TEMPLATE */}
                  <div className="bg-white text-slate-900 border-4 border-slate-900 rounded-xl p-8 max-w-3xl mx-auto shadow-2xl space-y-8 relative print:border-2 print:shadow-none print:p-4">
                    <div className="absolute inset-2 border border-slate-200 pointer-events-none" />

                    {/* Header Info */}
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-6 border-b border-slate-300 pb-6 text-center sm:text-left">
                      <div className="flex flex-col items-center sm:items-start">
                        <Logo size="sm" showText={true} className="brightness-75" />
                        <span className="text-[10px] tracking-widest text-slate-400 font-bold uppercase mt-1">ClassNova Digital Report Card</span>
                      </div>
                      <div className="text-xs font-semibold text-slate-500 font-serif leading-relaxed">
                        <p className="font-extrabold text-sm text-slate-900 uppercase">ClassNova Academy</p>
                        <p>Session: {activeReportCard.sessionName}</p>
                        <p>Semester Term: {activeReportCard.termName}</p>
                      </div>
                    </div>

                    {/* Student Metadata */}
                    <div className="grid sm:grid-cols-2 gap-4 text-xs font-serif leading-relaxed border-b border-slate-200 pb-4">
                      <div>
                        <span className="text-slate-400 font-bold uppercase text-[9px] block">Student Candidate</span>
                        <span className="text-slate-900 font-extrabold text-sm">{activeChild.user.name}</span>
                      </div>
                      <div className="sm:text-right">
                        <span className="text-slate-400 font-bold uppercase text-[9px] block">Student ID / Class</span>
                        <span className="text-slate-900 font-extrabold text-sm">
                          {activeChild.class?.name || "Grade 10-A"} &bull; {activeChild.studentId}
                        </span>
                      </div>
                    </div>

                    {/* Marks breakdown table */}
                    <div className="space-y-2">
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider font-serif">Assessment Breakdown</span>
                      <div className="border border-slate-300 rounded overflow-hidden">
                        <table className="w-full text-left text-xs font-serif border-collapse">
                          <thead>
                            <tr className="bg-slate-100 text-slate-700 uppercase text-[9px] tracking-wider border-b border-slate-300">
                              <th className="p-2.5 font-bold">Subject Course</th>
                              <th className="p-2.5 font-bold text-center">Homework Marks</th>
                              <th className="p-2.5 font-bold text-center">Exam Points</th>
                              <th className="p-2.5 font-bold text-right">Grade Mark</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 text-slate-600 font-medium">
                            <tr>
                              <td className="p-2.5 font-bold text-slate-900">Physics 101</td>
                              <td className="p-2.5 text-center font-mono">92%</td>
                              <td className="p-2.5 text-center font-mono">14.0/15.0</td>
                              <td className="p-2.5 text-right font-bold text-slate-900 font-mono">A</td>
                            </tr>
                            <tr>
                              <td className="p-2.5 font-bold text-slate-900">Mathematics 101</td>
                              <td className="p-2.5 text-center font-mono">85%</td>
                              <td className="p-2.5 text-center font-mono">11.0/15.0</td>
                              <td className="p-2.5 text-right font-bold text-slate-900 font-mono">B</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Overall GPA */}
                    <div className="grid sm:grid-cols-2 gap-6 items-center pt-4 border-t border-slate-300 font-serif">
                      <div className="space-y-1 text-xs">
                        <span className="text-slate-400 font-bold uppercase text-[9px] block">Principal's Report Remarks</span>
                        <p className="text-slate-700 italic leading-relaxed">"{activeReportCard.remarks}"</p>
                      </div>
                      
                      <div className="bg-slate-50 border border-slate-200 p-4 rounded flex flex-col justify-between items-center text-center max-w-[200px] sm:ml-auto">
                        <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Overall GPA</span>
                        <span className="text-3xl font-extrabold text-slate-900 font-sans mt-1">
                          {activeReportCard.gpa.toFixed(2)}
                        </span>
                        <span className="text-[10px] text-slate-400 mt-0.5">Scale: 4.00</span>
                      </div>
                    </div>

                    {/* Footer stamps */}
                    <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-6 font-serif">
                      <div className="flex flex-col items-center sm:items-start text-[8.5px] text-slate-400 font-bold font-mono">
                        <span>VERIFICATION REF ID: {activeReportCard.id}</span>
                        <span className="text-slate-300 text-[7.5px] mt-0.5">Public verification available at /verify</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="text-slate-800 italic font-medium text-xs mb-1">Sarah Jenkins</span>
                        <span className="border-t border-slate-300 w-24 pt-1 block text-[8px] text-center text-slate-400">School Admin</span>
                      </div>
                    </div>

                  </div>
                </div>
              ) : (
                // STANDARD DASHBOARD METRICS VIEW (hide when printing report card)
                <div className="space-y-6 print:hidden">
                  
                  {/* Summary Stats Cards */}
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div className="bg-card border border-border p-4 rounded-xl flex items-center gap-3 shadow-sm">
                      <div className="p-2 bg-blue-500/10 rounded-lg text-blue-600">
                        <Heart className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="block text-[9px] uppercase font-bold text-muted-foreground">Classroom Mentor</span>
                        <span className="text-xs font-extrabold text-foreground truncate max-w-[120px] block font-sans">
                          {activeChild.class?.formTeacher?.user.name || "None Assigned"}
                        </span>
                      </div>
                    </div>

                    <div className="bg-card border border-border p-4 rounded-xl flex items-center gap-3 shadow-sm">
                      <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-600">
                        <Calendar className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="block text-[9px] uppercase font-bold text-muted-foreground">Attendance Ratio</span>
                        <span className="text-xs font-extrabold text-foreground">
                          {attendanceRatio.percent}% ({attendanceRatio.present}/{attendanceRatio.total} days)
                        </span>
                      </div>
                    </div>

                    <div className="bg-card border border-border p-4 rounded-xl flex items-center gap-3 shadow-sm">
                      <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500">
                        <DollarSign className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="block text-[9px] uppercase font-bold text-muted-foreground">Pending Bills</span>
                        <span className="text-xs font-extrabold text-foreground">
                          {activeChild.invoices.filter((i) => i.status === "UNPAID").length} outstanding
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Tuition fees statement card */}
                  <div className="bg-card border border-border rounded-xl shadow-sm p-6 space-y-4">
                    <h3 className="font-bold text-sm flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-primary" />
                      <span>Tuition & Invoice Statements</span>
                    </h3>

                    <div className="divide-y divide-border border rounded-lg bg-muted/10">
                      {activeChild.invoices.map((inv) => (
                        <div key={inv.id} className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs font-semibold">
                          <div className="space-y-1">
                            <p className="font-extrabold text-sm text-foreground">{inv.title}</p>
                            <p className="text-muted-foreground font-medium">
                              Due deadline: {new Date(inv.dueDate).toLocaleDateString()}
                              {inv.paidAt && ` &bull; Paid: ${new Date(inv.paidAt).toLocaleDateString()}`}
                            </p>
                          </div>

                          <div className="flex items-center gap-4 shrink-0">
                            <span className="font-extrabold text-sm text-foreground">${inv.amount}</span>
                            {inv.status === "PAID" ? (
                              <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded text-[10px] font-bold">
                                PAID
                              </span>
                            ) : (
                              <button
                                onClick={() => handlePayInvoice(inv.id)}
                                disabled={isLoading}
                                className="px-3.5 py-1.5 bg-primary text-primary-foreground hover:bg-primary-hover font-bold text-[10px] rounded shadow-sm flex items-center gap-1 transition-all"
                              >
                                {isLoading && <Loader2 className="w-3 h-3 animate-spin" />}
                                <span>Pay Tuition</span>
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                      {activeChild.invoices.length === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-6 italic font-medium">No invoice logs registered.</p>
                      )}
                    </div>
                  </div>

                  {/* Grading results sheets */}
                  <div className="grid md:grid-cols-2 gap-6">
                    
                    {/* Active results: Exams & homework */}
                    <div className="bg-card border border-border rounded-xl shadow-sm p-6 space-y-4">
                      <h3 className="font-bold text-sm flex items-center gap-2">
                        <Award className="w-4 h-4 text-primary" />
                        <span>Grading & Academic Reports</span>
                      </h3>
                      
                      <div className="space-y-3">
                        {/* Report cards link */}
                        <span className="text-[9px] uppercase font-bold text-primary tracking-wider block">Academic Report Cards</span>
                        {activeChild.reportCards.map((rc) => (
                          <button
                            key={rc.id}
                            onClick={() => setActiveReportCard(rc)}
                            className="w-full p-3 text-left bg-muted border rounded-lg text-xs flex justify-between items-center font-semibold hover:border-primary/45 transition-all"
                          >
                            <span className="truncate max-w-[150px] font-bold">{rc.termName} ({rc.sessionName})</span>
                            <span className="text-primary hover:underline flex items-center gap-0.5">
                              View GPA: {rc.gpa.toFixed(2)} &rarr;
                            </span>
                          </button>
                        ))}
                        {activeChild.reportCards.length === 0 && (
                          <p className="text-[11px] text-muted-foreground italic">No compiled report cards found.</p>
                        )}

                        <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider block pt-2">CBT Test Attempts</span>
                        {activeChild.attempts.map((att) => (
                          <div key={att.id} className="p-3 bg-muted border rounded-lg text-xs flex justify-between items-center font-semibold">
                            <span className="truncate max-w-[150px]">{att.exam.title}</span>
                            <span className="font-mono text-primary font-bold">{att.score} pts</span>
                          </div>
                        ))}
                        {activeChild.attempts.length === 0 && (
                          <p className="text-[11px] text-muted-foreground italic text-center py-2">No CBT exam records found.</p>
                        )}

                        <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider block pt-2">Homework Submissions</span>
                        {activeChild.submissions.map((sub) => (
                          <div key={sub.id} className="p-3 bg-muted border rounded-lg text-xs flex justify-between items-center font-semibold">
                            <div className="flex flex-col truncate max-w-[150px]">
                              <span className="truncate">{sub.assignment.title}</span>
                              <span className="text-[9px] text-muted-foreground font-medium mt-0.5">{sub.assignment.subject.name}</span>
                            </div>
                            <span className="font-mono text-primary font-bold">
                              {sub.score !== null ? `${sub.score}/100` : "Ungraded"}
                            </span>
                          </div>
                        ))}
                        {activeChild.submissions.length === 0 && (
                          <p className="text-[11px] text-muted-foreground italic text-center py-2">No homework submissions logged.</p>
                        )}
                      </div>
                    </div>

                    {/* Pace Courses progress */}
                    <div className="bg-card border border-border rounded-xl shadow-sm p-6 space-y-4">
                      <h3 className="font-bold text-sm flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-primary" />
                        <span>Pace Courses & Attendance</span>
                      </h3>

                      <div className="space-y-3">
                        <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider block">Syllabus Courses Taken</span>
                        {activeChild.enrollments.map((en) => (
                          <div key={en.id} className="p-3 bg-muted border rounded-lg text-xs space-y-2 font-semibold">
                            <span className="truncate block">{en.course.title}</span>
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 flex-1 bg-card rounded-full overflow-hidden border">
                                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${en.progress}%` }} />
                              </div>
                              <span className="text-[10px] text-muted-foreground font-mono shrink-0">{en.progress}%</span>
                            </div>
                          </div>
                        ))}
                        {activeChild.enrollments.length === 0 && (
                          <p className="text-[11px] text-muted-foreground italic">Not enrolled in self-paced courses.</p>
                        )}

                        <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider block pt-2">Detailed Attendance History</span>
                        <div className="divide-y divide-border border rounded bg-card max-h-[140px] overflow-y-auto">
                          {activeChild.attendance.map((att) => (
                            <div key={att.id} className="p-2 flex justify-between items-center text-[10px] font-semibold">
                              <span>{new Date(att.date).toLocaleDateString()}</span>
                              <span className={`font-bold px-1.5 py-0.5 rounded text-[8.5px] uppercase ${
                                att.status === "PRESENT" ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"
                              }`}>
                                {att.status}
                              </span>
                            </div>
                          ))}
                          {activeChild.attendance.length === 0 && (
                            <p className="p-3 text-[10px] text-muted-foreground italic text-center">No attendance logs available.</p>
                          )}
                        </div>
                      </div>
                    </div>

                  </div>

                </div>
              )}

            </div>
          )}

        </div>
      ) : (
        <div className="p-12 text-center text-muted-foreground bg-card border border-border rounded-xl">
          <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-4" />
          <p className="text-xs italic mb-2">No linked children registered in your parent profile.</p>
          <p className="text-[10px] text-muted-foreground font-semibold">Please contact ClassNova Academy admin desk to map your Parent profile.</p>
        </div>
      )}

    </div>
  );
}
