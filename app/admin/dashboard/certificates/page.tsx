"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Award,
  Search,
  RefreshCw,
  Plus,
  Download,
  AlertCircle,
  CheckCircle2,
  Clock,
  Send,
  XCircle,
  Trash2,
  Eye,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Calendar,
} from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminModal } from "@/components/admin/AdminModal";
import { Button } from "@/components/ui/Button";
import { formatDateIST } from "@/lib/utils/date-ist";
import { ICertificateBatch } from "@/types/certificate";

interface BatchStats {
  totalBatches: number;
  totalParticipants: number;
  totalGenerated: number;
  totalEmailsSent: number;
  totalEmailsFailed: number;
  totalEmailsPending: number;
}

export default function CertificateDashboardPage() {
  const [batches, setBatches] = useState<ICertificateBatch[]>([]);
  const [stats, setStats] = useState<BatchStats>({
    totalBatches: 0,
    totalParticipants: 0,
    totalGenerated: 0,
    totalEmailsSent: 0,
    totalEmailsFailed: 0,
    totalEmailsPending: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Pagination
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  // Modals
  const [deleteBatchId, setDeleteBatchId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchBatches = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search: search.trim(),
        status: statusFilter,
      });

      const res = await fetch(`/api/admin/certificates/batches?${query.toString()}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to load certificate batches");
      }

      setBatches(data.batches || []);
      setStats(data.stats || stats);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  const handleDeleteBatch = async () => {
    if (!deleteBatchId) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/certificates/batches/${deleteBatchId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to delete batch");
      }
      setActionSuccess("Batch and associated files successfully deleted.");
      setDeleteBatchId(null);
      fetchBatches();
    } catch (err: any) {
      alert(err.message || "Failed to delete batch");
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" /> Completed
          </span>
        );
      case "generated":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20">
            <CheckCircle2 className="w-3.5 h-3.5" /> Generated
          </span>
        );
      case "generating":
      case "sending":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> In Progress
          </span>
        );
      case "ready":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Clock className="w-3.5 h-3.5" /> Ready
          </span>
        );
      case "failed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle className="w-3.5 h-3.5" /> Failed
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-500/10 text-gray-400 border border-gray-500/20">
            Cancelled
          </span>
        );
      case "draft":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-foundation-slate text-typo-gray border border-foundation-slate/80">
            Draft
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-foundation-space text-typo-white">
      <AdminHeader
        title="Certificate Manager"
        subtitle="Generate bulk personalized PDF certificates, inspect participant rosters, and distribute via automated email delivery."
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Top Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold font-display text-typo-white flex items-center gap-2">
              <Award className="w-6 h-6 text-brand-cyan" />
              Certificate Batches & Distribution
            </h2>
            <p className="text-sm text-typo-gray mt-1">
              Automated high-fidelity PDF certificate generation and secure SMTP distribution.
            </p>
          </div>
          <Link href="/admin/dashboard/certificates/new">
            <Button className="w-full sm:w-auto inline-flex items-center gap-2 bg-brand-blue hover:bg-brand-blue/90 text-white font-medium px-4 py-2.5 rounded-xl shadow-lg shadow-brand-blue/20">
              <Plus className="w-4 h-4" />
              Create Certificate Batch
            </Button>
          </Link>
        </div>

        {/* Success Alert */}
        {actionSuccess && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              {actionSuccess}
            </div>
            <button
              onClick={() => setActionSuccess(null)}
              className="text-emerald-400 hover:text-emerald-200 text-xs font-semibold"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Summary Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="p-4 rounded-2xl bg-foundation-dark border border-foundation-slate/80">
            <p className="text-xs font-medium text-typo-gray uppercase tracking-wider">Total Batches</p>
            <p className="text-2xl font-bold text-typo-white mt-1">{stats.totalBatches}</p>
          </div>
          <div className="p-4 rounded-2xl bg-foundation-dark border border-foundation-slate/80">
            <p className="text-xs font-medium text-typo-gray uppercase tracking-wider">Participants</p>
            <p className="text-2xl font-bold text-typo-white mt-1">{stats.totalParticipants}</p>
          </div>
          <div className="p-4 rounded-2xl bg-foundation-dark border border-foundation-slate/80">
            <p className="text-xs font-medium text-brand-cyan uppercase tracking-wider">PDFs Generated</p>
            <p className="text-2xl font-bold text-brand-cyan mt-1">{stats.totalGenerated}</p>
          </div>
          <div className="p-4 rounded-2xl bg-foundation-dark border border-foundation-slate/80">
            <p className="text-xs font-medium text-emerald-400 uppercase tracking-wider">Emails Sent</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1">{stats.totalEmailsSent}</p>
          </div>
          <div className="p-4 rounded-2xl bg-foundation-dark border border-foundation-slate/80">
            <p className="text-xs font-medium text-amber-400 uppercase tracking-wider">Pending Send</p>
            <p className="text-2xl font-bold text-amber-400 mt-1">{stats.totalEmailsPending}</p>
          </div>
          <div className="p-4 rounded-2xl bg-foundation-dark border border-foundation-slate/80">
            <p className="text-xs font-medium text-rose-400 uppercase tracking-wider">Failed Deliveries</p>
            <p className="text-2xl font-bold text-rose-400 mt-1">{stats.totalEmailsFailed}</p>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 rounded-2xl bg-foundation-dark border border-foundation-slate/80 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-typo-gray absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search batches by name or event..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 bg-foundation-space border border-foundation-slate rounded-xl text-sm text-typo-white placeholder-typo-gray/60 focus:outline-none focus:border-brand-blue"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="bg-foundation-space border border-foundation-slate rounded-xl px-3 py-2 text-sm text-typo-white focus:outline-none focus:border-brand-blue"
            >
              <option value="all">All Statuses</option>
              <option value="ready">Ready</option>
              <option value="generating">Generating</option>
              <option value="generated">Generated</option>
              <option value="sending">Sending</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="draft">Draft</option>
            </select>

            <button
              onClick={() => fetchBatches()}
              className="p-2 bg-foundation-space border border-foundation-slate rounded-xl text-typo-gray hover:text-typo-white hover:border-brand-blue transition-colors"
              title="Refresh batches"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-brand-cyan" : ""}`} />
            </button>
          </div>
        </div>

        {/* Batch History Table */}
        <div className="rounded-2xl bg-foundation-dark border border-foundation-slate/80 overflow-hidden shadow-xl">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-typo-gray gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-brand-blue" />
              <p className="text-sm font-medium">Loading certificate batches...</p>
            </div>
          ) : error ? (
            <div className="py-16 text-center text-rose-400 p-6 space-y-2">
              <AlertCircle className="w-8 h-8 mx-auto" />
              <p className="font-semibold">{error}</p>
              <Button onClick={() => fetchBatches()} className="mt-3 text-xs">
                Try Again
              </Button>
            </div>
          ) : batches.length === 0 ? (
            <div className="py-20 text-center text-typo-gray space-y-4">
              <Award className="w-12 h-12 mx-auto text-foundation-slate/80" />
              <div>
                <p className="text-base font-semibold text-typo-white">No certificate batches found</p>
                <p className="text-sm text-typo-gray mt-1">
                  Create your first batch to start generating and emailing personalized certificates.
                </p>
              </div>
              <Link href="/admin/dashboard/certificates/new">
                <Button className="mt-2 bg-brand-blue text-white">Create Certificate Batch</Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-foundation-slate/70 bg-foundation-space/40 text-xs uppercase font-mono tracking-wider text-typo-gray">
                    <th className="py-4 px-6">Batch / Event</th>
                    <th className="py-4 px-6">Created</th>
                    <th className="py-4 px-6">Participants</th>
                    <th className="py-4 px-6">Generation</th>
                    <th className="py-4 px-6">Email Delivery</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-foundation-slate/60 text-sm">
                  {batches.map((batch) => {
                    const totalP = batch.totalParticipants || 0;
                    const genCount = batch.generationCounts?.generated || 0;
                    const emailSent = batch.emailCounts?.sent || 0;
                    const genPercent = totalP > 0 ? Math.round((genCount / totalP) * 100) : 0;
                    const emailPercent = totalP > 0 ? Math.round((emailSent / totalP) * 100) : 0;

                    return (
                      <tr
                        key={batch._id}
                        className="hover:bg-foundation-space/30 transition-colors group"
                      >
                        <td className="py-4 px-6">
                          <Link
                            href={`/admin/dashboard/certificates/${batch._id}`}
                            className="font-bold text-typo-white group-hover:text-brand-cyan transition-colors block"
                          >
                            {batch.batchName}
                          </Link>
                          <span className="text-xs text-typo-gray block mt-0.5">
                            {batch.eventName} {batch.certificateType ? `• ${batch.certificateType}` : ""}
                          </span>
                        </td>

                        <td className="py-4 px-6 text-xs text-typo-gray">
                          {formatDateIST(batch.createdAt)}
                          <span className="block text-[11px] text-typo-gray/60">{batch.createdBy}</span>
                        </td>

                        <td className="py-4 px-6 font-semibold text-typo-white">
                          {batch.totalParticipants}
                        </td>

                        <td className="py-4 px-6">
                          <div className="w-32 space-y-1">
                            <div className="flex justify-between text-xs text-typo-gray">
                              <span>{genCount}/{totalP}</span>
                              <span>{genPercent}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-foundation-space rounded-full overflow-hidden">
                              <div
                                className="h-full bg-brand-cyan transition-all duration-300"
                                style={{ width: `${genPercent}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-6">
                          <div className="w-32 space-y-1">
                            <div className="flex justify-between text-xs text-typo-gray">
                              <span>{emailSent}/{totalP}</span>
                              <span>{emailPercent}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-foundation-space rounded-full overflow-hidden">
                              <div
                                className="h-full bg-emerald-400 transition-all duration-300"
                                style={{ width: `${emailPercent}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-6">{getStatusBadge(batch.status)}</td>

                        <td className="py-4 px-6 text-right space-x-2">
                          <Link href={`/admin/dashboard/certificates/${batch._id}`}>
                            <button
                              className="p-1.5 rounded-lg bg-foundation-space border border-foundation-slate hover:border-brand-blue text-typo-gray hover:text-typo-white transition-colors"
                              title="View and Manage Batch"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </Link>

                          {genCount > 0 && (
                            <a
                              href={`/api/admin/certificates/batches/${batch._id}/download-zip`}
                              download
                              className="inline-block p-1.5 rounded-lg bg-foundation-space border border-foundation-slate hover:border-brand-cyan text-typo-gray hover:text-brand-cyan transition-colors"
                              title="Download All Certificates (ZIP)"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                          )}

                          <button
                            onClick={() => setDeleteBatchId(batch._id)}
                            className="p-1.5 rounded-lg bg-foundation-space border border-foundation-slate hover:border-rose-500 text-typo-gray hover:text-rose-400 transition-colors"
                            title="Delete Batch"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-foundation-slate/70 flex items-center justify-between text-sm text-typo-gray">
              <span>Page {page} of {totalPages}</span>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-lg bg-foundation-space border border-foundation-slate disabled:opacity-50 hover:text-typo-white"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3 py-1.5 rounded-lg bg-foundation-space border border-foundation-slate disabled:opacity-50 hover:text-typo-white"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {deleteBatchId && (
        <AdminModal
          isOpen={!!deleteBatchId}
          onClose={() => setDeleteBatchId(null)}
          title="Delete Certificate Batch"
        >
          <div className="space-y-4">
            <p className="text-sm text-typo-gray">
              Are you sure you want to delete this certificate batch? This will permanently delete all associated participant records and stored certificate files. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3 pt-4 border-t border-foundation-slate/60">
              <button
                type="button"
                onClick={() => setDeleteBatchId(null)}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-foundation-space border border-foundation-slate text-typo-gray hover:text-typo-white"
              >
                Cancel
              </button>
              <Button
                onClick={handleDeleteBatch}
                disabled={isDeleting}
                className="bg-rose-600 hover:bg-rose-700 text-white"
              >
                {isDeleting ? "Deleting..." : "Delete Batch"}
              </Button>
            </div>
          </div>
        </AdminModal>
      )}
    </div>
  );
}
