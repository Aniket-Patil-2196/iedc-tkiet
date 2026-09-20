"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  MessageSquare,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  CornerDownRight,
  Send,
  Filter,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  Search,
} from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { formatEventDate } from "@/lib/utils/event-status";

interface CommentItem {
  _id: string;
  blogId: string;
  blogSlug: string;
  blogTitle: string;
  name: string;
  email: string;
  body: string;
  status: "pending" | "approved" | "rejected";
  adminReply: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdminCommentsPage() {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);

  const fetchComments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url =
        statusFilter === "all"
          ? "/api/admin/comments"
          : `/api/admin/comments?status=${statusFilter}`;
      const res = await fetch(url, { cache: "no-store" });
      const data = await res.json();
      if (res.ok && data.success) {
        setComments(data.data || []);
      } else {
        setError(data.error || "Failed to load comments.");
      }
    } catch {
      setError("Network error while connecting to moderation service.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleStatusChange = async (
    id: string,
    newStatus: "approved" | "rejected" | "pending"
  ) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/comments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setComments((prev) =>
          prev.map((c) => (c._id === id ? { ...c, status: newStatus } : c))
        );
      } else {
        alert(data.error || "Failed to update comment status.");
      }
    } catch {
      alert("Network error: Could not update comment.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this comment?")) {
      return;
    }
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/comments/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setComments((prev) => prev.filter((c) => c._id !== id));
      } else {
        alert(data.error || "Failed to delete comment.");
      }
    } catch {
      alert("Network error: Could not delete comment.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleSaveReply = async (id: string) => {
    const replyText = replyDrafts[id] !== undefined ? replyDrafts[id] : "";
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/comments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminReply: replyText }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setComments((prev) =>
          prev.map((c) => (c._id === id ? { ...c, adminReply: replyText } : c))
        );
        setActiveReplyId(null);
      } else {
        alert(data.error || "Failed to save admin reply.");
      }
    } catch {
      alert("Network error: Could not save admin reply.");
    } finally {
      setActionLoading(null);
    }
  };

  const filteredComments = comments.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.body.toLowerCase().includes(q) ||
      c.blogTitle.toLowerCase().includes(q)
    );
  });

  const pendingCount = comments.filter((c) => c.status === "pending").length;

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-foundation-darkest">
      <AdminHeader
        title="Comment Moderation"
        subtitle="Review, approve, reject, or reply to public reader comments"
      />

      <main className="flex-1 p-4 sm:p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Top Controls: Filter Pills, Search Bar, Refresh */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-foundation-dark p-4 rounded-2xl border border-foundation-slate/80">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono text-typo-gray uppercase mr-1 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-brand-cyan" /> Status:
            </span>
            {[
              { id: "all", label: "All" },
              { id: "pending", label: "Pending", count: pendingCount },
              { id: "approved", label: "Approved" },
              { id: "rejected", label: "Rejected" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 ${
                  statusFilter === tab.id
                    ? "bg-brand-blue text-white shadow-sm"
                    : "bg-foundation-slate/40 text-typo-gray hover:text-typo-white hover:bg-foundation-slate/70"
                }`}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <div className="relative flex-1 md:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-typo-gray" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search author, email, body..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-foundation-slate/40 border border-foundation-slate/80 text-xs text-typo-white placeholder:text-typo-gray focus:outline-none focus:border-brand-cyan"
              />
            </div>
            <button
              type="button"
              onClick={fetchComments}
              disabled={loading}
              className="p-2 rounded-xl bg-foundation-slate/40 hover:bg-foundation-slate text-brand-cyan border border-foundation-slate/80 transition-all disabled:opacity-50"
              title="Refresh comments"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Comments List */}
        {loading && comments.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <RefreshCw className="w-6 h-6 text-brand-cyan animate-spin mx-auto" />
            <p className="text-xs font-mono text-typo-gray">Loading comment archives...</p>
          </div>
        ) : filteredComments.length === 0 ? (
          <div className="text-center py-16 bg-foundation-dark/40 rounded-2xl border border-foundation-slate/60 p-8 space-y-3">
            <MessageSquare className="w-8 h-8 text-slate-600 mx-auto" />
            <h3 className="font-display text-sm font-semibold text-typo-white">
              No comments found
            </h3>
            <p className="text-xs text-typo-gray max-w-sm mx-auto">
              {searchQuery
                ? "No comments matched your search query."
                : statusFilter === "pending"
                ? "All caught up! No pending comments awaiting moderation."
                : "No comments have been posted yet."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredComments.map((comment) => {
              const isActioning = actionLoading === comment._id;
              const isReplying = activeReplyId === comment._id;
              const draftReply =
                replyDrafts[comment._id] !== undefined
                  ? replyDrafts[comment._id]
                  : comment.adminReply || "";

              return (
                <div
                  key={comment._id}
                  className={`p-5 rounded-2xl border transition-all ${
                    comment.status === "pending"
                      ? "bg-amber-950/10 border-amber-500/30"
                      : comment.status === "rejected"
                      ? "bg-rose-950/10 border-rose-500/20 opacity-75"
                      : "bg-foundation-dark border-foundation-slate/80"
                  }`}
                >
                  {/* Comment Top Meta Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-foundation-slate/60 text-xs">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="font-sans font-bold text-typo-white">
                        {comment.name}
                      </span>
                      <span className="font-mono text-[11px] text-typo-gray">
                        &lt;{comment.email}&gt;
                      </span>
                      <span className="text-slate-600">·</span>
                      <span className="font-mono text-[11px] text-typo-gray">
                        {formatEventDate(comment.createdAt)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Status Tag */}
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono uppercase tracking-wider font-semibold ${
                          comment.status === "approved"
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : comment.status === "rejected"
                            ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                            : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                        }`}
                      >
                        {comment.status === "approved" && (
                          <CheckCircle2 className="w-3 h-3" />
                        )}
                        {comment.status === "rejected" && (
                          <XCircle className="w-3 h-3" />
                        )}
                        {comment.status === "pending" && (
                          <Clock className="w-3 h-3" />
                        )}
                        <span>{comment.status}</span>
                      </span>

                      {/* Article link */}
                      <Link
                        href={`/blog/${comment.blogSlug}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 text-[11px] font-mono text-brand-cyan hover:underline pl-2 border-l border-foundation-slate/80"
                        title="View published article"
                      >
                        <span className="max-w-[140px] truncate">
                          {comment.blogTitle}
                        </span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>

                  {/* Comment Body Text */}
                  <div className="py-3 text-sm text-slate-200 whitespace-pre-wrap break-words leading-relaxed font-sans">
                    {comment.body}
                  </div>

                  {/* Existing Admin Reply Box */}
                  {comment.adminReply && !isReplying && (
                    <div className="my-2 p-3.5 rounded-xl bg-foundation-slate/50 border border-brand-blue/30 text-xs space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-mono text-brand-cyan">
                        <span className="flex items-center gap-1.5 font-bold">
                          <CornerDownRight className="w-3.5 h-3.5" />
                          IEDC TKIET Official Admin Reply:
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveReplyId(comment._id);
                            setReplyDrafts((prev) => ({
                              ...prev,
                              [comment._id]: comment.adminReply,
                            }));
                          }}
                          className="hover:underline text-typo-gray hover:text-white"
                        >
                          Edit Reply
                        </button>
                      </div>
                      <p className="text-slate-300 whitespace-pre-wrap pl-5">
                        {comment.adminReply}
                      </p>
                    </div>
                  )}

                  {/* Admin Reply Composer Form */}
                  {isReplying && (
                    <div className="my-3 p-3.5 rounded-xl bg-slate-900 border border-brand-cyan/40 space-y-2">
                      <span className="block text-[11px] font-mono text-brand-cyan uppercase">
                        Official Response to {comment.name}:
                      </span>
                      <textarea
                        value={draftReply}
                        onChange={(e) =>
                          setReplyDrafts((prev) => ({
                            ...prev,
                            [comment._id]: e.target.value,
                          }))
                        }
                        placeholder="Write official response from IEDC TKIET team..."
                        rows={3}
                        maxLength={1000}
                        className="w-full p-2.5 rounded-lg bg-foundation-dark border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-cyan resize-none"
                      />
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] font-mono text-typo-gray">
                          {1000 - draftReply.length} chars left
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setActiveReplyId(null)}
                            className="px-3 py-1 rounded-lg text-xs font-mono text-typo-gray hover:text-white"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveReply(comment._id)}
                            disabled={isActioning}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-brand-blue hover:bg-blue-600 text-white text-xs font-mono font-bold shadow transition-all disabled:opacity-50"
                          >
                            <Send className="w-3 h-3" />
                            <span>Save Reply</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Actions Toolbar */}
                  <div className="pt-3 border-t border-foundation-slate/60 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {comment.status !== "approved" && (
                        <button
                          type="button"
                          onClick={() => handleStatusChange(comment._id, "approved")}
                          disabled={isActioning}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-semibold transition-all disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Approve & Publish</span>
                        </button>
                      )}

                      {comment.status !== "rejected" && (
                        <button
                          type="button"
                          onClick={() => handleStatusChange(comment._id, "rejected")}
                          disabled={isActioning}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-xs font-mono font-semibold transition-all disabled:opacity-50"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      )}

                      {comment.status !== "pending" && (
                        <button
                          type="button"
                          onClick={() => handleStatusChange(comment._id, "pending")}
                          disabled={isActioning}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition-all disabled:opacity-50"
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>Reset to Pending</span>
                        </button>
                      )}

                      {!isReplying && !comment.adminReply && (
                        <button
                          type="button"
                          onClick={() => {
                            setActiveReplyId(comment._id);
                            setReplyDrafts((prev) => ({
                              ...prev,
                              [comment._id]: "",
                            }));
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-foundation-slate/50 hover:bg-foundation-slate text-brand-cyan text-xs font-mono transition-all"
                        >
                          <CornerDownRight className="w-3.5 h-3.5" />
                          <span>Reply as Admin</span>
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDelete(comment._id)}
                      disabled={isActioning}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors ml-auto"
                      title="Permanently delete comment"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
