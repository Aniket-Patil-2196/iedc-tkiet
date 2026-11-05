"use client";

import React, { useState } from "react";
import {
  FileText,
  Link2,
  FolderOpen,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  Lock,
  Unlock,
  AlertTriangle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatDateIST } from "@/lib/utils/date-ist";
import { cn } from "@/lib/utils";
import {
  IEventSubmissionConfig,
  IRegistrationSubmission,
} from "@/types/content";

/**
 * WhatsApp Group Gating Policy Configuration
 * false = Unlocks as soon as participant submits files (status is 'pending' or 'approved').
 * true  = Unlocks ONLY after admin reviews and approves submission (status is 'approved').
 */
export const GATE_WHATSAPP_REQUIRES_APPROVAL = false;

export function isWhatsAppUnlocked(
  gateWhatsapp: boolean | undefined,
  submission: IRegistrationSubmission | null | undefined
): boolean {
  if (!gateWhatsapp) return true;
  if (!submission) return false;
  if (GATE_WHATSAPP_REQUIRES_APPROVAL) {
    return submission.status === "approved";
  }
  return (
    submission.status === "pending" ||
    submission.status === "approved" ||
    Boolean(submission.link || submission.driveFileId)
  );
}

interface ParticipantSubmissionCardProps {
  eventId: string;
  receiptToken: string;
  registrationStatus: string;
  eventSubmissionConfig?: IEventSubmissionConfig | null;
  initialSubmission?: IRegistrationSubmission | null;
  onSubmissionUpdated?: (newSubmission: IRegistrationSubmission) => void;
}

export function ParticipantSubmissionCard({
  eventId,
  receiptToken,
  registrationStatus,
  eventSubmissionConfig,
  initialSubmission,
  onSubmissionUpdated,
}: ParticipantSubmissionCardProps) {
  const config = eventSubmissionConfig;

  // Backward compatibility: If submission is not enabled, render nothing
  if (!config || !config.enabled) {
    return null;
  }

  const [submission, setSubmission] = useState<IRegistrationSubmission | null>(
    initialSubmission || null
  );

  const mode = config.mode || "both";

  // Form states
  const [linkInput, setLinkInput] = useState(submission?.link || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(!submission?.submittedAt);

  // Check deadline
  const isDeadlinePassed = config.deadline
    ? new Date() > new Date(config.deadline)
    : false;

  // Validate Google Drive / Google Docs host
  const validateGoogleDriveUrl = (url: string): boolean => {
    try {
      const parsed = new URL(url);
      const host = parsed.hostname.toLowerCase();
      return (
        host === "drive.google.com" ||
        host === "docs.google.com" ||
        host.endsWith(".drive.google.com") ||
        host.endsWith(".docs.google.com")
      );
    } catch {
      return false;
    }
  };

  const submitLink = async (targetLink: string) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/events/${eventId}/submission`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiptToken,
          link: targetLink,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMessage(data.error || "Failed to submit. Please try again.");
        setIsSubmitting(false);
        return;
      }

      setSubmission(data.submission);
      setIsEditing(false);
      setSuccessMessage("Submission received successfully and is pending review.");
      if (onSubmissionUpdated) {
        onSubmissionUpdated(data.submission);
      }
    } catch {
      setErrorMessage("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = linkInput.trim();
    if (!trimmed) {
      setErrorMessage("Please enter your Google Drive or Google Docs share link.");
      return;
    }

    if (!validateGoogleDriveUrl(trimmed)) {
      setErrorMessage(
        "Invalid URL. The link must be hosted on drive.google.com or docs.google.com."
      );
      return;
    }

    await submitLink(trimmed);
  };

  const handleFolderConfirm = async () => {
    const folderLink = config.folderUrl?.trim() || "";
    await submitLink(folderLink);
  };

  // Stepper calculations
  const isPaid = registrationStatus === "paid";
  const hasSubmitted = Boolean(submission?.submittedAt);
  const isApproved = submission?.status === "approved";
  const isRejected = submission?.status === "rejected";
  const isPending = hasSubmitted && submission?.status === "pending";

  const showFolderSection =
    (mode === "folder" || mode === "both") && Boolean(config.folderUrl);
  const showLinkForm = mode === "link" || mode === "both";

  return (
    <div className="space-y-6">
      {/* 1. PROGRESS STEPPER */}
      <div className="p-5 rounded-2xl bg-foundation-dark border border-brand-blue/30 shadow-xl">
        <p className="text-[11px] font-sans uppercase tracking-widest text-brand-cyan font-bold mb-4">
          Registration &amp; Submission Status
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Step 1: Registered */}
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-foundation-slate/50 border border-emerald-500/30">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-typo-white truncate">1. Registered</p>
              <p className="text-[10px] text-emerald-400 font-medium">Completed</p>
            </div>
          </div>

          {/* Step 2: Paid */}
          <div
            className={cn(
              "flex items-center gap-2.5 p-3 rounded-xl border",
              isPaid
                ? "bg-foundation-slate/50 border-emerald-500/30"
                : "bg-foundation-slate/20 border-amber-500/30"
            )}
          >
            <div
              className={cn(
                "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
                isPaid
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "bg-amber-500/20 text-amber-400"
              )}
            >
              {isPaid ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <Clock className="w-4 h-4" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-typo-white truncate">2. Payment</p>
              <p
                className={cn(
                  "text-[10px] font-medium",
                  isPaid ? "text-emerald-400" : "text-amber-400"
                )}
              >
                {isPaid ? "Paid" : "Pending"}
              </p>
            </div>
          </div>

          {/* Step 3: Submit files */}
          <div
            className={cn(
              "flex items-center gap-2.5 p-3 rounded-xl border transition-colors",
              isApproved
                ? "bg-foundation-slate/50 border-emerald-500/30"
                : isPending
                ? "bg-foundation-slate/50 border-amber-500/30"
                : isRejected
                ? "bg-foundation-slate/50 border-rose-500/30"
                : "bg-foundation-slate/40 border-brand-cyan/40 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
            )}
          >
            <div
              className={cn(
                "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
                isApproved
                  ? "bg-emerald-500/20 text-emerald-400"
                  : isPending
                  ? "bg-amber-500/20 text-amber-400"
                  : isRejected
                  ? "bg-rose-500/20 text-rose-400"
                  : "bg-brand-cyan/20 text-brand-cyan animate-pulse"
              )}
            >
              {isApproved ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : isPending ? (
                <Clock className="w-4 h-4" />
              ) : isRejected ? (
                <AlertCircle className="w-4 h-4" />
              ) : (
                <FolderOpen className="w-4 h-4" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-typo-white truncate">3. Submit Files</p>
              <p
                className={cn(
                  "text-[10px] font-medium truncate",
                  isApproved
                    ? "text-emerald-400"
                    : isPending
                    ? "text-amber-400"
                    : isRejected
                    ? "text-rose-400"
                    : "text-brand-cyan"
                )}
              >
                {isApproved
                  ? "Approved"
                  : isPending
                  ? "In Review"
                  : isRejected
                  ? "Action Required"
                  : "Required"}
              </p>
            </div>
          </div>

          {/* Step 4: Join WhatsApp */}
          {(() => {
            const unlocked = isWhatsAppUnlocked(config.gateWhatsapp, submission);
            return (
              <div
                className={cn(
                  "flex items-center gap-2.5 p-3 rounded-xl border",
                  unlocked
                    ? "bg-foundation-slate/50 border-emerald-500/30"
                    : "bg-foundation-slate/10 border-foundation-slate/60 opacity-60"
                )}
              >
                <div
                  className={cn(
                    "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
                    unlocked
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-foundation-slate text-typo-gray"
                  )}
                >
                  {unlocked ? (
                    <Unlock className="w-4 h-4" />
                  ) : (
                    <Lock className="w-4 h-4" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-typo-white truncate">4. WhatsApp</p>
                  <p
                    className={cn(
                      "text-[10px] font-medium",
                      unlocked ? "text-emerald-400" : "text-typo-gray"
                    )}
                  >
                    {unlocked ? "Unlocked" : "Locked"}
                  </p>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* 2. SUBMISSION CARD */}
      <div className="p-6 sm:p-7 rounded-2xl bg-foundation-dark border border-brand-blue/30 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-foundation-slate/60">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand-cyan animate-pulse" />
              <h3 className="font-display text-lg sm:text-xl font-bold text-typo-white">
                Participant Submission
              </h3>
            </div>
            <p className="text-xs font-sans text-typo-gray">
              Upload deliverables to the shared Google Drive folder or provide your share link.
            </p>
          </div>

          {/* Submission Status Badge */}
          {submission?.status && (
            <div>
              {submission.status === "approved" && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Submission Approved</span>
                </span>
              )}
              {submission.status === "pending" && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Under Review</span>
                </span>
              )}
              {submission.status === "rejected" && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Submission Rejected</span>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Instructions & Deadline Strip */}
        <div className="p-4 rounded-xl bg-foundation-slate/40 border border-foundation-slate/80 space-y-2.5 text-xs font-sans">
          {config.instructions && (
            <div>
              <p className="font-semibold text-typo-white mb-1">Instructions:</p>
              <p className="text-typo-gray leading-relaxed whitespace-pre-line">
                {config.instructions}
              </p>
            </div>
          )}

          {config.deadline && (
            <div className="flex items-center gap-1.5 pt-2 border-t border-foundation-slate/60 text-[11px] text-typo-gray">
              <Clock className="w-3.5 h-3.5 text-brand-cyan" />
              <span>
                Deadline:{" "}
                <strong className="text-typo-white">
                  {formatDateIST(config.deadline)}
                </strong>
              </span>
            </div>
          )}
        </div>

        {/* Deadline Passed Notice */}
        {isDeadlinePassed && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
            <div>
              <p className="font-semibold text-rose-200">
                Submission Window Closed
              </p>
              <p className="text-[11px] text-rose-300/80">
                The deadline for this event has expired. No further submissions or modifications can be accepted.
              </p>
            </div>
          </div>
        )}

        {/* Admin Feedback Box (If Reviewed) */}
        {submission?.adminNote && (
          <div
            className={cn(
              "p-4 rounded-xl border text-xs space-y-1",
              submission.status === "rejected"
                ? "bg-rose-500/10 border-rose-500/30 text-rose-200"
                : "bg-brand-blue/10 border-brand-cyan/30 text-typo-white"
            )}
          >
            <div className="flex items-center gap-2 font-semibold">
              <AlertCircle className="w-4 h-4 text-brand-cyan" />
              <span>Reviewer Feedback</span>
            </div>
            <p className="text-[11px] text-typo-gray pl-6 leading-relaxed">
              {submission.adminNote}
            </p>
          </div>
        )}

        {/* Existing Submission Details (When not in edit mode) */}
        {hasSubmitted && !isEditing && (
          <div className="p-4 rounded-xl bg-foundation-slate/30 border border-foundation-slate space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[11px] font-sans text-typo-gray uppercase tracking-wider">
                  Submitted Deliverable
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <FileText className="w-4 h-4 text-brand-cyan shrink-0" />
                  <a
                    href={submission?.link || config.folderUrl || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-brand-cyan hover:underline truncate inline-flex items-center gap-1.5"
                  >
                    <span className="truncate">
                      {submission?.fileName || submission?.link || "Google Drive Folder"}
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  </a>
                </div>
              </div>

              {submission?.submittedAt && (
                <p className="text-[11px] text-typo-gray shrink-0">
                  Submitted on {formatDateIST(submission.submittedAt)}
                </p>
              )}
            </div>

            {/* Resubmit button (allowed until deadline) */}
            {!isDeadlinePassed && (
              <div className="pt-2 border-t border-foundation-slate/60 flex items-center justify-between">
                <p className="text-[11px] text-typo-gray">
                  Need to update your files? You can resubmit anytime before the deadline.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setIsEditing(true);
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className="text-xs flex items-center gap-1.5 py-1.5 px-3"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Update Submission</span>
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Submission Form (When initial submission OR editing) */}
        {(!hasSubmitted || isEditing) && !isDeadlinePassed && (
          <div className="space-y-5">
            {/* Folder section (mode === 'folder' || mode === 'both') */}
            {showFolderSection && (
              <div className="p-4 rounded-xl bg-foundation-slate/40 border border-foundation-slate space-y-3">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-typo-white">
                    Step A: Open Event Upload Folder
                  </p>
                  <p className="text-[11px] text-typo-gray leading-relaxed">
                    Sign in with your Google account, name files like{" "}
                    <strong className="text-brand-cyan">YourName_TeamName</strong>, and do
                    not delete or edit other participants&apos; files.
                  </p>
                </div>

                <a
                  href={config.folderUrl || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-blue hover:bg-blue-600 text-white font-sans text-xs font-semibold transition-colors"
                >
                  <FolderOpen className="w-4 h-4" />
                  <span>Open upload folder</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                </a>

                {/* For mode 'folder' only: button to confirm upload */}
                {mode === "folder" && (
                  <div className="pt-3 border-t border-foundation-slate/60 flex items-center gap-3">
                    <Button
                      type="button"
                      onClick={handleFolderConfirm}
                      disabled={isSubmitting}
                      className="text-xs px-4 py-2 flex items-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Confirming...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>I have uploaded my files</span>
                        </>
                      )}
                    </Button>
                    {hasSubmitted && isEditing && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsEditing(false)}
                        className="text-xs py-2 px-3"
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Link Form (mode === 'link' || mode === 'both') */}
            {showLinkForm && (
              <form onSubmit={handleLinkSubmit} className="space-y-4">
                {mode === "both" && (
                  <p className="text-xs font-semibold text-typo-white">
                    Step B: Paste Your Deliverable or Drive Share Link
                  </p>
                )}

                {/* Drive Warning Alert */}
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                  <p className="leading-relaxed">
                    Important: Please ensure link sharing in Google Drive is set to{" "}
                    <strong className="text-amber-100 underline">
                      &quot;Anyone with the link can view&quot;
                    </strong>{" "}
                    so reviewers can access your submission without permission errors.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-typo-white">
                    Google Drive or Google Docs Share Link
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-typo-gray">
                      <Link2 className="w-4 h-4" />
                    </div>
                    <input
                      type="url"
                      value={linkInput}
                      onChange={(e) => setLinkInput(e.target.value)}
                      placeholder="https://drive.google.com/file/d/... or drive.google.com/drive/folders/..."
                      required
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-foundation-slate/50 border border-foundation-slate text-typo-white text-xs placeholder:text-typo-gray/60 focus:outline-none focus:border-brand-cyan transition-colors"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    type="submit"
                    disabled={isSubmitting || !linkInput.trim()}
                    className="text-xs px-5 py-2.5 flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Submitting Link...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{hasSubmitted ? "Update Submission" : "Submit Link"}</span>
                      </>
                    )}
                  </Button>

                  {hasSubmitted && isEditing && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                      className="text-xs py-2.5 px-4"
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            )}

            {/* Status alerts */}
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{successMessage}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
