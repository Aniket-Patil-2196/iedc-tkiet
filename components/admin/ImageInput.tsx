"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Upload, Link2, X, Check, Loader2 } from "lucide-react";

interface ImageInputProps {
  label?: string;
  value: string;
  onChange: (url: string) => void;
  placeholder?: string;
}

export function ImageInput({
  label = "Image Asset",
  value,
  onChange,
  placeholder = "/images/... or https://...",
}: ImageInputProps) {
  const [mode, setMode] = useState<"url" | "upload">("url");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setUploadError(data.error || "Upload failed.");
        setIsUploading(false);
        return;
      }

      onChange(data.url);
      setIsUploading(false);
    } catch {
      setUploadError("Network error during file upload.");
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-sans font-semibold uppercase tracking-wider text-typo-gray">
          {label}
        </label>
        <div className="flex items-center gap-1 bg-foundation-slate/50 p-0.5 rounded-lg text-[11px] font-sans">
          <button
            type="button"
            onClick={() => setMode("url")}
            className={`px-2 py-0.5 rounded-md transition-colors ${
              mode === "url"
                ? "bg-foundation-dark text-typo-white shadow"
                : "text-typo-gray hover:text-typo-white"
            }`}
          >
            URL
          </button>
          <button
            type="button"
            onClick={() => setMode("upload")}
            className={`px-2 py-0.5 rounded-md transition-colors ${
              mode === "upload"
                ? "bg-foundation-dark text-typo-white shadow"
                : "text-typo-gray hover:text-typo-white"
            }`}
          >
            Upload
          </button>
        </div>
      </div>

      {mode === "url" ? (
        <div className="relative">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-foundation-slate/50 border border-foundation-slate text-typo-white text-xs focus:outline-none focus:border-brand-cyan"
          />
          <Link2 className="w-4 h-4 text-typo-gray absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
      ) : (
        <div className="relative">
          <label className="flex flex-col items-center justify-center w-full h-24 border border-dashed border-foundation-slate hover:border-brand-blue/70 rounded-xl cursor-pointer bg-foundation-slate/20 hover:bg-foundation-slate/30 transition-colors p-4">
            {isUploading ? (
              <div className="flex items-center gap-2 text-xs text-brand-cyan">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Uploading asset...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center">
                <Upload className="w-5 h-5 text-brand-cyan mb-1" />
                <span className="text-xs font-sans text-typo-white">
                  Click to select file (PNG, JPG, SVG, WebP)
                </span>
                <span className="text-[10px] text-typo-gray">Max size: 5MB</span>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
              disabled={isUploading}
            />
          </label>
        </div>
      )}

      {uploadError && (
        <p className="text-[11px] text-red-400 font-sans">{uploadError}</p>
      )}

      {/* Image Preview Thumbnail */}
      {value && (
        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-foundation-slate/30 border border-foundation-slate">
          <div className="relative w-12 h-12 rounded-lg bg-foundation-space overflow-hidden shrink-0 border border-foundation-slate">
            <Image
              src={value}
              alt="Preview"
              fill
              className="object-cover"
              onError={(e) => {
                // If invalid preview URL
                (e.target as HTMLElement).style.display = "none";
              }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-xs font-mono text-typo-white truncate block">
              {value}
            </span>
            <span className="text-[10px] text-brand-cyan flex items-center gap-1">
              <Check className="w-3 h-3" /> Configured
            </span>
          </div>
          <button
            type="button"
            onClick={() => onChange("")}
            className="p-1 rounded-md text-typo-gray hover:text-typo-white hover:bg-foundation-slate"
            title="Remove image"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
