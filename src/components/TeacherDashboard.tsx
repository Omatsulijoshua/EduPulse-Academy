"use client";

import React, { useState } from "react";
import {
  BookOpen,
  Video,
  Plus,
  Users,
  Calendar,
  ClipboardList,
  CheckCircle,
  Clock,
  Layers,
  ChevronRight,
  Sparkles,
  Loader2,
  FileText,
  Eye,
  Settings,
  ArrowLeft
} from "lucide-react";

interface SubjectData {
  id: string;
  name: string;
  class: {
    name: string;
    _count: {
      students: number;
    };
  };
}

interface CourseData {
  id: string;
  title: string;
  description: string;
  coverImage: string | null;
  price: number;
  isPublished: boolean;
  _count?: {
    enrollments: number;
  };
}

interface TeacherDashboardProps {
  teacherName: string;
  assignedSubjects: SubjectData[];
  courses: CourseData[];
}

export default function TeacherDashboard({
  teacherName,
  assignedSubjects,
  courses,
}: TeacherDashboardProps) {
  const [activeView, setActiveView] = useState<"overview" | "course_manager">("overview");
  const [localCourses, setLocalCourses] = useState<CourseData[]>(courses);
  
  // Selected course details state
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<any | null>(null);

  // States
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  // Form states: Create Course
  const [courseTitle, setCourseTitle] = useState("");
  const [courseDesc, setCourseDesc] = useState("");
  const [coursePrice, setCoursePrice] = useState(0);

  // Form states: Create Module
  const [modTitle, setModTitle] = useState("");

  // Form states: Create Lesson
  const [activeModId, setActiveModId] = useState<string | null>(null);
  const [lessTitle, setLessTitle] = useState("");
  const [lessContent, setLessContent] = useState("");
  const [lessVideo, setLessVideo] = useState("");
  const [lessPdf, setLessPdf] = useState("");
  const [lessDuration, setLessDuration] = useState(15);

  const fetchCourseDetails = async (courseId: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/teacher/courses?courseId=${courseId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSelectedCourse(data.course);
      setSelectedCourseId(courseId);
      setActiveView("course_manager");
    } catch (err: any) {
      setError(err.message || "Failed to load course details");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/teacher/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_course",
          title: courseTitle,
          description: courseDesc,
          price: coursePrice,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setLocalCourses([data.course, ...localCourses]);
      setCourseTitle("");
      setCourseDesc("");
      setCoursePrice(0);
      setMsg("Course created successfully! Click on it below to add modules & lessons.");
      setTimeout(() => setMsg(null), 5000);
    } catch (err: any) {
      setError(err.message || "Failed to create course");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/teacher/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_module",
          courseId: selectedCourseId,
          title: modTitle,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Refresh details
      await fetchCourseDetails(selectedCourseId);
      setModTitle("");
      setMsg("Course Module added!");
      setTimeout(() => setMsg(null), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to create module");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId || !activeModId) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/teacher/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_lesson",
          moduleId: activeModId,
          title: lessTitle,
          content: lessContent,
          videoUrl: lessVideo,
          pdfUrl: lessPdf,
          duration: lessDuration,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Refresh details
      await fetchCourseDetails(selectedCourseId);
      setLessTitle("");
      setLessContent("");
      setLessVideo("");
      setLessPdf("");
      setActiveModId(null);
      setMsg("Lesson added successfully to module!");
      setTimeout(() => setMsg(null), 4000);
    } catch (err: any) {
      setError(err.message || "Failed to create lesson");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePublishToggle = async (publish: boolean) => {
    if (!selectedCourseId) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/teacher/courses", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_course",
          id: selectedCourseId,
          isPublished: publish,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      // Update local catalog list state
      setLocalCourses(localCourses.map(c => c.id === selectedCourseId ? { ...c, isPublished: publish } : c));
      await fetchCourseDetails(selectedCourseId);
      setMsg(publish ? "Course published successfully!" : "Course taken offline.");
      setTimeout(() => setMsg(null), 4000);
    } catch (err: any) {
      setError(err.message || "Failed to update status");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Teacher Console</h1>
          <p className="text-muted-foreground text-sm">
            Welcome back, <span className="text-foreground font-bold">{teacherName}</span>. Check schedules and publish self-paced catalogs.
          </p>
        </div>

        {activeView === "course_manager" && (
          <button
            onClick={() => {
              setActiveView("overview");
              setSelectedCourseId(null);
              setSelectedCourse(null);
            }}
            className="px-4 py-2 bg-muted hover:bg-muted/80 border border-border text-sm font-semibold rounded-lg flex items-center gap-1.5 transition-all shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>
        )}
      </div>

      {/* Notices */}
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

      {/* OVERVIEW VIEW */}
      {activeView === "overview" && (
        <div className="space-y-8">
          
          {/* Quick Metrics */}
          <div className="grid sm:grid-cols-3 gap-6">
            <div className="bg-card border border-border p-6 rounded-xl flex items-center gap-4 shadow-sm">
              <div className="p-3 bg-blue-500/10 rounded-lg text-blue-600">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-extrabold">{assignedSubjects.length}</p>
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Assigned Subjects</p>
              </div>
            </div>

            <div className="bg-card border border-border p-6 rounded-xl flex items-center gap-4 shadow-sm">
              <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-600">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-extrabold">
                  {assignedSubjects.reduce((acc, sub) => acc + sub.class._count.students, 0)}
                </p>
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Mentored Students</p>
              </div>
            </div>

            <div className="bg-card border border-border p-6 rounded-xl flex items-center gap-4 shadow-sm">
              <div className="p-3 bg-amber-500/10 rounded-lg text-amber-500">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-extrabold">{localCourses.length}</p>
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Self-Paced Courses</p>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-12 gap-8 items-start">
            
            {/* Left side: Class Subjects & Course Catalog (7 columns) */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Assigned Subjects Card */}
              <div className="bg-card border border-border rounded-xl shadow-sm p-6 space-y-4">
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span>My Active Classroom Schedules</span>
                </h3>
                <div className="divide-y divide-border">
                  {assignedSubjects.map((sub, idx) => (
                    <div key={idx} className="py-3 flex justify-between items-center text-xs font-semibold">
                      <div className="flex flex-col">
                        <span className="font-bold text-sm">{sub.name}</span>
                        <span className="text-muted-foreground mt-0.5">Section Class: {sub.class.name}</span>
                      </div>
                      <span className="bg-muted px-2.5 py-1 rounded text-muted-foreground border">
                        {sub.class._count.students} students rostered
                      </span>
                    </div>
                  ))}
                  {assignedSubjects.length === 0 && (
                    <p className="text-xs text-muted-foreground italic text-center py-4">
                      No active classroom subjects assigned to you by School Admin.
                    </p>
                  )}
                </div>
              </div>

              {/* Course Catalog Card */}
              <div className="bg-card border border-border rounded-xl shadow-sm p-6 space-y-4">
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-primary" />
                  <span>My Self-Paced Courses</span>
                </h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  {localCourses.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => fetchCourseDetails(c.id)}
                      className="p-4 text-left bg-muted border border-border rounded-lg flex flex-col justify-between hover:border-primary/50 transition-all text-xs font-semibold shadow-sm min-h-[120px]"
                    >
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                            c.isPublished ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" : "bg-muted-foreground/10 text-muted-foreground border"
                          }`}>
                            {c.isPublished ? "Published" : "Draft"}
                          </span>
                          <span className="text-[10px] text-muted-foreground">{c.price === 0 ? "Free" : `$${c.price}`}</span>
                        </div>
                        <h4 className="font-bold text-sm text-foreground leading-tight truncate mb-1">{c.title}</h4>
                        <p className="text-muted-foreground font-medium line-clamp-2 leading-relaxed">{c.description}</p>
                      </div>
                      <div className="flex justify-between items-center pt-2 mt-2 border-t border-border/50 text-[10px] text-muted-foreground font-bold">
                        <span>{c._count?.enrollments ?? 0} Enrolled</span>
                        <span className="text-primary hover:underline flex items-center gap-0.5">
                          Manage <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    </button>
                  ))}
                  {localCourses.length === 0 && (
                    <p className="sm:col-span-2 text-xs text-muted-foreground italic text-center py-8">
                      No self-paced courses created yet. Use the course creator form on the right.
                    </p>
                  )}
                </div>
              </div>

            </div>

            {/* Right side: Course Creator Form (5 columns) */}
            <div className="lg:col-span-5 bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-sm flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-primary" />
                <span>Create New Self-Paced Course</span>
              </h3>
              <form onSubmit={handleCreateCourse} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground block">Course Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Introduction to Physics"
                    value={courseTitle}
                    onChange={(e) => setCourseTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground block">Description Summary</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Write a brief overview describing what this course teaches..."
                    value={courseDesc}
                    onChange={(e) => setCourseDesc(e.target.value)}
                    className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary resize-none leading-relaxed"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground block">Access Price ($)</label>
                  <input
                    type="number"
                    value={coursePrice}
                    onChange={(e) => setCoursePrice(parseFloat(e.target.value))}
                    className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <p className="text-[10px] text-muted-foreground mt-0.5">Set to 0 if the course is free to take.</p>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:bg-primary-hover shadow flex items-center justify-center gap-1.5"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  <span>Create Course Profile</span>
                </button>
              </form>
            </div>

          </div>

        </div>
      )}

      {/* COURSE MANAGER VIEW */}
      {activeView === "course_manager" && selectedCourse && (
        <div className="grid lg:grid-cols-12 gap-8 items-start animate-in fade-in duration-200">
          
          {/* Left panel: Course outline hierarchy & Builder Forms (5 columns) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Course Settings */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-sm flex items-center gap-1.5">
                <Settings className="w-4 h-4 text-primary" />
                <span>Course Publishing Controls</span>
              </h3>
              <div className="p-3 bg-muted rounded-lg text-xs border flex items-center justify-between">
                <div>
                  <p className="font-bold">Catalog Status</p>
                  <p className="text-muted-foreground">
                    {selectedCourse.isPublished ? "Visible to students catalog" : "Draft mode (invisible)"}
                  </p>
                </div>
                <button
                  onClick={() => handlePublishToggle(!selectedCourse.isPublished)}
                  className={`px-3 py-1.5 rounded text-xs font-bold transition-all shadow ${
                    selectedCourse.isPublished 
                      ? "bg-rose-500 text-white hover:bg-rose-600" 
                      : "bg-emerald-500 text-white hover:bg-emerald-600"
                  }`}
                >
                  {selectedCourse.isPublished ? "Unpublish" : "Publish"}
                </button>
              </div>
            </div>

            {/* Create Module Form */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-sm flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-primary" />
                <span>1. Add Course Module</span>
              </h3>
              <form onSubmit={handleCreateModule} className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="e.g. Module 1: Core Principles"
                  value={modTitle}
                  onChange={(e) => setModTitle(e.target.value)}
                  className="flex-1 px-3 py-2 bg-muted border border-border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-3.5 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:bg-primary-hover shadow shrink-0 flex items-center justify-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </form>
            </div>

            {/* Create Lesson Form */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-sm flex items-center gap-1.5">
                <Video className="w-4 h-4 text-primary" />
                <span>2. Create & Embed Lesson</span>
              </h3>
              
              <form onSubmit={handleCreateLesson} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground block">Select Module Target</label>
                  <select
                    required
                    value={activeModId || ""}
                    onChange={(e) => setActiveModId(e.target.value)}
                    className="w-full px-2 py-2 bg-muted border border-border rounded-lg text-xs focus:outline-none focus:ring-1"
                  >
                    <option value="">Choose module...</option>
                    {selectedCourse.modules.map((m: any) => (
                      <option key={m.id} value={m.id}>{m.title}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground block">Lesson Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Lesson 1: Introduction to Gravity"
                    value={lessTitle}
                    onChange={(e) => setLessTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground block">Video Link (Embed URL)</label>
                    <input
                      type="text"
                      placeholder="e.g. https://www.youtube.com/embed/..."
                      value={lessVideo}
                      onChange={(e) => setLessVideo(e.target.value)}
                      className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary font-mono text-[10px]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground block">Lesson Duration (mins)</label>
                    <input
                      type="number"
                      value={lessDuration}
                      onChange={(e) => setLessDuration(parseInt(e.target.value))}
                      className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground block">PDF Material File Attachment URL</label>
                  <input
                    type="text"
                    placeholder="e.g. https://example.com/syllabus.pdf"
                    value={lessPdf}
                    onChange={(e) => setLessPdf(e.target.value)}
                    className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary font-mono text-[10px]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground block">Lesson Content Details (Markdown/Text)</label>
                  <textarea
                    rows={4}
                    placeholder="Write details or summary text representing the lesson description..."
                    value={lessContent}
                    onChange={(e) => setLessContent(e.target.value)}
                    className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary resize-none leading-relaxed"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading || selectedCourse.modules.length === 0 || !activeModId}
                  className="w-full py-2.5 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:bg-primary-hover shadow flex items-center justify-center gap-1.5"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  <span>Embed Lesson</span>
                </button>
              </form>
            </div>

          </div>

          {/* Right panel: Live Outlines player overview list (7 columns) */}
          <div className="lg:col-span-7 bg-card border border-border rounded-xl shadow-sm p-6 space-y-6">
            <div className="border-b border-border pb-3 flex justify-between items-center">
              <div className="flex flex-col">
                <h3 className="font-extrabold text-base text-foreground truncate">{selectedCourse.title}</h3>
                <p className="text-xs text-muted-foreground font-semibold mt-0.5 leading-relaxed">{selectedCourse.description}</p>
              </div>
            </div>

            {/* Outline list */}
            <div className="space-y-4">
              {selectedCourse.modules.map((mod: any, mIdx: number) => (
                <div key={mod.id} className="space-y-2 border border-border rounded-lg overflow-hidden bg-muted/20">
                  <div className="p-3 bg-muted font-bold text-xs flex justify-between items-center">
                    <span>{mod.title}</span>
                    <span className="text-[9.5px] font-medium text-muted-foreground bg-card border px-2 py-0.5 rounded">
                      Module {mod.order}
                    </span>
                  </div>
                  
                  <div className="divide-y divide-border px-3 pb-3">
                    {mod.lessons.map((less: any) => (
                      <div key={less.id} className="py-2.5 flex items-center justify-between text-xs font-semibold">
                        <div className="flex items-center gap-2">
                          <Eye className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <span className="truncate">{less.title}</span>
                        </div>
                        <div className="flex items-center gap-3 text-muted-foreground font-bold shrink-0">
                          {less.videoUrl && <Video className="w-3.5 h-3.5" title="Embedded video lecture" />}
                          {less.pdfUrl && <FileText className="w-3.5 h-3.5" title="PDF attachment" />}
                          <span className="flex items-center gap-0.5 font-mono text-[10px]">
                            <Clock className="w-3 h-3" />
                            {less.duration}m
                          </span>
                        </div>
                      </div>
                    ))}
                    {mod.lessons.length === 0 && (
                      <p className="text-[11px] text-muted-foreground italic text-center py-3">No lessons created inside this module.</p>
                    )}
                  </div>
                </div>
              ))}

              {selectedCourse.modules.length === 0 && (
                <div className="p-12 text-center text-muted-foreground border border-dashed rounded-lg">
                  <p className="text-xs italic mb-2">Course syllabus outline is empty.</p>
                  <p className="text-[10px] text-muted-foreground font-medium">Add modules and lessons to build the curriculum.</p>
                </div>
              )}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
