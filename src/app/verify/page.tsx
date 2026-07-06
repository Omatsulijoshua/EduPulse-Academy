"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  CheckCircle,
  XCircle,
  Search,
  Award,
  FileText,
  Loader2,
  Calendar,
  Sparkles,
  User,
  School,
  FileSpreadsheet
} from "lucide-react";
import Logo from "@/components/Logo";

interface VerifiedData {
  studentName: string;
  courseTitle?: string; // Certificate
  className?: string; // Report card
  schoolName: string;
  termName?: string;
  sessionName?: string;
  gpa?: number;
  remarks?: string;
  issuedAt?: string;
  createdAt?: string;
  code: string;
}

export default function PublicVerificationPage() {
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; type: "certificate" | "report_card"; data: VerifiedData } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`/api/verify?code=${encodeURIComponent(code.trim())}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to verify credential");
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message || "Failed to retrieve verification details.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between p-6">
      
      {/* Brand Header */}
      <header className="max-w-7xl mx-auto w-full flex justify-between items-center py-4">
        <Link href="/" className="flex items-center gap-2">
          <Logo size="md" showText={true} />
        </Link>
        <Link href="/login" className="text-xs font-bold border border-slate-700 hover:border-slate-500 px-4 py-2 rounded-lg transition-all">
          Sign In
        </Link>
      </header>

      {/* Main Search and Result container */}
      <main className="flex-1 flex flex-col items-center justify-center py-12 max-w-xl w-full mx-auto space-y-8">
        
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            Credential Verification Gateway
          </h1>
          <p className="text-xs text-slate-400 font-semibold leading-relaxed">
            Verify the authenticity of ClassNova Academy graduation certificates and academic report cards using ledger reference codes.
          </p>
        </div>

        {/* Verification Form */}
        <form onSubmit={handleVerify} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Enter Verification Code / Reference ID
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  required
                  placeholder="e.g., CN-ABCD-EFGH-1234 or Report Card ID"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 pl-10 text-xs focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                />
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="px-5 py-3 bg-primary text-primary-foreground font-bold hover:bg-primary-hover shadow rounded-xl text-xs flex items-center justify-center gap-1.5 shrink-0 transition-all"
              >
                {isLoading && <Loader2 className="w-4.5 h-4.5 animate-spin" />}
                <span>Verify</span>
              </button>
            </div>
          </div>
        </form>

        {/* Loader */}
        {isLoading && (
          <div className="py-8 flex flex-col items-center gap-3 text-xs text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span>Scanning ClassNova blockchain database...</span>
          </div>
        )}

        {/* Error notification */}
        {error && (
          <div className="w-full p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs flex items-center gap-3 animate-in fade-in duration-200">
            <XCircle className="w-6 h-6 shrink-0 text-rose-500" />
            <p className="font-semibold leading-relaxed">{error}</p>
          </div>
        )}

        {/* VERIFICATION VERDICT CARDS */}
        {result && result.success && (
          <div className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl space-y-6 animate-in zoom-in duration-300 relative overflow-hidden">
            
            {/* Background vector */}
            <div className="absolute -right-8 -top-8 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />

            {/* Verification status header */}
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <CheckCircle className="w-8 h-8 text-emerald-500 shrink-0" />
              <div>
                <h3 className="font-extrabold text-sm text-emerald-400">VALID CREDENTIAL VERIFIED</h3>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">Reference Hash: {result.data.code}</p>
              </div>
            </div>

            {/* 1. VIEW VERIFIED CERTIFICATE */}
            {result.type === "certificate" && (
              <div className="space-y-4 text-xs font-semibold">
                
                <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl flex items-center gap-4">
                  <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-400">
                    <Award className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="block text-[9px] uppercase tracking-wider text-slate-500 font-bold">Credential Type</span>
                    <span className="text-slate-100 text-sm font-extrabold">Course Graduation Certificate</span>
                  </div>
                </div>

                <div className="space-y-3.5 border-t border-slate-900 pt-4">
                  <div className="flex justify-between items-center bg-slate-900/50 p-2.5 rounded border border-slate-800/40">
                    <span className="text-slate-400 flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> Student Name</span>
                    <span className="text-slate-100 font-extrabold">{result.data.studentName}</span>
                  </div>
                  <div className="flex justify-between items-center bg-slate-900/50 p-2.5 rounded border border-slate-800/40">
                    <span className="text-slate-400 flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5" /> Course Title</span>
                    <span className="text-slate-100 font-extrabold text-right max-w-[200px] truncate">{result.data.courseTitle}</span>
                  </div>
                  <div className="flex justify-between items-center bg-slate-900/50 p-2.5 rounded border border-slate-800/40">
                    <span className="text-slate-400 flex items-center gap-1.5"><School className="w-3.5 h-3.5" /> Issuing Academy</span>
                    <span className="text-slate-100 font-extrabold">{result.data.schoolName}</span>
                  </div>
                  <div className="flex justify-between items-center bg-slate-900/50 p-2.5 rounded border border-slate-800/40">
                    <span className="text-slate-400 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Date Issued</span>
                    <span className="text-slate-100 font-mono">{new Date(result.data.issuedAt!).toLocaleDateString()}</span>
                  </div>
                </div>

              </div>
            )}

            {/* 2. VIEW VERIFIED REPORT CARD */}
            {result.type === "report_card" && (
              <div className="space-y-4 text-xs font-semibold">
                
                <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl flex items-center gap-4">
                  <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-400">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="block text-[9px] uppercase tracking-wider text-slate-500 font-bold">Credential Type</span>
                    <span className="text-slate-100 text-sm font-extrabold">Academic Term Report Card</span>
                  </div>
                </div>

                <div className="space-y-3.5 border-t border-slate-900 pt-4">
                  <div className="flex justify-between items-center bg-slate-900/50 p-2.5 rounded border border-slate-800/40">
                    <span className="text-slate-400 flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> Student Name</span>
                    <span className="text-slate-100 font-extrabold">{result.data.studentName}</span>
                  </div>
                  <div className="flex justify-between items-center bg-slate-900/50 p-2.5 rounded border border-slate-800/40">
                    <span className="text-slate-400 flex items-center gap-1.5"><Layers className="w-3.5 h-3.5" /> Class Section</span>
                    <span className="text-slate-100 font-extrabold">{result.data.className}</span>
                  </div>
                  <div className="flex justify-between items-center bg-slate-900/50 p-2.5 rounded border border-slate-800/40">
                    <span className="text-slate-400 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Session & Term</span>
                    <span className="text-slate-100 font-extrabold text-right truncate">{result.data.termName} ({result.data.sessionName})</span>
                  </div>
                  <div className="flex justify-between items-center bg-slate-900/50 p-2.5 rounded border border-slate-800/40">
                    <span className="text-slate-400 flex items-center gap-1.5"><Award className="w-3.5 h-3.5" /> Term GPA</span>
                    <span className="text-emerald-400 font-extrabold font-mono text-sm">{result.data.gpa}/4.00</span>
                  </div>
                  <div className="flex justify-between items-center bg-slate-900/50 p-2.5 rounded border border-slate-800/40">
                    <span className="text-slate-400 flex items-center gap-1.5"><School className="w-3.5 h-3.5" /> Issuing Academy</span>
                    <span className="text-slate-100 font-extrabold">{result.data.schoolName}</span>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-lg">
                  <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold block mb-1">Principal Remarks</span>
                  <p className="text-slate-300 italic leading-relaxed">"{result.data.remarks}"</p>
                </div>

              </div>
            )}

          </div>
        )}

      </main>

      {/* Footer copyright */}
      <footer className="max-w-7xl mx-auto w-full text-center py-6 border-t border-slate-800 text-[10px] text-slate-500 font-medium">
        &copy; {new Date().getFullYear()} ClassNova Inc. Secure digital credentials ledger. All rights reserved.
      </footer>

    </div>
  );
}
