"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Logo from "@/components/Logo";
import { Lock, Mail, ChevronRight, AlertCircle, Loader2, Sparkles } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Prefill helper
  const handlePrefill = (roleEmail: string) => {
    setEmail(roleEmail);
    setPassword("password123");
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      // Successful login
      router.push(callbackUrl || data.redirectTo);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please check your credentials.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4 sm:p-6 transition-colors duration-300">
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/4 w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-[80px] pointer-events-none -z-10" />
      <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] bg-emerald-500/5 rounded-full blur-[80px] pointer-events-none -z-10" />

      <div className="w-full max-w-5xl grid md:grid-cols-12 gap-8 items-stretch">
        
        {/* Card Form Pane */}
        <div className="md:col-span-7 bg-card text-card-foreground border border-border rounded-2xl shadow-xl p-8 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-8">
              <Link href="/">
                <Logo size="sm" />
              </Link>
              <span className="text-xs font-semibold text-muted-foreground">SECURE LOGIN</span>
            </div>

            <h2 className="text-3xl font-extrabold tracking-tight mb-2">Welcome Back</h2>
            <p className="text-sm text-muted-foreground mb-8">
              Enter your credentials to access your academic dashboard.
            </p>

            {error && (
              <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-lg flex items-start gap-3 text-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-muted-foreground block" htmlFor="email">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    id="email"
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-semibold text-muted-foreground block" htmlFor="password">
                    Password
                  </label>
                  <a href="#" className="text-xs font-semibold text-primary hover:underline">
                    Forgot password?
                  </a>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    id="password"
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-lg bg-primary text-primary-foreground font-bold hover:bg-primary-hover shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="mt-8 pt-6 border-t border-border text-center text-sm text-muted-foreground">
            Don't have an academy registered?{" "}
            <Link href="/register" className="font-semibold text-primary hover:underline">
              Create school account
            </Link>
          </div>
        </div>

        {/* Demo Helper Pane */}
        <div className="md:col-span-5 bg-muted/40 border border-border rounded-2xl p-8 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-bl-full pointer-events-none" />
          
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-primary mb-4 bg-primary/10 px-2.5 py-1 rounded-full w-max">
              <Sparkles className="w-3.5 h-3.5" />
              <span>TEST ACCOUNTS SEEDED</span>
            </div>
            
            <h3 className="text-xl font-bold mb-2">Quick Demo Access</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Click any role below to pre-fill credentials from our mock database seed:
            </p>

            <div className="space-y-3">
              {[
                { role: "Super Admin", email: "superadmin@classnova.com", color: "border-blue-500/30 hover:bg-blue-500/5 text-blue-700 dark:text-blue-400" },
                { role: "School Admin", email: "admin@classnova.com", color: "border-emerald-500/30 hover:bg-emerald-500/5 text-emerald-700 dark:text-emerald-400" },
                { role: "Teacher Profile", email: "teacher@classnova.com", color: "border-indigo-500/30 hover:bg-indigo-500/5 text-indigo-700 dark:text-indigo-400" },
                { role: "Student Account", email: "student@classnova.com", color: "border-amber-500/30 hover:bg-amber-500/5 text-amber-700 dark:text-amber-400" },
                { role: "Parent Account", email: "parent@classnova.com", color: "border-rose-500/30 hover:bg-rose-500/5 text-rose-700 dark:text-rose-400" },
              ].map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handlePrefill(item.email)}
                  className={`w-full p-3 text-left bg-card border rounded-lg flex justify-between items-center text-xs font-semibold shadow-sm transition-all ${item.color}`}
                >
                  <div className="flex flex-col">
                    <span className="font-bold">{item.role}</span>
                    <span className="text-[10px] text-muted-foreground font-medium">{item.email}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 opacity-50" />
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 text-center text-xs text-muted-foreground font-medium">
            Demo passwords are all <code className="bg-muted px-1.5 py-0.5 rounded font-mono border border-border">password123</code>
          </div>
        </div>

      </div>
    </div>
  );
}
