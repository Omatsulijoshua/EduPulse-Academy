"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Video,
  Award,
  Calendar,
  ClipboardList,
  CheckCircle,
  Clock,
  Layers,
  ArrowRight,
  Sparkles,
  Loader2,
  Bell,
  Check,
  Play,
  FileText,
  Send,
  Printer,
  FileSpreadsheet
} from "lucide-react";
import Logo from "@/components/Logo";

interface CourseCatalogData {
  id: string;
  title: string;
  description: string;
  coverImage: string | null;
  price: number;
  isEnrolled: boolean;
  progress: number;
  isCompleted: boolean;
}

interface ClassroomDetails {
  name: string;
  timetable: string | null;
  formTeacher: {
    user: {
      name: string;
    };
  } | null;
}

interface AttendanceLog {
  id: string;
  date: Date;
  status: string;
  remarks: string | null;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
}

interface StudentAssignment {
  id: string;
  title: string;
  description: string;
  dueDate: Date;
  fileUrl: string | null;
  subject: {
    name: string;
  };
  submissions: {
    id: string;
    submissionText: string | null;
    fileUrl: string | null;
    submittedAt: Date;
    score: number | null;
    feedback: string | null;
  }[];
}

interface StudentMaterial {
  id: string;
  title: string;
  fileUrl: string;
  createdAt: Date;
  subject: {
    name: string;
  };
}

interface StudentExam {
  id: string;
  title: string;
  duration: number;
  subject: {
    name: string;
  } | null;
  attempts: {
    id: string;
    submittedAt: Date;
    score: number;
    isGraded: boolean;
  }[];
  questions: { id: string }[];
}

interface ReportCardData {
  id: string;
  termName: string;
  sessionName: string;
  gpa: number;
  remarks: string;
  createdAt: string;
}

interface StudentDashboardProps {
  studentName: string;
  catalogCourses: CourseCatalogData[];
  classroomDetails: ClassroomDetails | null;
  attendanceLogs: AttendanceLog[];
  announcements: Announcement[];
  assignments: StudentAssignment[];
  materials: StudentMaterial[];
  exams: StudentExam[];
  reportCards: ReportCardData[];
}

export default function StudentDashboard({
  studentName,
  catalogCourses,
  classroomDetails,
  attendanceLogs,
  announcements,
  assignments: initialAssignments,
  materials,
  exams,
  reportCards,
}: StudentDashboardProps) {
  const [learningMode, setLearningMode] = useState<"pace" | "active">("pace");
  const [courses, setCourses] = useState<CourseCatalogData[]>(catalogCourses);
  const [enrollLoadingId, setEnrollLoadingId] = useState<string | null>(null);

  // Active learning inner tabs
  const [activeSubTab, setActiveSubTab] = useState<"timetable" | "materials" | "assignments" | "exams" | "report_card">("timetable");
  const [localAssignments, setLocalAssignments] = useState<StudentAssignment[]>(initialAssignments);

  // Homework submit form states
  const [selectedAssign, setSelectedAssign] = useState<StudentAssignment | null>(null);
  const [subComments, setSubComments] = useState("");
  const [subFileUrl, setSubFileUrl] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Active report card details state
  const [activeReportCard, setActiveReportCard] = useState<ReportCardData | null>(null);

  const handleEnroll = async (courseId: string) => {
    setEnrollLoadingId(courseId);
    try {
      const res = await fetch("/api/student/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setCourses(
        courses.map((c) =>
          c.id === courseId ? { ...c, isEnrolled: true, progress: 0 } : c
        )
      );
    } catch (err) {
      console.error("Failed to enroll in course:", err);
    } finally {
      setEnrollLoadingId(null);
    }
  };

  const handleSubmitHomework = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssign) return;
    setSubmitLoading(true);

    try {
      const res = await fetch("/api/student/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignmentId: selectedAssign.id,
          submissionText: subComments,
          fileUrl: subFileUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setLocalAssignments(
        localAssignments.map((a) =>
          a.id === selectedAssign.id
            ? { ...a, submissions: [data.submission] }
            : a
        )
      );

      setSubmitSuccess(true);
      setSubComments("");
      setSubFileUrl("");
      setTimeout(() => {
        setSubmitSuccess(false);
        setSelectedAssign(null);
      }, 2000);
    } catch (err) {
      console.error("Failed to submit homework:", err);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handlePrintReport = () => {
    window.print();
  };

  const weeklyTimetable = classroomDetails?.timetable 
    ? JSON.parse(classroomDetails.timetable) 
    : null;

  return (
    <div className="space-y-8 print:p-0 print:m-0 print:bg-white print:text-black">
      {/* Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border pb-4 print:hidden">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Student Hub</h1>
          <p className="text-muted-foreground text-sm">
            Welcome, <span className="text-foreground font-bold">{studentName}</span>! Choose your format and start studying.
          </p>
        </div>

        {/* Mode switcher */}
        <div className="flex bg-muted p-1 rounded-lg border border-border text-xs font-semibold shrink-0">
          <button
            onClick={() => setLearningMode("pace")}
            className={`px-4 py-2.5 rounded-md transition-all flex items-center gap-1.5 ${
              learningMode === "pace" ? "bg-card text-foreground shadow" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Pace Learning (Self-Paced)</span>
          </button>
          <button
            onClick={() => setLearningMode("active")}
            className={`px-4 py-2.5 rounded-md transition-all flex items-center gap-1.5 ${
              learningMode === "active" ? "bg-card text-foreground shadow" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Video className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Active Learning (Classroom)</span>
          </button>
        </div>
      </div>

      {/* 1. PACE LEARNING MODE */}
      {learningMode === "pace" && (
        <div className="space-y-8 animate-in fade-in duration-200 print:hidden">
          
          <div className="space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Play className="w-5 h-5 text-primary" />
              <span>My Enrolled Courses</span>
            </h3>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.filter((c) => c.isEnrolled).map((course) => (
                <div key={course.id} className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col justify-between hover:border-primary/20 transition-all">
                  <div className="p-6 space-y-4">
                    <h4 className="font-extrabold text-base leading-tight truncate">{course.title}</h4>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{course.description}</p>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs font-semibold text-muted-foreground">
                        <span>Course Progression</span>
                        <span className="font-bold text-foreground">{course.progress}%</span>
                      </div>
                      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 rounded-full transition-all" 
                          style={{ width: `${course.progress}%` }} 
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-6 pt-0">
                    <Link
                      href={`/dashboard/student/courses/${course.id}`}
                      className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-bold hover:bg-primary-hover shadow flex items-center justify-center gap-1.5 text-xs"
                    >
                      {course.progress === 100 ? (
                        <>
                          <Award className="w-4 h-4" />
                          <span>Graduate / Certificate</span>
                        </>
                      ) : (
                        <>
                          <span>Continue Lessons</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </Link>
                  </div>
                </div>
              ))}
              
              {courses.filter((c) => c.isEnrolled).length === 0 && (
                <div className="sm:col-span-2 lg:col-span-3 p-8 text-center text-muted-foreground border border-dashed rounded-xl">
                  <p className="text-xs italic mb-1">Not enrolled in any self-paced courses yet.</p>
                  <p className="text-[10px] text-muted-foreground font-semibold">Select a course from the Catalog below to begin.</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-border">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <span>Syllabus Catalog</span>
            </h3>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.filter((c) => !c.isEnrolled).map((course) => (
                <div key={course.id} className="bg-card border border-border rounded-xl shadow-sm p-6 flex flex-col justify-between hover:border-primary/20 transition-all">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold bg-muted border text-muted-foreground px-2 py-0.5 rounded">
                        {course.price === 0 ? "Free" : `$${course.price}`}
                      </span>
                    </div>
                    <h4 className="font-extrabold text-base leading-tight truncate">{course.title}</h4>
                    <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">{course.description}</p>
                  </div>

                  <button
                    onClick={() => handleEnroll(course.id)}
                    disabled={enrollLoadingId === course.id}
                    className="w-full mt-6 py-2.5 rounded-lg bg-muted hover:bg-muted/80 font-bold border border-border text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm"
                  >
                    {enrollLoadingId === course.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>Enroll & Study</span>
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* 2. ACTIVE LEARNING MODE */}
      {learningMode === "active" && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {classroomDetails ? (
            <div className="grid lg:grid-cols-12 gap-8 items-start print:block">
              
              {/* Classroom navigation panel & content (7 columns) */}
              <div className="lg:col-span-7 space-y-6 print:w-full">
                
                <div className="bg-card border border-border rounded-xl shadow-sm p-6 space-y-6 print:border-0 print:shadow-none">
                  
                  {/* Classroom navigation sub-tabs */}
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 border-b border-border pb-3 print:hidden">
                    <h3 className="font-extrabold text-base flex items-center gap-2">
                      <Layers className="w-5 h-5 text-primary" />
                      <span>{classroomDetails.name} Classroom</span>
                    </h3>

                    <div className="flex bg-muted p-0.5 rounded-lg border text-[10px] font-bold">
                      {[
                        { id: "timetable", label: "Timetable" },
                        { id: "materials", label: "Class Notes" },
                        { id: "assignments", label: "Homework" },
                        { id: "exams", label: "CBT Exams" },
                        { id: "report_card", label: "Report Card" }
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => {
                            setActiveSubTab(tab.id as any);
                            setSelectedAssign(null);
                            setActiveReportCard(null);
                          }}
                          className={`px-3 py-1.5 rounded transition-all ${
                            activeSubTab === tab.id ? "bg-card text-foreground shadow" : "text-muted-foreground"
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* SUBTAB: TIMETABLE */}
                  {activeSubTab === "timetable" && (
                    <div className="space-y-4 print:hidden">
                      {weeklyTimetable ? (
                        <div className="space-y-3 text-xs">
                          {Object.entries(weeklyTimetable).map(([day, slots]: any) => (
                            <div key={day} className="space-y-1.5 border border-border rounded-lg p-3 bg-muted/20">
                              <span className="font-bold text-primary block">{day}</span>
                              <div className="grid sm:grid-cols-2 gap-2">
                                {slots.map((s: any, idx: number) => (
                                  <div key={idx} className="p-2.5 bg-card border rounded flex flex-col justify-between">
                                    <span className="font-bold text-foreground">{s.subject}</span>
                                    <span className="text-[10px] text-muted-foreground mt-1">{s.time} ({s.room})</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground italic text-center py-4">No active timetable slots uploaded.</p>
                      )}
                    </div>
                  )}

                  {/* SUBTAB: MATERIALS / NOTES */}
                  {activeSubTab === "materials" && (
                    <div className="space-y-3 print:hidden">
                      {materials.map((mat) => (
                        <div key={mat.id} className="p-3 bg-muted border border-border rounded-lg text-xs flex justify-between items-center font-semibold">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-red-500" />
                            <div className="flex flex-col">
                              <span>{mat.title}</span>
                              <span className="text-[10px] text-muted-foreground font-medium mt-0.5">Subject: {mat.subject.name}</span>
                            </div>
                          </div>
                          <a
                            href={mat.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2 py-1 bg-card border rounded hover:bg-muted text-[10px] font-bold"
                          >
                            Read Note
                          </a>
                        </div>
                      ))}
                      {materials.length === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-6 italic">No shared notes available.</p>
                      )}
                    </div>
                  )}

                  {/* SUBTAB: ASSIGNMENTS / HOMEWORK */}
                  {activeSubTab === "assignments" && !selectedAssign && (
                    <div className="grid sm:grid-cols-2 gap-4 print:hidden">
                      {localAssignments.map((assign) => {
                        const hasSubmission = assign.submissions && assign.submissions.length > 0;
                        const sub = hasSubmission ? assign.submissions[0] : null;
                        const graded = sub?.score !== null;

                        return (
                          <div key={assign.id} className="p-4 bg-muted border border-border rounded-lg flex flex-col justify-between text-xs font-semibold shadow-sm min-h-[140px]">
                            <div>
                              <div className="flex justify-between items-center mb-1">
                                <span className="font-bold text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded">
                                  {assign.subject.name}
                                </span>
                                <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                                  graded 
                                    ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                                    : hasSubmission
                                    ? "bg-blue-500/10 text-blue-600 border border-blue-500/20"
                                    : "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                                }`}>
                                  {graded ? `${sub.score}/100 Graded` : hasSubmission ? "Submitted" : "Pending"}
                                </span>
                              </div>
                              <h4 className="font-bold text-sm text-foreground truncate mb-1">{assign.title}</h4>
                              <p className="text-muted-foreground font-medium line-clamp-2 leading-relaxed mb-3">{assign.description}</p>
                            </div>
                            
                            <div className="flex justify-between items-center border-t border-border/50 pt-2 text-[10px] text-muted-foreground font-bold">
                              <span>Due: {new Date(assign.dueDate).toLocaleDateString()}</span>
                              <button
                                onClick={() => setSelectedAssign(assign)}
                                className="text-primary hover:underline flex items-center gap-0.5"
                              >
                                View Details <ChevronRight className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                      {localAssignments.length === 0 && (
                        <p className="sm:col-span-2 text-xs text-muted-foreground text-center py-6 italic">No homework assignments posted.</p>
                      )}
                    </div>
                  )}

                  {/* ASSIGNMENT DETAILS & SUBMISSION FORM */}
                  {activeSubTab === "assignments" && selectedAssign && (
                    <div className="space-y-4 animate-in zoom-in duration-150 print:hidden">
                      <div className="flex items-center gap-2 border-b border-border pb-3">
                        <button
                          onClick={() => setSelectedAssign(null)}
                          className="p-1 rounded-lg border border-border hover:bg-muted"
                        >
                          <ArrowLeft className="w-4 h-4" />
                        </button>
                        <h4 className="font-bold text-sm text-foreground truncate">{selectedAssign.title}</h4>
                      </div>

                      <div className="p-3 bg-muted rounded-lg border text-xs space-y-2 leading-relaxed">
                        <p className="text-muted-foreground whitespace-pre-line">{selectedAssign.description}</p>
                        {selectedAssign.fileUrl && (
                          <a
                            href={selectedAssign.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary hover:underline font-mono text-[10px] flex items-center gap-1 pt-1"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Download Assignment Details</span>
                          </a>
                        )}
                      </div>

                      {/* Display grading if graded */}
                      {selectedAssign.submissions.length > 0 && selectedAssign.submissions[0].score !== null && (
                        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs space-y-2">
                          <p className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                            <Award className="w-4.5 h-4.5" />
                            <span>Graded Score: {selectedAssign.submissions[0].score}/100</span>
                          </p>
                          {selectedAssign.submissions[0].feedback && (
                            <p className="text-muted-foreground leading-relaxed">
                              <span className="font-bold">Teacher Feedback:</span> "{selectedAssign.submissions[0].feedback}"
                            </p>
                          )}
                        </div>
                      )}

                      {/* Submit form if not submitted */}
                      {selectedAssign.submissions.length === 0 ? (
                        <form onSubmit={handleSubmitHomework} className="space-y-4 pt-2">
                          {submitSuccess && (
                            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg text-xs flex items-center gap-2">
                              <CheckCircle className="w-4 h-4" />
                              <span>Homework submitted successfully!</span>
                            </div>
                          )}

                          <div className="space-y-1">
                            <label className="text-xs font-bold text-muted-foreground block">Submission Comments / Work Text</label>
                            <textarea
                              rows={4}
                              placeholder="Write your answer details, explanations, or messages to the teacher..."
                              value={subComments}
                              onChange={(e) => setSubComments(e.target.value)}
                              className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-xs focus:outline-none resize-none leading-relaxed"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs font-bold text-muted-foreground block">Attachment File URL (Optional)</label>
                            <input
                              type="text"
                              placeholder="https://example.com/homework-submission.pdf"
                              value={subFileUrl}
                              onChange={(e) => setSubFileUrl(e.target.value)}
                              className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-xs focus:outline-none font-mono text-[10px]"
                            />
                          </div>

                          <button
                            type="submit"
                            disabled={submitLoading}
                            className="w-full py-2.5 bg-primary text-primary-foreground font-bold hover:bg-primary-hover shadow rounded-lg text-xs flex items-center justify-center gap-1.5"
                          >
                            {submitLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            <span>Submit Homework</span>
                          </button>
                        </form>
                      ) : (
                        selectedAssign.submissions[0].score === null && (
                          <div className="p-4 bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 rounded-lg text-xs flex items-center gap-2">
                            <CheckCircle className="w-4.5 h-4.5" />
                            <span>Submitted on {new Date(selectedAssign.submissions[0].submittedAt).toLocaleDateString()}. Waiting for teacher grading marks.</span>
                          </div>
                        )
                      )}
                    </div>
                  )}

                  {/* SUBTAB: CBT EXAMS LIST */}
                  {activeSubTab === "exams" && (
                    <div className="grid sm:grid-cols-2 gap-4 print:hidden">
                      {exams.map((ex) => {
                        const hasAttempt = ex.attempts && ex.attempts.length > 0;
                        const attempt = hasAttempt ? ex.attempts[0] : null;
                        const submitted = attempt?.submittedAt;
                        const graded = attempt?.isGraded;

                        return (
                          <div key={ex.id} className="p-4 bg-muted border border-border rounded-lg flex flex-col justify-between text-xs font-semibold shadow-sm min-h-[140px]">
                            <div>
                              <div className="flex justify-between items-center mb-1">
                                <span className="font-bold text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded">
                                  {ex.subject ? ex.subject.name : "Exam"}
                                </span>
                                <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                                  graded 
                                    ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                                    : submitted
                                    ? "bg-blue-500/10 text-blue-600 border border-blue-500/20"
                                    : "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                                }`}>
                                  {graded ? `${attempt.score} pts Graded` : submitted ? "Submitted" : "Not Taken"}
                                </span>
                              </div>
                              <h4 className="font-bold text-sm text-foreground truncate mb-1">{ex.title}</h4>
                              <p className="text-muted-foreground font-medium flex items-center gap-1 leading-relaxed text-[11px] mb-3">
                                <Clock className="w-3.5 h-3.5" />
                                <span>Duration: {ex.duration} Minutes &bull; {ex.questions.length} Questions</span>
                              </p>
                            </div>

                            <div className="pt-2 border-t border-border/50 flex justify-end">
                              {submitted ? (
                                <span className="text-[10px] text-muted-foreground font-bold">
                                  Submitted: {new Date(attempt.submittedAt).toLocaleDateString()}
                                </span>
                              ) : (
                                <Link
                                  href={`/dashboard/student/exams/${ex.id}`}
                                  className="px-3.5 py-1.5 bg-primary text-primary-foreground font-bold hover:bg-primary-hover shadow rounded text-[10px] flex items-center gap-1"
                                >
                                  <span>Take Assessment</span>
                                  <ArrowRight className="w-3 h-3" />
                                </Link>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      {exams.length === 0 && (
                        <p className="sm:col-span-2 text-xs text-muted-foreground text-center py-6 italic font-medium">No CBT exams posted for your classroom subjects.</p>
                      )}
                    </div>
                  )}

                  {/* SUBTAB: REPORT CARDS LIST */}
                  {activeSubTab === "report_card" && (
                    <div className="space-y-4">
                      {!activeReportCard ? (
                        <div className="grid sm:grid-cols-2 gap-4 print:hidden">
                          {reportCards.map((rc) => (
                            <button
                              key={rc.id}
                              onClick={() => setActiveReportCard(rc)}
                              className="p-4 text-left bg-muted border border-border rounded-lg flex flex-col justify-between hover:border-primary/50 transition-all text-xs font-semibold shadow-sm min-h-[120px]"
                            >
                              <div className="space-y-1">
                                <div className="flex justify-between items-center mb-1">
                                  <span className="font-bold text-[9px] uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded">
                                    {rc.termName}
                                  </span>
                                  <span className="text-[10px] font-bold text-foreground font-mono">GPA: {rc.gpa}/4.00</span>
                                </div>
                                <h4 className="font-bold text-sm text-foreground leading-tight">{rc.sessionName} Session</h4>
                                <p className="text-muted-foreground font-medium line-clamp-2 leading-relaxed">
                                  Remarks: "{rc.remarks}"
                                </p>
                              </div>
                              <div className="flex justify-end pt-2 mt-3 border-t border-border/50 text-[10px] text-primary font-bold">
                                <span>View Document &rarr;</span>
                              </div>
                            </button>
                          ))}
                          {reportCards.length === 0 && (
                            <p className="sm:col-span-2 text-xs text-muted-foreground text-center py-6 italic font-medium">No compiled report cards found.</p>
                          )}
                        </div>
                      ) : (
                        // BEAUTIFUL PRINT-READY REPORT CARD TEMPLATE OVERVIEW
                        <div className="space-y-6">
                          
                          {/* Close & Print Buttons (hidden when printing) */}
                          <div className="flex justify-between items-center border-b border-border pb-3 print:hidden">
                            <button
                              onClick={() => setActiveReportCard(null)}
                              className="px-3.5 py-1.5 bg-muted hover:bg-muted/80 border text-xs font-bold rounded-lg flex items-center gap-1 transition-all"
                            >
                              <ArrowLeft className="w-3.5 h-3.5" />
                              <span>Back to list</span>
                            </button>
                            <button
                              onClick={handlePrintReport}
                              className="px-3.5 py-1.5 bg-primary text-primary-foreground font-bold hover:bg-primary-hover shadow rounded-lg text-xs flex items-center gap-1.5 transition-all"
                            >
                              <Printer className="w-4 h-4" />
                              <span>Print Report Card</span>
                            </button>
                          </div>

                          {/* PREMIUM REPORT CARD TEMPLATE */}
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
                                <span className="text-slate-900 font-extrabold text-sm">{studentName}</span>
                              </div>
                              <div className="sm:text-right">
                                <span className="text-slate-400 font-bold uppercase text-[9px] block">Student ID / Class</span>
                                <span className="text-slate-900 font-extrabold text-sm">
                                  {classroomDetails?.name || "Grade 10-A"} &bull; CN-2026-0001
                                </span>
                              </div>
                            </div>

                            {/* Marks Breakdown Table */}
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

                            {/* Overall Grades */}
                            <div className="grid sm:grid-cols-2 gap-6 items-center pt-4 border-t border-slate-300 font-serif">
                              <div className="space-y-1 text-xs">
                                <span className="text-slate-400 font-bold uppercase text-[9px] block">Principal's Report Comments</span>
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

                            {/* Signatures & Verification Stamp */}
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
                      )}
                    </div>
                  )}

                </div>

              </div>

              {/* Sidebars (5 columns) */}
              <div className="lg:col-span-5 space-y-6 print:hidden">
                
                {/* Announcements */}
                <div className="bg-card border border-border rounded-xl shadow-sm p-6 space-y-4">
                  <h3 className="font-bold text-sm flex items-center gap-2">
                    <Bell className="w-4 h-4 text-primary" />
                    <span>Announcements</span>
                  </h3>

                  <div className="space-y-3">
                    {announcements.map((ann) => (
                      <div key={ann.id} className="p-3 bg-muted border border-border rounded-lg text-xs">
                        <p className="font-bold text-foreground">{ann.title}</p>
                        <p className="text-muted-foreground mt-1 leading-relaxed">{ann.content}</p>
                        <span className="text-[9px] text-muted-foreground mt-1.5 block font-mono">
                          {new Date(ann.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                    {announcements.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-4">No active announcements.</p>
                    )}
                  </div>
                </div>

                {/* Attendance Logs */}
                <div className="bg-card border border-border rounded-xl shadow-sm p-6 space-y-4">
                  <h3 className="font-bold text-sm flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary" />
                    <span>Attendance Records</span>
                  </h3>

                  <div className="divide-y divide-border">
                    {attendanceLogs.map((log) => (
                      <div key={log.id} className="py-2.5 flex justify-between items-center text-xs font-semibold">
                        <span>{new Date(log.date).toLocaleDateString()}</span>
                        <div className="flex items-center gap-2">
                          {log.remarks && <span className="text-[10px] text-muted-foreground italic font-medium">{log.remarks}</span>}
                          <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${
                            log.status === "PRESENT" ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"
                          }`}>
                            {log.status}
                          </span>
                        </div>
                      </div>
                    ))}
                    {attendanceLogs.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-4">No attendance logs available.</p>
                    )}
                  </div>
                </div>

              </div>

            </div>
          ) : (
            <div className="p-12 text-center text-muted-foreground bg-card border border-border rounded-xl print:hidden">
              <p className="text-xs italic mb-2">Not assigned to any academic classroom yet.</p>
              <p className="text-[10px] text-muted-foreground font-semibold">Ask your School Administrator to assign you to a Class.</p>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
