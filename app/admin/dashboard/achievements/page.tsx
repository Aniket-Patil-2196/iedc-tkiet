"use client";

import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Trophy, Eye, EyeOff, Award } from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminModal } from "@/components/admin/AdminModal";
import { DeleteConfirmModal } from "@/components/admin/DeleteConfirmModal";
import { ImageInput } from "@/components/admin/ImageInput";
import { Button } from "@/components/ui/Button";
import { IAchievement } from "@/types/content";

export default function AdminAchievementsPage() {
  const [achievements, setAchievements] = useState<IAchievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<IAchievement | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<IAchievement | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    category: "National Competition",
    year: "2024",
    shortDescription: "",
    description: "",
    recipientOrTeam: "",
    verifiedLink: "https://tkiet.ac.in",
    certificateImage: "/images/placeholders/certificate-nec.svg",
    published: true,
    order: 1,
  });

  const fetchAchievements = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/achievements");
      const json = await res.json();
      if (json.success) {
        setAchievements(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAchievements();
  }, []);

  const openCreateModal = () => {
    setEditingItem(null);
    setFormData({
      title: "",
      category: "National Competition",
      year: new Date().getFullYear().toString(),
      shortDescription: "",
      description: "",
      recipientOrTeam: "",
      verifiedLink: "https://tkiet.ac.in",
      certificateImage: "/images/placeholders/certificate-nec.svg",
      published: true,
      order: achievements.length + 1,
    });
    setModalOpen(true);
  };

  const openEditModal = (item: IAchievement) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      category: item.category,
      year: item.year,
      shortDescription: item.shortDescription || "",
      description: item.description,
      recipientOrTeam: item.recipientOrTeam || "",
      verifiedLink: item.verifiedLink || "",
      certificateImage: item.certificateImage || "",
      published: item.published !== false,
      order: item.order || 1,
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const isEdit = Boolean(editingItem);
      const url = isEdit
        ? `/api/admin/achievements/${(editingItem as any)._id || editingItem?.id}`
        : "/api/admin/achievements";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (json.success) {
        setModalOpen(false);
        fetchAchievements();
      } else {
        alert(json.error || "Failed to save achievement.");
      }
    } catch {
      alert("Network error.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    setSaving(true);

    try {
      const id = (itemToDelete as any)._id || itemToDelete.id;
      const res = await fetch(`/api/admin/achievements/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        setDeleteModalOpen(false);
        setItemToDelete(null);
        fetchAchievements();
      } else {
        alert(json.error || "Failed to delete achievement.");
      }
    } catch {
      alert("Network error.");
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async (item: IAchievement) => {
    const id = (item as any)._id || item.id;
    try {
      await fetch(`/api/admin/achievements/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: item.published === false }),
      });
      fetchAchievements();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col flex-1">
      <AdminHeader
        title="Achievements & Honors"
        subtitle="Manage competition awards, patent publications, and institutional honors"
        onToggleSidebar={() => {}}
      />

      <main className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-xl font-bold text-typo-white">
              Institutional Milestones ({achievements.length})
            </h2>
            <p className="text-xs font-sans text-typo-gray">
              Published achievements display along the chronological timeline on /achievements.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-blue hover:bg-blue-600 text-typo-white text-xs font-sans font-semibold shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Record Achievement</span>
          </button>
        </div>

        {loading ? (
          <div className="p-12 rounded-2xl bg-foundation-dark border border-foundation-slate text-center text-xs font-sans text-typo-gray">
            Loading achievement records...
          </div>
        ) : (
          <div className="rounded-2xl bg-foundation-dark border border-foundation-slate overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-foundation-slate/40 text-typo-gray border-b border-foundation-slate uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-4">Status</th>
                    <th className="p-4">Year</th>
                    <th className="p-4">Honor / Title</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Recipient / Team</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-foundation-slate/50">
                  {achievements.map((item) => {
                    const isPublished = item.published !== false;
                    return (
                      <tr
                        key={(item as any)._id || item.id}
                        className="hover:bg-foundation-slate/20 transition-colors"
                      >
                        <td className="p-4 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => togglePublish(item)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold transition-all ${
                              isPublished
                                ? "bg-emerald-950/60 text-emerald-400 border border-emerald-500/50"
                                : "bg-amber-950/60 text-amber-400 border border-amber-500/50"
                            }`}
                          >
                            {isPublished ? (
                              <>
                                <Eye className="w-3 h-3" />
                                <span>PUBLISHED</span>
                              </>
                            ) : (
                              <>
                                <EyeOff className="w-3 h-3" />
                                <span>DRAFT</span>
                              </>
                            )}
                          </button>
                        </td>

                        <td className="p-4 font-mono text-brand-cyan font-bold whitespace-nowrap">
                          {item.year}
                        </td>

                        <td className="p-4 max-w-sm">
                          <span className="font-semibold text-typo-white block">
                            {item.title}
                          </span>
                          <span className="text-[11px] text-typo-gray truncate block mt-0.5">
                            {item.shortDescription || item.description}
                          </span>
                        </td>

                        <td className="p-4 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded bg-foundation-slate text-[11px] text-brand-cyan">
                            {item.category}
                          </span>
                        </td>

                        <td className="p-4 whitespace-nowrap text-typo-gray">
                          {item.recipientOrTeam || "—"}
                        </td>

                        <td className="p-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openEditModal(item)}
                              className="p-1.5 rounded-lg bg-foundation-slate/50 hover:bg-foundation-slate text-typo-white transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setItemToDelete(item);
                                setDeleteModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/50 text-red-300 border border-red-500/30 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Editor Modal */}
      <AdminModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingItem ? "Edit Achievement Record" : "Record Institutional Achievement"}
        subtitle="Chronological achievements reflect on the verified institutional timeline"
        maxWidth="2xl"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-typo-gray uppercase tracking-wider">
                Year *
              </label>
              <input
                type="text"
                required
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                placeholder="2024"
                className="w-full px-4 py-2.5 rounded-xl bg-foundation-slate/50 border border-foundation-slate text-typo-white text-xs focus:outline-none focus:border-brand-cyan"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-typo-gray uppercase tracking-wider">
                Category
              </label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="National Competition, Patenting & IP"
                className="w-full px-4 py-2.5 rounded-xl bg-foundation-slate/50 border border-foundation-slate text-typo-white text-xs focus:outline-none focus:border-brand-cyan"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-typo-gray uppercase tracking-wider">
              Achievement Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. National Entrepreneurship Challenge (NEC) Top Tier"
              className="w-full px-4 py-2.5 rounded-xl bg-foundation-slate/50 border border-foundation-slate text-typo-white text-xs focus:outline-none focus:border-brand-cyan"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-typo-gray uppercase tracking-wider">
                Conferred Upon / Recipient Team
              </label>
              <input
                type="text"
                value={formData.recipientOrTeam}
                onChange={(e) =>
                  setFormData({ ...formData, recipientOrTeam: e.target.value })
                }
                placeholder="e.g. Team AgroSense (ECE & Mech)"
                className="w-full px-4 py-2.5 rounded-xl bg-foundation-slate/50 border border-foundation-slate text-typo-white text-xs focus:outline-none focus:border-brand-cyan"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-typo-gray uppercase tracking-wider">
                Display Order
              </label>
              <input
                type="number"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) })}
                className="w-full px-4 py-2.5 rounded-xl bg-foundation-slate/50 border border-foundation-slate text-typo-white text-xs focus:outline-none focus:border-brand-cyan"
              />
            </div>
          </div>

          <ImageInput
            label="Certificate / Document Preview"
            value={formData.certificateImage}
            onChange={(url) => setFormData({ ...formData, certificateImage: url })}
          />

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-typo-gray uppercase tracking-wider">
              Short Summary
            </label>
            <input
              type="text"
              value={formData.shortDescription}
              onChange={(e) =>
                setFormData({ ...formData, shortDescription: e.target.value })
              }
              placeholder="1-sentence teaser for timeline card"
              className="w-full px-4 py-2.5 rounded-xl bg-foundation-slate/50 border border-foundation-slate text-typo-white text-xs focus:outline-none focus:border-brand-cyan"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-typo-gray uppercase tracking-wider">
              Citation &amp; Full Impact Details *
            </label>
            <textarea
              required
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detailed technical explanation and institutional milestone narrative..."
              className="w-full px-4 py-2.5 rounded-xl bg-foundation-slate/50 border border-foundation-slate text-typo-white text-xs focus:outline-none focus:border-brand-cyan"
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-foundation-slate/60">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-sans text-typo-white">
              <input
                type="checkbox"
                checked={formData.published}
                onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                className="w-4 h-4 rounded bg-foundation-slate border border-foundation-slate text-brand-blue focus:ring-0"
              />
              <span>Publish Immediately (Visible on /achievements)</span>
            </label>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" disabled={saving}>
                {saving ? "Saving..." : editingItem ? "Save Changes" : "Record"}
              </Button>
            </div>
          </div>
        </form>
      </AdminModal>

      {/* Delete Confirmation */}
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        title={itemToDelete?.title || ""}
        itemDescription="Achievement record"
        isDeleting={saving}
        onConfirm={handleDelete}
        onCancel={() => {
          setDeleteModalOpen(false);
          setItemToDelete(null);
        }}
      />
    </div>
  );
}
