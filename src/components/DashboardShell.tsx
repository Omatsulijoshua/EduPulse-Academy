"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import {
  LayoutDashboard,
  Building2,
  CreditCard,
  History,
  BookOpen,
  Users,
  GraduationCap,
  DollarSign,
  Globe,
  Bell,
  Sun,
  Moon,
  LogOut,
  Menu,
  X,
  UserCheck,
  Calendar,
  ClipboardList,
  FileSpreadsheet,
  Layers,
} from "lucide-react";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  schoolName?: string;
  schoolSlug?: string;
  avatar?: string | null;
}

interface DashboardShellProps {
  user: UserProfile;
  children: React.ReactNode;
}

export default function DashboardShell({ user, children }: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [themeMode, setThemeMode] = useState<"light" | "dark">("light");

  // Sync theme
  React.useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setThemeMode(isDark ? "dark" : "light");
  }, []);

  const toggleTheme = () => {
    if (themeMode === "light") {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setThemeMode("dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setThemeMode("light");
    }
  };

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (response.ok) {
        router.push("/login");
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  // Define sidebar navigation items based on role
  const getNavLinks = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return [
          { label: "Overview", href: "/dashboard/super-admin", icon: <LayoutDashboard className="w-5 h-5" /> },
          { label: "Manage Schools", href: "/dashboard/super-admin/schools", icon: <Building2 className="w-5 h-5" /> },
          { label: "Subscriptions", href: "/dashboard/super-admin/subscriptions", icon: <CreditCard className="w-5 h-5" /> },
          { label: "Audit Logs", href: "/dashboard/super-admin/logs", icon: <History className="w-5 h-5" /> },
        ];
      case "SCHOOL_ADMIN":
        return [
          { label: "Overview", href: "/dashboard/school-admin", icon: <LayoutDashboard className="w-5 h-5" /> },
          { label: "Academic Structure", href: "/dashboard/school-admin/structure", icon: <Layers className="w-5 h-5" /> },
          { label: "Teachers & Staff", href: "/dashboard/school-admin/teachers", icon: <UserCheck className="w-5 h-5" /> },
          { label: "Students & Parents", href: "/dashboard/school-admin/students", icon: <Users className="w-5 h-5" /> },
          { label: "Fee Billing", href: "/dashboard/school-admin/fees", icon: <DollarSign className="w-5 h-5" /> },
          { label: "Website Builder", href: "/dashboard/school-admin/website", icon: <Globe className="w-5 h-5" /> },
        ];
      case "TEACHER":
        return [
          { label: "Dashboard", href: "/dashboard/teacher", icon: <LayoutDashboard className="w-5 h-5" /> },
          { label: "My Classes", href: "/dashboard/teacher/classes", icon: <BookOpen className="w-5 h-5" /> },
          { label: "Question Bank", href: "/dashboard/teacher/cbt", icon: <ClipboardList className="w-5 h-5" /> },
          { label: "Attendance Log", href: "/dashboard/teacher/attendance", icon: <Calendar className="w-5 h-5" /> },
        ];
      case "STUDENT":
        return [
          { label: "My Dashboard", href: "/dashboard/student", icon: <LayoutDashboard className="w-5 h-5" /> },
          { label: "Pace Courses", href: "/dashboard/student/courses", icon: <BookOpen className="w-5 h-5" /> },
          { label: "Active Class", href: "/dashboard/student/active", icon: <GraduationCap className="w-5 h-5" /> },
          { label: "CBT Exams", href: "/dashboard/student/exams", icon: <ClipboardList className="w-5 h-5" /> },
        ];
      case "PARENT":
        return [
          { label: "Overview", href: "/dashboard/parent", icon: <LayoutDashboard className="w-5 h-5" /> },
          { label: "Child Progress", href: "/dashboard/parent/child-progress", icon: <FileSpreadsheet className="w-5 h-5" /> },
          { label: "Billing & Fees", href: "/dashboard/parent/payments", icon: <DollarSign className="w-5 h-5" /> },
        ];
      default:
        return [];
    }
  };

  const navLinks = getNavLinks(user.role);

  return (
    <div className="min-h-screen flex bg-background text-foreground transition-colors duration-300">
      
      {/* SIDEBAR - DESKTOP */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 xl:w-72 bg-card border-r border-border shrink-0 sticky top-0 h-screen p-6 justify-between shadow-sm">
        <div className="space-y-8">
          <Link href="/">
            <Logo size="sm" />
          </Link>

          {/* School Name Badge */}
          {user.schoolName && (
            <div className="p-3 bg-muted rounded-lg border border-border text-xs flex flex-col font-medium truncate">
              <span className="text-muted-foreground uppercase text-[10px] tracking-wider">Active School</span>
              <span className="font-extrabold text-foreground truncate mt-0.5">{user.schoolName}</span>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navLinks.map((link, idx) => {
              const active = pathname === link.href || pathname.startsWith(link.href + "/");
              return (
                <Link
                  key={idx}
                  href={link.href}
                  className={`flex items-center gap-3.5 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
                    active
                      ? "bg-primary text-primary-foreground shadow"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {link.icon}
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer controls */}
        <div className="space-y-4">
          <button
            onClick={toggleTheme}
            className="flex items-center gap-3.5 w-full px-4 py-3 rounded-lg text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
          >
            {themeMode === "light" ? (
              <>
                <Moon className="w-5 h-5" />
                <span>Dark Mode</span>
              </>
            ) : (
              <>
                <Sun className="w-5 h-5" />
                <span>Light Mode</span>
              </>
            )}
          </button>
          
          <button
            onClick={handleLogout}
            className="flex items-center gap-3.5 w-full px-4 py-3 rounded-lg text-sm font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-all border border-transparent hover:border-rose-500/20"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* MOBILE SIDEBAR DRAWERS */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden bg-slate-900/40 backdrop-blur-sm transition-opacity">
          <div className="w-72 bg-card p-6 flex flex-col justify-between shadow-2xl animate-in slide-in-from-left duration-250">
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <Logo size="sm" />
                <button 
                  onClick={() => setMobileOpen(false)}
                  className="p-1 rounded-lg border border-border hover:bg-muted"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {user.schoolName && (
                <div className="p-3 bg-muted rounded-lg border border-border text-xs flex flex-col font-medium truncate">
                  <span className="text-muted-foreground uppercase text-[10px] tracking-wider">Active School</span>
                  <span className="font-extrabold text-foreground truncate mt-0.5">{user.schoolName}</span>
                </div>
              )}

              <nav className="space-y-1">
                {navLinks.map((link, idx) => {
                  const active = pathname === link.href || pathname.startsWith(link.href + "/");
                  return (
                    <Link
                      key={idx}
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3.5 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
                        active
                          ? "bg-primary text-primary-foreground shadow"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`}
                    >
                      {link.icon}
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="space-y-4">
              <button
                onClick={toggleTheme}
                className="flex items-center gap-3.5 w-full px-4 py-3 rounded-lg text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
              >
                {themeMode === "light" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                <span>{themeMode === "light" ? "Dark Mode" : "Light Mode"}</span>
              </button>
              
              <button
                onClick={handleLogout}
                className="flex items-center gap-3.5 w-full px-4 py-3 rounded-lg text-sm font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-all"
              >
                <LogOut className="w-5 h-5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* TOP HEADER */}
        <header className="sticky top-0 z-40 bg-card/80 backdrop-blur border-b border-border h-16 flex items-center justify-between px-6 shadow-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileOpen(true)}
              className="p-1 rounded-lg border border-border hover:bg-muted lg:hidden"
            >
              <Menu className="w-6 h-6" />
            </button>
            
            {/* Context title / Breadcrumb */}
            <span className="text-sm font-bold uppercase tracking-wider text-muted-foreground hidden sm:inline-block">
              {user.role.replace("_", " ")} Portal
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="p-2 rounded-full hover:bg-muted relative transition-colors"
                aria-label="View notifications"
              >
                <Bell className="w-5 h-5 text-muted-foreground hover:text-foreground" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full animate-ping" />
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-3 w-80 bg-card border border-border rounded-xl shadow-xl z-50 p-4">
                  <h4 className="font-bold text-sm border-b border-border pb-2 mb-3">Notifications</h4>
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    <div className="text-xs p-2.5 bg-muted rounded-lg border border-border">
                      <p className="font-bold mb-0.5">Welcome to ClassNova!</p>
                      <p className="text-muted-foreground">Your default seed credentials are active and running.</p>
                      <span className="text-[9px] text-muted-foreground mt-1 block">Just now</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Summary Badge */}
            <div className="flex items-center gap-3 pl-3 border-l border-border">
              <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary text-sm uppercase">
                {user.name.charAt(0)}
              </div>
              <div className="flex flex-col text-left hidden md:flex">
                <span className="text-xs font-bold text-foreground leading-tight">{user.name}</span>
                <span className="text-[10px] font-semibold text-muted-foreground mt-0.5">{user.email}</span>
              </div>
            </div>
          </div>
        </header>

        {/* DASHBOARD PAGE CHILDREN CONTENT */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

    </div>
  );
}
