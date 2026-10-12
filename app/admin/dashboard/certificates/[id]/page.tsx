"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Award,
  ArrowLeft,
  RefreshCw,
  Download,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  XCircle,
  Loader2,
  FileText,
  Mail,
  Copy,
  Check,
  Search,
  Filter,
  Eye,
  RotateCcw,
  Ban,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminModal } from "@/components/admin/AdminModal";
import { Button } from "@/components/ui/Button";
import { formatDateIST } from "@/lib/utils/date-ist";
import {
  ICertificateBatch,
  ICertificateRecipient,
} from "@/types/certificate";

export default function BatchDetailsPage() {
  const params = useParams();
  const batchId = params.id as string;

  const [batch, setBatch] = useState<ICertificateBatch | null>(null);
  const [recipients, setRecipients] = useState<ICertificateRecipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Recipient table filters & pagination
  const [search, setSearch] = useState("");
  const [genFilter, setGenFilter] = useState("all");
  const [emailFilter, setEmailFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;

  // Actions state
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSendingEmails, setIsSendingEmails] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Modals
  const [isTestEmailOpen, setIsTestEmailOpen] = useState(false);
  const [testEmailAddress, setTestEmailAddress] = useState("");
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [previewRecipient, setPreviewRecipient] = useState<ICertificateRecipient | null>(null);
  const [copiedCertId, setCopiedCertId] = useState<string | null>(null);

  // Fetch Batch Details
  const fetchBatch = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/certificates/batches/${batchId}`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to fetch batch");
      }
      setBatch(data.batch);
    } catch (err: any) {
      setError(err.message || "Failed to load batch");
    }
  }, [batchId]);

  // Fetch Recipients with pagination & filters
  const fetchRecipients = useCallback(async () => {
    try {
      const query = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search: search.trim(),
        generationStatus: genFilter,
        emailStatus: emailFilter,
      });

      const res = await fetch(
        `/api/admin/certificates/batches/${batchId}/recipients?${query.toString()}`
      );
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to fetch participants");
      }
      setRecipients(data.recipients || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (err: any) {
      console.error(err);
    }
  }, [batchId, page, search, genFilter, emailFilter]);

  // Initial load
  useEffect(() => {
    setLoading(true);
    Promise.all([fetchBatch(), fetchRecipients()]).finally(() => {
      setLoading(false);
    });
  }, [fetchBatch, fetchRecipients]);

  // Reactive polling while batch is active (generating or sending)
  useEffect(() => {
    if (!batch) return;
    const isProcessing = batch.status === "generating" || batch.status === "sending";
    if (!isProcessing) return;

    const interval = setInterval(() => {
      fetchBatch();
      fetchRecipients();
    }, 3000);

    return () => clearInterval(interval);
  }, [batch?.status, fetchBatch, fetchRecipients]);

  // Start PDF Generation
  const handleStartGeneration = async (forceRegenerate = false) => {
    setIsGenerating(true);
    setActionNotice(null);
    setActionError(null);
    try {
      const res = await fetch(`/api/admin/certificates/batches/${batchId}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ forceRegenerate }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Generation failed");
      }
      setActionNotice(data.message || "PDF certificates generated successfully.");
      await fetchBatch();
      await fetchRecipients();
    } catch (err: any) {
      setActionError(err.message || "Failed to generate certificates");
    } finally {
      setIsGenerating(false);
    }
  };

  // Start Email Distribution
  const handleStartEmailDistribution = async (retryFailedOnly = false) => {
    setIsSendingEmails(true);
    setActionNotice(null);
    setActionError(null);
    try {
      const res = await fetch(`/api/admin/certificates/batches/${batchId}/send-emails`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ retryFailedOnly }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Email delivery failed");
      }
      setActionNotice(data.message || "Email distribution processed successfully.");
      await fetchBatch();
      await fetchRecipients();
    } catch (err: any) {
      setActionError(err.message || "Failed during email delivery");
    } finally {
      setIsSendingEmails(false);
    }
  };

  // Send Test Email
  const handleSendTestEmail = async () => {
    if (!testEmailAddress || !testEmailAddress.includes("@")) {
      alert("Please enter a valid email address.");
      return;
    }
    setIsSendingTest(true);
    try {
      const res = await fetch(`/api/admin/certificates/batches/${batchId}/test-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testEmail: testEmailAddress }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to dispatch test email");
      }
      alert(data.message || "Test email dispatched successfully!");
      setIsTestEmailOpen(false);
    } catch (err: any) {
      alert(err.message || "Failed to send test email");
    } finally {
      setIsSendingTest(false);
    }
  };

  // Cancel Batch Job
  const handleCancelOperation = async () => {
    try {
      const res = await fetch(`/api/admin/certificates/batches/${batchId}/cancel`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        setActionNotice("Active processing job cancelled.");
        fetchBatch();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Copy certificate ID
  const copyToClipboard = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedCertId(id);
    setTimeout(() => setCopiedCertId(null), 2000);
  };

  if (loading && !batch) {
    return (
      <div className="min-h-screen bg-foundation-space text-typo-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-blue" />
      </div>
    );
  }

  if (error || !batch) {
    return (
      <div className="min-h-screen bg-foundation-space text-typo-white p-8">
        <div className="max-w-md mx-auto text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-xl font-bold">Failed to load batch</h2>
          <p className="text-sm text-typo-gray">{error || "Batch not found"}</p>
          <Link href="/admin/dashboard/certificates">
            <Button className="bg-brand-blue text-white">Back to Certificate Manager</Button>
          </Link>
        </div>
      </div>
    );
  }

  const totalParticipants = batch.totalParticipants || 0;
  const genCounts = batch.generationCounts || { total: totalParticipants, generated: 0, failed: 0 };
  const emailCounts = batch.emailCounts || { total: totalParticipants, sent: 0, failed: 0, pending: 0 };

  const genPercent = totalParticipants > 0 ? Math.round((genCounts.generated / totalParticipants) * 100) : 0;
  const emailPercent = totalParticipants > 0 ? Math.round((emailCounts.sent / totalParticipants) * 100) : 0;

  return (
    <div className="min-h-screen bg-foundation-space text-typo-white">
      <AdminHeader
        title={batch.batchName}
        subtitle={`${batch.eventName} • Created by ${batch.createdBy}`}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between text-xs font-mono text-typo-gray">
          <Link href="/admin/dashboard/certificates" className="hover:text-typo-white flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to All Batches
          </Link>

          <span className="text-typo-gray/80">Batch ID: {batch._id}</span>
        </div>

        {/* Notices */}
        {actionNotice && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{actionNotice}</span>
            </div>
            <button onClick={() => setActionNotice(null)} className="text-xs font-semibold hover:underline">
              Dismiss
            </button>
          </div>
        )}

        {actionError && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{actionError}</span>
            </div>
            <button onClick={() => setActionError(null)} className="text-xs font-semibold hover:underline">
              Dismiss
            </button>
          </div>
        )}

        {/* Progress & Operations Command Deck */}
        <div className="p-6 rounded-2xl bg-foundation-dark border border-foundation-slate/80 shadow-xl space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 pb-6 border-b border-foundation-slate/60">
            {/* Progress Bars */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 flex-1">
              {/* PDF Generation Progress */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-typo-white flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-brand-cyan" /> Certificates Generated
                  </span>
                  <span className="font-mono text-brand-cyan font-bold">
                    {genCounts.generated} / {totalParticipants} ({genPercent}%)
                  </span>
                </div>
                <div className="h-2 w-full bg-foundation-space rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-cyan transition-all duration-300"
                    style={{ width: `${genPercent}%` }}
                  />
                </div>
                {genCounts.failed > 0 && (
                  <p className="text-[11px] text-rose-400">Failed: {genCounts.failed} certificate(s)</p>
                )}
              </div>

              {/* Email Delivery Progress */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-typo-white flex items-center gap-1.5">
                    <Mail className="w-4 h-4 text-emerald-400" /> Emails Sent (SMTP Accepted)
                  </span>
                  <span className="font-mono text-emerald-400 font-bold">
                    {emailCounts.sent} / {totalParticipants} ({emailPercent}%)
                  </span>
                </div>
                <div className="h-2 w-full bg-foundation-space rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-400 transition-all duration-300"
                    style={{ width: `${emailPercent}%` }}
                  />
                </div>
                {emailCounts.failed > 0 && (
                  <p className="text-[11px] text-rose-400">Failed deliveries: {emailCounts.failed}</p>
                )}
              </div>
            </div>

            {/* Status & Cancel Control */}
            <div className="flex items-center gap-3">
              {(batch.status === "generating" || batch.status === "sending") && (
                <button
                  onClick={handleCancelOperation}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 inline-flex items-center gap-1"
                >
                  <Ban className="w-3.5 h-3.5" /> Stop / Cancel
                </button>
              )}
              <button
                onClick={() => {
                  fetchBatch();
                  fetchRecipients();
                }}
                className="p-2 rounded-xl bg-foundation-space border border-foundation-slate text-typo-gray hover:text-typo-white"
                title="Refresh batch status"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Action Button Bar */}
          <div className="flex flex-wrap gap-3 items-center justify-between">
            <div className="flex flex-wrap gap-3">
              {/* Generate PDF Trigger */}
              <Button
                disabled={isGenerating || batch.status === "generating"}
                onClick={() => handleStartGeneration(false)}
                className="bg-brand-blue hover:bg-brand-blue/90 text-white text-xs font-bold px-4 py-2 rounded-xl inline-flex items-center gap-2"
              >
                {isGenerating || batch.status === "generating" ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating Certificates...
                  </>
                ) : (
                  <>
                    <FileText className="w-3.5 h-3.5" /> Generate Certificates
                  </>
                )}
              </Button>

              {/* Send Test Email Button */}
              <Button
                onClick={() => setIsTestEmailOpen(true)}
                className="bg-foundation-space hover:bg-foundation-slate border border-foundation-slate text-typo-white text-xs font-medium px-4 py-2 rounded-xl inline-flex items-center gap-2"
              >
                <Send className="w-3.5 h-3.5 text-brand-cyan" /> Send Test Email
              </Button>

              {/* Start Bulk Email Distribution Button */}
              <Button
                disabled={
                  isSendingEmails ||
                  batch.status === "sending" ||
                  genCounts.generated === 0
                }
                onClick={() => {
                  if (
                    confirm(
                      `Are you sure you want to send certificates to ${emailCounts.pending} pending participant(s)?`
                    )
                  ) {
                    handleStartEmailDistribution(false);
                  }
                }}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-xl inline-flex items-center gap-2 disabled:opacity-50"
              >
                {isSendingEmails || batch.status === "sending" ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Sending Emails...
                  </>
                ) : (
                  <>
                    <Mail className="w-3.5 h-3.5" /> Start Email Distribution
                  </>
                )}
              </Button>

              {/* Retry Failed Deliveries */}
              {emailCounts.failed > 0 && (
                <Button
                  onClick={() => handleStartEmailDistribution(true)}
                  className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold px-4 py-2 rounded-xl inline-flex items-center gap-2"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Retry Failed ({emailCounts.failed})
                </Button>
              )}
            </div>

            {/* Bulk ZIP Download */}
            {genCounts.generated > 0 && (
              <a
                href={`/api/admin/certificates/batches/${batchId}/download-zip`}
                download
                className="px-4 py-2 rounded-xl bg-foundation-space border border-brand-cyan/40 hover:bg-brand-cyan/10 text-brand-cyan text-xs font-bold inline-flex items-center gap-2 transition-colors"
              >
                <Download className="w-4 h-4" /> Download All (ZIP + Manifest)
              </a>
            )}
          </div>
        </div>

        {/* Participant Roster Table Section */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h3 className="text-lg font-bold font-display text-typo-white flex items-center gap-2">
              <Award className="w-5 h-5 text-brand-cyan" />
              Participant Roster ({totalParticipants} total)
            </h3>

            {/* Search and Filters */}
            <div className="flex flex-wrap gap-2 items-center">
              <div className="relative w-64">
                <Search className="w-3.5 h-3.5 text-typo-gray absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search name, email, ID..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="w-full pl-8 pr-3 py-1.5 bg-foundation-dark border border-foundation-slate rounded-lg text-xs text-typo-white focus:outline-none focus:border-brand-blue"
                />
              </div>

              <select
                value={genFilter}
                onChange={(e) => {
                  setGenFilter(e.target.value);
                  setPage(1);
                }}
                className="bg-foundation-dark border border-foundation-slate rounded-lg px-2.5 py-1.5 text-xs text-typo-white focus:outline-none"
              >
                <option value="all">All PDF Statuses</option>
                <option value="generated">Generated</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>

              <select
                value={emailFilter}
                onChange={(e) => {
                  setEmailFilter(e.target.value);
                  setPage(1);
                }}
                className="bg-foundation-dark border border-foundation-slate rounded-lg px-2.5 py-1.5 text-xs text-typo-white focus:outline-none"
              >
                <option value="all">All Email Statuses</option>
                <option value="sent">Sent</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>

          <div className="rounded-2xl bg-foundation-dark border border-foundation-slate/80 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-foundation-slate/70 bg-foundation-space/40 uppercase font-mono tracking-wider text-typo-gray">
                    <th className="py-3 px-4">Row</th>
                    <th className="py-3 px-4">Participant Name</th>
                    <th className="py-3 px-4">Email Address</th>
                    <th className="py-3 px-4">Certificate ID</th>
                    <th className="py-3 px-4">PDF Status</th>
                    <th className="py-3 px-4">Email Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-foundation-slate/60">
                  {recipients.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-typo-gray">
                        No participants found matching the current filters.
                      </td>
                    </tr>
                  ) : (
                    recipients.map((r) => (
                      <tr key={r._id} className="hover:bg-foundation-space/30 transition-colors">
                        <td className="py-3 px-4 font-mono text-typo-gray">{r.sourceRowNumber}</td>
                        <td className="py-3 px-4 font-semibold text-typo-white">{r.participantName}</td>
                        <td className="py-3 px-4 text-typo-gray">{r.email}</td>
                        <td className="py-3 px-4 font-mono">
                          <button
                            onClick={() => copyToClipboard(r.certificateId)}
                            className="inline-flex items-center gap-1 hover:text-brand-cyan text-typo-white/90"
                            title="Click to copy ID"
                          >
                            <span>{r.certificateId}</span>
                            {copiedCertId === r.certificateId ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3 text-typo-gray" />
                            )}
                          </button>
                        </td>

                        <td className="py-3 px-4">
                          {r.generationStatus === "generated" ? (
                            <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                              <CheckCircle2 className="w-3 h-3" /> Ready
                            </span>
                          ) : r.generationStatus === "generating" ? (
                            <span className="inline-flex items-center gap-1 text-amber-400 font-medium animate-pulse">
                              <Loader2 className="w-3 h-3 animate-spin" /> Generating
                            </span>
                          ) : r.generationStatus === "failed" ? (
                            <span className="inline-flex items-center gap-1 text-rose-400 font-medium" title={r.generationError}>
                              <XCircle className="w-3 h-3" /> Failed
                            </span>
                          ) : (
                            <span className="text-typo-gray">Pending</span>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          {r.emailStatus === "sent" ? (
                            <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                              <CheckCircle2 className="w-3 h-3" /> Sent ({formatDateIST(r.sentAt || "")})
                            </span>
                          ) : r.emailStatus === "sending" ? (
                            <span className="inline-flex items-center gap-1 text-amber-400 font-medium animate-pulse">
                              <Loader2 className="w-3 h-3 animate-spin" /> Sending
                            </span>
                          ) : r.emailStatus === "failed" ? (
                            <span className="inline-flex items-center gap-1 text-rose-400 font-medium" title={r.lastEmailError}>
                              <XCircle className="w-3 h-3" /> Failed (Attempt {r.emailAttempts})
                            </span>
                          ) : (
                            <span className="text-typo-gray">Pending</span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right space-x-1">
                          <button
                            onClick={() => setPreviewRecipient(r)}
                            className="p-1 rounded bg-foundation-space border border-foundation-slate hover:border-brand-cyan text-typo-gray hover:text-brand-cyan"
                            title="Preview Certificate"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <a
                            href={`/api/admin/certificates/recipients/${r._id}/download`}
                            download
                            className="inline-block p-1 rounded bg-foundation-space border border-foundation-slate hover:border-brand-blue text-typo-gray hover:text-white"
                            title="Download Certificate PDF"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-3 border-t border-foundation-slate/70 flex items-center justify-between text-xs text-typo-gray">
                <span>Page {page} of {totalPages}</span>
                <div className="flex gap-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="p-1 rounded bg-foundation-space border border-foundation-slate disabled:opacity-50"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="p-1 rounded bg-foundation-space border border-foundation-slate disabled:opacity-50"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Send Test Email Modal */}
      {isTestEmailOpen && (
        <AdminModal
          isOpen={isTestEmailOpen}
          onClose={() => setIsTestEmailOpen(false)}
          title="Send Sample Test Certificate Email"
        >
          <div className="space-y-4 text-sm">
            <p className="text-typo-gray">
              Dispatch a test email with an on-the-fly rendered personalized certificate attachment to verify formatting, layout, and deliverability.
            </p>

            <div>
              <label className="block text-xs font-semibold text-typo-gray uppercase mb-1">
                Recipient Email Address
              </label>
              <input
                type="email"
                placeholder="your.email@example.com"
                value={testEmailAddress}
                onChange={(e) => setTestEmailAddress(e.target.value)}
                className="w-full px-3 py-2 bg-foundation-space border border-foundation-slate rounded-xl text-typo-white text-sm"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-foundation-slate/60">
              <button
                type="button"
                onClick={() => setIsTestEmailOpen(false)}
                className="px-4 py-2 rounded-xl text-xs bg-foundation-space border border-foundation-slate text-typo-gray"
              >
                Cancel
              </button>
              <Button
                disabled={isSendingTest}
                onClick={handleSendTestEmail}
                className="bg-brand-blue text-white text-xs"
              >
                {isSendingTest ? "Sending Test..." : "Send Test Now"}
              </Button>
            </div>
          </div>
        </AdminModal>
      )}

      {/* Certificate Preview Modal */}
      {previewRecipient && (
        <AdminModal
          isOpen={!!previewRecipient}
          onClose={() => setPreviewRecipient(null)}
          title={`Certificate Preview — ${previewRecipient.participantName}`}
        >
          <div className="space-y-4">
            <div className="w-full aspect-[842/595] rounded-xl overflow-hidden bg-slate-900 border border-foundation-slate shadow-inner">
              <iframe
                src={`/api/admin/certificates/batches/${batchId}/preview?recipientId=${previewRecipient._id}`}
                className="w-full h-full border-0"
                title="Certificate PDF Preview"
              />
            </div>

            <div className="flex justify-between items-center text-xs text-typo-gray pt-2">
              <span>Certificate ID: <strong className="text-brand-cyan">{previewRecipient.certificateId}</strong></span>
              <a
                href={`/api/admin/certificates/recipients/${previewRecipient._id}/download`}
                download
                className="px-3 py-1.5 rounded-lg bg-brand-blue text-white font-medium inline-flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" /> Download PDF
              </a>
            </div>
          </div>
        </AdminModal>
      )}
    </div>
  );
}
