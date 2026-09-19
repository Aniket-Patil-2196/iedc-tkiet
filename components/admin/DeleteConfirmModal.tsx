"use client";

import React, { useEffect } from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  title: string;
  itemDescription?: string;
  isDeleting?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteConfirmModal({
  isOpen,
  title,
  itemDescription,
  isDeleting = false,
  onConfirm,
  onCancel,
}: DeleteConfirmModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onCancel();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Confirm Deletion"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foundation-space/90 backdrop-blur-sm animate-fadeIn"
      onClick={onCancel}
    >
      <div
        className="relative w-full max-w-md rounded-2xl bg-foundation-dark border border-red-500/40 p-6 space-y-5 shadow-[0_15px_60px_rgba(0,0,0,0.85)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="w-12 h-12 rounded-xl bg-red-950/50 border border-red-500/50 flex items-center justify-center text-red-400 shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 rounded-lg text-typo-gray hover:text-typo-white hover:bg-foundation-slate"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2">
          <h3 className="font-display text-xl font-bold text-typo-white">
            Confirm Removal
          </h3>
          <p className="font-sans text-xs text-typo-gray leading-relaxed">
            Are you sure you want to delete <span className="text-typo-white font-semibold">&quot;{title}&quot;</span>?
            {itemDescription && ` (${itemDescription})`}
          </p>
          <p className="text-[11px] font-sans text-red-400/90">
            This action cannot be undone.
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={isDeleting}
          >
            Cancel
          </Button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-typo-white text-xs font-sans font-semibold shadow-lg shadow-red-950/50 transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isDeleting ? "Deleting..." : "Confirm Delete"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
