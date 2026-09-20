"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Ticket,
  Mail,
  Phone,
  Hash,
  AlertCircle,
  Loader2,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";

type SearchMode = "email_phone" | "receipt_email";

export default function FindReceiptPage() {
  const router = useRouter();
  const [searchMode, setSearchMode] = useState<SearchMode>("email_phone");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [receiptNumber, setReceiptNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const payload: any = {
        email: email.trim().toLowerCase(),
      };

      if (searchMode === "email_phone") {
        payload.phone = phone.trim();
      } else {
        payload.receiptNumber = receiptNumber.trim().toUpperCase();
      }

      const res = await fetch("/api/receipts/find", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(
          data.error ||
            "No matching paid registration found for the provided details. Please check your information or contact support."
        );
        setLoading(false);
        return;
      }

      if (data.redirectUrl) {
        router.push(data.redirectUrl);
      } else {
        setLoading(false);
      }
    } catch {
      setErrorMessage("Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 w-full bg-foundation-darkest min-h-screen">
      <Section spacing="lg">
        <Container size="sm">
          {/* Back Navigation */}
          <div className="mb-6">
            <Link
              href="/events"
              className="inline-flex items-center gap-2 text-xs uppercase font-sans tracking-widest text-typo-gray hover:text-brand-cyan transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to all events</span>
            </Link>
          </div>

          <div className="p-8 sm:p-10 rounded-2xl bg-foundation-dark border border-brand-blue/30 shadow-[0_0_50px_rgba(37,99,235,0.15)] space-y-6">
            {/* Header */}
            <div className="space-y-2 text-center">
              <div className="w-14 h-14 rounded-2xl bg-brand-blue/20 border border-brand-cyan/40 flex items-center justify-center mx-auto text-brand-cyan mb-4">
                <Search className="w-7 h-7" />
              </div>
              <span className="text-xs uppercase font-sans tracking-widest text-brand-cyan font-bold block">
                Official Document Portal
              </span>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-typo-white">
                Find My Event Receipt
              </h1>
              <p className="text-xs font-sans text-typo-gray max-w-sm mx-auto">
                Retrieve and download your official IEDC TKIET registration receipt and payment
                confirmation anytime.
              </p>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="grid grid-cols-2 gap-2 p-1.5 rounded-xl bg-foundation-slate/40 border border-foundation-slate text-xs font-medium">
              <button
                type="button"
                onClick={() => {
                  setSearchMode("email_phone");
                  setErrorMessage(null);
                }}
                className={`py-2 px-3 rounded-lg transition-all ${
                  searchMode === "email_phone"
                    ? "bg-brand-blue text-typo-white font-semibold shadow-md"
                    : "text-typo-gray hover:text-typo-white"
                }`}
              >
                Email &amp; Phone
              </button>
              <button
                type="button"
                onClick={() => {
                  setSearchMode("receipt_email");
                  setErrorMessage(null);
                }}
                className={`py-2 px-3 rounded-lg transition-all ${
                  searchMode === "receipt_email"
                    ? "bg-brand-blue text-typo-white font-semibold shadow-md"
                    : "text-typo-gray hover:text-typo-white"
                }`}
              >
                Receipt # &amp; Email
              </button>
            </div>

            {/* Error message */}
            {errorMessage && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{errorMessage}</span>
              </div>
            )}

            {/* Search Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-typo-gray uppercase tracking-wider flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-brand-cyan" />
                  <span>Registered Email Address *</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-2.5 rounded-xl bg-foundation-slate/50 border border-foundation-slate text-typo-white text-xs focus:outline-none focus:border-brand-cyan"
                />
              </div>

              {searchMode === "email_phone" ? (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-typo-gray uppercase tracking-wider flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-brand-cyan" />
                    <span>Registered Phone Number *</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="10-digit mobile number used during registration"
                    className="w-full px-4 py-2.5 rounded-xl bg-foundation-slate/50 border border-foundation-slate text-typo-white text-xs focus:outline-none focus:border-brand-cyan"
                  />
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-typo-gray uppercase tracking-wider flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-brand-cyan" />
                    <span>Receipt Number *</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={receiptNumber}
                    onChange={(e) => setReceiptNumber(e.target.value)}
                    placeholder="e.g. IEDC-2026-0001"
                    className="w-full px-4 py-2.5 rounded-xl bg-foundation-slate/50 border border-foundation-slate text-typo-white text-xs focus:outline-none focus:border-brand-cyan uppercase font-mono"
                  />
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                disabled={loading}
                className="w-full py-3 text-xs font-semibold flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(37,99,235,0.3)]"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Searching records...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Find &amp; Open Receipt</span>
                  </>
                )}
              </Button>
            </form>

            <div className="pt-4 border-t border-foundation-slate/60 text-[11px] font-sans text-typo-gray flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-brand-cyan" />
                <span>Encrypted • No Public Indexing</span>
              </div>
              <Link href="/contact" className="hover:text-typo-white transition-colors">
                Need Help?
              </Link>
            </div>
          </div>
        </Container>
      </Section>
    </div>
  );
}
