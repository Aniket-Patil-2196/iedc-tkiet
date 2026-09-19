"use client";

import React, { useState, useEffect } from "react";
import { Edit2, Award, UserCheck } from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminModal } from "@/components/admin/AdminModal";
import { ImageInput } from "@/components/admin/ImageInput";
import { Button } from "@/components/ui/Button";
import { ILeadershipMessage } from "@/types/content";

export default function AdminLeadershipPage() {
  const [messages, setMessages] = useState<ILeadershipMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ILeadershipMessage | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    leaderName: "",
    designation: "",
    institution: "Tatyasaheb Kore Institute of Engineering and Technology (TKIET)",
    message: "",
    avatarUrl: "",
    order: 1,
  });

  const fetchLeadership = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/leadership", { cache: "no-store" });
      const json = await res.json();
      if (json.success) {
        setMessages(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeadership();
  }, []);

  const openEditModal = (item: ILeadershipMessage) => {
    setEditingItem(item);
    setFormData({
      leaderName: item.leaderName,
      designation: item.designation,
      institution: item.institution || "Tatyasaheb Kore Institute of Engineering and Technology (TKIET)",
      message: item.message,
      avatarUrl: item.avatarUrl || "",
      order: item.order || 1,
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    setSaving(true);

    try {
      const id = (editingItem as any)._id || editingItem.id;
      const res = await fetch(`/api/admin/leadership/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (json.success) {
        setModalOpen(false);
        fetchLeadership();
      } else {
        alert(json.error || "Failed to update leadership message.");
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
        title="Institutional Leadership Messages"
        subtitle="Manage the 5 designated leadership perspectives and executive guidance statements"
        onToggleSidebar={() => {}}
      />

      <main className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto w-full">
        <div>
          <h2 className="font-display text-xl font-bold text-typo-white">
            Designated Positions (Exactly 5)
          </h2>
          <p className="text-xs font-sans text-typo-gray">
            CEO, Principal, Dean, IEDC Coordinator, and IEDC President. Update actual appointee names and statements.
          </p>
        </div>

        {loading ? (
          <div className="p-12 rounded-2xl bg-foundation-dark border border-foundation-slate text-center text-xs font-sans text-typo-gray">
            Loading leadership registry...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {messages.map((item) => (
              <div
                key={(item as any)._id || item.id}
                className="p-6 rounded-2xl bg-foundation-dark border border-foundation-slate flex flex-col justify-between space-y-4 group hover:border-brand-blue/50 transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="w-8 h-8 rounded-lg bg-foundation-slate/70 border border-brand-cyan/40 flex items-center justify-center font-mono text-xs font-bold text-brand-cyan">
                      #{item.order}
                    </span>
                    <span className="text-[10px] font-mono text-typo-gray uppercase">
                      Position {item.order} of 5
                    </span>
                  </div>

                  <div>
                    <span className="text-xs uppercase font-mono tracking-wider text-brand-cyan block">
                      {item.designation}
                    </span>
                    <h3 className="font-display text-lg font-bold text-typo-white mt-0.5">
                      {item.leaderName}
                    </h3>
                  </div>

                  <p className="font-sans text-xs text-typo-gray line-clamp-3 leading-relaxed">
                    {item.message}
                  </p>
                </div>

                <div className="pt-4 border-t border-foundation-slate/50 flex items-center justify-between">
                  <span className="text-[11px] text-typo-gray/70">
                    Official Statement
                  </span>
                  <button
                    type="button"
                    onClick={() => openEditModal(item)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-foundation-slate/60 hover:bg-foundation-slate text-xs font-sans text-typo-white hover:text-brand-cyan transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Name &amp; Message</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Editor Modal */}
      <AdminModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`Edit ${formData.designation}`}
        subtitle="Configure the appointee name, photograph, and official institutional message"
        maxWidth="2xl"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-typo-gray uppercase tracking-wider">
                Official Designation (Fixed)
              </label>
              <input
                type="text"
                disabled
                value={formData.designation}
                className="w-full px-4 py-2.5 rounded-xl bg-foundation-slate/30 border border-foundation-slate text-typo-white/70 text-xs cursor-not-allowed"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-typo-gray uppercase tracking-wider">
                Appointee Full Name *
              </label>
              <input
                type="text"
                required
                value={formData.leaderName}
                onChange={(e) =>
                  setFormData({ ...formData, leaderName: e.target.value })
                }
                placeholder="e.g. Dr. [Appointee Name]"
                className="w-full px-4 py-2.5 rounded-xl bg-foundation-slate/50 border border-foundation-slate text-typo-white text-xs focus:outline-none focus:border-brand-cyan"
              />
            </div>
          </div>

          <ImageInput
            label="Portrait / Photo"
            value={formData.avatarUrl}
            onChange={(url) => setFormData({ ...formData, avatarUrl: url })}
          />

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-typo-gray uppercase tracking-wider">
              Official Message &amp; Vision *
            </label>
            <textarea
              required
              rows={6}
              value={formData.message}
              onChange={(e) =>
                setFormData({ ...formData, message: e.target.value })
              }
              placeholder="Enter leadership message delivered to student founders and faculty..."
              className="w-full px-4 py-3 rounded-xl bg-foundation-slate/50 border border-foundation-slate text-typo-white text-xs focus:outline-none focus:border-brand-cyan leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-foundation-slate/60">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={saving}>
              {saving ? "Saving..." : "Save Message"}
            </Button>
          </div>
        </form>
      </AdminModal>
    </div>
  );
}
