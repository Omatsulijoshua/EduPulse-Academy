"use client";

import React, { useState, useEffect } from "react";
import { 
  Play, 
  Check, 
  Lock, 
  ChevronRight, 
  Video, 
  FileText, 
  Award, 
  Loader2, 
  Printer, 
  CheckCircle,
  FileDown
} from "lucide-react";
import Logo from "@/components/Logo";

interface Lesson {
  id: string;
  title: string;
  content: string | null;
  videoUrl: string | null;
  pdfUrl: string | null;
  duration: number;
  order: number;
}

interface Module {
  id: string;
  title: string;
  order: number;
  lessons: Lesson[];
}

interface CoursePlayerProps {
  course: {
    id: string;
    title: string;
    description: string;
  };
  modules: Module[];
  initialCompletedLessonIds: string[];
  initialEnrollment: {
    progress: number;
    isCompleted: boolean;
  } | null;
}

export default function CoursePlayer({
  course,
  modules,
  initialCompletedLessonIds,
  initialEnrollment,
}: CoursePlayerProps) {
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>(
    initialCompletedLessonIds
  );
  const [enrollment, setEnrollment] = useState(initialEnrollment);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [certCode, setCertCode] = useState<string | null>(null);

  // Flatten all lessons across all modules to calculate locks and indexes
  const allLessons: Lesson[] = modules
    .slice()
    .sort((a, b) => a.order - b.order)
    .flatMap((m) =>
      m.lessons.slice().sort((a, b) => a.order - b.order)
    );

  // Initialize first unlocked lesson as active if none selected
  useEffect(() => {
    if (allLessons.length > 0 && !activeLesson) {
      // Find first lesson that is not completed, or default to first lesson
      const firstUncompleted = allLessons.find(
        (less) => !completedLessonIds.includes(less.id)
      );
      setActiveLesson(firstUncompleted || allLessons[0]);
    }
  }, [allLessons, completedLessonIds, activeLesson]);

  // Checks if a lesson is locked
  const isLessonLocked = (lessonId: string) => {
    const idx = allLessons.findIndex((less) => less.id === lessonId);
    if (idx === -1) return true;
    if (idx === 0) return false; // First lesson is always unlocked
    
    // Unlocked only if previous lesson is completed
    const prevLesson = allLessons[idx - 1];
    return !completedLessonIds.includes(prevLesson.id);
  };

  const handleMarkComplete = async () => {
    if (!activeLesson) return;
    setIsLoading(true);

    try {
      const res = await fetch("/api/student/courses", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonId: activeLesson.id,
          courseId: course.id,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Add to completed logs
      if (!completedLessonIds.includes(activeLesson.id)) {
        setCompletedLessonIds([...completedLessonIds, activeLesson.id]);
      }

      // Update enrollment progress
      setEnrollment({
        progress: data.progress,
        isCompleted: data.isCompleted,
      });

      if (data.certificateCode) {
        setCertCode(data.certificateCode);
      }

      // Move to next lesson if available
      const currentIdx = allLessons.findIndex((less) => less.id === activeLesson.id);
      if (currentIdx !== -1 && currentIdx < allLessons.length - 1) {
        setActiveLesson(allLessons[currentIdx + 1]);
      }
    } catch (err) {
      console.error("Failed to mark lesson complete:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrintCertificate = () => {
    window.print();
  };

  const isCompleted = enrollment?.isCompleted || completedLessonIds.length === allLessons.length;

  return (
    <div className="space-y-8 print:p-0 print:m-0 print:bg-white print:text-black">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-4 print:hidden">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">{course.title}</h1>
          <p className="text-muted-foreground text-xs font-semibold mt-0.5">
            Self-Paced Course Player &bull; {enrollment?.progress ?? 0}% Complete
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8 items-start print:block">
        
        {/* Navigation Sidebar (4 columns) */}
        <div className="lg:col-span-4 bg-card border border-border rounded-xl shadow-sm overflow-hidden sticky top-20 print:hidden">
          <div className="p-4 bg-muted border-b border-border font-bold text-xs">
            COURSE MODULES
          </div>

          <div className="divide-y divide-border max-h-[500px] overflow-y-auto">
            {modules.map((mod) => (
              <div key={mod.id} className="space-y-1 p-3">
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1 block">
                  {mod.title}
                </span>

                <div className="space-y-1">
                  {mod.lessons.map((less) => {
                    const active = activeLesson?.id === less.id;
                    const completed = completedLessonIds.includes(less.id);
                    const locked = isLessonLocked(less.id);

                    return (
                      <button
                        key={less.id}
                        disabled={locked}
                        onClick={() => setActiveLesson(less)}
                        className={`w-full p-2.5 rounded-lg text-left text-xs font-semibold flex justify-between items-center transition-all ${
                          active
                            ? "bg-primary text-primary-foreground shadow"
                            : locked
                            ? "text-muted-foreground/40 bg-muted/20 cursor-not-allowed"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          {completed ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          ) : locked ? (
                            <Lock className="w-3.5 h-3.5 shrink-0" />
                          ) : (
                            <Play className="w-3.5 h-3.5 shrink-0" />
                          )}
                          <span className="truncate">{less.title}</span>
                        </div>
                        <span className="text-[9px] font-mono shrink-0 ml-2">{less.duration}m</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Content Viewer (8 columns) */}
        <div className="lg:col-span-8 space-y-6 print:w-full">
          {activeLesson ? (
            <div className="space-y-6 print:hidden">
              {/* Video Player Frame */}
              {activeLesson.videoUrl && (
                <div className="bg-slate-950 border border-border rounded-xl overflow-hidden aspect-video shadow-lg relative flex items-center justify-center">
                  <iframe
                    src={activeLesson.videoUrl}
                    title={activeLesson.title}
                    className="absolute inset-0 w-full h-full border-0"
                    allowFullScreen
                  />
                </div>
              )}

              {/* Lesson Text details */}
              <div className="bg-card border border-border rounded-xl p-6 md:p-8 shadow-sm space-y-6">
                <div>
                  <h2 className="text-xl font-extrabold mb-1">{activeLesson.title}</h2>
                  <span className="text-[10px] text-muted-foreground font-mono flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {activeLesson.duration} minutes estimated study time
                  </span>
                </div>

                {activeLesson.content && (
                  <div className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line border-t border-border pt-6">
                    {activeLesson.content}
                  </div>
                )}

                {/* PDF Materials attachment */}
                {activeLesson.pdfUrl && (
                  <div className="p-4 bg-muted border border-border rounded-lg flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-red-500" />
                      <div>
                        <p className="font-bold">Lesson Syllabus Materials</p>
                        <p className="text-[10px] text-muted-foreground">PDF attachment</p>
                      </div>
                    </div>
                    <a
                      href={activeLesson.pdfUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded bg-card hover:bg-muted text-[10px] font-bold border flex items-center gap-1"
                    >
                      <FileDown className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </a>
                  </div>
                )}

                {/* Mark complete action */}
                <div className="border-t border-border pt-6 flex justify-end">
                  <button
                    onClick={handleMarkComplete}
                    disabled={isLoading}
                    className="px-5 py-3 rounded-lg bg-primary text-primary-foreground font-bold hover:bg-primary-hover shadow flex items-center justify-center gap-1.5 text-sm"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : completedLessonIds.includes(activeLesson.id) ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-emerald-300" />
                        <span>Completed (Proceed Next)</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Mark Complete & Continue</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-muted-foreground bg-card border border-border rounded-xl print:hidden">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
              <span>Loading lesson outlines...</span>
            </div>
          )}

          {/* GRADUATION / CERTIFICATE VIEW CARD */}
          {isCompleted && (
            <div className="space-y-6 pt-4 border-t border-border print:pt-0 print:border-0">
              
              {/* Congratulation Notification (hide when printing) */}
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
                <div className="space-y-1">
                  <h3 className="font-extrabold text-lg text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                    <Award className="w-6 h-6 animate-bounce" />
                    <span>Congratulations! You graduated!</span>
                  </h3>
                  <p className="text-xs text-muted-foreground max-w-md">
                    You have successfully completed 100% of the lessons in this course. Your graduation certificate is available below.
                  </p>
                </div>
                <button
                  onClick={handlePrintCertificate}
                  className="px-4 py-2 bg-card hover:bg-muted text-xs font-bold border rounded-lg shadow-sm flex items-center gap-1.5 shrink-0 transition-all"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Certificate</span>
                </button>
              </div>

              {/* PREMIUM CERTIFICATE TEMPLATE VIEW */}
              <div className="bg-white text-slate-900 border-8 border-double border-amber-500 rounded-2xl p-8 sm:p-12 max-w-4xl mx-auto shadow-2xl relative flex flex-col justify-between items-center text-center aspect-[1.414/1] overflow-hidden select-none print:shadow-none print:border-amber-600">
                {/* Vintage certificate styles */}
                <div className="absolute inset-4 border border-slate-200 pointer-events-none" />
                <div className="absolute top-0 left-0 w-32 h-32 bg-amber-500/5 rounded-br-full pointer-events-none" />
                
                {/* Brand Header */}
                <div className="flex flex-col items-center mt-4">
                  <Logo size="sm" showText={true} className="brightness-75" />
                  <span className="text-[10px] tracking-widest text-slate-400 font-bold uppercase mt-1">
                    ClassNova Academy Portal
                  </span>
                </div>

                <div className="space-y-4 my-8">
                  <span className="text-xs font-serif uppercase tracking-widest text-amber-600 font-bold block">
                    Certificate of Graduation
                  </span>
                  
                  <p className="text-xs text-slate-400 italic font-serif">
                    This is proudly presented to
                  </p>

                  <h3 className="text-3xl sm:text-4xl font-serif font-extrabold tracking-tight text-slate-900 underline decoration-amber-500/40 decoration-wavy underline-offset-8">
                    Tyler Chen
                  </h3>

                  <p className="text-xs text-slate-500 max-w-lg leading-relaxed font-serif pt-4 mx-auto">
                    for successfully demonstrating mastery and completing all requirements for the self-paced syllabus course entitled
                  </p>

                  <h4 className="text-xl sm:text-2xl font-extrabold text-primary font-sans leading-tight">
                    {course.title}
                  </h4>
                </div>

                {/* Footer Signatures */}
                <div className="w-full grid grid-cols-2 gap-12 mt-8 max-w-md border-t border-slate-200 pt-6 text-[10px] font-semibold text-slate-400 font-serif">
                  <div className="flex flex-col items-center">
                    <span className="text-slate-800 font-sans italic font-medium text-xs mb-1">Jenkins S.</span>
                    <span className="border-t border-slate-300 w-24 pt-1 block text-[9px]">School Principal</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-slate-800 font-sans italic font-medium text-xs mb-1">Vance M.</span>
                    <span className="border-t border-slate-300 w-24 pt-1 block text-[9px]">Course Instructor</span>
                  </div>
                </div>

                {/* Verification Stamp */}
                <div className="mt-8 flex flex-col items-center text-[9px] text-slate-400 font-bold font-mono">
                  <span>VERIFICATION CODE: {certCode || "CN-DEMO-CERT-1029"}</span>
                  <span className="text-slate-300 text-[8px] mt-0.5">Securely logged in ClassNova ledger</span>
                </div>

                {/* Gold Seal decoration */}
                <div className="absolute right-8 bottom-8 w-16 h-16 bg-amber-500 rounded-full border-4 border-amber-600 flex items-center justify-center shadow-lg transform rotate-12 opacity-80 hidden sm:flex">
                  <Award className="w-8 h-8 text-white" />
                </div>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
