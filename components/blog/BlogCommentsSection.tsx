"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  MessageSquare,
  Send,
  Heart,
  Reply as ReplyIcon,
  Trash2,
  Flag,
  ChevronDown,
  ChevronUp,
  Clock,
  AlertCircle,
  CheckCircle2,
  Lock,
  CornerDownRight,
  MoreVertical,
  X,
  Share2,
} from "lucide-react";

export interface CommentData {
  _id: string;
  parentId: string | null;
  replyToUser: string | null;
  name: string;
  body: string;
  likesCount: number;
  isDeleted: boolean;
  createdAt: string;
  adminReply?: string | null;
}

interface BlogCommentsSectionProps {
  blogSlug: string;
  blogTitle?: string;
}

// Deterministic vibrant avatar gradient based on author name
function getAvatarGradient(name: string): string {
  const gradients = [
    "from-blue-600 to-cyan-500",
    "from-purple-600 to-pink-500",
    "from-emerald-600 to-teal-400",
    "from-amber-600 to-orange-400",
    "from-indigo-600 to-blue-400",
    "from-rose-600 to-red-400",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % gradients.length;
  return gradients[index];
}

// Relative humanized time helper (e.g. "Just now", "5m ago", "2h ago", "3d ago")
function formatRelativeTime(dateString: string): string {
  try {
    const now = Date.now();
    const past = new Date(dateString).getTime();
    const diffSeconds = Math.floor((now - past) / 1000);

    if (diffSeconds < 60) return "Just now";
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) return `${diffDays}d ago`;
    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths < 12) return `${diffMonths}mo ago`;
    return `${Math.floor(diffDays / 365)}y ago`;
  } catch {
    return "Recently";
  }
}

export function BlogCommentsSection({ blogSlug, blogTitle }: BlogCommentsSectionProps) {
  const [comments, setComments] = useState<CommentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Top-level comment composer state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [body, setBody] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [formLoadedAt] = useState(() => Date.now());

  // Local likes tracking
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  // Author tokens tracking: commentId -> authorToken
  const [authorTokens, setAuthorTokens] = useState<Record<string, string>>({});
  // Replying state: ID of the comment being replied to
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [replyingSubmitting, setReplyingSubmitting] = useState(false);
  const [replyFeedback, setReplyFeedback] = useState<string | null>(null);

  // Collapsed reply threads: set of parent comment IDs whose replies are collapsed
  const [collapsedThreads, setCollapsedThreads] = useState<Set<string>>(new Set());
  // Active action menu
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Load saved commenter info, liked comments, and author tokens from localStorage
  useEffect(() => {
    try {
      const savedName = localStorage.getItem("iedc_commenter_name");
      const savedEmail = localStorage.getItem("iedc_commenter_email");
      if (savedName) setName(savedName);
      if (savedEmail) setEmail(savedEmail);

      const savedLikes = localStorage.getItem("iedc_liked_comments");
      if (savedLikes) {
        setLikedIds(new Set(JSON.parse(savedLikes)));
      }

      const savedTokens = localStorage.getItem("iedc_comment_tokens");
      if (savedTokens) {
        setAuthorTokens(JSON.parse(savedTokens));
      }
    } catch {}
  }, []);

  // Fetch comments for this blog
  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/blogs/${encodeURIComponent(blogSlug)}/comments`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.data)) {
        setComments(data.data);
        if (Array.isArray(data.likedCommentIds)) {
          setLikedIds((prev) => {
            const next = new Set(prev);
            data.likedCommentIds.forEach((id: string) => next.add(id));
            try {
              localStorage.setItem("iedc_liked_comments", JSON.stringify(Array.from(next)));
            } catch {}
            return next;
          });
        }
      }
    } catch {
      // Non-critical network error
    } finally {
      setLoading(false);
    }
  }, [blogSlug]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // Save liked IDs to localStorage
  const saveLikesToStorage = (newLikes: Set<string>) => {
    try {
      localStorage.setItem("iedc_liked_comments", JSON.stringify(Array.from(newLikes)));
    } catch {}
  };

  // Save author token
  const saveAuthorToken = (commentId: string, token: string) => {
    setAuthorTokens((prev) => {
      const next = { ...prev, [commentId]: token };
      try {
        localStorage.setItem("iedc_comment_tokens", JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // Organize comments into root comments and nested replies map
  const { rootComments, repliesMap } = useMemo(() => {
    const roots: CommentData[] = [];
    const replies: Record<string, CommentData[]> = {};

    comments.forEach((c) => {
      if (!c.parentId) {
        roots.push(c);
      } else {
        if (!replies[c.parentId]) {
          replies[c.parentId] = [];
        }
        replies[c.parentId].push(c);
      }
    });

    return { rootComments: roots, repliesMap: replies };
  }, [comments]);

  // Handle top-level comment submission
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setFeedback(null);

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedBody = body.trim();

    if (!trimmedName || trimmedName.length < 2) {
      setFeedback({ type: "error", message: "Please enter your name (at least 2 characters)." });
      return;
    }
    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      setFeedback({ type: "error", message: "Please enter a valid email address." });
      return;
    }
    if (!trimmedBody || trimmedBody.length < 3) {
      setFeedback({ type: "error", message: "Please enter a comment (at least 3 characters)." });
      return;
    }

    setSubmitting(true);
    try {
      // Save name/email for future comments
      try {
        localStorage.setItem("iedc_commenter_name", trimmedName);
        localStorage.setItem("iedc_commenter_email", trimmedEmail);
      } catch {}

      const res = await fetch(`/api/blogs/${encodeURIComponent(blogSlug)}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          email: trimmedEmail,
          body: trimmedBody,
          website: honeypot,
          formLoadedAt,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.data) {
        // Immediate UI update without page refresh!
        const newComment: CommentData = {
          _id: data.data._id,
          parentId: null,
          replyToUser: null,
          name: data.data.name,
          body: data.data.body,
          likesCount: 0,
          isDeleted: false,
          createdAt: data.data.createdAt || new Date().toISOString(),
          adminReply: null,
        };

        setComments((prev) => [...prev, newComment]);
        if (data.authorToken) {
          saveAuthorToken(data.data._id, data.authorToken);
        }

        setBody("");
        setFeedback({
          type: "success",
          message: "Your remark has been published!",
        });
        setTimeout(() => setFeedback(null), 5000);
      } else {
        setFeedback({
          type: "error",
          message: data.error || "Unable to submit remark. Please try again.",
        });
      }
    } catch {
      setFeedback({
        type: "error",
        message: "Network error. Please check your connection and try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle reply submission
  const handleReplySubmit = async (parentId: string, replyToName: string) => {
    const trimmedBody = replyBody.trim();
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName || trimmedName.length < 2) {
      setReplyFeedback("Please enter your name at the top form first.");
      return;
    }
    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      setReplyFeedback("Please enter a valid email at the top form first.");
      return;
    }
    if (!trimmedBody || trimmedBody.length < 3) {
      setReplyFeedback("Please enter a reply (at least 3 characters).");
      return;
    }

    setReplyingSubmitting(true);
    setReplyFeedback(null);
    try {
      const res = await fetch(`/api/blogs/${encodeURIComponent(blogSlug)}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          email: trimmedEmail,
          body: trimmedBody,
          parentId,
          replyToUser: replyToName,
          formLoadedAt,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.data) {
        const newReply: CommentData = {
          _id: data.data._id,
          parentId,
          replyToUser: replyToName,
          name: data.data.name,
          body: data.data.body,
          likesCount: 0,
          isDeleted: false,
          createdAt: data.data.createdAt || new Date().toISOString(),
          adminReply: null,
        };

        // Immediately insert reply
        setComments((prev) => [...prev, newReply]);
        if (data.authorToken) {
          saveAuthorToken(data.data._id, data.authorToken);
        }

        // Expand thread if collapsed
        setCollapsedThreads((prev) => {
          const next = new Set(prev);
          next.delete(parentId);
          return next;
        });

        setReplyBody("");
        setActiveReplyId(null);
      } else {
        setReplyFeedback(data.error || "Failed to post reply.");
      }
    } catch {
      setReplyFeedback("Network error. Please try again.");
    } finally {
      setReplyingSubmitting(false);
    }
  };

  // Handle like / unlike toggle
  const handleToggleLike = async (commentId: string) => {
    const isLiked = likedIds.has(commentId);

    // Optimistic UI update
    setLikedIds((prev) => {
      const next = new Set(prev);
      if (isLiked) {
        next.delete(commentId);
      } else {
        next.add(commentId);
      }
      saveLikesToStorage(next);
      return next;
    });

    setComments((prev) =>
      prev.map((c) =>
        c._id === commentId
          ? { ...c, likesCount: Math.max(0, c.likesCount + (isLiked ? -1 : 1)) }
          : c
      )
    );

    try {
      const res = await fetch(
        `/api/blogs/${encodeURIComponent(blogSlug)}/comments/${commentId}/like`,
        { method: "POST" }
      );
      const data = await res.json();
      if (res.ok && data.success) {
        setComments((prev) =>
          prev.map((c) =>
            c._id === commentId ? { ...c, likesCount: data.likesCount } : c
          )
        );
      } else {
        // Rollback on server error
        setLikedIds((prev) => {
          const next = new Set(prev);
          if (isLiked) next.add(commentId);
          else next.delete(commentId);
          saveLikesToStorage(next);
          return next;
        });
        setComments((prev) =>
          prev.map((c) =>
            c._id === commentId
              ? { ...c, likesCount: Math.max(0, c.likesCount + (isLiked ? 1 : -1)) }
              : c
          )
        );
      }
    } catch {
      // Rollback on network failure
      setLikedIds((prev) => {
        const next = new Set(prev);
        if (isLiked) next.add(commentId);
        else next.delete(commentId);
        saveLikesToStorage(next);
        return next;
      });
      setComments((prev) =>
        prev.map((c) =>
          c._id === commentId
            ? { ...c, likesCount: Math.max(0, c.likesCount + (isLiked ? 1 : -1)) }
            : c
        )
      );
    }
  };

  // Handle author comment deletion
  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("Are you sure you want to delete this remark?")) {
      return;
    }

    const token = authorTokens[commentId] || "";

    try {
      const res = await fetch(
        `/api/blogs/${encodeURIComponent(blogSlug)}/comments/${commentId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ authorToken: token }),
        }
      );

      const data = await res.json();
      if (res.ok && data.success) {
        if (data.softDeleted) {
          setComments((prev) =>
            prev.map((c) =>
              c._id === commentId
                ? {
                    ...c,
                    isDeleted: true,
                    name: "[deleted]",
                    body: "[This comment was deleted by the author]",
                  }
                : c
            )
          );
        } else {
          setComments((prev) => prev.filter((c) => c._id !== commentId));
        }
        setOpenMenuId(null);
      } else {
        alert(data.error || "Could not delete comment.");
      }
    } catch {
      alert("Network error: Could not delete comment.");
    }
  };

  // Handle report comment
  const handleReportComment = async (commentId: string) => {
    try {
      const res = await fetch(
        `/api/blogs/${encodeURIComponent(blogSlug)}/comments/${commentId}/report`,
        { method: "POST" }
      );
      const data = await res.json();
      if (res.ok && data.success) {
        alert("Thank you. This remark has been reported for editorial review.");
        setOpenMenuId(null);
      }
    } catch {
      alert("Network error while reporting remark.");
    }
  };

  // Toggle thread expansion
  const toggleThreadCollapse = (parentId: string) => {
    setCollapsedThreads((prev) => {
      const next = new Set(prev);
      if (next.has(parentId)) next.delete(parentId);
      else next.add(parentId);
      return next;
    });
  };

  // Helper to render an individual comment card
  const renderCommentCard = (comment: CommentData, isReply = false) => {
    const isLiked = likedIds.has(comment._id);
    const isAuthor = !!authorTokens[comment._id];
    const isMenuOpen = openMenuId === comment._id;
    const replies = repliesMap[comment._id] || [];
    const hasReplies = replies.length > 0;
    const isThreadCollapsed = collapsedThreads.has(comment._id);
    const isReplyingToThis = activeReplyId === comment._id;

    return (
      <div
        key={comment._id}
        className={`group relative transition-all rounded-2xl ${
          isReply
            ? "mt-3 bg-foundation-dark/60 border border-slate-800/80 p-3.5 sm:p-4 hover:border-slate-700/80"
            : "bg-gradient-to-b from-foundation-dark/95 to-foundation-slate/20 border border-slate-800 p-4 sm:p-5 shadow-sm hover:border-slate-700"
        }`}
      >
        {/* Header: Avatar, Name, Relative Date, Options */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Avatar with deterministic initials */}
            <div
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr ${getAvatarGradient(
                comment.name
              )} flex items-center justify-center text-xs font-mono font-bold text-white shadow-sm shrink-0`}
            >
              {comment.name ? comment.name.charAt(0).toUpperCase() : "U"}
            </div>

            <div className="min-w-0 flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <span className="font-sans font-semibold text-xs sm:text-sm text-white truncate">
                {comment.name}
              </span>

              {/* Reply-to Badge */}
              {comment.replyToUser && (
                <span className="inline-flex items-center gap-1 text-[11px] font-mono text-brand-cyan/90 bg-brand-cyan/10 px-1.5 py-0.2 rounded">
                  <CornerDownRight className="w-3 h-3 shrink-0" />
                  <span>@{comment.replyToUser}</span>
                </span>
              )}

              <span className="text-slate-600 text-xs">·</span>

              <span
                className="font-mono text-[11px] text-slate-400 shrink-0"
                title={new Date(comment.createdAt).toLocaleString()}
              >
                {formatRelativeTime(comment.createdAt)}
              </span>
            </div>
          </div>

          {/* Action Menu (Report / Delete) */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setOpenMenuId(isMenuOpen ? null : comment._id)}
              className="p-1 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800/60 transition-colors"
              title="More actions"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 top-full mt-1 w-36 py-1 rounded-xl bg-foundation-dark border border-slate-700 shadow-xl z-20 text-xs font-mono">
                {isAuthor && !comment.isDeleted && (
                  <button
                    type="button"
                    onClick={() => handleDeleteComment(comment._id)}
                    className="w-full px-3 py-1.5 text-left text-rose-400 hover:bg-rose-500/10 flex items-center gap-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleReportComment(comment._id)}
                  className="w-full px-3 py-1.5 text-left text-slate-300 hover:bg-slate-800 flex items-center gap-2"
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span>Report</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Comment Body */}
        <div className="mt-2.5 text-xs sm:text-sm text-slate-200 font-sans leading-relaxed whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
          {comment.isDeleted ? (
            <span className="italic text-slate-500">{comment.body}</span>
          ) : (
            comment.body
          )}
        </div>

        {/* Admin Official Reply if Present */}
        {comment.adminReply && (
          <div className="mt-3 p-3 rounded-xl bg-brand-blue/10 border border-brand-cyan/30 text-xs space-y-1">
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-brand-cyan font-bold uppercase tracking-wider">
              <CornerDownRight className="w-3.5 h-3.5" />
              <span>IEDC Editorial Response</span>
            </div>
            <p className="text-slate-300 whitespace-pre-wrap break-words pl-4">
              {comment.adminReply}
            </p>
          </div>
        )}

        {/* Bottom Actions Bar: Likes, Reply button, Expand replies */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/60 text-xs">
          <div className="flex items-center gap-3">
            {/* Like button with live count & pop animation */}
            <button
              type="button"
              onClick={() => handleToggleLike(comment._id)}
              disabled={comment.isDeleted}
              className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg font-mono text-xs transition-all active:scale-90 ${
                isLiked
                  ? "text-rose-400 bg-rose-500/10 font-bold"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50"
              }`}
              title={isLiked ? "Unlike" : "Like"}
            >
              <Heart
                className={`w-3.5 h-3.5 transition-transform ${
                  isLiked ? "fill-rose-400 text-rose-400 scale-110" : ""
                }`}
              />
              <span>{comment.likesCount > 0 ? comment.likesCount : "Like"}</span>
            </button>

            {/* Reply button */}
            {!comment.isDeleted && (
              <button
                type="button"
                onClick={() => {
                  setActiveReplyId(isReplyingToThis ? null : comment._id);
                  setReplyBody("");
                  setReplyFeedback(null);
                }}
                className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg font-mono text-xs transition-colors ${
                  isReplyingToThis
                    ? "text-brand-cyan bg-brand-cyan/10 font-semibold"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                }`}
              >
                <ReplyIcon className="w-3.5 h-3.5" />
                <span>Reply</span>
              </button>
            )}
          </div>

          {/* Expand / Collapse Replies Button (if has replies) */}
          {hasReplies && (
            <button
              type="button"
              onClick={() => toggleThreadCollapse(comment._id)}
              className="inline-flex items-center gap-1 font-mono text-[11px] text-brand-cyan hover:underline transition-all"
            >
              {isThreadCollapsed ? (
                <>
                  <ChevronDown className="w-3 h-3" />
                  <span>
                    Show {replies.length} {replies.length === 1 ? "reply" : "replies"}
                  </span>
                </>
              ) : (
                <>
                  <ChevronUp className="w-3 h-3" />
                  <span>Hide {replies.length === 1 ? "reply" : "replies"}</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Inline Reply Composer */}
        {isReplyingToThis && (
          <div className="mt-3.5 pt-3 border-t border-brand-cyan/30 rounded-xl bg-slate-950/60 p-3.5 space-y-2.5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between text-[11px] font-mono text-brand-cyan">
              <span className="flex items-center gap-1.5">
                <CornerDownRight className="w-3.5 h-3.5" />
                Replying to <span className="font-bold">@{comment.name}</span>
              </span>
              <button
                type="button"
                onClick={() => setActiveReplyId(null)}
                className="text-slate-500 hover:text-white"
                title="Cancel reply"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <textarea
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleReplySubmit(comment.parentId || comment._id, comment.name);
                }
              }}
              rows={2}
              maxLength={1000}
              placeholder={`Write a thoughtful reply to ${comment.name}... (Enter to post)`}
              className="w-full p-2.5 rounded-lg bg-foundation-dark border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-cyan transition-all resize-none"
            />

            {replyFeedback && (
              <p className="text-[11px] text-rose-400 font-mono flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                {replyFeedback}
              </p>
            )}

            <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
              <span>Shift + Enter for new line</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveReplyId(null)}
                  className="px-2.5 py-1 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleReplySubmit(comment.parentId || comment._id, comment.name)
                  }
                  disabled={replyingSubmitting || !replyBody.trim()}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-brand-blue hover:bg-blue-600 text-white font-bold transition-all disabled:opacity-50"
                >
                  <Send className="w-3 h-3" />
                  <span>{replyingSubmitting ? "Posting..." : "Post Reply"}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Nested Replies Section (Thread line & Indentation) */}
        {hasReplies && !isThreadCollapsed && (
          <div className="mt-3 pl-3 sm:pl-6 border-l-2 border-slate-800 space-y-2">
            {replies.map((reply) => renderCommentCard(reply, true))}
          </div>
        )}
      </div>
    );
  };

  const totalCommentCount = comments.length;

  return (
    <section
      id="readers-remarks"
      aria-label="Readers Remarks and Discussion"
      className="w-full max-w-4xl mx-auto mt-12 mb-16 px-4 sm:px-0 space-y-8"
    >
      {/* Section Divider & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <span className="text-[11px] font-mono text-brand-cyan uppercase tracking-widest flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5" />
            Scholarly Discussion & Community Exchange
          </span>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-white tracking-tight">
            Reader Remarks
          </h2>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <span className="px-2.5 py-1 rounded-full bg-slate-900 border border-slate-700/80 text-brand-cyan font-bold">
            {totalCommentCount}
          </span>
          <span>{totalCommentCount === 1 ? "remark published" : "remarks published"}</span>
        </div>
      </div>

      {/* Modern Reddit/Instagram Style Comment Input Card */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-slate-950 p-5 sm:p-7 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-cyan/5 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between gap-4 mb-4">
          <h3 className="font-display text-sm sm:text-base font-semibold text-white">
            Join the Discussion
          </h3>
          <span className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400">
            <Lock className="w-3 h-3 text-brand-cyan/80" />
            Live & Public Discussion
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Honeypot field (hidden from human visitors) */}
          <div
            style={{
              position: "absolute",
              opacity: 0,
              zIndex: -1,
              left: "-9999px",
            }}
            aria-hidden="true"
          >
            <label htmlFor="website-field">Leave empty</label>
            <input
              id="website-field"
              type="text"
              name="website"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label
                htmlFor="comment-author-name"
                className="block text-[11px] font-mono text-slate-300"
              >
                Your Name <span className="text-rose-400">*</span>
              </label>
              <input
                id="comment-author-name"
                type="text"
                required
                maxLength={60}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Dr. A. Patil / Student Lead"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs sm:text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-brand-cyan transition-all"
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="comment-author-email"
                className="block text-[11px] font-mono text-slate-300"
              >
                Your Email <span className="text-rose-400">*</span>{" "}
                <span className="text-[10px] text-slate-500">(Never shared)</span>
              </label>
              <input
                id="comment-author-email"
                type="email"
                required
                maxLength={100}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs sm:text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-brand-cyan transition-all"
              />
            </div>
          </div>

          {/* Comment Body */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
              <label htmlFor="comment-body-text">
                Your Remark or Perspective <span className="text-rose-400">*</span>
              </label>
              <span className={body.length > 900 ? "text-amber-400" : "text-slate-500"}>
                {1000 - body.length} left
              </span>
            </div>
            <textarea
              id="comment-body-text"
              required
              rows={3}
              maxLength={1000}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder="What are your thoughts on this innovation manuscript? (Enter to post, Shift+Enter for new line)"
              className="w-full p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs sm:text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-brand-cyan transition-all resize-none leading-relaxed"
            />
          </div>

          {/* Feedback banner */}
          {feedback && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2.5 ${
                feedback.type === "success"
                  ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300"
                  : "bg-rose-500/10 border border-rose-500/30 text-rose-300"
              }`}
            >
              {feedback.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* Submit button bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-1">
            <span className="text-[11px] font-mono text-slate-500 hidden sm:inline">
              Press Enter to post · Shift + Enter for new line
            </span>
            <button
              type="submit"
              disabled={submitting || !body.trim()}
              className="w-full sm:w-auto inline-flex items-center justify-center min-h-[40px] gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-brand-blue to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-mono text-xs uppercase tracking-wider font-bold shadow-md shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submitting ? "Posting..." : "Post Remark"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Comments List Feed */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12 space-y-2">
            <Clock className="w-5 h-5 text-brand-cyan animate-spin mx-auto" />
            <p className="text-xs font-mono text-slate-500">Loading reader remarks...</p>
          </div>
        ) : rootComments.length === 0 ? (
          <div className="text-center py-10 rounded-2xl border border-slate-800/80 bg-slate-900/30 p-6 space-y-2">
            <p className="font-display text-sm font-semibold text-slate-300">
              No remarks yet.
            </p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Be the first innovator or scholar to share your perspective on this publication!
            </p>
          </div>
        ) : (
          rootComments.map((root) => renderCommentCard(root, false))
        )}
      </div>
    </section>
  );
}
