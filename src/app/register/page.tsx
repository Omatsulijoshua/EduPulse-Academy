"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import { User, Mail, Lock, Building2, Globe, AlertCircle, Loader2, Check } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [schoolSlug, setSchoolSlug] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSlugChange = (val: string) => {
    // Only allow lowercase letters, numbers, and hyphens
    const sanitized = val
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-");
    setSchoolSlug(sanitized);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!schoolSlug) {
      setError("Please provide a valid school URL slug.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          schoolName,
          schoolSlug,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Registration failed");
      }

      // Successful registration, cookie is set, redirect
      router.push(data.redirectTo);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during signup.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4 sm:p-6 transition-colors duration-300">
      {/* Background Gradients */}
      <div className="absolute top-0 right-1/4 w-[300px] h-[300px] bg-emerald-500/5 rounded-full blur-[80px] pointer-events-none -z-10" />
      <div className="absolute bottom-0 left-1/4 w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-[80px] pointer-events-none -z-10" />

      <div className="w-full max-w-4xl grid md:grid-cols-12 gap-8 items-stretch">
        
        {/* Pitch Pane (Left side) */}
        <div className="md:col-span-5 bg-primary text-primary-foreground rounded-2xl p-8 flex flex-col justify-between relative overflow-hidden shadow-xl">
          {/* Subtle patterns */}
          <div className="absolute bottom-0 right-0 w-44 h-44 bg-white/5 rounded-tl-full pointer-events-none" />
          
          <div>
            <Logo showText={true} size="sm" className="mb-8 invert dark:invert-0" />
            <h3 className="text-2xl font-extrabold tracking-tight mb-4">Establish Your Digital Academy</h3>
            <p className="text-sm text-primary-foreground/80 leading-relaxed mb-6">
              Launch a full virtual learning ecosystem supporting self-paced courses, term-based classrooms, timed CBT exams, automated student results, and online tuition billing.
            </p>
            
            <div className="space-y-4">
              {[
                "100% white-label subdomain",
                "Self-paced & active learning modes",
                "Advanced role-based dashboards",
                "Secure card payments built-in",
              ].map((text, idx) => (
                <div key={idx} className="flex items-center gap-2.5 text-xs font-semibold">
                  <div className="p-0.5 rounded-full bg-white/20">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 text-xs text-primary-foreground/75 font-semibold">
            Join schools worldwide building their future on ClassNova.
          </div>
        </div>

        {/* Form Pane (Right side) */}
        <div className="md:col-span-7 bg-card text-card-foreground border border-border rounded-2xl shadow-xl p-8 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-extrabold tracking-tight">Register School</h2>
              <span className="text-[10px] font-bold text-muted-foreground uppercase bg-muted px-2 py-0.5 rounded border border-border">SaaS signup</span>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-lg flex items-start gap-3 text-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Double Column for Admin Name & Email */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground block" htmlFor="admin-name">
                    Your Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      id="admin-name"
                      type="text"
                      required
                      placeholder="Principal name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground block" htmlFor="email">
                    Admin Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      id="email"
                      type="email"
                      required
                      placeholder="name@school.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground block" htmlFor="password">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    id="password"
                    type="password"
                    required
                    placeholder="Minimum 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <hr className="border-border my-4" />

              {/* School Details */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground block" htmlFor="school-name">
                  School / Academy Name
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    id="school-name"
                    type="text"
                    required
                    placeholder="e.g. Apex Science College"
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground block" htmlFor="school-slug">
                  Custom Domain Slug
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    id="school-slug"
                    type="text"
                    required
                    placeholder="e.g. apex-academy"
                    value={schoolSlug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all font-mono"
                  />
                </div>
                {schoolSlug && (
                  <p className="text-[11px] text-muted-foreground font-medium mt-1">
                    Your public portal URL will be: <code className="bg-muted px-1 py-0.5 rounded font-mono border border-border text-primary font-semibold">{`classnova.com/schools/${schoolSlug}`}</code>
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 mt-4 rounded-lg bg-primary text-primary-foreground font-bold hover:bg-primary-hover shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Creating Academy...</span>
                  </>
                ) : (
                  <span>Register & Launch Dashboard</span>
                )}
              </button>
            </form>
          </div>

          <div className="mt-6 pt-4 border-t border-border text-center text-sm text-muted-foreground">
            Already registered?{" "}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              Log in instead
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
