"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Download,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  ShieldCheck,
  Bookmark,
  Search,
  ArrowLeft,
  Loader2,
  Building2,
  Calendar,
  MapPin,
  User,
  CreditCard,
  Hash,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatDateIST } from "@/lib/utils/date-ist";

interface ReceiptViewerProps {
  registration: {
    id: string;
    receiptToken: string;
    receiptNumber?: string;
    status: "pending" | "paid" | "failed" | "refunded" | "cancelled";
    name: string;
    email: string;
    phone: string;
    college: string;
    year: string;
    amount: number; // in paise
    paymentMethod?: string;
    razorpayPaymentId?: string;
    razorpayOrderId?: string;
    paidAt?: string | Date;
    refundId?: string;
    refundedAt?: string | Date;
    createdAt: string | Date;
  };
  event: {
    id: string;
    slug: string;
    title: string;
    startDate: string;
    venue: string;
    fee?: number;
  };
}

export function ReceiptViewer({
  registration: initialReg,
  event,
}: ReceiptViewerProps) {
  const router = useRouter();
  const receiptRef = useRef<HTMLDivElement>(null);
  const [currentStatus, setCurrentStatus] = useState(initialReg.status);
  const [receiptNumber, setReceiptNumber] = useState(initialReg.receiptNumber);
  const [paidAt, setPaidAt] = useState(initialReg.paidAt);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingPng, setIsExportingPng] = useState(false);
  const [copied, setCopied] = useState(false);

  // Poll status every 3 seconds if status is pending (e.g. waiting for webhook confirmation)
  useEffect(() => {
    if (currentStatus !== "pending") return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/registrations/status?token=${initialReg.receiptToken}`);
        if (res.ok) {
          const data = await res.json();
          if (data.status && data.status !== "pending") {
            setCurrentStatus(data.status);
            if (data.receiptNumber) setReceiptNumber(data.receiptNumber);
            if (data.paidAt) setPaidAt(data.paidAt);
            router.refresh();
          }
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [currentStatus, initialReg.receiptToken, router]);

  // Download as PNG
  const handleDownloadPng = async () => {
    if (!receiptRef.current) return;
    setIsExportingPng(true);
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(receiptRef.current, {
        pixelRatio: 2,
        backgroundColor: "#ffffff",
        cacheBust: true,
      });

      const fileName = `${receiptNumber || "receipt"}-receipt.png`;
      const link = document.createElement("a");
      link.download = fileName;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("PNG export error:", err);
      alert("Failed to export receipt image. Please try downloading PDF instead.");
    } finally {
      setIsExportingPng(false);
    }
  };

  // Download as PDF (A4 Portrait)
  const handleDownloadPdf = async () => {
    if (!receiptRef.current) return;
    setIsExportingPdf(true);
    try {
      const { toPng } = await import("html-to-image");
      const { jsPDF } = await import("jspdf");

      const dataUrl = await toPng(receiptRef.current, {
        pixelRatio: 2,
        backgroundColor: "#ffffff",
        cacheBust: true,
      });

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = pdf.internal.pageSize.getWidth(); // 210mm
      const pageHeight = pdf.internal.pageSize.getHeight(); // 297mm

      const margin = 10; // 10mm margin
      const printWidth = pageWidth - margin * 2;
      const imgProps = pdf.getImageProperties(dataUrl);
      const printHeight = (imgProps.height * printWidth) / imgProps.width;

      pdf.addImage(
        dataUrl,
        "PNG",
        margin,
        margin,
        printWidth,
        Math.min(printHeight, pageHeight - margin * 2)
      );

      const fileName = `${receiptNumber || "receipt"}-receipt.pdf`;
      pdf.save(fileName);
    } catch (err) {
      console.error("PDF export error:", err);
      alert("Failed to export PDF. Please try downloading PNG image instead.");
    } finally {
      setIsExportingPdf(false);
    }
  };

  const copyReceiptLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  // Render: Pending State
  if (currentStatus === "pending") {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 space-y-6">
        <div className="p-8 rounded-2xl bg-foundation-dark border border-brand-blue/40 text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-brand-blue/20 border border-brand-cyan/40 flex items-center justify-center mx-auto text-brand-cyan">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
          <div className="space-y-2">
            <h2 className="font-display text-2xl font-bold text-typo-white">
              Confirming Your Payment...
            </h2>
            <p className="text-sm font-sans text-typo-gray max-w-md mx-auto">
              We are finalizing verification with the banking network and Razorpay webhook. This
              page will automatically update as soon as confirmation is recorded.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-foundation-slate/40 border border-foundation-slate text-xs font-mono text-brand-cyan max-w-sm mx-auto">
            Order Reference: {initialReg.razorpayOrderId || initialReg.id}
          </div>

          <div className="pt-4 border-t border-foundation-slate/60 text-xs text-typo-gray">
            If you closed your tab, you can always look up your receipt later at{" "}
            <Link href="/receipt/find" className="text-brand-cyan underline">
              Find My Receipt
            </Link>
            .
          </div>
        </div>
      </div>
    );
  }

  // Render: Refunded State
  if (currentStatus === "refunded") {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 space-y-6">
        <div className="p-8 rounded-2xl bg-foundation-dark border border-amber-500/40 text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mx-auto text-amber-400">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-mono font-semibold uppercase">
              Payment Refunded
            </span>
            <h2 className="font-display text-2xl font-bold text-typo-white">
              Registration Amount Refunded
            </h2>
            <p className="text-sm font-sans text-typo-gray max-w-md mx-auto">
              Your payment of ₹{initialReg.amount / 100} has been refunded via Razorpay.
              {initialReg.refundId && (
                <span className="block mt-2 font-mono text-xs text-amber-300">
                  Refund Reference: {initialReg.refundId}
                </span>
              )}
            </p>
          </div>

          <div className="pt-4 border-t border-foundation-slate/60 flex items-center justify-center gap-4 text-xs">
            <Link href={`/events/${event.slug}`} className="text-brand-cyan underline">
              Return to Event
            </Link>
            <span className="text-typo-gray/40">•</span>
            <Link href="/contact" className="text-typo-gray hover:text-typo-white">
              Contact Support
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Render: Failed or Cancelled State
  if (currentStatus === "failed" || currentStatus === "cancelled") {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 space-y-6">
        <div className="p-8 rounded-2xl bg-foundation-dark border border-rose-500/40 text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center mx-auto text-rose-400">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-mono font-semibold uppercase">
              Registration {currentStatus.toUpperCase()}
            </span>
            <h2 className="font-display text-2xl font-bold text-typo-white">
              Payment Could Not Be Completed
            </h2>
            <p className="text-sm font-sans text-typo-gray max-w-md mx-auto">
              Your registration transaction did not succeed. If money was debited from your
              account, it will automatically be reversed by your bank.
            </p>
          </div>

          <div className="pt-4 border-t border-foundation-slate/60 flex items-center justify-center gap-4 text-xs">
            <Link href={`/events/${event.slug}`} className="text-brand-cyan underline">
              Try Registering Again
            </Link>
            <span className="text-typo-gray/40">•</span>
            <Link href="/contact" className="text-typo-gray hover:text-typo-white">
              Contact Support
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Render: Paid Official Receipt (Light Theme for pristine PDF/PNG export)
  const feeRupees = initialReg.amount > 0 ? initialReg.amount / 100 : 0;
  const isFree = initialReg.amount === 0;

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-6 animate-fade-in">
      {/* Top Advisory Strip: Bookmark & Find Receipt */}
      <div className="p-4 rounded-2xl bg-foundation-dark border border-brand-blue/30 flex flex-wrap items-center justify-between gap-3 text-xs font-sans">
        <div className="flex items-center gap-2 text-typo-gray">
          <Bookmark className="w-4 h-4 text-brand-cyan shrink-0" />
          <span>
            Bookmark or save this URL to access or re-download your official receipt anytime.
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={copyReceiptLink}
            className="px-3 py-1.5 rounded-lg bg-foundation-slate/60 hover:bg-foundation-slate text-typo-white transition-colors flex items-center gap-1.5"
          >
            {copied ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Copied Link!</span>
              </>
            ) : (
              <span>Copy Link</span>
            )}
          </button>
          <Link
            href="/receipt/find"
            className="px-3 py-1.5 rounded-lg bg-brand-blue/20 hover:bg-brand-blue/30 text-brand-cyan border border-brand-cyan/30 transition-colors flex items-center gap-1.5"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Find Receipt</span>
          </Link>
        </div>
      </div>

      {/* Action Strip: Download PDF & Download PNG */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={`/events/${event.slug}`}
          className="text-xs font-sans text-typo-gray hover:text-brand-cyan transition-colors flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to {event.title}</span>
        </Link>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            onClick={handleDownloadPng}
            disabled={isExportingPng || isExportingPdf}
            variant="secondary"
            className="text-xs flex items-center gap-2 bg-foundation-dark border border-foundation-slate text-typo-white hover:border-brand-cyan"
          >
            {isExportingPng ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <ImageIcon className="w-3.5 h-3.5 text-brand-cyan" />
            )}
            <span>Download Image (PNG)</span>
          </Button>

          <Button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isExportingPdf || isExportingPng}
            variant="primary"
            className="text-xs flex items-center gap-2 shadow-[0_0_20px_rgba(37,99,235,0.3)]"
          >
            {isExportingPdf ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <FileText className="w-3.5 h-3.5" />
            )}
            <span>Download PDF</span>
          </Button>
        </div>
      </div>

      {/* Official Receipt Container (ALWAYS LIGHT THEME FOR FORMAL PRINT & EXPORT) */}
      <div
        ref={receiptRef}
        id="official-receipt-print"
        className="w-full bg-white text-slate-900 rounded-2xl p-8 sm:p-12 shadow-2xl border border-slate-200 font-sans space-y-8 select-text"
        style={{ color: "#0F172A", backgroundColor: "#FFFFFF" }}
      >
        {/* Receipt Header */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 pb-6 border-b-2 border-slate-900">
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 rounded-full overflow-hidden bg-slate-100 border border-slate-300 shrink-0 p-1 flex items-center justify-center">
              <img
                src="/images/iedc-logo.png"
                alt="IEDC TKIET Logo"
                className="w-full h-full object-contain"
                crossOrigin="anonymous"
              />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 uppercase">
                Innovation &amp; Entrepreneurship Development Cell
              </h1>
              <p className="text-xs text-slate-600 font-medium">
                Tatyasaheb Kore Institute of Engineering and Technology, Warananagar
              </p>
              <p className="text-[11px] text-slate-500 font-mono tracking-wider mt-0.5">
                Accredited 'A' Grade by NAAC • Approved by AICTE, New Delhi
              </p>
            </div>
          </div>

          <div className="text-center sm:text-right shrink-0">
            <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-300 uppercase tracking-wider">
              Payment Successful
            </span>
            <span className="block text-[11px] font-mono text-slate-500 mt-1">
              Official e-Receipt
            </span>
          </div>
        </div>

        {/* Receipt Title Strip */}
        <div className="text-center py-2 bg-slate-50 rounded-xl border border-slate-200">
          <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-wider uppercase">
            Official Event Registration Receipt
          </h2>
        </div>

        {/* Metadata Key-Value Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">
              Receipt Number
            </span>
            <span className="font-mono font-bold text-slate-900 text-sm">
              {receiptNumber || "PENDING"}
            </span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">
              Date &amp; Time Paid
            </span>
            <span className="font-medium text-slate-800">
              {paidAt ? formatDateIST(paidAt) : formatDateIST(initialReg.createdAt)}
            </span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">
              Payment Method
            </span>
            <span className="font-medium text-slate-800 uppercase">
              {initialReg.paymentMethod || (isFree ? "Free Waiver" : "Online")}
            </span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">
              Total Amount
            </span>
            <span className="font-mono font-bold text-emerald-700 text-base">
              {isFree ? "₹0 (Free)" : `₹${feeRupees}`}
            </span>
          </div>
        </div>

        {/* Participant & Event Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Participant Information */}
          <div className="space-y-3 p-5 rounded-xl border border-slate-200 bg-white">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200 text-slate-900 font-bold text-xs uppercase tracking-wider">
              <User className="w-4 h-4 text-blue-600" />
              <span>Participant Details</span>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <span className="text-slate-500 text-[11px] block">Full Name</span>
                <span className="font-semibold text-slate-900 text-sm">{initialReg.name}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[11px] block">Email Address</span>
                <span className="font-medium text-slate-800">{initialReg.email}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[11px] block">Contact Number</span>
                <span className="font-medium text-slate-800">{initialReg.phone}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[11px] block">College / Institution</span>
                <span className="font-medium text-slate-800">{initialReg.college}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[11px] block">Year of Study / Category</span>
                <span className="font-medium text-slate-800">{initialReg.year}</span>
              </div>
            </div>
          </div>

          {/* Event Information */}
          <div className="space-y-3 p-5 rounded-xl border border-slate-200 bg-white">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200 text-slate-900 font-bold text-xs uppercase tracking-wider">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>Event Details</span>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <span className="text-slate-500 text-[11px] block">Event Title</span>
                <span className="font-semibold text-slate-900 text-sm">{event.title}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[11px] block">Event Date</span>
                <span className="font-medium text-slate-800">
                  {event.startDate ? event.startDate.split("T")[0] : "Scheduled"}
                </span>
              </div>
              <div>
                <span className="text-slate-500 text-[11px] block">Venue Location</span>
                <span className="font-medium text-slate-800">{event.venue}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[11px] block">Organized By</span>
                <span className="font-medium text-slate-800">
                  IEDC TKIET Student &amp; Faculty Executive Council
                </span>
              </div>
              <div>
                <span className="text-slate-500 text-[11px] block">Registration Token</span>
                <span className="font-mono text-[10px] text-slate-600 break-all">
                  {initialReg.receiptToken}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Transaction Reference Table */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs font-mono">
          <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-600">
            <span>Razorpay Payment ID:</span>
            <span className="font-bold text-slate-900">
              {initialReg.razorpayPaymentId || (isFree ? "N/A (Institutional Waiver)" : "Confirmed")}
            </span>
          </div>
          {initialReg.razorpayOrderId && (
            <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-600">
              <span>Razorpay Order ID:</span>
              <span className="text-slate-900">{initialReg.razorpayOrderId}</span>
            </div>
          )}
        </div>

        {/* Footer & Verification Note */}
        <div className="pt-6 border-t-2 border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>
              This is an authentic computer-generated digital receipt issued by IEDC TKIET.
              No physical signature required.
            </span>
          </div>

          <div className="text-center sm:text-right shrink-0">
            <span className="font-mono text-[10px] text-slate-400 block">
              Document Authenticated
            </span>
            <span className="font-bold text-slate-800 text-xs uppercase">
              IEDC • TKIET Warananagar
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
