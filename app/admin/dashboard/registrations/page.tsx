"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Ticket,
  Search,
  RefreshCw,
  Download,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  Clock,
  Coins,
  Users,
  RotateCcw,
  X,
  Loader2,
  Calendar,
  AlertTriangle,
  Building,
  Smartphone,
  Eye,
  Check,
  Ban,
} from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminModal } from "@/components/admin/AdminModal";
import { Button } from "@/components/ui/Button";
import { formatDateIST } from "@/lib/utils/date-ist";

interface RegistrationItem {
  _id: string;
  name: string;
  email: string;
  phone: string;
  college: string;
  department?: string;
  year: string;
  status:
    | "pending"
    | "paid"
    | "failed"
    | "refunded"
    | "cancelled"
    | "verification_required"
    | "payment_rejected";
  amount: number;
  totalAmount?: number;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  receiptNumber?: string;
  receiptToken: string;
  paymentMethod?: string;
  paymentMode?: string;
  paidAt?: string;
  refundId?: string;
  refundedAt?: string;
  createdAt: string;
  // Manual UPI & Installment fields
  upiProofUrl?: string;
  upiTransactionRef?: string;
  upiId?: string | null;
  upiQrUrl?: string | null;
  adminNote?: string;
  rejectionReason?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  installmentPlan?: "full" | "installment" | null;
  installmentStatus?: "part1_pending" | "part1_paid" | "part2_pending" | "complete" | null;
  part1PaidAt?: string;
  part2ProofUrl?: string;
  part2TransactionRef?: string;
  part2PaidAt?: string;
  eventId?: {
    _id: string;
    title: string;
    slug: string;
    startDate: string;
    venue: string;
  };
}

interface EventOption {
  id: string;
  title: string;
  slug: string;
  startDate: string;
}

interface Metrics {
  totalRegistrations: number;
  paidCount: number;
  totalRevenueRupees: number;
  pendingCount: number;
  refundedCount: number;
  failedCount: number;
  stalePendingCount: number;
  upiPendingCount?: number;
  installmentDueCount?: number;
}

export default function AdminRegistrationsPage() {
  const [registrations, setRegistrations] = useState<RegistrationItem[]>([]);
  const [events, setEvents] = useState<EventOption[]>([]);
  const [metrics, setMetrics] = useState<Metrics>({
    totalRegistrations: 0,
    paidCount: 0,
    totalRevenueRupees: 0,
    pendingCount: 0,
    refundedCount: 0,
    failedCount: 0,
    stalePendingCount: 0,
    upiPendingCount: 0,
    installmentDueCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Reconcile state (Razorpay)
  const [reconciling, setReconciling] = useState(false);
  const [reconcileResult, setReconcileResult] = useState<string | null>(null);

  // Razorpay Refund modal state
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [selectedRegForRefund, setSelectedRegForRefund] = useState<RegistrationItem | null>(null);
  const [refundReason, setRefundReason] = useState("Participant requested refund");
  const [refunding, setRefunding] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Manual UPI Approval Modal state
  const [upiApproveModalOpen, setUpiApproveModalOpen] = useState(false);
  const [selectedRegForUpiApprove, setSelectedRegForUpiApprove] = useState<RegistrationItem | null>(null);
  const [upiApproveNote, setUpiApproveNote] = useState("");
  const [upiApproving, setUpiApproving] = useState(false);

  // Manual UPI Rejection Modal state
  const [upiRejectModalOpen, setUpiRejectModalOpen] = useState(false);
  const [selectedRegForUpiReject, setSelectedRegForUpiReject] = useState<RegistrationItem | null>(null);
  const [upiRejectReason, setUpiRejectReason] = useState("");
  const [upiRejecting, setUpiRejecting] = useState(false);

  // Proof Image Preview Modal state
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  // Read eventId from URL if navigated from events table
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const eventParam = params.get("eventId");
      if (eventParam) {
        setSelectedEventId(eventParam);
      }
    }
  }, []);

  const fetchRegistrations = async () => {
    setLoading(true);
    setActionError(null);
    try {
      const url = new URL("/api/admin/registrations", window.location.origin);
      if (selectedEventId && selectedEventId !== "all") {
        url.searchParams.set("eventId", selectedEventId);
      }

      if (selectedStatus && selectedStatus !== "all") {
        url.searchParams.set("status", selectedStatus);
      }

      if (searchQuery.trim()) {
        url.searchParams.set("search", searchQuery.trim());
      }

      const res = await fetch(url.toString(), { cache: "no-store" });
      const json = await res.json();
      if (json.success) {
        setRegistrations(json.data || []);
        if (json.metrics) setMetrics(json.metrics);
        if (json.events) setEvents(json.events);
      } else {
        setActionError(json.error || "Failed to load registrations");
      }
    } catch (err: any) {
      setActionError(err.message || "Network error loading data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, [selectedEventId, selectedStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRegistrations();
  };

  // Reconcile Handler (Razorpay untouched)
  const handleReconcile = async () => {
    setReconciling(true);
    setReconcileResult(null);
    try {
      const res = await fetch("/api/admin/registrations/reconcile", {
        method: "POST",
      });
      const json = await res.json();
      if (json.success) {
        setReconcileResult(
          `Reconciled: ${json.summary?.checked || 0} checked, ${json.summary?.finalizedPaid || 0} marked paid, ${json.summary?.markedFailed || 0} marked failed.`
        );
        fetchRegistrations();
      } else {
        alert(json.error || "Failed to reconcile orders");
      }
    } catch {
      alert("Network error while running reconciliation");
    } finally {
      setReconciling(false);
    }
  };

  // Razorpay Refund Submit (untouched)
  const handleConfirmRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRegForRefund) return;
    setRefunding(true);
    try {
      const res = await fetch(`/api/admin/registrations/${selectedRegForRefund._id}/refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: refundReason }),
      });
      const json = await res.json();
      if (json.success) {
        setRefundModalOpen(false);
        setSelectedRegForRefund(null);
        fetchRegistrations();
      } else {
        alert(json.error || "Failed to process refund");
      }
    } catch {
      alert("Network error processing refund");
    } finally {
      setRefunding(false);
    }
  };

  // Manual UPI Approve Submit (routes Part 2 to approve-part2)
  const handleConfirmUpiApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRegForUpiApprove) return;
    setUpiApproving(true);
    try {
      const isPart2 = selectedRegForUpiApprove.installmentStatus === "part2_pending";
      const endpoint = isPart2
        ? `/api/admin/registrations/${selectedRegForUpiApprove._id}/approve-part2`
        : `/api/admin/registrations/${selectedRegForUpiApprove._id}/approve-upi`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminNote: upiApproveNote }),
      });
      const json = await res.json();
      if (json.success) {
        setUpiApproveModalOpen(false);
        setSelectedRegForUpiApprove(null);
        setUpiApproveNote("");
        fetchRegistrations();
      } else {
        alert(json.error || "Failed to approve registration");
      }
    } catch {
      alert("Network error processing approval");
    } finally {
      setUpiApproving(false);
    }
  };

  // Manual UPI Reject Submit — rejectionReason required
  const handleConfirmUpiReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRegForUpiReject) return;
    const reason = upiRejectReason.trim();
    if (!reason) {
      alert("A rejection reason is required.");
      return;
    }
    setUpiRejecting(true);
    try {
      const res = await fetch(
        `/api/admin/registrations/${selectedRegForUpiReject._id}/reject-upi`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rejectionReason: reason }),
        }
      );
      const json = await res.json();
      if (json.success) {
        setUpiRejectModalOpen(false);
        setSelectedRegForUpiReject(null);
        setUpiRejectReason("");
        fetchRegistrations();
      } else {
        alert(json.error || "Failed to reject registration");
      }
    } catch {
      alert("Network error processing rejection");
    } finally {
      setUpiRejecting(false);
    }
  };

  // CSV Export (Includes UPI & installment fields)
  const handleExportCsv = () => {
    if (registrations.length === 0) {
      alert("No registrations to export");
      return;
    }

    const headers = [
      "Receipt Number",
      "Receipt Token",
      "Full Name",
      "Email",
      "Phone",
      "College",
      "Department",
      "Year",
      "Event Title",
      "Amount (INR)",
      "Status",
      "Payment Method",
      "UPI Transaction Ref / UTR",
      "Installment Plan",
      "Installment Status",
      "Razorpay Payment ID",
      "Razorpay Order ID",
      "Date Paid (IST)",
      "Created At (IST)",
      "Admin Note",
    ];

    const rows = registrations.map((r) => [
      `"${r.receiptNumber || ""}"`,
      `"${r.receiptToken || ""}"`,
      `"${r.name.replace(/"/g, '""')}"`,
      `"${r.email}"`,
      `"${r.phone}"`,
      `"${r.college.replace(/"/g, '""')}"`,
      `"${(r.department || "").replace(/"/g, '""')}"`,
      `"${r.year}"`,
      `"${(r.eventId?.title || "N/A").replace(/"/g, '""')}"`,
      r.amount ? r.amount / 100 : 0,
      `"${r.status}"`,
      `"${r.paymentMethod || ""}"`,
      `"${r.upiTransactionRef || ""}"`,
      `"${r.installmentPlan || "full"}"`,
      `"${r.installmentStatus || ""}"`,
      `"${r.razorpayPaymentId || ""}"`,
      `"${r.razorpayOrderId || ""}"`,
      `"${r.paidAt ? formatDateIST(r.paidAt) : ""}"`,
      `"${formatDateIST(r.createdAt)}"`,
      `"${(r.adminNote || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `iedc-registrations-${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const STATUS_TABS = [
    { id: "all", label: "All" },
    {
      id: "upi_pending",
      label: `UPI Review${metrics.upiPendingCount ? ` (${metrics.upiPendingCount})` : ""}`,
    },
    {
      id: "installment_due",
      label: `Installment Due${metrics.installmentDueCount ? ` (${metrics.installmentDueCount})` : ""}`,
    },
    { id: "installment", label: "Installment" },
    { id: "paid", label: "Paid" },
    { id: "pending", label: "Pending" },
    { id: "refunded", label: "Refunded" },
    { id: "cancelled", label: "Cancelled / Rejected" },
    { id: "payment_rejected", label: "UPI Rejected" },
  ];

  const daysSince = (dateStr?: string) => {
    if (!dateStr) return null;
    const ms = Date.now() - new Date(dateStr).getTime();
    return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
  };

  return (
    <div className="flex-1 overflow-y-auto bg-foundation-darkest min-h-screen">
      <AdminHeader
        title="Event Registrations & Payments"
        subtitle="Manage participant registries, Razorpay transactions, manual UPI verification, and installments"
        onToggleSidebar={() => {}}
      />

      <main className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto">
        {/* Top Control Strip */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              onClick={handleReconcile}
              disabled={reconciling}
              variant="secondary"
              className="text-xs flex items-center gap-2 bg-foundation-dark border border-foundation-slate hover:border-brand-cyan text-typo-white"
            >
              {reconciling ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RotateCcw className="w-3.5 h-3.5 text-brand-cyan" />
              )}
              <span>Reconcile Razorpay Orders</span>
            </Button>

            <Button
              type="button"
              onClick={handleExportCsv}
              variant="secondary"
              className="text-xs flex items-center gap-2 bg-foundation-dark border border-foundation-slate hover:border-brand-cyan text-typo-white"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export CSV</span>
            </Button>
          </div>

          <Button
            type="button"
            onClick={fetchRegistrations}
            disabled={loading}
            variant="ghost"
            className="text-xs flex items-center gap-2 text-typo-gray hover:text-typo-white"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>
        </div>

        {/* Reconcile Status Notice */}
        {reconcileResult && (
          <div className="p-4 rounded-xl bg-brand-blue/10 border border-brand-cyan/40 text-xs text-brand-cyan flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{reconcileResult}</span>
            </div>
            <button
              type="button"
              onClick={() => setReconcileResult(null)}
              className="text-typo-gray hover:text-typo-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Summary Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-foundation-dark border border-foundation-slate/80 space-y-1 shadow-md">
            <div className="flex items-center justify-between text-typo-gray text-xs font-semibold uppercase tracking-wider">
              <span>Total Revenue</span>
              <Coins className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="font-mono text-2xl font-bold text-typo-white">
              ₹{metrics.totalRevenueRupees.toLocaleString("en-IN")}
            </p>
            <span className="text-[11px] text-typo-gray block">From verified paid orders</span>
          </div>

          <div className="p-5 rounded-2xl bg-foundation-dark border border-foundation-slate/80 space-y-1 shadow-md">
            <div className="flex items-center justify-between text-typo-gray text-xs font-semibold uppercase tracking-wider">
              <span>Paid Attendees</span>
              <CheckCircle2 className="w-4 h-4 text-brand-cyan" />
            </div>
            <p className="font-mono text-2xl font-bold text-typo-white">
              {metrics.paidCount}
            </p>
            <span className="text-[11px] text-typo-gray block">
              {metrics.totalRegistrations} total submissions
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-foundation-dark border border-foundation-slate/80 space-y-1 shadow-md">
            <div className="flex items-center justify-between text-typo-gray text-xs font-semibold uppercase tracking-wider">
              <span>UPI Awaiting Review</span>
              <Smartphone className="w-4 h-4 text-amber-400" />
            </div>
            <p className="font-mono text-2xl font-bold text-amber-400">
              {metrics.upiPendingCount || 0}
            </p>
            <span className="text-[11px] text-typo-gray block">
              Manual verification needed
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-foundation-dark border border-foundation-slate/80 space-y-1 shadow-md">
            <div className="flex items-center justify-between text-typo-gray text-xs font-semibold uppercase tracking-wider">
              <span>Refunded / Cancelled</span>
              <AlertCircle className="w-4 h-4 text-rose-400" />
            </div>
            <p className="font-mono text-2xl font-bold text-typo-white">
              {metrics.refundedCount}
            </p>
            <span className="text-[11px] text-typo-gray block">
              {metrics.failedCount} gateway drops
            </span>
          </div>
        </div>

        {/* Filters & Search Strip */}
        <div className="p-4 rounded-2xl bg-foundation-dark border border-foundation-slate/80 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Event Dropdown */}
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="px-3.5 py-2 rounded-xl bg-foundation-slate/50 border border-foundation-slate text-typo-white text-xs focus:outline-none focus:border-brand-cyan max-w-xs"
            >
              <option value="all">All Events</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.title}
                </option>
              ))}
            </select>

            {/* Status Tabs */}
            <div className="flex flex-wrap items-center gap-1 p-1 rounded-xl bg-foundation-slate/40 border border-foundation-slate text-xs">
              {STATUS_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedStatus(tab.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                    selectedStatus === tab.id
                      ? tab.id === "upi_pending" || tab.id === "installment_due"
                        ? "bg-amber-500 text-foundation-darkest font-bold shadow-sm"
                        : tab.id === "installment"
                        ? "bg-violet-600 text-typo-white font-bold shadow-sm"
                        : "bg-brand-blue text-typo-white shadow-sm"
                      : "text-typo-gray hover:text-typo-white"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-typo-gray" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search name, email, phone, UTR..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-foundation-slate/50 border border-foundation-slate text-typo-white text-xs focus:outline-none focus:border-brand-cyan"
            />
          </form>
        </div>

        {/* Registrations Table */}
        {loading ? (
          <div className="p-12 rounded-2xl bg-foundation-dark border border-foundation-slate text-center text-xs font-sans text-typo-gray">
            Loading registrations database...
          </div>
        ) : registrations.length === 0 ? (
          <div className="p-12 rounded-2xl bg-foundation-dark border border-foundation-slate text-center space-y-3">
            <Ticket className="w-10 h-10 text-typo-gray/60 mx-auto" />
            <h3 className="font-display text-base font-bold text-typo-white">
              No matching registrations found.
            </h3>
            <p className="text-xs font-sans text-typo-gray">
              {searchQuery || selectedEventId !== "all" || selectedStatus !== "all"
                ? "Try adjusting your filters or search query."
                : "Participants who complete registration will appear here automatically."}
            </p>
          </div>
        ) : (
          <div className="rounded-2xl bg-foundation-dark border border-foundation-slate overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-foundation-slate/40 text-typo-gray border-b border-foundation-slate uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-4">Receipt # / Status</th>
                    <th className="p-4">Participant &amp; College</th>
                    <th className="p-4">Event</th>
                    <th className="p-4">Amount &amp; Plan</th>
                    <th className="p-4">Payment &amp; Proof</th>
                    <th className="p-4">Registered At</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-foundation-slate/50">
                  {registrations.map((reg) => {
                    const isManualUpi =
                      reg.paymentMethod === "MANUAL_UPI" || reg.paymentMode === "manual_upi";
                    const awaitingUpiReview =
                      reg.status === "verification_required" || reg.status === "pending";
                    const isPendingUpi =
                      isManualUpi &&
                      awaitingUpiReview &&
                      reg.installmentStatus !== "part1_paid";

                    return (
                      <tr key={reg._id} className="hover:bg-foundation-slate/20 transition-colors">
                        {/* Receipt & Status */}
                        <td className="p-4 whitespace-nowrap">
                          <div className="space-y-1">
                            <span className="font-mono font-bold text-typo-white block">
                              {reg.receiptNumber || (
                                <span className="text-typo-gray/60 font-normal">Pending #</span>
                              )}
                            </span>
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-full font-mono uppercase font-semibold border ${
                                  reg.status === "paid"
                                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                                    : reg.status === "pending" ||
                                      reg.status === "verification_required"
                                    ? isManualUpi
                                      ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                                      : "bg-amber-500/20 text-amber-400 border-amber-500/30"
                                    : reg.status === "refunded"
                                    ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                                    : "bg-rose-500/20 text-rose-400 border-rose-500/30"
                                }`}
                              >
                                {isManualUpi &&
                                (reg.status === "pending" ||
                                  reg.status === "verification_required")
                                  ? reg.installmentStatus === "part1_paid"
                                    ? "Awaiting Part 2"
                                    : "UPI Review"
                                  : reg.status === "payment_rejected"
                                  ? "UPI Rejected"
                                  : reg.status}
                              </span>

                              {isManualUpi && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-brand-blue/30 text-brand-cyan border border-brand-cyan/30 font-mono">
                                  MANUAL_UPI
                                </span>
                              )}

                              {reg.installmentPlan === "installment" && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-violet-500/25 text-violet-200 border border-violet-400/40 font-mono font-semibold uppercase tracking-wide">
                                  Installment
                                </span>
                              )}

                              {reg.installmentPlan === "installment" && reg.installmentStatus && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono">
                                  {reg.installmentStatus === "part1_pending"
                                    ? "Part 1 Review"
                                    : reg.installmentStatus === "part1_paid"
                                    ? "Part 2 Due"
                                    : reg.installmentStatus === "part2_pending"
                                    ? "Part 2 Review"
                                    : "Complete"}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Participant & Department */}
                        <td className="p-4 max-w-xs">
                          <span className="font-semibold text-typo-white block truncate">
                            {reg.name}
                          </span>
                          <span className="text-[11px] text-typo-gray block truncate">
                            {reg.email} • {reg.phone}
                          </span>
                          <span className="text-[10px] text-brand-cyan block truncate">
                            {reg.college}
                            {reg.department ? ` · ${reg.department}` : ""} ({reg.year})
                          </span>
                        </td>

                        {/* Event */}
                        <td className="p-4 max-w-xs">
                          <span className="text-typo-white font-medium block truncate">
                            {reg.eventId?.title || "Unknown Event"}
                          </span>
                          <span className="text-[10px] text-typo-gray font-mono block">
                            {reg.eventId?.startDate ? reg.eventId.startDate.split("T")[0] : ""}
                          </span>
                        </td>

                        {/* Amount & Plan */}
                        <td className="p-4 whitespace-nowrap">
                          <span className="font-mono font-bold text-typo-white block">
                            {reg.amount === 0 ? "Free" : `₹${reg.amount / 100}`}
                            {reg.installmentPlan === "installment" &&
                              reg.installmentStatus === "part1_paid" &&
                              reg.totalAmount != null && (
                                <span className="text-typo-gray font-normal">
                                  {" "}
                                  / ₹{reg.totalAmount / 100}
                                </span>
                              )}
                          </span>
                          <span className="text-[10px] text-typo-gray uppercase block font-mono">
                            {reg.installmentPlan === "installment" ? "Split Plan" : "Full Payment"}
                          </span>
                          {reg.installmentStatus === "part1_paid" && (
                            <span className="text-[10px] text-amber-300 block font-mono mt-0.5">
                              Remaining: ₹
                              {Math.max(
                                0,
                                ((reg.totalAmount ?? reg.amount) || 0) - (reg.amount || 0)
                              ) / 100}
                              {reg.part1PaidAt && daysSince(reg.part1PaidAt) !== null
                                ? ` · ${daysSince(reg.part1PaidAt)}d since Part 1`
                                : ""}
                            </span>
                          )}
                        </td>

                        {/* Gateway / UPI Proof */}
                        <td className="p-4 whitespace-nowrap font-mono text-[11px]">
                          {isManualUpi ? (
                            <div className="space-y-1">
                              {reg.upiTransactionRef && (
                                <span
                                  className="text-amber-300 block truncate max-w-[140px]"
                                  title={`UTR: ${reg.upiTransactionRef}`}
                                >
                                  UTR: {reg.upiTransactionRef}
                                </span>
                              )}
                              {reg.upiProofUrl && (
                                <button
                                  type="button"
                                  onClick={() => setPreviewImageUrl(reg.upiProofUrl || null)}
                                  className="text-[10px] text-brand-cyan hover:underline inline-flex items-center gap-1 font-sans"
                                >
                                  <Eye className="w-3 h-3" />
                                  <span>View Proof</span>
                                </button>
                              )}
                              {reg.part2ProofUrl && (
                                <button
                                  type="button"
                                  onClick={() => setPreviewImageUrl(reg.part2ProofUrl || null)}
                                  className="text-[10px] text-purple-300 hover:underline inline-flex items-center gap-1 font-sans block"
                                >
                                  <Eye className="w-3 h-3" />
                                  <span>View Part 2</span>
                                </button>
                              )}
                            </div>
                          ) : (
                            <div>
                              {reg.razorpayPaymentId ? (
                                <span
                                  className="text-brand-cyan block truncate max-w-[140px]"
                                  title={reg.razorpayPaymentId}
                                >
                                  {reg.razorpayPaymentId}
                                </span>
                              ) : (
                                <span className="text-typo-gray/40 block">None</span>
                              )}
                              {reg.razorpayOrderId && (
                                <span
                                  className="text-[10px] text-typo-gray block truncate max-w-[140px]"
                                  title={reg.razorpayOrderId}
                                >
                                  {reg.razorpayOrderId}
                                </span>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Dates */}
                        <td className="p-4 whitespace-nowrap text-typo-gray">
                          <span className="block">{formatDateIST(reg.createdAt)}</span>
                          {reg.paidAt && (
                            <span className="text-[10px] text-emerald-400 font-mono block">
                              Paid: {formatDateIST(reg.paidAt)}
                            </span>
                          )}
                        </td>

                        {/* Action Buttons */}
                        <td className="p-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Manual UPI Approve / Reject Buttons */}
                            {isPendingUpi && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedRegForUpiApprove(reg);
                                    setUpiApproveNote("");
                                    setUpiApproveModalOpen(true);
                                  }}
                                  className="p-1.5 rounded-lg bg-emerald-950/50 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-500/40 transition-colors inline-flex items-center gap-1"
                                  title="Approve UPI Payment"
                                >
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  <span className="text-[11px] font-semibold hidden sm:inline">
                                    {reg.installmentStatus === "part2_pending"
                                      ? "Approve Part 2"
                                      : "Approve"}
                                  </span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedRegForUpiReject(reg);
                                    setUpiRejectReason("");
                                    setUpiRejectModalOpen(true);
                                  }}
                                  className="p-1.5 rounded-lg bg-rose-950/50 hover:bg-rose-900/60 text-rose-300 border border-rose-500/40 transition-colors inline-flex items-center gap-1"
                                  title="Reject Payment Proof"
                                >
                                  <Ban className="w-3.5 h-3.5 text-rose-400" />
                                  <span className="text-[11px] font-medium hidden sm:inline">Reject</span>
                                </button>
                              </>
                            )}

                            {/* View Receipt Link */}
                            <Link
                              href={`/receipt/${reg.receiptToken}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 rounded-lg bg-foundation-slate/50 hover:bg-foundation-slate text-brand-cyan transition-colors inline-flex items-center gap-1"
                              title="View Official Receipt"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span className="text-[11px] font-medium hidden sm:inline">Receipt</span>
                            </Link>

                            {/* Razorpay Refund button for paid razorpay registrations */}
                            {reg.status === "paid" && !isManualUpi && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedRegForRefund(reg);
                                  setRefundReason("Admin initiated refund");
                                  setRefundModalOpen(true);
                                }}
                                className="p-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/50 text-red-300 border border-red-500/30 transition-colors inline-flex items-center gap-1"
                                title="Issue Razorpay Refund"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span className="text-[11px] font-medium hidden sm:inline">Refund</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Manual UPI Approve Modal */}
      <AdminModal
        isOpen={upiApproveModalOpen}
        onClose={() => setUpiApproveModalOpen(false)}
        title="Approve Manual UPI Registration"
        subtitle="This will mark the payment verified and issue an official sequential IEDC receipt number"
        maxWidth="md"
      >
        <form onSubmit={handleConfirmUpiApprove} className="space-y-4">
          {selectedRegForUpiApprove && (
            <div className="p-4 rounded-xl bg-foundation-slate/40 border border-foundation-slate text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-typo-gray">Participant:</span>
                <span className="font-semibold text-typo-white">{selectedRegForUpiApprove.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-typo-gray">Event:</span>
                <span className="text-typo-white">{selectedRegForUpiApprove.eventId?.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-typo-gray">Amount:</span>
                <span className="font-mono font-bold text-emerald-400">
                  ₹{selectedRegForUpiApprove.amount / 100}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-typo-gray">UTR / Reference:</span>
                <span className="font-mono text-amber-300">
                  {selectedRegForUpiApprove.upiTransactionRef || "N/A"}
                </span>
              </div>
              {selectedRegForUpiApprove.installmentPlan === "installment" && (
                <div className="flex justify-between">
                  <span className="text-typo-gray">Installment Stage:</span>
                  <span className="text-brand-cyan font-semibold">
                    {selectedRegForUpiApprove.installmentStatus === "part2_pending"
                      ? "Approving Final Part 2"
                      : "Approving Initial Part 1"}
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-typo-gray uppercase tracking-wider">
              Admin Verification Note (Optional)
            </label>
            <input
              type="text"
              value={upiApproveNote}
              onChange={(e) => setUpiApproveNote(e.target.value)}
              placeholder="e.g. Verified via college SBI account statement"
              className="w-full px-4 py-2.5 rounded-xl bg-foundation-slate/50 border border-foundation-slate text-typo-white text-xs focus:outline-none focus:border-brand-cyan"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              disabled={upiApproving}
              onClick={() => setUpiApproveModalOpen(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={upiApproving}
              className="text-xs flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {upiApproving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Approving...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Confirm &amp; Issue Receipt</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </AdminModal>

      {/* Manual UPI Reject Modal */}
      <AdminModal
        isOpen={upiRejectModalOpen}
        onClose={() => setUpiRejectModalOpen(false)}
        title="Reject UPI Payment Proof"
        subtitle="Participant will be marked as payment rejected — a reason is required"
        maxWidth="md"
      >
        <form onSubmit={handleConfirmUpiReject} className="space-y-4">
          {selectedRegForUpiReject && (
            <div className="p-4 rounded-xl bg-foundation-slate/40 border border-foundation-slate text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-typo-gray">Participant:</span>
                <span className="font-semibold text-typo-white">{selectedRegForUpiReject.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-typo-gray">UTR / Reference:</span>
                <span className="font-mono text-amber-300">
                  {selectedRegForUpiReject.upiTransactionRef || "N/A"}
                </span>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-typo-gray uppercase tracking-wider">
              Rejection Reason *
            </label>
            <input
              type="text"
              required
              value={upiRejectReason}
              onChange={(e) => setUpiRejectReason(e.target.value)}
              placeholder="e.g. UTR not found on bank statement / Invalid amount transferred"
              className="w-full px-4 py-2.5 rounded-xl bg-foundation-slate/50 border border-foundation-slate text-typo-white text-xs focus:outline-none focus:border-brand-cyan"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              disabled={upiRejecting}
              onClick={() => setUpiRejectModalOpen(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={upiRejecting || !upiRejectReason.trim()}
              className="text-xs flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white"
            >
              {upiRejecting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Rejecting...</span>
                </>
              ) : (
                <>
                  <Ban className="w-4 h-4" />
                  <span>Confirm Rejection</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </AdminModal>

      {/* Proof Image Preview Modal */}
      {previewImageUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foundation-darkest/90 backdrop-blur-md"
          onClick={() => setPreviewImageUrl(null)}
        >
          <div
            className="relative max-w-2xl max-h-[85vh] bg-foundation-dark p-4 rounded-2xl border border-foundation-slate/60 shadow-2xl flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between w-full pb-3 border-b border-foundation-slate/60">
              <span className="text-xs font-semibold text-typo-white">Payment Proof Screenshot</span>
              <button
                type="button"
                onClick={() => setPreviewImageUrl(null)}
                className="text-typo-gray hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-3 overflow-auto max-h-[70vh]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewImageUrl}
                alt="Payment Proof"
                className="rounded-lg object-contain max-h-[65vh] w-auto mx-auto"
              />
            </div>
            <div className="pt-2">
              <a
                href={previewImageUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-brand-cyan hover:underline inline-flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open original image</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Razorpay Refund Confirmation Modal (untouched functionality) */}
      <AdminModal
        isOpen={refundModalOpen}
        onClose={() => setRefundModalOpen(false)}
        title="Confirm Razorpay Refund"
        subtitle="This action will call the Razorpay API to return funds to the participant's original payment method"
        maxWidth="md"
      >
        <form onSubmit={handleConfirmRefund} className="space-y-4">
          {selectedRegForRefund && (
            <div className="p-4 rounded-xl bg-foundation-slate/40 border border-foundation-slate text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-typo-gray">Participant:</span>
                <span className="font-semibold text-typo-white">{selectedRegForRefund.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-typo-gray">Email:</span>
                <span className="font-mono text-typo-white">{selectedRegForRefund.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-typo-gray">Amount to Refund:</span>
                <span className="font-mono font-bold text-rose-400">
                  ₹{selectedRegForRefund.amount / 100}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-typo-gray">Razorpay Payment ID:</span>
                <span className="font-mono text-brand-cyan">
                  {selectedRegForRefund.razorpayPaymentId || "N/A (Free)"}
                </span>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-typo-gray uppercase tracking-wider">
              Refund Reason (Logged with Razorpay) *
            </label>
            <input
              type="text"
              required
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              placeholder="e.g. Participant withdrew registration"
              className="w-full px-4 py-2.5 rounded-xl bg-foundation-slate/50 border border-foundation-slate text-typo-white text-xs focus:outline-none focus:border-brand-cyan"
            />
          </div>

          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-300 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
            <span>
              Warning: Refunds cannot be undone. Razorpay typically credits UPI payments
              instantly and cards within 5–7 banking days.
            </span>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              disabled={refunding}
              onClick={() => setRefundModalOpen(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={refunding}
              className="text-xs flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-typo-white"
            >
              {refunding ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing Refund...</span>
                </>
              ) : (
                <>
                  <RotateCcw className="w-4 h-4" />
                  <span>Confirm &amp; Refund ₹{selectedRegForRefund ? selectedRegForRefund.amount / 100 : 0}</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </AdminModal>
    </div>
  );
}
