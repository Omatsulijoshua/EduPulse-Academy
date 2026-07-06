"use client";

import React, { useState } from "react";
import {
  FileQuestion,
  Plus,
  Loader2,
  CheckCircle,
  FileText,
  Clock,
  Award,
  ChevronRight,
  ArrowLeft,
  Users,
  Settings,
  HelpCircle,
  Eye,
  Trash
} from "lucide-react";

interface Question {
  id: string;
  type: "MCQ" | "TRUE_FALSE" | "SHORT_ANSWER" | "THEORY";
  questionText: string;
  options: string | null;
  correctAnswer: string | null;
  points: number;
}

interface Exam {
  id: string;
  title: string;
  instructions: string | null;
  duration: number;
  startTime: string | null;
  endTime: string | null;
  showResult: boolean;
  subject?: { name: string; class: { name: string } } | null;
  course?: { title: string } | null;
  _count?: { attempts: number };
}

interface Attempt {
  id: string;
  submittedAt: string;
  score: number;
  isGraded: boolean;
  student: {
    user: {
      name: string;
    };
  };
  answers: {
    id: string;
    studentAnswer: string;
    score: number;
    isGraded: boolean;
    question: Question;
  }[];
}

interface TeacherCBTConsoleProps {
  initialExams: Exam[];
  subjects: { id: string; name: string; class: { name: string } }[];
  courses: { id: string; title: string }[];
}

export default function TeacherCBTConsole({
  initialExams,
  subjects,
  courses,
}: TeacherCBTConsoleProps) {
  const [exams, setExams] = useState<Exam[]>(initialExams);
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [selectedExam, setSelectedExam] = useState<(Exam & { questions: Question[] }) | null>(null);

  // States
  const [activeTab, setActiveTab] = useState<"questions" | "attempts">("questions");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  // Form states: Create Exam
  const [examTitle, setExamTitle] = useState("");
  const [examInstructions, setExamInstructions] = useState("");
  const [examDuration, setExamDuration] = useState(45);
  const [examSubjectId, setExamSubjectId] = useState("");
  const [examCourseId, setExamCourseId] = useState("");

  // Form states: Add Question
  const [qType, setQType] = useState<"MCQ" | "TRUE_FALSE" | "SHORT_ANSWER" | "THEORY">("MCQ");
  const [qText, setQText] = useState("");
  const [qPoints, setQPoints] = useState(2.0);
  const [qCorrect, setQCorrect] = useState("");
  const [mcqOptions, setMcqOptions] = useState<string[]>(["", "", "", ""]);

  // Grading states
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [activeAttempt, setActiveAttempt] = useState<Attempt | null>(null);
  const [theoryMarks, setTheoryMarks] = useState<Record<string, number>>({});

  const handleFetchExamDetails = async (examId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/exams?examId=${examId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSelectedExam(data.exam);
      setSelectedExamId(examId);
      setActiveTab("questions");
      
      // Fetch student attempts
      const attRes = await fetch(`/api/exams/grade?examId=${examId}`); // We'll make a helper sub-route, or fetch it inside attempts list
      // Let's implement active fetch in the component directly
      fetchAttempts(examId);
    } catch (err: any) {
      setError(err.message || "Failed to load exam details");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAttempts = async (examId: string) => {
    try {
      const res = await fetch(`/api/teacher/assignments?action=exam_attempts&examId=${examId}`);
      // Wait, let's look up our grading endpoint: we can implement attempts fetching inside GET `/api/exams/grade` or simple params check.
      // Let's write a simple attempts fetch: we will fetch them from `/api/exams/grade` when we pass `examId`.
      // Let's create an endpoint GET `/api/exams/grade?examId=xxx` to fetch attempts for grading!
      const attemptsRes = await fetch(`/api/exams/grade?examId=${examId}`);
      const attemptsData = await attemptsRes.json();
      if (attemptsRes.ok) {
        setAttempts(attemptsData.attempts || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_exam",
          title: examTitle,
          instructions: examInstructions,
          duration: examDuration,
          subjectId: examSubjectId || null,
          courseId: examCourseId || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setExams([data.exam, ...exams]);
      setExamTitle("");
      setExamInstructions("");
      setExamDuration(45);
      setExamSubjectId("");
      setExamCourseId("");
      setMsg("Exam created successfully! Click on it to add questions.");
      setTimeout(() => setMsg(null), 5000);
    } catch (err: any) {
      setError(err.message || "Failed to create exam");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExamId) return;
    setIsLoading(true);
    setError(null);

    const reqBody: any = {
      action: "add_question",
      examId: selectedExamId,
      type: qType,
      questionText: qText,
      points: qPoints,
      correctAnswer: qType === "THEORY" ? "" : qCorrect,
    };

    if (qType === "MCQ") {
      reqBody.options = mcqOptions.filter((opt) => opt.trim() !== "");
    } else if (qType === "TRUE_FALSE") {
      reqBody.options = ["True", "False"];
    }

    try {
      const res = await fetch("/api/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reqBody),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Refresh exam details
      await handleFetchExamDetails(selectedExamId);
      setQText("");
      setQCorrect("");
      setMcqOptions(["", "", "", ""]);
      setMsg("Question added successfully!");
      setTimeout(() => setMsg(null), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to add question");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGradeTheory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAttempt) return;
    setIsLoading(true);

    try {
      const gradesArray = Object.entries(theoryMarks).map(([answerId, score]) => ({
        answerId,
        score,
      }));

      const res = await fetch("/api/exams/grade", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId: activeAttempt.id, grades: gradesArray }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Refresh attempts lists
      await fetchAttempts(selectedExamId!);
      setActiveAttempt(null);
      setTheoryMarks({});
      setMsg("Theory grading submitted successfully!");
      setTimeout(() => setMsg(null), 4000);
    } catch (err: any) {
      setError(err.message || "Failed to save grades");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Question Bank & CBT Console</h1>
          <p className="text-muted-foreground text-sm font-semibold">
            Create online assessments, shuffle questionnaires, and audit automatic grades.
          </p>
        </div>

        {selectedExamId && (
          <button
            onClick={() => {
              setSelectedExamId(null);
              setSelectedExam(null);
              setActiveAttempt(null);
            }}
            className="px-4 py-2 bg-muted hover:bg-muted/80 border border-border text-sm font-semibold rounded-lg flex items-center gap-1.5 transition-all shrink-0 animate-in fade-in duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Exam List</span>
          </button>
        )}
      </div>

      {/* Messages */}
      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-lg text-sm">
          {error}
        </div>
      )}
      {msg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg text-sm flex items-center gap-2">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <span>{msg}</span>
        </div>
      )}

      {/* EXAMS LIST & FRESH CREATOR */}
      {!selectedExamId && (
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          
          {/* Active exams list (7 columns) */}
          <div className="lg:col-span-7 bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <FileQuestion className="w-4 h-4 text-primary" />
              <span>Created Exams</span>
            </h3>

            <div className="grid sm:grid-cols-2 gap-4">
              {exams.map((ex) => (
                <button
                  key={ex.id}
                  onClick={() => handleFetchExamDetails(ex.id)}
                  className="p-4 text-left bg-muted border border-border rounded-lg flex flex-col justify-between hover:border-primary/50 transition-all text-xs font-semibold shadow-sm min-h-[140px]"
                >
                  <div className="space-y-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-[9px] uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded">
                        {ex.subject ? ex.subject.name : ex.course ? "Pace Learning" : "Exam"}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono flex items-center gap-0.5">
                        <Clock className="w-3 h-3" />
                        {ex.duration}m
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-foreground leading-tight truncate">{ex.title}</h4>
                    <p className="text-muted-foreground font-medium line-clamp-2 leading-relaxed">
                      {ex.instructions || "No custom instructions."}
                    </p>
                  </div>
                  <div className="flex justify-between items-center border-t border-border/50 pt-2 mt-3 text-[10px] text-muted-foreground font-bold">
                    <span>{ex._count?.attempts ?? 0} Attempts logged</span>
                    <span className="text-primary hover:underline flex items-center gap-0.5">
                      Configure <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </button>
              ))}
              {exams.length === 0 && (
                <p className="sm:col-span-2 text-xs text-muted-foreground italic text-center py-8">
                  No online exams created yet. Use the wizard form on the right.
                </p>
              )}
            </div>
          </div>

          {/* Create Exam Wizard Form (5 columns) */}
          <div className="lg:col-span-5 bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-sm flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-primary" />
              <span>Create Online Exam</span>
            </h3>
            <form onSubmit={handleCreateExam} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground block">Exam Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mid-Term Chemistry Exam"
                  value={examTitle}
                  onChange={(e) => setExamTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground block">Linked Subject (Active)</label>
                  <select
                    value={examSubjectId}
                    onChange={(e) => {
                      setExamSubjectId(e.target.value);
                      setExamCourseId("");
                    }}
                    className="w-full px-2 py-2 bg-muted border border-border rounded-lg text-xs focus:outline-none"
                  >
                    <option value="">None (Optional)</option>
                    {subjects.map((sub) => (
                      <option key={sub.id} value={sub.id}>{sub.name} ({sub.class.name})</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground block">Linked Course (Pace)</label>
                  <select
                    value={examCourseId}
                    onChange={(e) => {
                      setExamCourseId(e.target.value);
                      setExamSubjectId("");
                    }}
                    className="w-full px-2 py-2 bg-muted border border-border rounded-lg text-xs focus:outline-none"
                  >
                    <option value="">None (Optional)</option>
                    {courses.map((crs) => (
                      <option key={crs.id} value={crs.id}>{crs.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground block">Duration (minutes)</label>
                <input
                  type="number"
                  required
                  value={examDuration}
                  onChange={(e) => setExamDuration(parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-xs focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground block">Candidate Instructions</label>
                <textarea
                  rows={3}
                  placeholder="Explain instructions (no calculators, tab-switching triggers auto-submit, etc.)"
                  value={examInstructions}
                  onChange={(e) => setExamInstructions(e.target.value)}
                  className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-xs focus:outline-none resize-none leading-relaxed"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:bg-primary-hover shadow flex items-center justify-center gap-1.5"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                <span>Create Exam Paper</span>
              </button>
            </form>
          </div>

        </div>
      )}

      {/* DETAILED EXAM MANAGER VIEW */}
      {selectedExamId && selectedExam && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Header Sub-bar */}
          <div className="p-4 bg-muted border rounded-xl flex justify-between items-center text-xs font-semibold shadow-sm">
            <div>
              <p className="font-extrabold text-sm text-foreground">{selectedExam.title}</p>
              <p className="text-muted-foreground font-medium mt-0.5">
                {selectedExam.subject ? `Subject: ${selectedExam.subject.name}` : selectedExam.course ? `Course: ${selectedExam.course.title}` : "General Exam"}
                &bull; {selectedExam.duration} Minutes
              </p>
            </div>
            
            <div className="flex bg-card p-0.5 border rounded-lg font-bold">
              <button
                onClick={() => setActiveTab("questions")}
                className={`px-3.5 py-1.5 rounded transition-all ${
                  activeTab === "questions" ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Questions ({selectedExam.questions.length})
              </button>
              <button
                onClick={() => setActiveTab("attempts")}
                className={`px-3.5 py-1.5 rounded transition-all ${
                  activeTab === "attempts" ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Grading Queue ({attempts.length})
              </button>
            </div>
          </div>

          {/* TAB: QUESTIONS CONSOLE */}
          {activeTab === "questions" && (
            <div className="grid lg:grid-cols-12 gap-8 items-start">
              
              {/* Question Creator (5 columns) */}
              <div className="lg:col-span-5 bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
                <h3 className="font-bold text-sm flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-primary" />
                  <span>Insert Question</span>
                </h3>

                <form onSubmit={handleAddQuestion} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-muted-foreground block">Question Type</label>
                      <select
                        value={qType}
                        onChange={(e) => {
                          setQType(e.target.value as any);
                          setQCorrect("");
                        }}
                        className="w-full px-2 py-2 bg-muted border border-border rounded-lg text-xs focus:outline-none"
                      >
                        <option value="MCQ">Multiple Choice (MCQ)</option>
                        <option value="TRUE_FALSE">True / False</option>
                        <option value="SHORT_ANSWER">Short Text Answer</option>
                        <option value="THEORY">Theory / Essay</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-muted-foreground block">Score Points</label>
                      <input
                        type="number"
                        step={0.5}
                        required
                        value={qPoints}
                        onChange={(e) => setQPoints(parseFloat(e.target.value))}
                        className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-xs focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground block">Question text</label>
                    <textarea
                      rows={3}
                      required
                      placeholder="Write your exam question description..."
                      value={qText}
                      onChange={(e) => setQText(e.target.value)}
                      className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-xs focus:outline-none resize-none leading-relaxed"
                    />
                  </div>

                  {/* Options inputs for MCQ */}
                  {qType === "MCQ" && (
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-muted-foreground block">Answer Options</label>
                      <div className="grid grid-cols-2 gap-2">
                        {mcqOptions.map((opt, idx) => (
                          <input
                            key={idx}
                            type="text"
                            required
                            placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                            value={opt}
                            onChange={(e) => {
                              const copy = [...mcqOptions];
                              copy[idx] = e.target.value;
                              setMcqOptions(copy);
                            }}
                            className="px-2.5 py-1.5 bg-muted border border-border rounded text-[11px] focus:outline-none"
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Correct answer input */}
                  {qType !== "THEORY" && (
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-muted-foreground block">Correct Answer Key</label>
                      {qType === "TRUE_FALSE" ? (
                        <select
                          required
                          value={qCorrect}
                          onChange={(e) => setQCorrect(e.target.value)}
                          className="w-full px-2 py-2 bg-muted border border-border rounded-lg text-xs focus:outline-none"
                        >
                          <option value="">Select Option...</option>
                          <option value="True">True</option>
                          <option value="False">False</option>
                        </select>
                      ) : (
                        <input
                          type="text"
                          required
                          placeholder={qType === "MCQ" ? "e.g. write the exact matching text of correct option" : "e.g. exact phrase to match"}
                          value={qCorrect}
                          onChange={(e) => setQCorrect(e.target.value)}
                          className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-xs focus:outline-none font-mono text-[10px]"
                        />
                      )}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:bg-primary-hover shadow flex items-center justify-center gap-1.5"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    <span>Embed Question</span>
                  </button>
                </form>
              </div>

              {/* Created Questions List (7 columns) */}
              <div className="lg:col-span-7 bg-card border border-border rounded-xl shadow-sm p-6 space-y-4">
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-primary" />
                  <span>Exam Paper Content</span>
                </h3>

                <div className="space-y-3">
                  {selectedExam.questions.map((q, idx) => (
                    <div key={q.id} className="p-4 border rounded-lg bg-muted/20 text-xs font-semibold space-y-2.5">
                      <div className="flex justify-between items-center border-b border-border/50 pb-2">
                        <span className="font-bold text-primary">Question {idx + 1}</span>
                        <span className="text-[10px] text-muted-foreground font-mono bg-card px-2 py-0.5 rounded border">
                          {q.type} &bull; {q.points} pts
                        </span>
                      </div>
                      <p className="text-foreground leading-relaxed font-medium">{q.questionText}</p>
                      
                      {q.options && (
                        <div className="grid grid-cols-2 gap-2 text-[10px] text-muted-foreground pt-1.5">
                          {JSON.parse(q.options).map((opt: string, oIdx: number) => (
                            <div key={oIdx} className="p-1.5 bg-card border rounded truncate font-medium">
                              {String.fromCharCode(65 + oIdx)}. {opt}
                            </div>
                          ))}
                        </div>
                      )}

                      {q.correctAnswer && (
                        <p className="text-[10px] text-emerald-600 font-bold font-mono pt-1.5">
                          ANSWER KEY: {q.correctAnswer}
                        </p>
                      )}
                    </div>
                  ))}

                  {selectedExam.questions.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-8 italic border border-dashed rounded-lg">
                      Question booklet is empty. Use the input form on the left to add items.
                    </p>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* TAB: ATTEMPTS & THEORY GRADING */}
          {activeTab === "attempts" && (
            <div className="space-y-6">
              {!activeAttempt ? (
                <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-muted text-muted-foreground uppercase text-[9px] tracking-wider border-b border-border">
                          <th className="p-3 font-bold">Student Name</th>
                          <th className="p-3 font-bold">Submission Time</th>
                          <th className="p-3 font-bold">Grade score</th>
                          <th className="p-3 font-bold">Grading State</th>
                          <th className="p-3 font-bold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {attempts.map((att) => (
                          <tr key={att.id} className="hover:bg-muted/10">
                            <td className="p-3 font-bold text-foreground">{att.student.user.name}</td>
                            <td className="p-3 text-muted-foreground font-mono text-[11px]">
                              {new Date(att.submittedAt).toLocaleString()}
                            </td>
                            <td className="p-3 font-bold font-mono text-primary">
                              {att.score} pts
                            </td>
                            <td className="p-3">
                              <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${
                                att.isGraded 
                                  ? "bg-emerald-500/10 text-emerald-600" 
                                  : "bg-amber-500/10 text-amber-600"
                              }`}>
                                {att.isGraded ? "Graded & Released" : "Pending Essay Mark"}
                              </span>
                            </td>
                            <td className="p-3 text-right">
                              <button
                                onClick={() => {
                                  setActiveAttempt(att);
                                  const marks: any = {};
                                  att.answers.forEach((ans) => {
                                    if (!ans.isGraded) {
                                      marks[ans.id] = ans.score;
                                    }
                                  });
                                  setTheoryMarks(marks);
                                }}
                                className="px-2.5 py-1 bg-card hover:bg-muted border rounded text-[10px] font-bold"
                              >
                                {att.isGraded ? "Review Answers" : "Grade Essays"}
                              </button>
                            </td>
                          </tr>
                        ))}
                        {attempts.length === 0 && (
                          <tr>
                            <td colSpan={5} className="p-8 text-center text-muted-foreground italic">
                              No student submissions received yet for this exam.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                // ESSAY GRADING SCROLL PANEL
                <div className="grid lg:grid-cols-12 gap-8 items-start">
                  
                  {/* Student Answer Sheets (7 columns) */}
                  <div className="lg:col-span-7 bg-card border border-border rounded-xl p-6 shadow-sm space-y-6">
                    <div className="flex justify-between items-center border-b border-border pb-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setActiveAttempt(null)}
                          className="p-1 rounded border hover:bg-muted"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                        </button>
                        <span className="font-bold text-sm text-foreground">
                          Answers: {activeAttempt.student.user.name}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {activeAttempt.answers.map((ans, idx) => (
                        <div key={ans.id} className="p-4 border rounded-lg bg-muted/20 text-xs font-semibold space-y-3 leading-relaxed">
                          <div className="flex justify-between items-start border-b border-border/50 pb-2">
                            <span className="font-bold text-primary">Question {idx + 1} ({ans.question.type})</span>
                            <span className="text-[10px] font-mono text-muted-foreground">
                              Weight: {ans.question.points} pts &bull; Scored: {ans.score}
                            </span>
                          </div>
                          
                          <div>
                            <span className="text-[9px] uppercase font-bold text-muted-foreground block mb-0.5">Question Text:</span>
                            <p className="text-foreground font-semibold">{ans.question.questionText}</p>
                          </div>

                          <div className="p-3 bg-card border rounded border-slate-200">
                            <span className="text-[9px] uppercase font-bold text-muted-foreground block mb-1">Student Answer:</span>
                            <p className="font-mono text-foreground font-bold">{ans.studentAnswer || "[No answer submitted]"}</p>
                          </div>

                          {ans.question.type !== "THEORY" && ans.question.correctAnswer && (
                            <p className="text-[9.5px] text-emerald-600 font-mono font-bold">
                              Answer Key: {ans.question.correctAnswer}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Grading scorecards (5 columns) */}
                  <div className="lg:col-span-5 bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
                    <h3 className="font-bold text-sm text-primary flex items-center gap-1.5">
                      <Award className="w-4.5 h-4.5" />
                      <span>Essay Grade Evaluator</span>
                    </h3>

                    {activeAttempt.isGraded ? (
                      <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg text-xs leading-relaxed">
                        <p className="font-bold">Exam Already Fully Graded</p>
                        <p className="mt-1">All theory questions have been assessed. Student's final score: <span className="font-extrabold">{activeAttempt.score} pts</span>.</p>
                      </div>
                    ) : (
                      <form onSubmit={handleGradeTheory} className="space-y-4">
                        {activeAttempt.answers.filter(a => !a.isGraded).map((ans, idx) => (
                          <div key={ans.id} className="p-3 bg-muted rounded-lg border text-xs space-y-2">
                            <p className="font-bold">Essay {idx + 1}: "{ans.question.questionText.slice(0, 40)}..."</p>
                            <p className="text-[10px] text-muted-foreground italic font-medium leading-relaxed">Student Response: "{ans.studentAnswer}"</p>
                            
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-muted-foreground block">
                                Score Point (Max {ans.question.points})
                              </label>
                              <input
                                type="number"
                                step={0.5}
                                max={ans.question.points}
                                min={0}
                                required
                                value={theoryMarks[ans.id] || 0}
                                onChange={(e) =>
                                  setTheoryMarks({
                                    ...theoryMarks,
                                    [ans.id]: parseFloat(e.target.value),
                                  })
                                }
                                className="w-full px-2.5 py-1.5 bg-card border border-border rounded text-[11px] focus:outline-none"
                              />
                            </div>
                          </div>
                        ))}

                        <button
                          type="submit"
                          disabled={isLoading}
                          className="w-full py-2.5 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:bg-primary-hover shadow"
                        >
                          Submit Essay Grades
                        </button>
                      </form>
                    )}
                  </div>

                </div>
              )}
            </div>
          )}

        </div>
      )}

    </div>
  );
}
