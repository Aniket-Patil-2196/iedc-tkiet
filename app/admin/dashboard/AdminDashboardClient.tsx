"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Calendar,
  FileText,
  Users,
  Trophy,
  Image as ImageIcon,
  Mail,
  MessageSquare,
  ArrowUpRight,
  ShieldCheck,
  Clock,
  Sparkles,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";

interface StatsData {
  databaseConnected: boolean;
  stats: {
    eventsCount: number;
    blogsCount: number;
    teamCount: number;
    achievementsCount: number;
    galleryCount: number;
    unreadContactsCount: number;
    pendingCommentsCount?: number;
    totalCommentsCount?: number;
  };
  recentActivity: {
    latestEvent: string | null;
    latestBlog: string | null;
    latestContact: string | null;
  };
}

export default function AdminDashboardClient() {
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetch("/api/admin/stats", {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setData(json);
      } else {
        setFetchError(json.error || "Failed to load live metrics.");
      }
    } catch (e: any) {
      console.error("Failed to fetch stats", e);
      setFetchError("Network error: Could not reach statistics service.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const statsCards = [
    {
      title: "Active Events",
      count: data?.stats.eventsCount ?? "—",
      icon: Calendar,
      href: "/admin/dashboard/events",
      subtext: "Hackathons, Workshops, Sprints",
    },
    {
      title: "Published Blogs",
      count: data?.stats.blogsCount ?? "—",
      icon: FileText,
      href: "/admin/dashboard/blogs",
      subtext: "IEDC TKIET Institutional Articles",
    },
    {
      title: "Pending Comments",
      count: data?.stats.pendingCommentsCount ?? "—",
      icon: MessageSquare,
      href: "/admin/dashboard/comments",
      subtext: "Comments awaiting moderation",
      highlight: (data?.stats.pendingCommentsCount ?? 0) > 0,
    },
    {
      title: "Team Members",
      count: data?.stats.teamCount ?? "—",
      icon: Users,
      href: "/admin/dashboard/team",
      subtext: "Student Council & Faculty Leads",
    },
    {
      title: "Achievements",
      count: data?.stats.achievementsCount ?? "—",
      icon: Trophy,
      href: "/admin/dashboard/achievements",
      subtext: "National Awards & IP Disclosures",
    },
    {
      title: "Gallery Records",
      count: data?.stats.galleryCount ?? "—",
      icon: ImageIcon,
      href: "/admin/dashboard/gallery",
      subtext: "3D Globe Constellation Photos",
    },
    {
      title: "Unread Inquiries",
      count: data?.stats.unreadContactsCount ?? "—",
      icon: Mail,
      href: "/admin/dashboard/contact",
      subtext: "Incoming Public Messages",
    },
  ];

  return (
    <div className="flex flex-col flex-1">
      <AdminHeader
        title="Executive Overview"
        subtitle="Institutional content metrics and cell administrative status"
      />

      <main className="p-6 sm:p-8 space-y-8 max-w-7xl mx-auto w-full">
        {/* Top Institutional Status Banner */}
        <div
          className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border ${
            fetchError
              ? "bg-red-950/40 border-red-500/50"
              : data?.databaseConnected
              ? "bg-foundation-dark border-foundation-slate"
              : "bg-amber-950/40 border-amber-500/50"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-foundation-slate/70 border border-brand-cyan/40 flex items-center justify-center shrink-0">
              {fetchError ? (
                <AlertTriangle className="w-5 h-5 text-red-400" />
              ) : (
                <ShieldCheck className="w-5 h-5 text-brand-cyan" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-mono tracking-wider text-typo-white font-semibold">
                  TKIET IEDC System Status:
                </span>
                {fetchError ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-950/80 border border-red-500/60 text-[11px] font-mono text-red-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                    Database Unreachable
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-500/50 text-[11px] font-mono text-emerald-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Operational
                  </span>
                )}
              </div>
              <p className="text-xs font-sans text-typo-gray mt-0.5">
                {fetchError
                  ? fetchError
                  : data?.databaseConnected
                  ? "MongoDB live persistence active. Counts reflect real-time documents."
                  : "Database in fallback mode."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={fetchStats}
            disabled={loading}
            className="self-start sm:self-auto inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-foundation-slate/50 hover:bg-foundation-slate text-xs font-sans text-typo-gray hover:text-typo-white border border-foundation-slate transition-colors"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
            />
            <span>Refresh Metrics</span>
          </button>
        </div>

        {/* Concise Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {statsCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.title}
                href={card.href}
                className={`group p-6 rounded-2xl bg-foundation-dark border transition-all duration-300 flex flex-col justify-between ${
                  card.highlight
                    ? "border-brand-cyan/60 shadow-[0_0_25px_rgba(56,189,248,0.15)]"
                    : "border-foundation-slate hover:border-brand-blue/50"
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="w-11 h-11 rounded-xl bg-foundation-slate/60 border border-foundation-slate flex items-center justify-center">
                      <Icon className="w-5 h-5 text-brand-cyan group-hover:scale-110 transition-transform" />
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-typo-gray/60 group-hover:text-typo-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                  </div>

                  <div>
                    <span className="font-display text-3xl sm:text-4xl font-extrabold text-typo-white">
                      {card.count}
                    </span>
                    <h3 className="font-display font-bold text-typo-white text-base mt-1 group-hover:text-brand-cyan transition-colors">
                      {card.title}
                    </h3>
                    <p className="text-xs font-sans text-typo-gray mt-1">
                      {card.subtext}
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-6 border-t border-foundation-slate/60 flex items-center justify-between text-xs font-mono text-brand-cyan group-hover:text-typo-white transition-colors">
                  <span>Manage Collection</span>
                  <span>&rarr;</span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Recent Node Activity */}
        <div className="p-6 rounded-2xl bg-foundation-dark border border-foundation-slate space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-brand-cyan" />
            <h3 className="font-display font-bold text-sm text-typo-white uppercase tracking-wider">
              Most Recent Node Activity
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-sans">
            <div className="p-3.5 rounded-xl bg-foundation-slate/30 border border-foundation-slate">
              <span className="text-[10px] font-mono uppercase text-typo-gray block">
                Latest Event
              </span>
              <p className="font-semibold text-typo-white mt-1 line-clamp-1">
                {data?.recentActivity.latestEvent || "No recent event recorded"}
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-foundation-slate/30 border border-foundation-slate">
              <span className="text-[10px] font-mono uppercase text-typo-gray block">
                Latest Published Article
              </span>
              <p className="font-semibold text-typo-white mt-1 line-clamp-1">
                {data?.recentActivity.latestBlog || "No recent blog published"}
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-foundation-slate/30 border border-foundation-slate">
              <span className="text-[10px] font-mono uppercase text-typo-gray block">
                Latest Inbound Inquiry
              </span>
              <p className="font-semibold text-typo-white mt-1 line-clamp-1">
                {data?.recentActivity.latestContact || "No unread inquiries"}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
