"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  FileText,
  Users,
  Info,
  Milestone,
  Award,
  Layers,
  Trophy,
  Image as ImageIcon,
  Mail,
  Mic,
  LogOut,
  ExternalLink,
  X,
} from "lucide-react";

interface AdminSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const NAV_ITEMS = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/dashboard/events", label: "Events", icon: Calendar },
  { href: "/admin/dashboard/speakers", label: "Previous Speakers", icon: Mic },
  { href: "/admin/dashboard/blogs", label: "Blogs", icon: FileText },
  { href: "/admin/dashboard/team", label: "Team", icon: Users },
  { href: "/admin/dashboard/about", label: "About Info", icon: Info },
  { href: "/admin/dashboard/journey", label: "Journey", icon: Milestone },
  { href: "/admin/dashboard/leadership", label: "Leadership", icon: Award },
  { href: "/admin/dashboard/collaborations", label: "Collaborations", icon: Layers },
  { href: "/admin/dashboard/achievements", label: "Achievements", icon: Trophy },
  { href: "/admin/dashboard/gallery", label: "Gallery", icon: ImageIcon },
  { href: "/admin/dashboard/contact", label: "Contact Inquiries", icon: Mail },
];

export function AdminSidebar({ isOpen = false, onClose }: AdminSidebarProps) {
  let pathname = "";
  try {
    pathname = usePathname() || "";
  } catch {
    pathname = "";
  }
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/auth/logout", { method: "POST" });
      router.push("/admin");
      router.refresh();
    } catch {
      router.push("/admin");
    }
  };

  const content = (
    <div className="flex flex-col h-full bg-foundation-dark border-r border-foundation-slate/80 p-5 space-y-6">
      {/* Brand Header */}
      <div className="flex items-center justify-between pb-4 border-b border-foundation-slate/60">
        <Link href="/admin/dashboard" className="flex items-center gap-3">
          <div className="relative w-8 h-8 rounded-lg bg-foundation-slate/80 border border-brand-blue/40 flex items-center justify-center p-1">
            <Image
              src="/images/iedc-logo.png"
              alt="IEDC Logo"
              width={26}
              height={26}
              className="object-contain"
            />
          </div>
          <div>
            <span className="font-display font-bold text-typo-white text-base block leading-none">
              IEDC CMS
            </span>
            <span className="text-[10px] font-mono text-brand-cyan tracking-wider uppercase">
              TKIET Console
            </span>
          </div>
        </Link>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-typo-gray hover:text-typo-white hover:bg-foundation-slate/60"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1 overflow-y-auto pr-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/admin/dashboard"
              ? pathname === "/admin/dashboard"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-sans font-medium transition-all ${
                isActive
                  ? "bg-brand-blue text-typo-white shadow-[0_0_15px_rgba(37,99,235,0.35)]"
                  : "text-typo-gray hover:text-typo-white hover:bg-foundation-slate/50"
              }`}
            >
              <Icon
                className={`w-4 h-4 ${
                  isActive ? "text-typo-white" : "text-brand-cyan/80"
                }`}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Profile & Actions */}
      <div className="pt-4 border-t border-foundation-slate/60 space-y-2">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-sans text-typo-gray hover:text-typo-white hover:bg-foundation-slate/40 transition-colors"
        >
          <span className="flex items-center gap-2">
            <ExternalLink className="w-3.5 h-3.5 text-brand-cyan" />
            <span>Public Website</span>
          </span>
          <span className="text-[10px] font-mono text-typo-gray/60">New Tab</span>
        </a>

        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-sans text-red-400 hover:text-red-300 hover:bg-red-950/30 transition-colors text-left"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:block w-64 h-screen sticky top-0 shrink-0">
        {content}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-foundation-space/80 backdrop-blur-sm"
            onClick={onClose}
          />
          <div className="relative w-64 max-w-[80vw] h-full z-10 animate-fadeIn">
            {content}
          </div>
        </div>
      )}
    </>
  );
}
