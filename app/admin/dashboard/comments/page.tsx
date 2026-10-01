"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  MessageSquare,
  Clock,
  Trash2,
  CornerDownRight,
  Send,
  Filter,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  Search,
  Flag,
  Heart,
  MessageCircle,
  FileText,
  AlertTriangle,
  ArrowUpDown,
} from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { formatEventDate } from "@/lib/utils/event-status";

interface CommentItem {
  _id: string;
  blogId: string;
  blogSlug: string;
  blogTitle: string;
  parentId: string | null;
  parentAuthor: string | null;
  parentBodySnippet: string | null;
  replyCount: number;
  name: string;
  email: string;
  body: string;
  likesCount: number;
  reportsCount: number;
  isDeleted: boolean;
  status: string;
  adminReply: string;
  createdAt: string;
  updatedAt: string;
}

interface BlogOption {
  slug: string;
  title: string;
}

export default function AdminCommentsPage() {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [blogs, setBlogs] = useState<BlogOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [selectedBlog, setSelectedBlog] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all"); // "all" | "roots" | "replies" | "reported"
  const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest");
  const [searchQuery, setSearchQuery] = useState("");

  // Actions
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<CommentItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchComments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (selectedBlog !== "all") params.set("blogSlug", selectedBlog);
      if (typeFilter !== "all") params.set("type", typeFilter);
      params.set("sort", sortBy);
      if (searchQuery.trim()) params.set("search", searchQuery.trim());

      const res = await fetch(`/api/admin/comments?${params.toString()}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setComments(data.data || []);
        if (Array.isArray(data.blogs)) {
          setBlogs(data.blogs);
        }
      } else {
        setError(data.error || "Failed to load comments.");
      }
    } catch {
      setError("Network error connecting to moderation service.");
    } finally {
      setLoading(false);
    }
  }, [selectedBlog, typeFilter, sortBy, searchQuery]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // Execute deletion
  const confirmDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/comments/${deleteTarget._id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        // If it was a parent comment, also remove any child replies from local state
        setComments((prev) =>
          prev.filter(
            (c) => c._id !== deleteTarget._id && c.parentId !== deleteTarget._id
          )
        );
        setDeleteTarget(null);
      } else {
        alert(data.error || "Failed to delete comment.");
      }
    } catch {
      alert("Network error: Could not delete comment.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Save admin editorial reply
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

  const reportedCount = comments.filter((c) => c.reportsCount > 0).length;

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-foundation-darkest">
      <AdminHeader
        title="Comment Moderation"
        subtitle="Manage public remarks, nested discussion threads, and inappropriate content"
      />

      <main className="flex-1 p-4 sm:p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Controls Toolbar: Search, Filters, Sort, Refresh */}
        <div className="flex flex-col gap-4 bg-foundation-dark p-4 sm:p-5 rounded-2xl border border-foundation-slate/80">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-typo-gray" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by author name, email, or comment keywords..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-foundation-slate/40 border border-foundation-slate/80 text-xs text-typo-white placeholder:text-typo-gray focus:outline-none focus:border-brand-cyan transition-all"
              />
            </div>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={fetchComments}
              disabled={loading}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-foundation-slate/40 hover:bg-foundation-slate text-brand-cyan border border-foundation-slate/80 text-xs font-mono transition-all disabled:opacity-50 shrink-0"
              title="Refresh comments"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-foundation-slate/60 text-xs">
            {/* Filter by Type */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-mono text-typo-gray uppercase mr-1 flex items-center gap-1">
                <Filter className="w-3 h-3 text-brand-cyan" /> Type:
              </span>
              {[
                { id: "all", label: "All Remarks" },
                { id: "roots", label: "Root Comments" },
                { id: "replies", label: "Replies" },
                {
                  id: "reported",
                  label: "Reported",
                  badge: reportedCount > 0 ? reportedCount : undefined,
                },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setTypeFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-lg font-mono transition-all flex items-center gap-1.5 ${
                    typeFilter === tab.id
                      ? "bg-brand-blue text-white shadow-sm font-semibold"
                      : "bg-foundation-slate/40 text-typo-gray hover:text-typo-white hover:bg-foundation-slate/70"
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500 text-white">
                      {tab.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Filter by Blog & Sort by Date */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Blog dropdown */}
              <div className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-brand-cyan" />
                <select
                  value={selectedBlog}
                  onChange={(e) => setSelectedBlog(e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-foundation-slate/40 border border-foundation-slate/80 text-xs font-mono text-typo-white focus:outline-none focus:border-brand-cyan"
                >
                  <option value="all">All Blog Articles</option>
                  {blogs.map((b) => (
                    <option key={b.slug} value={b.slug}>
                      {b.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort Order */}
              <div className="flex items-center gap-1.5">
                <ArrowUpDown className="w-3.5 h-3.5 text-brand-cyan" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as "newest" | "oldest")}
                  className="px-3 py-1.5 rounded-lg bg-foundation-slate/40 border border-foundation-slate/80 text-xs font-mono text-typo-white focus:outline-none focus:border-brand-cyan"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Comments Feed */}
        {loading && comments.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <RefreshCw className="w-6 h-6 text-brand-cyan animate-spin mx-auto" />
            <p className="text-xs font-mono text-typo-gray">Loading comment archives...</p>
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-16 bg-foundation-dark/40 rounded-2xl border border-foundation-slate/60 p-8 space-y-3">
            <MessageSquare className="w-8 h-8 text-slate-600 mx-auto" />
            <h3 className="font-display text-sm font-semibold text-typo-white">
              No remarks found
            </h3>
            <p className="text-xs text-typo-gray max-w-sm mx-auto">
              {searchQuery
                ? "No comments matched your search query."
                : typeFilter === "reported"
                ? "All clear! No comments have been flagged for review."
                : "No comments match the selected filters."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => {
              const isActioning = actionLoading === comment._id;
              const isReplying = activeReplyId === comment._id;
              const draftReply =
                replyDrafts[comment._id] !== undefined
                  ? replyDrafts[comment._id]
                  : comment.adminReply || "";
              const isReply = !!comment.parentId;

              return (
                <div
                  key={comment._id}
                  className={`p-5 rounded-2xl border transition-all ${
                    comment.reportsCount > 0
                      ? "bg-rose-950/20 border-rose-500/40"
                      : isReply
                      ? "bg-foundation-dark/80 border-foundation-slate/70 ml-0 sm:ml-6"
                      : "bg-foundation-dark border-foundation-slate/80"
                  }`}
                >
                  {/* Top Bar: Author Name, Email, Date, Badges & Article Link */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-foundation-slate/60 text-xs">
                    <div className="flex flex-wrap items-center gap-2">
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

                      {/* Comment type badge */}
                      {isReply ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/10 text-brand-cyan border border-brand-cyan/30">
                          <CornerDownRight className="w-3 h-3" />
                          <span>Reply to @{comment.parentAuthor || "Author"}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300">
                          Root Comment
                        </span>
                      )}

                      {/* Reports Badge */}
                      {comment.reportsCount > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold">
                          <Flag className="w-3 h-3" />
                          <span>{comment.reportsCount} report(s)</span>
                        </span>
                      )}

                      {/* Likes count */}
                      {comment.likesCount > 0 && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-400">
                          <Heart className="w-3 h-3 text-rose-400 fill-rose-400" />
                          <span>{comment.likesCount}</span>
                        </span>
                      )}

                      {/* Reply count for roots */}
                      {!isReply && comment.replyCount > 0 && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono text-brand-cyan">
                          <MessageCircle className="w-3 h-3" />
                          <span>
                            {comment.replyCount} {comment.replyCount === 1 ? "reply" : "replies"}
                          </span>
                        </span>
                      )}
                    </div>

                    {/* Blog Link */}
                    <Link
                      href={`/blog/${comment.blogSlug}`}
                      target="_blank"
                      className="inline-flex items-center gap-1 text-[11px] font-mono text-brand-cyan hover:underline pl-2 border-l border-foundation-slate/80"
                      title="View published article"
                    >
                      <span className="max-w-[180px] truncate">{comment.blogTitle}</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>

                  {/* If this is a reply, show small quote of parent comment */}
                  {isReply && comment.parentBodySnippet && (
                    <div className="mt-2.5 px-3 py-1.5 rounded-lg bg-slate-950/40 border-l-2 border-brand-cyan/40 text-xs font-sans text-slate-400 italic">
                      In response to: &ldquo;{comment.parentBodySnippet}&rdquo;
                    </div>
                  )}

                  {/* Comment Body */}
                  <div className="py-3 text-sm text-slate-200 whitespace-pre-wrap break-words leading-relaxed font-sans">
                    {comment.body}
                  </div>

                  {/* Existing Admin Reply Box */}
                  {comment.adminReply && !isReplying && (
                    <div className="my-2 p-3.5 rounded-xl bg-foundation-slate/50 border border-brand-blue/30 text-xs space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-mono text-brand-cyan">
                        <span className="flex items-center gap-1.5 font-bold">
                          <CornerDownRight className="w-3.5 h-3.5" />
                          IEDC TKIET Official Editorial Reply:
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
                        placeholder="Write official response from IEDC TKIET editorial team..."
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

                  {/* Actions Toolbar: Reply as Admin & Delete Button */}
                  <div className="pt-3 border-t border-foundation-slate/60 flex items-center justify-between gap-3">
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
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-foundation-slate/50 hover:bg-foundation-slate text-brand-cyan text-xs font-mono transition-all"
                      >
                        <CornerDownRight className="w-3.5 h-3.5" />
                        <span>Reply as Admin</span>
                      </button>
                    )}

                    <div className="ml-auto">
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(comment)}
                        disabled={isActioning}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/30 text-xs font-mono transition-all"
                        title="Delete comment"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="w-full max-w-md bg-foundation-dark border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center gap-3 text-rose-400">
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h3 className="font-display text-base font-bold text-white">
                  Confirm Remark Deletion
                </h3>
              </div>

              <div className="space-y-2 text-xs text-slate-300">
                <p>
                  Are you sure you want to permanently delete this comment by{" "}
                  <strong className="text-white">{deleteTarget.name}</strong>?
                </p>

                {deleteTarget.replyCount > 0 && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px]">
                    <strong>Warning:</strong> This comment has{" "}
                    <strong>{deleteTarget.replyCount}</strong> reply thread(s).
                    Deleting it will also delete all of its nested replies.
                  </div>
                )}

                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 italic text-slate-400 line-clamp-3">
                  &ldquo;{deleteTarget.body}&rdquo;
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  disabled={isDeleting}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-mono font-bold shadow-md shadow-rose-600/20 transition-all disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isDeleting ? "Deleting..." : "Permanently Delete"}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
