"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
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
  Upload,
  QrCode,
  ArrowRight,
  ArrowLeft,
  Smartphone,
  CreditCard,
  Building,
  Copy,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

const YEAR_OPTIONS = [
  "1st Year",
  "2nd Year",
  "3rd Year",
  "4th Year",
  "Postgraduate",
  "Other",
];

interface EventInfo {
  id: string;
  title: string;
  startDate?: string;
  venue: string;
  fee?: number;
  upiId?: string | null;
  upiQrUrl?: string | null;
  installmentEnabled?: boolean;
  installmentPart1Amount?: number | null;
  installmentPart2Amount?: number | null;
  capacity?: number | null;
  registrationDeadline?: string | Date;
}

interface UpiRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventInfo;
}

type Step = "form" | "payment_plan" | "pay_and_upload" | "success";

export function UpiRegistrationModal({ isOpen, onClose, event }: UpiRegistrationModalProps) {
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<Step>("form");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    college: "TKIET, Warananagar",
    department: "",
    year: "3rd Year",
  });
  const [paymentPlan, setPaymentPlan] = useState<"full" | "installment">("full");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [receiptToken, setReceiptToken] = useState<string | null>(null);
  const [registrationId, setRegistrationId] = useState<string | null>(null);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Body scroll locking with scrollbar compensation
  useEffect(() => {
    if (!isOpen) return;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    const originalOverflow = document.body.style.overflow;
    const originalPadding = document.body.style.paddingRight;
    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPadding;
    };
  }, [isOpen]);

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting && !uploading) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, submitting, uploading, onClose]);

  const handleClose = () => {
    if (submitting || uploading) return;
    onClose();
    setTimeout(() => {
      setStep("form");
      setFormData({
        name: "",
        email: "",
        phone: "",
        college: "TKIET, Warananagar",
        department: "",
        year: "3rd Year",
      });
      setPaymentPlan("full");
      setProofFile(null);
      setProofPreview(null);
      setErrorMessage(null);
      setReceiptToken(null);
      setRegistrationId(null);
    }, 300);
  };

  const feeRupees = event.fee !== undefined && event.fee >= 0 ? Math.floor(event.fee) : 0;
  const part1Amount =
    event.installmentPart1Amount !== null && event.installmentPart1Amount !== undefined
      ? Math.floor(event.installmentPart1Amount)
      : Math.ceil(feeRupees * 0.5);
  const part2Amount =
    event.installmentPart2Amount !== null && event.installmentPart2Amount !== undefined
      ? Math.floor(event.installmentPart2Amount)
      : feeRupees - part1Amount;

  const amountToPay =
    paymentPlan === "installment" && event.installmentEnabled ? part1Amount : feeRupees;

  const validateForm = (): string | null => {
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      return "Full Name must be at least 2 characters.";
    }
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      return "Please enter a valid email address.";
    }
    if (!/^[6-9]\d{9}$/.test(formData.phone.trim())) {
      return "Please enter a valid 10-digit Indian mobile number (e.g. 9876543210).";
    }
    if (!formData.college.trim() || formData.college.trim().length < 2) {
      return "Please enter your college name.";
    }
    if (!formData.department.trim() || formData.department.trim().length < 1) {
      return "Please enter your department/branch.";
    }
    if (!formData.year) {
      return "Please select your year of study.";
    }
    return null;
  };

  const handleFormNext = () => {
    setErrorMessage(null);
    const err = validateForm();
    if (err) {
      setErrorMessage(err);
      return;
    }
    if (event.installmentEnabled && feeRupees > 0) {
      setStep("payment_plan");
    } else {
      setStep("pay_and_upload");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setErrorMessage("Please select a valid image file (JPG, PNG, WebP).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage("Image exceeds 5MB limit. Please upload a smaller screenshot.");
      return;
    }
    setProofFile(file);
    setErrorMessage(null);
    const reader = new FileReader();
    reader.onload = (ev) => setProofPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleCopyUpi = () => {
    if (event.upiId) {
      navigator.clipboard.writeText(event.upiId);
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2000);
    }
  };

  const uploadProofAndSubmit = async () => {
    if (!proofFile) {
      setErrorMessage("Please upload your payment screenshot/proof.");
      return;
    }

    setErrorMessage(null);
    setUploading(true);

    let proofUrl = "";
    try {
      const uploadData = new FormData();
      uploadData.append("file", proofFile);
      const uploadRes = await fetch("/api/upi-proof-upload", {
        method: "POST",
        body: uploadData,
      });
      const uploadJson = await uploadRes.json().catch(() => ({}));
      if (!uploadRes.ok || !uploadJson.success) {
        throw new Error(uploadJson.error || "Failed to upload payment proof screenshot.");
      }
      proofUrl = uploadJson.url;
    } catch (err: any) {
      setUploading(false);
      setErrorMessage(err.message || "Failed to upload image. Please try again.");
      return;
    }

    setUploading(false);
    setSubmitting(true);

    try {
      const res = await fetch(`/api/events/${event.id}/register-upi`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone.trim(),
          college: formData.college.trim(),
          department: formData.department.trim(),
          year: formData.year,
          installmentPlan: paymentPlan,
          upiProofUrl: proofUrl,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Registration submission failed.");
      }

      setReceiptToken(data.receiptToken);
      if (data.registrationId) setRegistrationId(data.registrationId);
      setStep("success");
    } catch (err: any) {
      setErrorMessage(err.message || "Submission failed. Please check your network.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="upi-reg-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-foundation-darkest/80 backdrop-blur-md animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting && !uploading) handleClose();
      }}
    >
      <div
        className="relative w-full max-w-xl max-h-[90vh] flex flex-col rounded-2xl bg-foundation-dark border border-brand-blue/30 shadow-[0_0_50px_rgba(37,99,235,0.2)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between p-6 border-b border-foundation-slate/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-blue/20 border border-brand-cyan/40 flex items-center justify-center text-brand-cyan">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 id="upi-reg-modal-title" className="font-display font-bold text-typo-white text-lg leading-tight">
                UPI Payment Registration
              </h3>
              <p className="text-[11px] font-sans text-typo-gray truncate max-w-xs">{event.title}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={submitting || uploading}
            className="p-2 rounded-xl text-typo-gray hover:text-typo-white hover:bg-foundation-slate/50 transition-colors disabled:opacity-40"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Event Summary Strip */}
        <div className="px-6 py-3 bg-foundation-slate/20 border-b border-foundation-slate/50 flex flex-wrap items-center justify-between gap-3 text-xs font-sans shrink-0">
          <div className="flex items-center gap-2 text-typo-gray">
            <Calendar className="w-4 h-4 text-brand-cyan" />
            <span>{event.startDate ? event.startDate.split("T")[0] : "Scheduled"}</span>
          </div>
          <div className="flex items-center gap-2 text-typo-gray">
            <MapPin className="w-4 h-4 text-brand-cyan" />
            <span className="truncate max-w-[180px]">{event.venue}</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-blue/20 border border-brand-cyan/40 text-typo-white font-semibold">
            <Coins className="w-3.5 h-3.5 text-brand-cyan" />
            <span>{feeRupees > 0 ? `Fee: ₹${feeRupees}` : "Free"}</span>
          </div>
        </div>

        {/* Step Progress Ticker */}
        {step !== "success" && (
          <div className="px-6 pt-4 shrink-0">
            <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider">
              <span className={step === "form" ? "text-brand-cyan font-bold" : "text-typo-gray"}>
                1. Student Info
              </span>
              {event.installmentEnabled && feeRupees > 0 && (
                <>
                  <span className="text-typo-gray/40">›</span>
                  <span className={step === "payment_plan" ? "text-brand-cyan font-bold" : "text-typo-gray"}>
                    2. Payment Plan
                  </span>
                </>
              )}
              <span className="text-typo-gray/40">›</span>
              <span className={step === "pay_and_upload" ? "text-brand-cyan font-bold" : "text-typo-gray"}>
                {event.installmentEnabled && feeRupees > 0 ? "3." : "2."} Pay &amp; Upload Proof
              </span>
            </div>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* STEP 1: Student Information Form */}
          {step === "form" && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-typo-gray uppercase tracking-wider">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Rahul Patil"
                  className="w-full px-4 py-2.5 rounded-xl bg-foundation-slate/50 border border-foundation-slate text-typo-white text-xs focus:outline-none focus:border-brand-cyan"
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
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="student@tkiet.ac.in"
                    className="w-full px-4 py-2.5 rounded-xl bg-foundation-slate/50 border border-foundation-slate text-typo-white text-xs focus:outline-none focus:border-brand-cyan"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-typo-gray uppercase tracking-wider">
                    Phone Number (Indian 10-digit) *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })
                    }
                    placeholder="9876543210"
                    maxLength={10}
                    className="w-full px-4 py-2.5 rounded-xl bg-foundation-slate/50 border border-foundation-slate text-typo-white text-xs focus:outline-none focus:border-brand-cyan font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-typo-gray uppercase tracking-wider">
                  College / Institution *
                </label>
                <input
                  type="text"
                  required
                  value={formData.college}
                  onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                  placeholder="TKIET Warananagar"
                  className="w-full px-4 py-2.5 rounded-xl bg-foundation-slate/50 border border-foundation-slate text-typo-white text-xs focus:outline-none focus:border-brand-cyan"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-typo-gray uppercase tracking-wider">
                    Department / Branch *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    placeholder="e.g. Computer Science & Engg."
                    className="w-full px-4 py-2.5 rounded-xl bg-foundation-slate/50 border border-foundation-slate text-typo-white text-xs focus:outline-none focus:border-brand-cyan"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-typo-gray uppercase tracking-wider">
                    Year of Study *
                  </label>
                  <select
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-foundation-slate/50 border border-foundation-slate text-typo-white text-xs focus:outline-none focus:border-brand-cyan"
                  >
                    {YEAR_OPTIONS.map((yr) => (
                      <option key={yr} value={yr} className="bg-foundation-dark text-typo-white">
                        {yr}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-between">
                <Link
                  href="/receipt/find"
                  className="text-xs font-sans text-typo-gray hover:text-brand-cyan transition-colors"
                >
                  Already registered? Check receipt
                </Link>
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleFormNext}
                  className="text-xs flex items-center gap-2"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2: Payment Plan (Full or 2-Part Installment) */}
          {step === "payment_plan" && (
            <div className="space-y-4">
              <div>
                <h4 className="font-display text-base font-bold text-typo-white mb-1">Select Payment Plan</h4>
                <p className="text-xs text-typo-gray">
                  This event supports split payment. Choose whether to pay in full or in 2 installments.
                </p>
              </div>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setPaymentPlan("full")}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                    paymentPlan === "full"
                      ? "border-brand-cyan bg-brand-blue/20"
                      : "border-foundation-slate bg-foundation-slate/30 hover:border-foundation-slate"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-typo-white text-sm">Full Payment</p>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          Single Transfer
                        </span>
                      </div>
                      <p className="text-xs text-typo-gray mt-1">
                        Pay ₹{feeRupees} in one UPI transaction. Immediate verification.
                      </p>
                    </div>
                    <span className="font-mono text-xl font-bold text-typo-white">₹{feeRupees}</span>
                  </div>
                </button>

                {event.installmentEnabled && (
                  <button
                    type="button"
                    onClick={() => setPaymentPlan("installment")}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                      paymentPlan === "installment"
                        ? "border-brand-cyan bg-brand-blue/20"
                        : "border-foundation-slate bg-foundation-slate/30 hover:border-foundation-slate"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-typo-white text-sm">2-Part Installment Plan</p>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-brand-blue/30 text-brand-cyan border border-brand-cyan/40">
                            Split Payment
                          </span>
                        </div>
                        <p className="text-xs text-typo-gray mt-1">
                          Part 1: ₹{part1Amount} now · Part 2: ₹{part2Amount} later
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-mono text-xl font-bold text-brand-cyan">₹{part1Amount}</span>
                        <span className="text-[11px] text-typo-gray block">Due now</span>
                      </div>
                    </div>
                  </button>
                )}
              </div>

              <div className="pt-3 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep("form")}
                  className="text-xs text-typo-gray hover:text-typo-white flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => {
                    setErrorMessage(null);
                    setStep("pay_and_upload");
                  }}
                  className="text-xs flex items-center gap-2"
                >
                  <span>Proceed to Pay ₹{amountToPay}</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: Pay via UPI & Upload Screenshot */}
          {step === "pay_and_upload" && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-brand-blue/10 border border-brand-cyan/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-brand-cyan font-bold">
                    <QrCode className="w-4 h-4" />
                    <span>Pay ₹{amountToPay} via UPI</span>
                  </div>
                  {paymentPlan === "installment" && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Part 1 of 2
                    </span>
                  )}
                </div>

                {/* QR Code if present */}
                {event.upiQrUrl ? (
                  <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-foundation-darkest/80 border border-foundation-slate/60">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={event.upiQrUrl}
                      alt="UPI QR Code"
                      className="w-44 h-44 rounded-lg object-contain bg-white p-2 shadow-md"
                    />
                    <span className="text-[10px] font-mono text-typo-gray mt-2">
                      Scan with GPay / PhonePe / Paytm / BHIM
                    </span>
                  </div>
                ) : null}

                {/* UPI ID display */}
                {event.upiId ? (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-foundation-darkest/60 border border-foundation-slate/50">
                    <div>
                      <span className="text-[10px] font-mono uppercase text-typo-gray block">UPI ID</span>
                      <span className="font-mono font-bold text-typo-white text-sm">{event.upiId}</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyUpi}
                      className="text-xs text-brand-cyan hover:text-white px-2.5 py-1 rounded-lg bg-brand-blue/20 hover:bg-brand-blue/40 border border-brand-cyan/30 transition-colors flex items-center gap-1.5"
                    >
                      {copiedUpi ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400 font-semibold">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                ) : null}

                {!event.upiId && !event.upiQrUrl && (
                  <p className="text-xs text-typo-gray text-center py-2">
                    Please use the IEDC official UPI ID provided on the college portal or poster.
                  </p>
                )}

                <div className="p-2.5 rounded-lg bg-foundation-darkest/40 border border-foundation-slate/40 text-[11px] text-typo-gray leading-relaxed">
                  💡 <span className="text-typo-white font-medium">Important:</span> After completing your UPI transfer, take a clear screenshot showing the transaction amount, date, and reference details. Upload below.
                </div>
              </div>

              {/* Proof Image Upload */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-typo-gray uppercase tracking-wider">
                  Payment Proof Screenshot *
                </label>
                <div
                  className="border-2 border-dashed border-foundation-slate/80 rounded-xl p-5 text-center cursor-pointer hover:border-brand-cyan/50 hover:bg-foundation-slate/20 transition-all"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {proofPreview ? (
                    <div className="space-y-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={proofPreview}
                        alt="Payment proof preview"
                        className="max-h-40 mx-auto rounded-lg object-contain shadow-md"
                      />
                      <p className="text-[11px] text-brand-cyan font-medium">Click to change screenshot</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="w-8 h-8 text-typo-gray/60 mx-auto" />
                      <p className="text-xs text-typo-white font-medium">Upload UPI Payment Screenshot</p>
                      <p className="text-[10px] text-typo-gray">JPG, PNG, WebP · Up to 5MB</p>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleFileChange}
                />
                {proofFile && (
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-typo-gray truncate max-w-xs">{proofFile.name}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setProofFile(null);
                        setProofPreview(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      className="text-rose-400 hover:text-rose-300"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              <div className="p-3 rounded-xl bg-foundation-slate/30 border border-foundation-slate/50 text-[11px] font-sans text-typo-gray flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Verified manually by administration within 24 hours.</span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setStep(event.installmentEnabled && feeRupees > 0 ? "payment_plan" : "form");
                    setErrorMessage(null);
                  }}
                  className="text-xs text-typo-gray hover:text-typo-white flex items-center gap-1.5"
                  disabled={submitting || uploading}
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
                <Button
                  type="button"
                  variant="primary"
                  onClick={uploadProofAndSubmit}
                  disabled={submitting || uploading || !proofFile}
                  className="text-xs flex items-center gap-2"
                >
                  {uploading || submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{uploading ? "Uploading Proof..." : "Submitting..."}</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      <span>Submit Payment Proof</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* STEP 4: Success Confirmation */}
          {step === "success" && (
            <div className="text-center space-y-5 py-4 animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>
              <div className="space-y-2">
                <h4 className="font-display text-xl font-bold text-typo-white">
                  Payment Proof Submitted!
                </h4>
                <p className="text-xs text-typo-gray leading-relaxed max-w-sm mx-auto">
                  Your registration details and UPI payment proof have been recorded. The administration team will verify your transaction within{" "}
                  <span className="text-typo-white font-medium">24 hours</span> and approve your seat.
                </p>
              </div>

              {receiptToken && (
                <div className="p-4 rounded-xl bg-foundation-slate/40 border border-foundation-slate text-left space-y-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-typo-gray block">
                    Your Verification &amp; Receipt Token
                  </span>
                  <code className="font-mono text-xs text-brand-cyan break-all block select-all">
                    {receiptToken}
                  </code>
                  {registrationId && (
                    <>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-typo-gray block pt-1">
                        Registration ID (for Part 2 / Pay Remaining)
                      </span>
                      <code className="font-mono text-xs text-amber-300 break-all block select-all">
                        {registrationId}
                      </code>
                    </>
                  )}
                  <p className="text-[11px] text-typo-gray">
                    Keep these safe. Check status via{" "}
                    <Link href="/receipt/find" className="text-brand-cyan underline">
                      Find My Receipt
                    </Link>
                    {paymentPlan === "installment" && (
                      <>
                        {" "}
                        or pay Part 2 later at{" "}
                        <Link href="/pay-remaining" className="text-brand-cyan underline">
                          /pay-remaining
                        </Link>
                      </>
                    )}
                    .
                  </p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                {receiptToken && (
                  <Link
                    href={`/receipt/${receiptToken}`}
                    className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-brand-blue hover:bg-brand-blue/90 text-typo-white font-sans text-xs font-semibold transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)]"
                  >
                    <Ticket className="w-4 h-4" />
                    <span>View Registration Status</span>
                  </Link>
                )}
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleClose}
                  className="text-xs"
                >
                  Done
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
