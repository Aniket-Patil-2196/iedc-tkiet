"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { PUBLIC_NAV_ITEMS } from "@/lib/constants/site";
import { X, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import gsap from "gsap";

interface NavOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NavOverlay({ isOpen, onClose }: NavOverlayProps) {
  const pathname = usePathname();
  const overlayRef = useRef<HTMLDivElement>(null);
  const linksContainerRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Body scroll locking with scrollbar compensation
  useEffect(() => {
    if (isOpen) {
      const scrollbarWidth =
        window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = "hidden";
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }
    } else {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    }

    return () => {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    };
  }, [isOpen]);

  // Coordinated GSAP Opening & Closing Animation
  useEffect(() => {
    if (!isOpen || !overlayRef.current) return;

    const ctx = gsap.context(() => {
      gsap.set(overlayRef.current, { opacity: 0 });
      gsap.set(
        linksContainerRef.current?.querySelectorAll(".nav-anim-item") || [],
        {
          opacity: 0,
          y: 16,
        }
      );

      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.to(overlayRef.current, {
        opacity: 1,
        duration: 0.25,
      }).to(
        linksContainerRef.current?.querySelectorAll(".nav-anim-item") || [],
        {
          opacity: 1,
          y: 0,
          duration: 0.35,
          stagger: 0.035,
        },
        "-=0.1"
      );
    }, overlayRef);

    // Initial focus on close button
    closeButtonRef.current?.focus();

    return () => {
      ctx.revert();
    };
  }, [isOpen]);

  // Keyboard navigation & Focus trap
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleCloseWithAnimation();
        return;
      }

      if (e.key === "Tab") {
        if (!overlayRef.current) return;
        const focusableElements =
          overlayRef.current.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
          );
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Smooth exit animation before calling onClose
  const handleCloseWithAnimation = () => {
    if (!overlayRef.current) {
      onClose();
      return;
    }

    gsap.to(overlayRef.current, {
      opacity: 0,
      duration: 0.2,
      ease: "power2.in",
      onComplete: onClose,
    });
  };

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label="Site Navigation"
      className="fixed inset-0 z-50 flex flex-col bg-foundation-darkest/98 backdrop-blur-2xl select-none"
    >
      {/* Background subtle diagonal grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#151B26_1px,transparent_1px),linear-gradient(to_bottom,#151B26_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20 pointer-events-none" />

      {/* Top Header inside overlay */}
      <div className="relative z-10 flex items-center justify-between px-6 sm:px-12 md:px-16 py-5 border-b border-foundation-slate/50">
        <div className="flex items-center gap-3">
          <div className="relative w-8 h-8 rounded-full overflow-hidden border border-brand-cyan/40">
            <Image
              src="/images/iedc-logo.png"
              alt="IEDC Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <div className="flex flex-col">
            <span className="font-display font-bold text-typo-white text-sm sm:text-base tracking-wider">
              IEDC TKIET
            </span>
            <span className="text-[10px] text-typo-gray tracking-tight">
              Innovation & Entrepreneurship Platform
            </span>
          </div>
        </div>

        <button
          ref={closeButtonRef}
          onClick={handleCloseWithAnimation}
          aria-label="Close navigation"
          className="group p-2 sm:px-3 sm:py-2 rounded-lg bg-foundation-slate/40 border border-foundation-slate text-typo-gray hover:text-typo-white hover:border-brand-cyan/50 hover:bg-foundation-slate/80 transition-all flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-brand-cyan"
        >
          <span className="text-xs uppercase tracking-widest font-sans font-semibold hidden sm:inline text-typo-gray group-hover:text-typo-white">
            Close
          </span>
          <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-200" />
        </button>
      </div>

      {/* Main navigation content — Clean, focused, spacious single-column list */}
      <div className="relative z-10 flex-1 overflow-y-auto px-6 sm:px-12 md:px-16 py-8 md:py-12 flex flex-col justify-center">
        <div className="max-w-4xl mx-auto w-full">
          <nav
            ref={linksContainerRef}
            aria-label="Main Navigation Menu"
            className="flex flex-col space-y-2 sm:space-y-3 md:space-y-4"
          >
            {PUBLIC_NAV_ITEMS.map((item, idx) => {
              const isCurrentRoute =
                pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(item.href));

              return (
                <div
                  key={item.href}
                  className="nav-anim-item group flex items-center justify-between"
                >
                  <Link
                    href={item.href}
                    onClick={handleCloseWithAnimation}
                    className={cn(
                      "font-display text-2xl sm:text-3xl md:text-4xl lg:text-[2.75rem] font-bold tracking-tight transition-all duration-200 flex items-center gap-3 sm:gap-4 group-hover:translate-x-2.5",
                      isCurrentRoute
                        ? "text-brand-cyan"
                        : "text-typo-white hover:text-brand-cyan"
                    )}
                  >
                    <span className="font-mono text-xs sm:text-sm text-typo-gray/40 group-hover:text-brand-cyan/70 transition-colors w-6">
                      0{idx + 1}
                    </span>
                    <span>{item.title}</span>
                    <ArrowUpRight className="w-5 h-5 sm:w-6 sm:h-6 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-brand-cyan" />
                  </Link>

                  {isCurrentRoute && (
                    <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-blue/10 border border-brand-cyan/40 text-[11px] font-sans text-brand-cyan uppercase tracking-wider">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-cyan animate-pulse" />
                      Active
                    </span>
                  )}
                </div>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Subtle bottom bar */}
      <div className="relative z-10 px-6 sm:px-12 md:px-16 py-4 border-t border-foundation-slate/40 flex items-center justify-between text-xs font-sans text-typo-gray/60">
        <span>TKIET Warananagar</span>
        <span className="font-mono text-[11px]">Press ESC to close</span>
      </div>
    </div>
  );
}
