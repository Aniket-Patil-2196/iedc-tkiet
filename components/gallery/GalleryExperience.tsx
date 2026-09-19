"use client";

import React, { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { IGalleryImage } from "@/types/content";
import { GalleryLightbox } from "@/components/gallery/GalleryLightbox";
import { Box, Eye, Sparkles, Filter, Maximize2, Image as ImageIcon } from "lucide-react";

// Dynamic import with SSR disabled for Three.js Canvas
const PhotoGlobeCanvas = dynamic(
  () => import("@/components/gallery/PhotoGlobeCanvas").then((mod) => mod.PhotoGlobeCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="relative w-full h-[540px] sm:h-[640px] md:h-[720px] rounded-3xl bg-foundation-space border border-foundation-slate flex flex-col items-center justify-center p-8 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-foundation-slate/60 border border-brand-cyan/40 flex items-center justify-center animate-pulse">
          <Box className="w-7 h-7 text-brand-cyan" />
        </div>
        <h4 className="font-display text-xl font-bold text-typo-white">
          Initializing 3D Spatial Canvas...
        </h4>
        <p className="text-xs font-sans text-typo-gray max-w-sm">
          Calibrating spherical coordinate matrices and hardware shaders.
        </p>
      </div>
    ),
  }
);

interface GalleryExperienceProps {
  images: IGalleryImage[];
}

export function GalleryExperience({ images }: GalleryExperienceProps) {
  const [selectedImage, setSelectedImage] = useState<IGalleryImage | null>(null);
  const [selectedTag, setSelectedTag] = useState<string>("all");

  // Collect unique tags
  const allTags = useMemo(() => {
    const set = new Set<string>();
    images.forEach((img) => {
      img.tags?.forEach((t) => set.add(t));
    });
    return Array.from(set);
  }, [images]);

  // Filter images for linear catalogue below
  const filteredImages = useMemo(() => {
    if (selectedTag === "all") return images;
    return images.filter((img) => img.tags?.includes(selectedTag));
  }, [images, selectedTag]);

  // Lightbox Next/Prev handlers
  const handleNext = () => {
    if (!selectedImage) return;
    const currentIndex = images.findIndex((img) => img.id === selectedImage.id);
    const nextIndex = (currentIndex + 1) % images.length;
    setSelectedImage(images[nextIndex]);
  };

  const handlePrev = () => {
    if (!selectedImage) return;
    const currentIndex = images.findIndex((img) => img.id === selectedImage.id);
    const prevIndex = (currentIndex - 1 + images.length) % images.length;
    setSelectedImage(images[prevIndex]);
  };

  if (images.length === 0) {
    return (
      <div className="py-20 text-center max-w-md mx-auto space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-foundation-dark border border-foundation-slate flex items-center justify-center mx-auto text-brand-cyan">
          <Box className="w-6 h-6" />
        </div>
        <h3 className="font-display text-xl font-bold text-typo-white">
          Gallery moments will appear here as they are added.
        </h3>
        <p className="font-sans text-xs sm:text-sm text-typo-gray">
          Photographs from cell hackathons, prototyping sessions, and inaugural events will be archived here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-16">
      {/* 3D Photo Globe Viewport */}
      <section aria-label="Interactive 3D Photo Globe" className="space-y-4">
        <PhotoGlobeCanvas
          images={images}
          onSelectImage={(img) => setSelectedImage(img)}
        />
      </section>

      {/* Editorial Catalog Archive Below the Sphere */}
      <section className="space-y-8 pt-6 border-t border-foundation-slate/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs uppercase font-mono tracking-wider text-brand-cyan font-semibold block">
              Linear Archive Collection
            </span>
            <h3 className="font-display text-2xl font-bold text-typo-white">
              Campus Moments &amp; Records
            </h3>
          </div>

          {/* Tag Filter */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 text-xs font-sans text-typo-gray mr-1">
              <Filter className="w-3.5 h-3.5 text-brand-cyan" />
              <span className="uppercase tracking-wider font-semibold">Filter:</span>
            </div>

            <button
              type="button"
              onClick={() => setSelectedTag("all")}
              className={`px-3 py-1 rounded-lg text-xs font-sans font-medium transition-all ${
                selectedTag === "all"
                  ? "bg-brand-blue text-typo-white shadow-[0_0_12px_rgba(37,99,235,0.4)]"
                  : "bg-foundation-dark text-typo-gray hover:text-typo-white hover:bg-foundation-slate/60 border border-foundation-slate"
              }`}
            >
              All Records ({images.length})
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setSelectedTag(tag)}
                className={`px-3 py-1 rounded-lg text-xs font-sans font-medium transition-all ${
                  selectedTag === tag
                    ? "bg-brand-blue text-typo-white shadow-[0_0_12px_rgba(37,99,235,0.4)]"
                    : "bg-foundation-dark text-typo-gray hover:text-typo-white hover:bg-foundation-slate/60 border border-foundation-slate"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Responsive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredImages.map((img) => (
            <GalleryCardItem
              key={(img as any)._id || img.id}
              img={img}
              onSelect={() => setSelectedImage(img)}
            />
          ))}
        </div>
      </section>

      {/* Full Lightbox */}
      <GalleryLightbox
        image={selectedImage}
        onClose={() => setSelectedImage(null)}
        onNext={handleNext}
        onPrev={handlePrev}
        hasMultiple={images.length > 1}
      />
    </div>
  );
}

function GalleryCardItem({
  img,
  onSelect,
}: {
  img: IGalleryImage;
  onSelect: () => void;
}) {
  const [hasError, setHasError] = useState(false);
  const isInternal = img.imageUrl?.startsWith("/api/images/");
  const displayRef = ((img.id || (img as any)._id || "0") as string)
    .replace("gal-", "")
    .slice(-6);

  return (
    <article
      onClick={onSelect}
      className="group relative rounded-2xl bg-foundation-dark border border-foundation-slate hover:border-brand-blue/60 transition-all duration-300 overflow-hidden cursor-pointer flex flex-col justify-between"
    >
      {/* Image Preview */}
      <div className="relative w-full aspect-[16/10] bg-foundation-space overflow-hidden">
        {hasError || !img.imageUrl ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-foundation-slate/20 text-center">
            <ImageIcon className="w-8 h-8 text-brand-cyan/50 mb-1" />
            <span className="text-[11px] font-mono text-typo-gray">
              Visual Record Archive
            </span>
          </div>
        ) : (
          <Image
            src={img.imageUrl}
            alt={img.title}
            fill
            unoptimized={isInternal}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            onError={() => setHasError(true)}
          />
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-foundation-space/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <span className="px-3.5 py-1.5 rounded-lg bg-brand-blue text-typo-white text-xs font-sans font-semibold inline-flex items-center gap-1.5 shadow-lg">
            <Maximize2 className="w-3.5 h-3.5" />
            Inspect Asset
          </span>
        </div>

        {/* Primary Tag */}
        {img.tags && img.tags[0] && (
          <div className="absolute top-3 left-3 z-10">
            <span className="px-2.5 py-0.5 rounded-full bg-foundation-dark/80 backdrop-blur-md text-[11px] font-mono text-brand-cyan border border-foundation-slate">
              {img.tags[0]}
            </span>
          </div>
        )}
      </div>

      {/* Text Info */}
      <div className="p-5 space-y-2">
        <h4 className="font-display font-bold text-typo-white text-lg group-hover:text-brand-cyan transition-colors">
          {img.title}
        </h4>
        {img.caption && (
          <p className="font-sans text-xs text-typo-gray leading-relaxed line-clamp-2">
            {img.caption}
          </p>
        )}
        <div className="pt-2 flex items-center justify-between text-xs font-mono text-typo-gray border-t border-foundation-slate/40">
          <span>REF #{displayRef}</span>
          <span className="text-brand-cyan flex items-center gap-1">
            <Eye className="w-3 h-3" />
            View Details
          </span>
        </div>
      </div>
    </article>
  );
}
