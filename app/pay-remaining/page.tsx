"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Coins,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Smartphone,
  Upload,
  ShieldCheck,
} from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";

interface LookupResult {
  regId: string;
  eventId: string;
  eventTitle: string;
  eventSlug: string;
  name: string;
  email: string;
  phone: string;
  amountPaidPaise: number;
  totalAmountPaise: number;
  remainingAmountPaise: number;
  upiId: string | null;
  upiQrUrl: string | null;
  receiptToken: string;
  installmentStatus: string;
}

export default function PayRemainingPage() {
  const [regId, setRegId] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookup, setLookup] = useState<LookupResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [upiTransactionRef, setUpiTransactionRef] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLookup(null);
    setSuccess(false);

    if (!regId.trim()) {
      setErrorMessage("Registration ID is required.");
      return;
    }
    if (!email.trim() && !phone.trim()) {
      setErrorMessage("Provide the email or phone used during registration.");
      return;
    }

    setLookupLoading(true);
    try {
      const res = await fetch("/api/registrations/part2-lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          regId: regId.trim(),
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        setErrorMessage(data.error || "Could not find an eligible installment registration.");
        return;
      }
      setLookup(data.data);
    } catch {
      setErrorMessage("Network error. Please try again.");
    } finally {
      setLookupLoading(false);
    }
  };

  const handleSubmitPart2 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookup) return;
    setErrorMessage(null);

    if (!proofFile) {
      setErrorMessage("Please upload your Part 2 payment screenshot.");
      return;
    }
    if (!upiTransactionRef.trim() || upiTransactionRef.trim().length < 4) {
      setErrorMessage("Please enter your UPI transaction reference / UTR.");
      return;
    }

    setSubmitting(true);
    try {
      const uploadData = new FormData();
      uploadData.append("file", proofFile);
      const uploadRes = await fetch("/api/upi-proof-upload", {
        method: "POST",
        body: uploadData,
      });
      const uploadJson = await uploadRes.json().catch(() => ({}));
      if (!uploadRes.ok || !uploadJson.success) {
        throw new Error(uploadJson.error || "Failed to upload payment proof.");
      }

      const res = await fetch(`/api/events/${lookup.eventId}/submit-part2`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          regId: lookup.regId,
          email: lookup.email,
          phone: lookup.phone,
          upiTransactionRef: upiTransactionRef.trim(),
          upiProofUrl: uploadJson.url,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Part 2 submission failed.");
      }
      setSuccess(true);
    } catch (err: any) {
      setErrorMessage(err.message || "Submission failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 w-full bg-foundation-darkest min-h-screen">
      <Section spacing="lg">
        <Container size="sm">
          <div className="mb-6">
            <Link
              href="/events"
              className="inline-flex items-center gap-2 text-xs uppercase font-sans tracking-widest text-typo-gray hover:text-brand-cyan transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to events</span>
            </Link>
          </div>

          <div className="p-8 sm:p-10 rounded-2xl bg-foundation-dark border border-brand-blue/30 shadow-[0_0_50px_rgba(37,99,235,0.15)] space-y-6">
            <div className="space-y-2 text-center">
              <div className="w-14 h-14 rounded-2xl bg-brand-blue/20 border border-brand-cyan/40 flex items-center justify-center mx-auto text-brand-cyan mb-4">
                <Coins className="w-7 h-7" />
              </div>
              <span className="text-xs uppercase font-sans tracking-widest text-brand-cyan font-bold block">
                Installment Part 2
              </span>
              <h1 className="font-display text-2xl font-bold text-typo-white">
                Pay Remaining Balance
              </h1>
              <p className="text-sm text-typo-gray max-w-md mx-auto">
                Enter your Registration ID and the email or phone used at registration. Remaining
                amount is calculated on the server.
              </p>
            </div>

            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {success && lookup ? (
              <div className="text-center space-y-4 py-4">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                <h2 className="font-display text-xl font-bold text-typo-white">
                  Part 2 Proof Submitted
                </h2>
                <p className="text-sm text-typo-gray">
                  Administrator will verify your payment. Track status on your receipt page.
                </p>
                <Link
                  href={`/receipt/${lookup.receiptToken}`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-blue text-typo-white text-xs font-medium hover:bg-blue-600 transition-colors"
                >
                  View Receipt Status
                </Link>
              </div>
            ) : !lookup ? (
              <form onSubmit={handleLookup} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-typo-gray uppercase tracking-wider">
                    Registration ID *
                  </label>
                  <input
                    type="text"
                    value={regId}
                    onChange={(e) => setRegId(e.target.value)}
                    placeholder="Registration ID from your confirmation"
                    className="w-full px-4 py-2.5 rounded-xl bg-foundation-slate/50 border border-foundation-slate text-typo-white text-xs focus:outline-none focus:border-brand-cyan font-mono"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-typo-gray uppercase tracking-wider">
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="student@tkiet.ac.in"
                      className="w-full px-4 py-2.5 rounded-xl bg-foundation-slate/50 border border-foundation-slate text-typo-white text-xs focus:outline-none focus:border-brand-cyan"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-typo-gray uppercase tracking-wider">
                      Phone (10-digit)
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="9876543210"
                      className="w-full px-4 py-2.5 rounded-xl bg-foundation-slate/50 border border-foundation-slate text-typo-white text-xs focus:outline-none focus:border-brand-cyan"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-typo-gray">Provide at least one of email or phone.</p>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={lookupLoading}
                  className="w-full text-xs flex items-center justify-center gap-2"
                >
                  {lookupLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Looking up...
                    </>
                  ) : (
                    "Find Remaining Balance"
                  )}
                </Button>
                <p className="text-[11px] text-center text-typo-gray">
                  Don&apos;t have your Reg ID?{" "}
                  <Link href="/receipt/find" className="text-brand-cyan underline">
                    Find My Receipt
                  </Link>{" "}
                  instead.
                </p>
              </form>
            ) : (
              <div className="space-y-5">
                <div className="p-4 rounded-xl bg-foundation-slate/40 border border-foundation-slate text-xs space-y-2">
                  <div className="flex justify-between gap-2">
                    <span className="text-typo-gray">Event</span>
                    <span className="font-semibold text-typo-white text-right">{lookup.eventTitle}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-typo-gray">Participant</span>
                    <span className="text-typo-white">{lookup.name}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-typo-gray">Paid so far</span>
                    <span className="font-mono text-emerald-400">
                      ₹{lookup.amountPaidPaise / 100}
                    </span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-typo-gray">Remaining (due now)</span>
                    <span className="font-mono font-bold text-amber-300">
                      ₹{lookup.remainingAmountPaise / 100}
                    </span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-typo-gray">Total fee</span>
                    <span className="font-mono text-typo-white">
                      ₹{lookup.totalAmountPaise / 100}
                    </span>
                  </div>
                </div>

                {lookup.upiId && (
                  <div className="p-3 rounded-xl bg-brand-blue/10 border border-brand-cyan/30 flex items-start gap-2 text-xs">
                    <Smartphone className="w-4 h-4 text-brand-cyan shrink-0 mt-0.5" />
                    <div>
                      <span className="text-typo-gray block">Pay remaining to UPI ID</span>
                      <span className="font-mono font-bold text-brand-cyan">{lookup.upiId}</span>
                    </div>
                  </div>
                )}

                {lookup.upiQrUrl && (
                  <div className="flex justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={lookup.upiQrUrl}
                      alt="UPI QR Code"
                      className="w-40 h-40 object-contain rounded-xl border border-foundation-slate bg-white p-2"
                    />
                  </div>
                )}

                <form onSubmit={handleSubmitPart2} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-typo-gray uppercase tracking-wider">
                      Part 2 UTR / Transaction Ref *
                    </label>
                    <input
                      type="text"
                      value={upiTransactionRef}
                      onChange={(e) => setUpiTransactionRef(e.target.value)}
                      placeholder="Enter UPI reference number"
                      className="w-full px-4 py-2.5 rounded-xl bg-foundation-slate/50 border border-foundation-slate text-typo-white text-xs focus:outline-none focus:border-brand-cyan font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-typo-gray uppercase tracking-wider">
                      Payment Screenshot *
                    </label>
                    <label className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl border border-dashed border-foundation-slate hover:border-brand-cyan cursor-pointer text-xs text-typo-gray hover:text-brand-cyan transition-colors">
                      <Upload className="w-4 h-4" />
                      <span>{proofFile ? proofFile.name : "Upload JPG / PNG / WebP (max 5MB)"}</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                        className="hidden"
                        onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                      />
                    </label>
                  </div>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={submitting}
                    className="w-full text-xs flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit Part 2 Proof"
                    )}
                  </Button>
                  <button
                    type="button"
                    onClick={() => {
                      setLookup(null);
                      setUpiTransactionRef("");
                      setProofFile(null);
                      setErrorMessage(null);
                    }}
                    className="w-full text-[11px] text-typo-gray hover:text-typo-white"
                  >
                    Look up a different registration
                  </button>
                </form>
              </div>
            )}

            <div className="pt-4 border-t border-foundation-slate/60 flex items-start gap-2 text-[11px] text-typo-gray">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-cyan shrink-0 mt-0.5" />
              <span>
                Remaining amount is never taken from the browser — it is always recalculated from
                your registration record on the server.
              </span>
            </div>
          </div>
        </Container>
      </Section>
    </div>
  );
}
