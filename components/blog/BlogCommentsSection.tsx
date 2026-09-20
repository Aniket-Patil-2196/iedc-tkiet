"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  MessageSquare,
  Send,
  ShieldCheck,
  Clock,
  CornerDownRight,
  AlertCircle,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { formatEventDate } from "@/lib/utils/event-status";

interface PublicComment {
  _id: string;
  name: string;
  body: string;
  createdAt: string;
  adminReply?: string | null;
}

interface BlogCommentsSectionProps {
  blogSlug: string;
  blogTitle?: string;
}

export function BlogCommentsSection({ blogSlug, blogTitle }: BlogCommentsSectionProps) {
  const [comments, setComments] = useState<PublicComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [body, setBody] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [formLoadedAt] = useState(() => Date.now());

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/blogs/${blogSlug}/comments`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setComments(data.data || []);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    // Basic client validation
    if (!name.trim() || name.trim().length < 2) {
      setFeedback({ type: "error", message: "Please enter your name (at least 2 characters)." });
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setFeedback({ type: "error", message: "Please enter a valid email address." });
      return;
    }
    if (!body.trim() || body.trim().length < 3) {
      setFeedback({ type: "error", message: "Please write a comment (at least 3 characters)." });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/blogs/${blogSlug}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          body: body.trim(),
          website: honeypot, // Honeypot field
          formLoadedAt, // Timing bot protection
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback({
          type: "success",
          message:
            "Thank you! Your remark has been submitted for archival moderation.",
        });
        setName("");
        setEmail("");
        setBody("");
        setHoneypot("");
      } else {
        setFeedback({
          type: "error",
          message:
            data.error ||
            "Unable to submit comment at this time. Please try again later.",
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
            Readers’ Remarks & Scholarly Exchange
          </span>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-white tracking-tight">
            Discussion & Commentary
          </h2>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <span className="px-2.5 py-1 rounded-full bg-slate-900 border border-slate-700/80 text-brand-cyan font-bold">
            {comments.length}
          </span>
          <span>{comments.length === 1 ? "remark published" : "remarks published"}</span>
        </div>
      </div>

      {/* Submission Form Card */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-slate-950 p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-cyan/5 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between gap-4 mb-6">
          <h3 className="font-display text-base sm:text-lg font-semibold text-white">
            Leave a Remark
          </h3>
          <span className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Moderated Archival Forum
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label
                htmlFor="comment-author-name"
                className="block text-xs font-mono text-slate-300"
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
                placeholder="e.g. Dr. Jane Doe / Student Innovator"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-brand-cyan transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="comment-author-email"
                className="block text-xs font-mono text-slate-300"
              >
                Your Email <span className="text-rose-400">*</span>
              </label>
              <input
                id="comment-author-email"
                type="email"
                required
                maxLength={100}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-brand-cyan transition-all"
              />
            </div>
          </div>

          {/* Privacy Note Reassurance */}
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400">
            <Lock className="w-3 h-3 text-brand-cyan/80" />
            <span>
              Privacy Guarantee: Your email address will never be published, displayed, or shared.
            </span>
          </div>

          {/* Comment Body */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono text-slate-300">
              <label htmlFor="comment-body-text">
                Your Remark or Feedback <span className="text-rose-400">*</span>
              </label>
              <span
                className={`text-[11px] ${
                  body.length > 900 ? "text-amber-400" : "text-slate-500"
                }`}
              >
                {1000 - body.length} chars left
              </span>
            </div>
            <textarea
              id="comment-body-text"
              required
              rows={4}
              maxLength={1000}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Share thoughts, academic citations, or technical perspective on this publication..."
              className="w-full p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-brand-cyan transition-all resize-none leading-relaxed"
            />
          </div>

          {/* Feedback banner */}
          {feedback && (
            <div
              className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 ${
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

          {/* Submit button */}
          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-blue to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-mono text-xs uppercase tracking-wider font-bold shadow-lg shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submitting ? "Submitting..." : "Post Remark"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Approved Comments Feed */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-10 space-y-2">
            <Clock className="w-5 h-5 text-brand-cyan animate-spin mx-auto" />
            <p className="text-xs font-mono text-slate-500">Retrieving reader entries...</p>
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-10 rounded-2xl border border-slate-800/80 bg-slate-900/30 p-6 space-y-2">
            <p className="font-display text-sm font-semibold text-slate-300">
              No published remarks yet.
            </p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Be the first scholar or innovator to contribute commentary to this article.
            </p>
          </div>
        ) : (
          comments.map((comment) => (
            <div
              key={comment._id}
              className="p-5 sm:p-6 rounded-2xl border border-slate-800/80 bg-slate-900/40 shadow-sm space-y-3"
            >
              {/* Comment Header */}
              <div className="flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-brand-blue/20 border border-brand-cyan/30 flex items-center justify-center text-xs font-mono font-bold text-brand-cyan">
                    {comment.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-sans font-semibold text-white">
                    {comment.name}
                  </span>
                </div>
                <span className="font-mono text-[11px] text-slate-500">
                  {formatEventDate(comment.createdAt)}
                </span>
              </div>

              {/* Comment Text with safe pre-wrap and break-words */}
              <p className="text-xs sm:text-sm text-slate-300 font-sans leading-relaxed whitespace-pre-wrap break-words pl-9">
                {comment.body}
              </p>

              {/* Admin Official Response if Present */}
              {comment.adminReply && (
                <div className="mt-3 ml-9 p-4 rounded-xl bg-slate-900/90 border border-brand-cyan/30 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-mono text-brand-cyan font-bold uppercase tracking-wider">
                    <CornerDownRight className="w-3.5 h-3.5" />
                    <span>IEDC TKIET Editorial Team</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-200 whitespace-pre-wrap break-words leading-relaxed pl-5">
                    {comment.adminReply}
                  </p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  );
}
