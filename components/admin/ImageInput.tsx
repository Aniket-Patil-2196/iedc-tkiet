"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Upload, Link2, X, Check, Loader2, AlertCircle } from "lucide-react";

interface ImageInputProps {
  label?: string;
  value: string;
  onChange: (url: string) => void;
  onDimensionsChange?: (dimensions: { width: number; height: number }) => void;
  placeholder?: string;
}

export function ImageInput({
  label = "Image Asset",
  value,
  onChange,
  onDimensionsChange,
  placeholder = "/images/... or https://...",
}: ImageInputProps) {
  const [mode, setMode] = useState<"url" | "upload">("url");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [urlPreviewError, setUrlPreviewError] = useState(false);

  useEffect(() => {
    setUrlPreviewError(false);
  }, [value]);

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
      if (data.width && data.height && onDimensionsChange) {
        onDimensionsChange({ width: data.width, height: data.height });
      }
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
        <div className="space-y-1.5">
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
          <p className="text-[11px] text-typo-gray font-sans">
            Use a direct image link (ends in .jpg, .png, .webp). For Pinterest, right-click the image and copy image address.
          </p>
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

      {/* Image Preview Thumbnail / Error state */}
      {value && (
        urlPreviewError && !value.startsWith("/api/images/") ? (
          <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
            <div className="flex-1 min-w-0 space-y-0.5">
              <p className="font-semibold text-amber-200">
                This doesn&apos;t look like a direct image link
              </p>
              <p className="text-[11px] text-amber-300/80 leading-relaxed">
                The URL may point to a web page instead of an image file. Right-click the image on the web page and choose &quot;Copy image address&quot;.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onChange("")}
              className="p-1 rounded-md text-amber-400 hover:text-amber-200 hover:bg-amber-900/40"
              title="Clear URL"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-foundation-slate/30 border border-foundation-slate">
            <div className="relative w-12 h-12 rounded-lg bg-foundation-space overflow-hidden shrink-0 border border-foundation-slate">
              <Image
                src={value}
                alt="Preview"
                fill
                unoptimized={value.startsWith("/api/images/")}
                className="object-cover"
                onLoad={(e) => {
                  const img = e.currentTarget;
                  if (img.naturalWidth && img.naturalHeight && onDimensionsChange) {
                    onDimensionsChange({
                      width: img.naturalWidth,
                      height: img.naturalHeight,
                    });
                  }
                }}
                onError={() => {
                  setUrlPreviewError(true);
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
        )
      )}
    </div>
  );
}
