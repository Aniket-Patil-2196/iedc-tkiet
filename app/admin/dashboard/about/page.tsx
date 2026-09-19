"use client";

import React, { useState, useEffect } from "react";
import { Info, Check, Save } from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Button } from "@/components/ui/Button";

export default function AdminAboutPage() {
  const [whoWeAre, setWhoWeAre] = useState("");
  const [vision, setVision] = useState("");
  const [mission, setMission] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    fetch("/api/admin/about")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          setWhoWeAre(json.data.whoWeAre || "");
          setVision(json.data.vision || "");
          setMission(json.data.mission || "");
        }
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    try {
      const res = await fetch("/api/admin/about", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ whoWeAre, vision, mission }),
      });

      const json = await res.json();
      if (json.success) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 4000);
      } else {
        alert(json.error || "Failed to update about content.");
      }
    } catch {
      alert("Network error.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col flex-1">
      <AdminHeader
        title="About Institutional Content"
        subtitle="Manage foundational Who We Are narrative, vision statement, and mission mandates"
        onToggleSidebar={() => {}}
      />

      <main className="p-6 sm:p-8 space-y-6 max-w-5xl mx-auto w-full">
        {loading ? (
          <div className="p-12 rounded-2xl bg-foundation-dark border border-foundation-slate text-center text-xs font-sans text-typo-gray">
            Loading institutional narrative...
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-6">
            <div className="p-6 sm:p-8 rounded-2xl bg-foundation-dark border border-foundation-slate space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-foundation-slate/60">
                <div className="flex items-center gap-2 text-xs font-mono text-brand-cyan">
                  <Info className="w-4 h-4" />
                  <span className="uppercase tracking-wider font-semibold">
                    Core Institutional Statements
                  </span>
                </div>

                {savedSuccess && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/50 text-xs font-mono text-emerald-300 animate-fadeIn">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    Updated &amp; Synced to /about
                  </span>
                )}
              </div>

              {/* Who We Are */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-typo-white uppercase tracking-wider block">
                  1. Who We Are Statement
                </label>
                <textarea
                  required
                  rows={4}
                  value={whoWeAre}
                  onChange={(e) => setWhoWeAre(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-foundation-slate/50 border border-foundation-slate text-typo-white text-xs leading-relaxed focus:outline-none focus:border-brand-cyan"
                  placeholder="Outline the foundational identity of IEDC at TKIET..."
                />
              </div>

              {/* Vision */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-typo-white uppercase tracking-wider block">
                  2. Vision Mandate
                </label>
                <textarea
                  required
                  rows={3}
                  value={vision}
                  onChange={(e) => setVision(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-foundation-slate/50 border border-foundation-slate text-typo-white text-xs leading-relaxed focus:outline-none focus:border-brand-cyan"
                  placeholder="The long-term vision of technological entrepreneurship..."
                />
              </div>

              {/* Mission */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-typo-white uppercase tracking-wider block">
                  3. Mission Directive
                </label>
                <textarea
                  required
                  rows={4}
                  value={mission}
                  onChange={(e) => setMission(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-foundation-slate/50 border border-foundation-slate text-typo-white text-xs leading-relaxed focus:outline-none focus:border-brand-cyan"
                  placeholder="The actionable mission pillars and incubator objectives..."
                />
              </div>

              <div className="pt-4 border-t border-foundation-slate/60 flex items-center justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={saving}
                  className="inline-flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? "Updating..." : "Save Statements"}</span>
                </Button>
              </div>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
