"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Shield, ArrowRight, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Invalid administrator credentials.");
        setLoading(false);
        return;
      }

      // Successful login -> navigate to dashboard
      router.push("/admin/dashboard");
      router.refresh();
    } catch {
      setError("Network error connecting to auth service.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-foundation-space flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-brand-blue/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#151B26_1px,transparent_1px)] [background-size:32px_32px] opacity-30 pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        {/* Card Container */}
        <div className="p-8 sm:p-10 rounded-3xl bg-foundation-dark/95 border border-foundation-slate shadow-[0_20px_70px_rgba(0,0,0,0.7)] backdrop-blur-xl space-y-8">
          {/* Brand Header */}
          <div className="text-center space-y-3">
            <div className="relative w-14 h-14 mx-auto rounded-2xl bg-foundation-slate/60 border border-brand-blue/40 flex items-center justify-center p-2.5 shadow-[0_0_20px_rgba(37,99,235,0.2)]">
              <Image
                src="/images/iedc-logo.png"
                alt="IEDC TKIET Logo"
                width={44}
                height={44}
                className="object-contain"
                priority
              />
            </div>

            <div>
              <span className="text-xs uppercase tracking-widest font-mono text-brand-cyan font-semibold block">
                Administrative Portal
              </span>
              <h1 className="font-display text-2xl font-bold text-typo-white mt-1">
                IEDC TKIET Console
              </h1>
              <p className="font-sans text-xs text-typo-gray mt-1">
                Authorized access for cell coordination and content publication
              </p>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/50 flex items-start gap-3 text-xs text-red-300 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
              <label
                htmlFor="admin-email"
                className="text-xs font-sans font-semibold uppercase tracking-wider text-typo-gray block"
              >
                Administrator Email
              </label>
              <input
                id="admin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@tkiet.ac.in"
                required
                className="w-full px-4 py-3 rounded-xl bg-foundation-slate/50 border border-foundation-slate text-typo-white placeholder:text-typo-gray/50 text-sm focus:outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="admin-password"
                  className="text-xs font-sans font-semibold uppercase tracking-wider text-typo-gray block"
                >
                  Password
                </label>
                <span className="text-[11px] font-sans text-typo-gray/60">
                  Single Account
                </span>
              </div>
              <input
                id="admin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                className="w-full px-4 py-3 rounded-xl bg-foundation-slate/50 border border-foundation-slate text-typo-white placeholder:text-typo-gray/50 text-sm focus:outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan transition-colors"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Console</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>

          {/* Footer security notice */}
          <div className="pt-4 border-t border-foundation-slate/60 flex items-center justify-between text-xs font-sans text-typo-gray">
            <span className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-brand-cyan" />
              Encrypted Session
            </span>
            <Link
              href="/"
              className="text-typo-gray hover:text-typo-white transition-colors"
            >
              ← Back to Website
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
