"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  X,
  Ticket,
  Calendar,
  MapPin,
  Coins,
  ShieldCheck,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

interface EventRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: {
    id: string;
    title: string;
    startDate?: string;
    venue: string;
    fee?: number;
    capacity?: number | null;
    registrationDeadline?: string | Date;
  };
}

// Dynamically load Razorpay checkout.js script
function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
    }
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

const YEAR_OPTIONS = [
  "First Year (FE)",
  "Second Year (SE)",
  "Third Year (TE)",
  "Final Year (BE)",
  "Postgraduate (M.Tech / MBA / MCA)",
  "Faculty / Academician",
  "Industry Professional",
  "Other",
];

export function EventRegistrationModal({
  isOpen,
  onClose,
  event,
}: EventRegistrationModalProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    college: "TKIET, Warananagar",
    year: "Third Year (TE)",
  });
  const [submitting, setSubmitting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const feeRupees = event.fee !== undefined && event.fee >= 0 ? Math.floor(event.fee) : 0;
  const isFree = feeRupees === 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSubmitting(true);

    try {
      // 1. Call registration endpoint
      const res = await fetch(`/api/events/${event.id}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
        }),
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch {
        setErrorMessage("Server communication error. Please try again shortly.");
        setSubmitting(false);
        return;
      }

      if (!res.ok || !data?.success) {
        setErrorMessage(data?.error || data?.message || "Failed to initiate registration.");
        setSubmitting(false);
        return;
      }

      // 2. Free Event: Redirect immediately to receipt
      if (data.isFree) {
        router.push(`/receipt/${data.receiptToken}`);
        return;
      }

      // 3. Paid Event: Load Razorpay Checkout
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        setErrorMessage(
          "Could not load Razorpay payment gateway. Please check your internet connection and try again."
        );
        setSubmitting(false);
        return;
      }

      const options = {
        key: data.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: data.amount,
        currency: "INR",
        name: "IEDC TKIET",
        description: event.title,
        image: "/images/iedc-logo.png",
        order_id: data.orderId,
        prefill: {
          name: formData.name,
          email: formData.email,
          contact: formData.phone,
        },
        theme: {
          color: "#2563EB",
        },
        modal: {
          ondismiss: () => {
            setSubmitting(false);
          },
        },
        handler: async (paymentResponse: any) => {
          setVerifying(true);
          try {
            const verifyRes = await fetch("/api/payments/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                order_id: paymentResponse.razorpay_order_id,
                payment_id: paymentResponse.razorpay_payment_id,
                signature: paymentResponse.razorpay_signature,
                receiptToken: data.receiptToken,
              }),
            });

            const verifyJson = await verifyRes.json();
            if (!verifyRes.ok || !verifyJson.success) {
              setErrorMessage(
                verifyJson.error || "Payment verification failed. Please contact support or find your receipt."
              );
              setVerifying(false);
              return;
            }
            const token = verifyJson.receiptToken || data.receiptToken;
            router.push(`/receipt/${token}`);
          } catch (err: any) {
            setErrorMessage(
              err.message || "Payment verification interrupted. Please verify receipt via Find My Receipt."
            );
            setVerifying(false);
          }
        },
      };

      const razorpayInstance = new (window as any).Razorpay(options);
      razorpayInstance.on("payment.failed", (failRes: any) => {
        setErrorMessage(
          failRes.error?.description ||
            "Payment attempt failed. You may retry or use another payment method."
        );
        setSubmitting(false);
      });

      razorpayInstance.open();
    } catch (err: any) {
      setErrorMessage(err.message || "Network error. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foundation-darkest/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl rounded-2xl bg-foundation-dark border border-brand-blue/30 shadow-[0_0_50px_rgba(37,99,235,0.2)] overflow-hidden">
        {/* Header Strip */}
        <div className="flex items-center justify-between p-6 border-b border-foundation-slate/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-blue/20 border border-brand-cyan/40 flex items-center justify-center text-brand-cyan">
              <Ticket className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-typo-white text-lg leading-tight">
                Event Registration Desk
              </h3>
              <p className="text-[11px] font-sans text-typo-gray">
                Registration for {event.title}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting || verifying}
            className="p-2 rounded-xl text-typo-gray hover:text-typo-white hover:bg-foundation-slate/50 transition-colors disabled:opacity-40"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Event Summary Card */}
        <div className="px-6 py-4 bg-foundation-slate/20 border-b border-foundation-slate/50 flex flex-wrap items-center justify-between gap-3 text-xs font-sans">
          <div className="flex items-center gap-2 text-typo-gray">
            <Calendar className="w-4 h-4 text-brand-cyan" />
            <span>{event.startDate ? event.startDate.split("T")[0] : "Scheduled Event"}</span>
          </div>
          <div className="flex items-center gap-2 text-typo-gray">
            <MapPin className="w-4 h-4 text-brand-cyan" />
            <span className="truncate max-w-[180px]">{event.venue}</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-blue/20 border border-brand-cyan/40 text-typo-white font-semibold">
            <Coins className="w-3.5 h-3.5 text-brand-cyan" />
            <span>{isFree ? "Free Registration" : `Fee: ₹${feeRupees}`}</span>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span>{errorMessage}</span>
                <p className="text-[11px] text-rose-300/80">
                  Already completed payment?{" "}
                  <Link href="/receipt/find" className="underline font-semibold hover:text-typo-white">
                    Find your receipt here
                  </Link>
                  .
                </p>
              </div>
            </div>
          )}

          {verifying && (
            <div className="p-4 rounded-xl bg-brand-blue/10 border border-brand-cyan/40 text-xs text-brand-cyan flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin shrink-0" />
              <div>
                <p className="font-semibold text-typo-white">Verifying payment with bank...</p>
                <p className="text-[11px] text-typo-gray">
                  Generating official receipt, please do not close this window.
                </p>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-typo-gray uppercase tracking-wider">
              Full Name *
            </label>
            <input
              type="text"
              required
              disabled={submitting || verifying}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Rahul Sharma"
              className="w-full px-4 py-2.5 rounded-xl bg-foundation-slate/50 border border-foundation-slate text-typo-white text-xs focus:outline-none focus:border-brand-cyan disabled:opacity-50"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-typo-gray uppercase tracking-wider">
                Email Address *
              </label>
              <input
                type="email"
                required
                disabled={submitting || verifying}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="you@example.com"
                className="w-full px-4 py-2.5 rounded-xl bg-foundation-slate/50 border border-foundation-slate text-typo-white text-xs focus:outline-none focus:border-brand-cyan disabled:opacity-50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-typo-gray uppercase tracking-wider">
                Phone Number (WhatsApp / Calling) *
              </label>
              <input
                type="tel"
                required
                disabled={submitting || verifying}
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="10-digit mobile number"
                className="w-full px-4 py-2.5 rounded-xl bg-foundation-slate/50 border border-foundation-slate text-typo-white text-xs focus:outline-none focus:border-brand-cyan disabled:opacity-50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-typo-gray uppercase tracking-wider">
                College / Institution *
              </label>
              <input
                type="text"
                required
                disabled={submitting || verifying}
                value={formData.college}
                onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                placeholder="TKIET Warananagar"
                className="w-full px-4 py-2.5 rounded-xl bg-foundation-slate/50 border border-foundation-slate text-typo-white text-xs focus:outline-none focus:border-brand-cyan disabled:opacity-50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-typo-gray uppercase tracking-wider">
                Year of Study / Role *
              </label>
              <select
                disabled={submitting || verifying}
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-foundation-slate/50 border border-foundation-slate text-typo-white text-xs focus:outline-none focus:border-brand-cyan disabled:opacity-50"
              >
                {YEAR_OPTIONS.map((yr) => (
                  <option key={yr} value={yr} className="bg-foundation-dark text-typo-white">
                    {yr}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Security & Reliability Badge */}
          <div className="p-3 rounded-xl bg-foundation-slate/30 border border-foundation-slate/50 text-[11px] font-sans text-typo-gray flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                {isFree
                  ? "Instant seat confirmation with digital receipt"
                  : "Encrypted checkout via Razorpay (UPI, Cards, Netbanking)"}
              </span>
            </div>
            <span className="text-[10px] font-mono text-brand-cyan">256-Bit SSL</span>
          </div>

          {/* Submit Action */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
            <Link
              href="/receipt/find"
              className="text-xs font-sans text-typo-gray hover:text-brand-cyan transition-colors flex items-center gap-1.5"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Already registered? Find receipt</span>
            </Link>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                disabled={submitting || verifying}
                className="w-1/2 sm:w-auto text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={submitting || verifying}
                className="w-1/2 sm:w-auto text-xs flex items-center justify-center gap-2"
              >
                {submitting || verifying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{verifying ? "Verifying..." : "Processing..."}</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isFree ? "Confirm Free Registration" : `Pay ₹${feeRupees} & Register`}</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
