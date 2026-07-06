"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  BookOpen, 
  Video, 
  Award, 
  Users, 
  Check, 
  Menu, 
  X, 
  Sun, 
  Moon, 
  TrendingUp, 
  ClipboardList, 
  ShieldCheck, 
  DollarSign, 
  Globe, 
  ChevronRight,
  Sparkles,
  BookMarked,
  Layers,
  ArrowRight,
  GraduationCap
} from "lucide-react";
import Logo from "@/components/Logo";
import { motion, AnimatePresence } from "framer-motion";

export default function LandingPage() {
  const [darkMode, setDarkMode] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");

  // Load and apply dark mode
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark" || (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      setDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleDarkMode = () => {
    if (darkMode) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setDarkMode(false);
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setDarkMode(true);
    }
  };

  const pricingPlans = [
    {
      name: "Starter",
      description: "Perfect for small tutoring schools getting started.",
      price: billingPeriod === "monthly" ? 49.99 : 39.99,
      features: [
        "Up to 100 students limit",
        "Up to 10 teachers limit",
        "Pace Learning Mode",
        "CBT Exam Builder & Auto-grading",
        "Standard Analytics Dashboard",
        "ClassNova subdomain (school.classnova.com)",
      ],
      cta: "Start 14-Day Free Trial",
      popular: false,
    },
    {
      name: "Pro",
      description: "Our most popular plan, suitable for medium academies.",
      price: billingPeriod === "monthly" ? 99.99 : 79.99,
      features: [
        "Up to 500 students limit",
        "Up to 50 teachers limit",
        "Pace & Active Learning Modes",
        "CBT Exam Builder & Auto-grading",
        "Parent Monitoring Portal",
        "Report Card & Master Sheet Generator",
        "Fee Management & Payment Gateways",
        "Advanced Analytics",
      ],
      cta: "Get Started Now",
      popular: true,
    },
    {
      name: "Enterprise",
      description: "For large colleges and school networks.",
      price: billingPeriod === "monthly" ? 249.99 : 199.99,
      features: [
        "Up to 2,000+ students limit",
        "Up to 200 teachers limit",
        "All features in Pro plan",
        "Custom domain support (academy.com)",
        "Teacher Payroll Management",
        "Assignment Plagiarism Checker",
        "Custom Logo & App Branding",
        "24/7 Dedicated Support Specialist",
      ],
      cta: "Contact Sales",
      popular: false,
    },
  ];

  const features = [
    {
      icon: <Layers className="w-6 h-6 text-blue-600 dark:text-blue-400" />,
      title: "Pace Learning Mode",
      description: "Self-paced structured courses with modules, video player, PDFs, completion milestones, and graduation certificates.",
    },
    {
      icon: <Users className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />,
      title: "Active Learning Mode",
      description: "Simulate a physical school setup with classes, subject assignments, timetables, live attendance logs, and homework.",
    },
    {
      icon: <ClipboardList className="w-6 h-6 text-amber-500" />,
      title: "Timed CBT Exam Engine",
      description: "Build robust quizzes/exams supporting MCQs, True/False, Short answers, and Essays, complete with countdowns and anti-cheat tracking.",
    },
    {
      icon: <Award className="w-6 h-6 text-purple-600 dark:text-purple-400" />,
      title: "Report Cards & Master Sheets",
      description: "Auto-compile student records across terms, compute averages, GPAs, auto-generate report cards and printable master sheets.",
    },
    {
      icon: <DollarSign className="w-6 h-6 text-rose-600 dark:text-rose-400" />,
      title: "Tuition Fee Payments",
      description: "Set school bills, keep billing transparent for parents, accept credit/debit card payments, and auto-issue receipts.",
    },
    {
      icon: <Globe className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />,
      title: "Landing Page Builder",
      description: "Create an attractive, public website for your school. Configure logo, tagline, background themes, and admissions policy.",
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans transition-colors duration-300">
      {/* Dynamic Background Gradients */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-400/10 dark:bg-blue-600/5 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-emerald-400/10 dark:bg-emerald-600/5 rounded-full blur-[100px] pointer-events-none -z-10" />

      {/* HEADER / NAVIGATION */}
      <header className="sticky top-0 z-50 glass shadow-sm transition-all duration-300 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/">
            <Logo size="md" />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8 font-medium text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#modes" className="hover:text-foreground transition-colors">Learning Modes</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
            <Link href="/demo-login" className="hover:text-foreground transition-colors">Quick Demo</Link>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            {/* Theme Toggle */}
            <button 
              onClick={toggleDarkMode}
              className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Toggle Theme"
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <Link 
              href="/login" 
              className="px-4 py-2 text-sm font-medium hover:text-primary transition-colors"
            >
              Sign In
            </Link>
            <Link 
              href="/register" 
              className="px-5 py-2.5 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary-hover shadow-md hover:shadow-lg transition-all"
            >
              Launch Academy
            </Link>
          </div>

          {/* Mobile Menu Actions */}
          <div className="flex items-center gap-2 md:hidden">
            <button 
              onClick={toggleDarkMode}
              className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Panel */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden glass border-t border-border overflow-hidden"
            >
              <div className="px-4 py-6 flex flex-col gap-4 text-center">
                <a 
                  href="#features" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2 text-base font-medium hover:text-primary"
                >
                  Features
                </a>
                <a 
                  href="#modes" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2 text-base font-medium hover:text-primary"
                >
                  Learning Modes
                </a>
                <a 
                  href="#pricing" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2 text-base font-medium hover:text-primary"
                >
                  Pricing
                </a>
                <Link 
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2 text-base font-medium hover:text-primary"
                >
                  Sign In
                </Link>
                <Link 
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary-hover shadow-md"
                >
                  Launch Academy
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* HERO SECTION */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-12 gap-12 items-center">
          <div className="md:col-span-7 flex flex-col items-start text-left">
            {/* Hero Pill badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300 text-xs font-semibold mb-6 shadow-sm border border-blue-200 dark:border-blue-900/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Next-Gen SaaS Education Platform</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] mb-6">
              One platform for{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-400">self-paced</span>
              {" "}and{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-emerald-400">active learning</span>.
            </h1>

            <p className="text-lg text-muted-foreground mb-8 max-w-xl">
              ClassNova enables schools, colleges, and independent educators to launch a complete, branded academy in minutes. Empower your teachers, engage students, and delight parents.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Link 
                href="/register" 
                className="px-8 py-4 rounded-xl font-bold bg-primary text-primary-foreground hover:bg-primary-hover shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 group"
              >
                <span>Get Started Free</span>
                <ArrowRight className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link 
                href="/login" 
                className="px-8 py-4 rounded-xl font-bold bg-muted hover:bg-muted/80 text-foreground transition-all flex items-center justify-center gap-2 border border-border"
              >
                <span>Explore Demo Accounts</span>
              </Link>
            </div>
            
            {/* Fast Stats */}
            <div className="grid grid-cols-3 gap-6 sm:gap-12 mt-12 border-t border-border pt-8 w-full">
              <div>
                <p className="text-3xl font-extrabold text-primary">100%</p>
                <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider mt-1">Multi-Tenant Secure</p>
              </div>
              <div>
                <p className="text-3xl font-extrabold text-secondary">5+</p>
                <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider mt-1">Role Dashboards</p>
              </div>
              <div>
                <p className="text-3xl font-extrabold text-amber-500">2-in-1</p>
                <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider mt-1">Learning Modes</p>
              </div>
            </div>
          </div>

          <div className="md:col-span-5 relative flex justify-center">
            {/* Decorative backgrounds */}
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-600 to-emerald-500 rounded-2xl opacity-10 blur-2xl transform rotate-3" />
            
            {/* Interactive Logo Stamp Card */}
            <div className="relative glass border border-border rounded-2xl p-8 max-w-sm shadow-xl flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                <GraduationCap className="w-10 h-10 text-primary animate-pulse" />
              </div>
              <h3 className="text-xl font-bold mb-2">ClassNova Academy</h3>
              <p className="text-sm text-muted-foreground mb-6">
                "One platform. Every learner. Endless possibilities."
              </p>
              <div className="w-full bg-muted rounded-lg p-4 text-left border border-border">
                <div className="flex justify-between items-center text-xs font-semibold text-muted-foreground mb-2">
                  <span>TYLER CHEN (STUDENT)</span>
                  <span className="text-emerald-600 dark:text-emerald-400">ACTIVE</span>
                </div>
                <div className="h-1.5 w-full bg-border rounded-full overflow-hidden mb-3">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: "66%" }} />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium">Intro to Web Dev</span>
                  <span className="font-bold text-muted-foreground">66.6% Complete</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2 mt-6 text-xs text-muted-foreground font-semibold">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Verified Certificate Code CN-2026-X1</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TWO LEARNING MODES PREVIEW */}
      <section id="modes" className="py-20 bg-muted/30 border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              Flexible Formats to Match Any Syllabus
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              ClassNova hosts two learning methodologies inside one dashboard, permitting schools to run hybrid courses.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Mode 1: Pace Learning */}
            <div className="bg-card text-card-foreground rounded-2xl border border-border p-8 hover:shadow-xl transition-all relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-bl-full pointer-events-none" />
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-950 flex items-center justify-center mb-6">
                <BookMarked className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-2xl font-bold mb-4">1. Pace Learning Mode</h3>
              <p className="text-muted-foreground mb-6">
                Allows students to explore courses asynchronously, studying course modules, video lectures, and PDF resources at their own convenience.
              </p>
              <ul className="space-y-3.5 mb-8">
                {["Admin/teachers upload courses & modules", "Video lectures (YouTube/Vimeo) & materials", "Automatic unlock progression for lessons", "Graduation certificate generated on completion", "Comprehensive final CBT exams"].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-sm font-medium text-muted-foreground">
                    <Check className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Mode 2: Active Learning */}
            <div className="bg-card text-card-foreground rounded-2xl border border-border p-8 hover:shadow-xl transition-all relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-bl-full pointer-events-none" />
              <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center mb-6">
                <Video className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-2xl font-bold mb-4">2. Active Learning Mode</h3>
              <p className="text-muted-foreground mb-6">
                Structured academic semesters. Perfect for standard schools, universities, and virtual training bootcamps with active timetables.
              </p>
              <ul className="space-y-3.5 mb-8">
                {["Classrooms, academic terms, and subjects", "Teacher assignments and weekly timetables", "Live class links and attendance logs", "Homework assignments with grading files", "CBT exams scheduled with duration timers"].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-sm font-medium text-muted-foreground">
                    <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CORE FEATURES */}
      <section id="features" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Everything Required to Power an Academy
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            ClassNova packages enterprise-level tools inside a sleek, intuitive interface.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, idx) => (
            <div key={idx} className="bg-card text-card-foreground p-6 rounded-xl border border-border hover:border-primary/30 transition-all flex flex-col items-start">
              <div className="p-3 bg-muted rounded-lg mb-4">
                {feature.icon}
              </div>
              <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING PLANS */}
      <section id="pricing" className="py-20 bg-muted/20 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              Transparent, Value-Packed Pricing
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Select a package to launch your school. Upgrade or cancel anytime.
            </p>

            {/* Toggle Billing Period */}
            <div className="inline-flex items-center gap-1 bg-muted p-1 rounded-lg border border-border mt-8">
              <button 
                onClick={() => setBillingPeriod("monthly")}
                className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${billingPeriod === "monthly" ? "bg-card text-foreground shadow" : "text-muted-foreground"}`}
              >
                Monthly
              </button>
              <button 
                onClick={() => setBillingPeriod("yearly")}
                className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${billingPeriod === "yearly" ? "bg-card text-foreground shadow" : "text-muted-foreground"}`}
              >
                Yearly (Save 20%)
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto">
            {pricingPlans.map((plan, idx) => (
              <div 
                key={idx} 
                className={`bg-card text-card-foreground rounded-2xl border flex flex-col justify-between transition-all ${plan.popular ? "border-primary shadow-xl ring-2 ring-primary/20 scale-[1.03] relative z-10" : "border-border shadow-md"}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-full uppercase tracking-wider">
                    Most Popular
                  </div>
                )}
                
                <div className="p-8">
                  <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground mb-6 leading-relaxed">{plan.description}</p>
                  
                  <div className="flex items-baseline gap-1 mb-8">
                    <span className="text-4xl font-extrabold">${plan.price}</span>
                    <span className="text-xs text-muted-foreground font-semibold">/month</span>
                  </div>
                  
                  <ul className="space-y-4 text-sm font-medium">
                    {plan.features.map((feature, fIdx) => (
                      <li key={fIdx} className="flex items-start gap-2.5">
                        <Check className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                        <span className="text-muted-foreground leading-tight">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="p-8 pt-0">
                  <Link 
                    href="/register" 
                    className={`w-full py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 ${plan.popular ? "bg-primary text-primary-foreground hover:bg-primary-hover shadow-lg" : "bg-muted hover:bg-muted/80 text-foreground"}`}
                  >
                    <span>{plan.cta}</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mt-auto bg-card border-t border-border py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left">
          <Logo size="sm" />
          <p className="text-sm text-muted-foreground">
            &copy; 2026 ClassNova Inc. All rights reserved. Created with premium UI features.
          </p>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link href="/verify" className="hover:text-primary transition-colors">Verify Certificate</Link>
            <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
