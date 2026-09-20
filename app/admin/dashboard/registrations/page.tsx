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
  year: string;
  status: "pending" | "paid" | "failed" | "refunded" | "cancelled";
  amount: number;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  receiptNumber?: string;
  receiptToken: string;
  paymentMethod?: string;
  paidAt?: string;
  refundId?: string;
  refundedAt?: string;
  createdAt: string;
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
  });
  const [loading, setLoading] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Reconcile state
  const [reconciling, setReconciling] = useState(false);
  const [reconcileResult, setReconcileResult] = useState<string | null>(null);

  // Refund modal state
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [selectedRegForRefund, setSelectedRegForRefund] = useState<RegistrationItem | null>(null);
  const [refundReason, setRefundReason] = useState("Participant requested refund");
  const [refunding, setRefunding] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

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

  // Reconcile Handler
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

  // Refund Submit
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

  // CSV Export
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
      "Year",
      "Event Title",
      "Amount (INR)",
      "Status",
      "Payment Method",
      "Razorpay Payment ID",
      "Razorpay Order ID",
      "Date Paid (IST)",
      "Created At (IST)",
    ];

    const rows = registrations.map((r) => [
      `"${r.receiptNumber || ""}"`,
      `"${r.receiptToken || ""}"`,
      `"${r.name.replace(/"/g, '""')}"`,
      `"${r.email}"`,
      `"${r.phone}"`,
      `"${r.college.replace(/"/g, '""')}"`,
      `"${r.year}"`,
      `"${(r.eventId?.title || "N/A").replace(/"/g, '""')}"`,
      r.amount ? r.amount / 100 : 0,
      `"${r.status}"`,
      `"${r.paymentMethod || ""}"`,
      `"${r.razorpayPaymentId || ""}"`,
      `"${r.razorpayOrderId || ""}"`,
      `"${r.paidAt ? formatDateIST(r.paidAt) : ""}"`,
      `"${formatDateIST(r.createdAt)}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `iedc-registrations-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const STATUS_TABS = [
    { id: "all", label: "All" },
    { id: "paid", label: "Paid" },
    { id: "pending", label: "Pending" },
    { id: "refunded", label: "Refunded" },
    { id: "failed", label: "Failed" },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-foundation-darkest min-h-screen">
      <AdminHeader
        title="Event Registrations & Payments"
        subtitle="Manage participant registries, Razorpay transactions, refunds, and reconciliation"
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
              <span>Reconcile Pending Orders</span>
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
              <span>Paid Participants</span>
              <CheckCircle2 className="w-4 h-4 text-brand-cyan" />
            </div>
            <p className="font-mono text-2xl font-bold text-typo-white">
              {metrics.paidCount}
            </p>
            <span className="text-[11px] text-typo-gray block">
              {metrics.totalRegistrations} total registrations
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-foundation-dark border border-foundation-slate/80 space-y-1 shadow-md">
            <div className="flex items-center justify-between text-typo-gray text-xs font-semibold uppercase tracking-wider">
              <span>Pending Holds</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <p className="font-mono text-2xl font-bold text-amber-400">
              {metrics.pendingCount}
            </p>
            <span className="text-[11px] text-typo-gray block">
              {metrics.stalePendingCount > 0 ? (
                <span className="text-amber-300 font-semibold">
                  {metrics.stalePendingCount} stale (&gt;15 min)
                </span>
              ) : (
                "All within 15 min seat hold"
              )}
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
              {metrics.failedCount} payment failures
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

            {/* Status Pills */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-foundation-slate/40 border border-foundation-slate text-xs">
              {STATUS_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedStatus(tab.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                    selectedStatus === tab.id
                      ? "bg-brand-blue text-typo-white shadow-sm"
                      : "text-typo-gray hover:text-typo-white"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Live Search */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-typo-gray" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search name, email, phone, receipt #..."
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
                    <th className="p-4">Participant Details</th>
                    <th className="p-4">Event</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Gateway IDs</th>
                    <th className="p-4">Registered At</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-foundation-slate/50">
                  {registrations.map((reg) => {
                    const isStalePending =
                      reg.status === "pending" &&
                      Date.now() - new Date(reg.createdAt).getTime() > 15 * 60 * 1000;

                    return (
                      <tr key={reg._id} className="hover:bg-foundation-slate/20 transition-colors">
                        <td className="p-4 whitespace-nowrap">
                          <div className="space-y-1">
                            <span className="font-mono font-bold text-typo-white block">
                              {reg.receiptNumber || (
                                <span className="text-typo-gray/60 font-normal">Pending #</span>
                              )}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-full font-mono uppercase font-semibold border ${
                                  reg.status === "paid"
                                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                                    : reg.status === "pending"
                                    ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                                    : reg.status === "refunded"
                                    ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                                    : "bg-rose-500/20 text-rose-400 border-rose-500/30"
                                }`}
                              >
                                {reg.status}
                              </span>
                              {isStalePending && (
                                <span
                                  className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/30 text-amber-300 font-mono flex items-center gap-1"
                                  title="Seat hold expired (>15 min) without captured payment"
                                >
                                  <AlertTriangle className="w-2.5 h-2.5" />
                                  <span>&gt;15m</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="p-4 max-w-xs">
                          <span className="font-semibold text-typo-white block truncate">
                            {reg.name}
                          </span>
                          <span className="text-[11px] text-typo-gray block truncate">
                            {reg.email} • {reg.phone}
                          </span>
                          <span className="text-[10px] text-brand-cyan block truncate">
                            {reg.college} ({reg.year})
                          </span>
                        </td>

                        <td className="p-4 max-w-xs">
                          <span className="text-typo-white font-medium block truncate">
                            {reg.eventId?.title || "Unknown Event"}
                          </span>
                          <span className="text-[10px] text-typo-gray font-mono block">
                            {reg.eventId?.startDate ? reg.eventId.startDate.split("T")[0] : ""}
                          </span>
                        </td>

                        <td className="p-4 whitespace-nowrap">
                          <span className="font-mono font-bold text-typo-white block">
                            {reg.amount === 0 ? "Free" : `₹${reg.amount / 100}`}
                          </span>
                          <span className="text-[10px] text-typo-gray uppercase block font-mono">
                            {reg.paymentMethod || "online"}
                          </span>
                        </td>

                        <td className="p-4 whitespace-nowrap font-mono text-[11px]">
                          {reg.razorpayPaymentId ? (
                            <span className="text-brand-cyan block truncate max-w-[150px]" title={reg.razorpayPaymentId}>
                              {reg.razorpayPaymentId}
                            </span>
                          ) : (
                            <span className="text-typo-gray/40 block">None</span>
                          )}
                          {reg.razorpayOrderId && (
                            <span className="text-[10px] text-typo-gray block truncate max-w-[150px]" title={reg.razorpayOrderId}>
                              {reg.razorpayOrderId}
                            </span>
                          )}
                        </td>

                        <td className="p-4 whitespace-nowrap text-typo-gray">
                          <span className="block">{formatDateIST(reg.createdAt)}</span>
                          {reg.paidAt && (
                            <span className="text-[10px] text-emerald-400 font-mono block">
                              Paid: {formatDateIST(reg.paidAt)}
                            </span>
                          )}
                        </td>

                        <td className="p-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
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

                            {reg.status === "paid" && (
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

      {/* Refund Confirmation Modal */}
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
