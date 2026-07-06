"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Clock,
  AlertTriangle,
  Award,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Loader2,
  CheckCircle,
  Flag,
  CornerDownRight,
  FileSpreadsheet
} from "lucide-react";

interface Question {
  id: string;
  type: "MCQ" | "TRUE_FALSE" | "SHORT_ANSWER" | "THEORY";
  questionText: string;
  options: string | null; // JSON
  points: number;
}

interface CBTExamPlayerProps {
  exam: {
    id: string;
    title: string;
    instructions: string | null;
    duration: number;
    showResult: boolean;
    questions: Question[];
  };
}

export default function CBTExamPlayer({ exam }: CBTExamPlayerProps) {
  const [gameState, setGameState] = useState<"instructions" | "active" | "submitted">("instructions");
  const [attemptId, setAttemptId] = useState<string | null>(null);

  // Navigator index state
  const [currentQIdx, setCurrentQIdx] = useState(0);

  // Student Answers state
  // Records mapping: questionId -> studentAnswer
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<string, boolean>>({});

  // Countdown timer states
  const [timeLeft, setTimeLeft] = useState(exam.duration * 60);

  // Anti-Cheat counters
  const [blurCount, setBlurCount] = useState(0);
  const [antiCheatWarning, setAntiCheatWarning] = useState<string | null>(null);

  // Loading / saving states
  const [isLoading, setIsLoading] = useState(false);
  const [submitScore, setSubmitScore] = useState<number | null>(null);
  const [isGraded, setIsGraded] = useState(false);

  // Refs for tracking timer and count
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Initialize Anti-Cheat tab blurs monitoring when active
  useEffect(() => {
    if (gameState !== "active") return;

    const handleWindowBlur = () => {
      setBlurCount((prev) => {
        const next = prev + 1;
        if (next >= 4) {
          // Trigger force submit
          setAntiCheatWarning("Anti-Cheat Locked! Submitting assessment due to excessive tab switching...");
          setTimeout(() => {
            forceSubmitExam();
          }, 2000);
        } else {
          setAntiCheatWarning(
            `Warning: Tab switch detected! (Incident ${next}/3). Switching tabs again will force auto-submit the exam.`
          );
          setTimeout(() => setAntiCheatWarning(null), 8000);
        }
        return next;
      });
    };

    window.addEventListener("blur", handleWindowBlur);
    return () => {
      window.removeEventListener("blur", handleWindowBlur);
    };
  }, [gameState]);

  // 2. Countdown timer ticking
  useEffect(() => {
    if (gameState !== "active") return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          forceSubmitExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState]);

  const handleStartExam = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/exams/attempt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ examId: exam.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setAttemptId(data.attempt.id);
      
      // Load pre-existing answers if resuming
      if (data.resume && data.attempt.answers) {
        const preAnswers: any = {};
        data.attempt.answers.forEach((ans: any) => {
          preAnswers[ans.questionId] = ans.studentAnswer;
        });
        setAnswers(preAnswers);
      }

      setGameState("active");
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerChange = (questionId: string, val: string) => {
    setAnswers({
      ...answers,
      [questionId]: val,
    });
  };

  const toggleFlag = (questionId: string) => {
    setFlaggedQuestions({
      ...flaggedQuestions,
      [questionId]: !flaggedQuestions[questionId],
    });
  };

  const forceSubmitExam = async () => {
    if (gameState === "submitted") return;
    setIsLoading(true);
    
    // Format answers array
    const answersArray = exam.questions.map((q) => ({
      questionId: q.id,
      studentAnswer: answers[q.id] || "",
    }));

    try {
      const activeId = attemptId || localStorage.getItem(`attempt_${exam.id}`);
      const res = await fetch("/api/exams/attempt", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId: activeId, answers: answersArray }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (data.score !== undefined) {
        setSubmitScore(data.score);
        setIsGraded(data.isGraded);
      }
      setGameState("submitted");
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${remainingSecs.toString().padStart(2, "0")}`;
  };

  const currentQ = exam.questions[currentQIdx];

  return (
    <div className="space-y-6">
      
      {/* 1. PRE-EXAM INSTRUCTIONS SCREEN */}
      {gameState === "instructions" && (
        <div className="max-w-2xl mx-auto bg-card border border-border rounded-xl p-8 shadow-sm space-y-6 animate-in zoom-in duration-200">
          <div className="text-center space-y-2">
            <ClipboardList className="w-12 h-12 text-primary mx-auto animate-pulse" />
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">{exam.title}</h1>
            <p className="text-xs text-muted-foreground font-semibold">CBT Assessment Instructions</p>
          </div>

          <div className="border bg-muted p-4 rounded-lg text-xs leading-relaxed space-y-3 font-medium">
            <h3 className="font-bold text-foreground">Canditate Instructions:</h3>
            <p className="text-muted-foreground">{exam.instructions || "No customized candidate instructions. Complete all questions before submitting."}</p>
            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-border text-[11px]">
              <div>
                <span className="block text-muted-foreground font-bold">Total Duration:</span>
                <span className="text-foreground font-extrabold">{exam.duration} Minutes</span>
              </div>
              <div>
                <span className="block text-muted-foreground font-bold">Question Count:</span>
                <span className="text-foreground font-extrabold">{exam.questions.length} Items</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 rounded-lg text-xs flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 shrink-0" />
            <div>
              <p className="font-bold">Anti-Cheat Mode Activated</p>
              <p className="mt-0.5 leading-relaxed text-[11px] font-medium">
                ClassNova monitors browser window switches and blur events. Leaving this page or changing browser tabs more than 3 times will trigger auto-submission of your answer sheet!
              </p>
            </div>
          </div>

          <button
            onClick={handleStartExam}
            disabled={isLoading || exam.questions.length === 0}
            className="w-full py-3 bg-primary text-primary-foreground font-bold hover:bg-primary-hover shadow-lg rounded-xl flex items-center justify-center gap-2 text-sm"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            <span>Start Assessment</span>
          </button>
        </div>
      )}

      {/* 2. ACTIVE CBT EXAM PLAYER VIEW */}
      {gameState === "active" && currentQ && (
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Panel: Question Navigator & timer (4 columns) */}
          <div className="lg:col-span-4 bg-card border border-border rounded-xl shadow-sm overflow-hidden sticky top-20">
            {/* Timer Banner */}
            <div className="p-4 bg-muted border-b border-border flex justify-between items-center text-xs font-bold">
              <span className="text-muted-foreground uppercase tracking-wider">Remaining Time</span>
              <span className="text-rose-500 font-mono text-sm flex items-center gap-1.5 animate-pulse bg-rose-500/5 px-2.5 py-1 rounded">
                <Clock className="w-4 h-4" />
                {formatTime(timeLeft)}
              </span>
            </div>

            {/* Questions Tracker Grid */}
            <div className="p-6 space-y-4">
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">
                Questions Booklet
              </span>
              <div className="grid grid-cols-5 gap-2.5">
                {exam.questions.map((q, idx) => {
                  const answered = !!answers[q.id];
                  const flagged = flaggedQuestions[q.id];
                  const active = currentQIdx === idx;

                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentQIdx(idx)}
                      className={`h-9 w-full rounded-lg text-xs font-bold border transition-all flex items-center justify-center ${
                        active
                          ? "bg-primary text-primary-foreground border-primary shadow"
                          : flagged
                          ? "bg-amber-500 text-white border-amber-600 shadow-sm"
                          : answered
                          ? "bg-emerald-500 text-white border-emerald-600 shadow-sm"
                          : "text-muted-foreground bg-muted hover:border-slate-300"
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Submissions Panel */}
            <div className="p-6 pt-0 border-t border-border">
              <button
                onClick={forceSubmitExam}
                disabled={isLoading}
                className="w-full mt-6 py-2.5 bg-rose-600 text-white font-bold hover:bg-rose-700 shadow-md rounded-lg text-xs"
              >
                {isLoading ? "Submitting..." : "Submit Answer Sheet"}
              </button>
            </div>
          </div>

          {/* Right Panel: Active Question Pane (8 columns) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Anti cheat alert banner */}
            {antiCheatWarning && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-lg text-xs flex items-center gap-2 animate-bounce">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <span className="font-bold">{antiCheatWarning}</span>
              </div>
            )}

            {/* Question Card */}
            <div className="bg-card border border-border rounded-xl p-6 md:p-8 shadow-sm space-y-6">
              
              {/* Question Header */}
              <div className="flex justify-between items-start border-b border-border pb-4">
                <div>
                  <h3 className="font-extrabold text-base text-primary">Question {currentQIdx + 1}</h3>
                  <span className="text-[10px] text-muted-foreground font-mono mt-0.5 block uppercase tracking-wider">
                    {currentQ.type} &bull; {currentQ.points} points
                  </span>
                </div>
                <button
                  onClick={() => toggleFlag(currentQ.id)}
                  className={`p-2 border rounded-lg hover:bg-muted text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    flaggedQuestions[currentQ.id] ? "bg-amber-500 text-white border-amber-600" : "text-muted-foreground"
                  }`}
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span>Flag</span>
                </button>
              </div>

              {/* Question Text Body */}
              <p className="text-sm text-foreground font-semibold leading-relaxed whitespace-pre-line">
                {currentQ.questionText}
              </p>

              {/* Answers Input Area */}
              <div className="pt-4 border-t border-border/50">
                {/* 1. MCQ OPTIONS LIST */}
                {currentQ.type === "MCQ" && currentQ.options && (
                  <div className="grid sm:grid-cols-2 gap-3">
                    {JSON.parse(currentQ.options).map((opt: string, oIdx: number) => {
                      const optCode = String.fromCharCode(65 + oIdx);
                      const selected = answers[currentQ.id] === opt;
                      return (
                        <button
                          key={oIdx}
                          onClick={() => handleAnswerChange(currentQ.id, opt)}
                          className={`p-3 text-left border rounded-lg text-xs font-semibold transition-all flex items-center gap-2 hover:bg-muted/10 ${
                            selected
                              ? "bg-primary/5 border-primary text-primary"
                              : "text-muted-foreground"
                          }`}
                        >
                          <span className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 font-bold ${
                            selected ? "bg-primary text-white border-primary" : "bg-muted"
                          }`}>
                            {optCode}
                          </span>
                          <span className="truncate">{opt}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* 2. TRUE_FALSE OPTIONS LIST */}
                {currentQ.type === "TRUE_FALSE" && (
                  <div className="flex gap-4">
                    {["True", "False"].map((opt) => {
                      const selected = answers[currentQ.id] === opt;
                      return (
                        <button
                          key={opt}
                          onClick={() => handleAnswerChange(currentQ.id, opt)}
                          className={`px-6 py-2.5 border rounded-lg text-xs font-bold transition-all ${
                            selected
                              ? "bg-primary text-primary-foreground border-primary shadow"
                              : "text-muted-foreground bg-muted hover:border-slate-300"
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* 3. SHORT ANSWER INPUT */}
                {currentQ.type === "SHORT_ANSWER" && (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground block mb-1">Your Answer:</label>
                    <input
                      type="text"
                      placeholder="Type short answer text here..."
                      value={answers[currentQ.id] || ""}
                      onChange={(e) => handleAnswerChange(currentQ.id, e.target.value)}
                      className="w-full max-w-md px-3 py-2 bg-muted border border-border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary font-mono text-[11px]"
                    />
                  </div>
                )}

                {/* 4. THEORY / ESSAY TEXT AREA */}
                {currentQ.type === "THEORY" && (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground block mb-1">Write Essay / Explanation:</label>
                    <textarea
                      rows={6}
                      placeholder="Write your calculations, equations, or paragraphs response here..."
                      value={answers[currentQ.id] || ""}
                      onChange={(e) => handleAnswerChange(currentQ.id, e.target.value)}
                      className="w-full px-3 py-2.5 bg-muted border border-border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary resize-none leading-relaxed"
                    />
                  </div>
                )}
              </div>

              {/* Navigation buttons */}
              <div className="flex justify-between items-center border-t border-border pt-6">
                <button
                  disabled={currentQIdx === 0}
                  onClick={() => setCurrentQIdx(currentQIdx - 1)}
                  className="px-3.5 py-2 bg-muted hover:bg-muted/80 text-xs font-bold rounded-lg border border-border text-muted-foreground flex items-center gap-1 transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                <button
                  disabled={currentQIdx === exam.questions.length - 1}
                  onClick={() => setCurrentQIdx(currentQIdx + 1)}
                  className="px-3.5 py-2 bg-muted hover:bg-muted/80 text-xs font-bold rounded-lg border border-border text-muted-foreground flex items-center gap-1 transition-all"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

            </div>
          </div>

        </div>
      )}

      {/* 3. COMPLETED SUCCESS SCREEN */}
      {gameState === "submitted" && (
        <div className="max-w-xl mx-auto bg-card border border-border rounded-xl p-8 shadow-sm space-y-6 text-center animate-in zoom-in duration-200">
          <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto animate-bounce" />
          
          <div className="space-y-1">
            <h1 className="text-2xl font-extrabold tracking-tight">Assessment Submitted Successfully</h1>
            <p className="text-xs text-muted-foreground font-semibold">Your exam booklet has been locked and securely filed.</p>
          </div>

          {exam.showResult && isGraded && submitScore !== null ? (
            <div className="p-6 bg-muted rounded-xl border border-border max-w-sm mx-auto space-y-3 font-semibold text-xs leading-none">
              <span className="block text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1">Cumulative Grade Score</span>
              <p className="text-3xl font-extrabold text-primary">{submitScore} points</p>
              
              {/* Score analysis details */}
              <div className="border-t border-border pt-4 mt-4 text-[10px] text-muted-foreground font-bold flex justify-between items-center px-4">
                <span>Auto-Graded Objectives: Yes</span>
                <span className="text-emerald-500">Released ✅</span>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 rounded-lg text-xs leading-relaxed">
              <p className="font-bold">Answers Pending Review</p>
              <p className="mt-0.5 text-[11px] font-medium">Your exam contains theory questions. Your grade score will be released as soon as the course instructor finishes reviewing your scripts.</p>
            </div>
          )}

          <div className="pt-4">
            <Link
              href="/dashboard/student"
              className="px-6 py-2.5 bg-primary text-primary-foreground font-bold hover:bg-primary-hover shadow rounded-lg text-xs inline-flex items-center gap-1.5"
            >
              <span>Back to Student Dashboard</span>
            </Link>
          </div>
        </div>
      )}

    </div>
  );
}
