"use client";

import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, ArrowUp, ArrowDown, Eye, EyeOff } from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminModal } from "@/components/admin/AdminModal";
import { DeleteConfirmModal } from "@/components/admin/DeleteConfirmModal";
import { Button } from "@/components/ui/Button";
import { IJourneyMilestone } from "@/types/content";

export default function AdminJourneyPage() {
  const [milestones, setMilestones] = useState<IJourneyMilestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<IJourneyMilestone | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<IJourneyMilestone | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    year: "2024",
    title: "",
    label: "",
    summary: "",
    description: "",
    highlightMetric: "",
    accent: "oceanic",
    published: true,
    order: 1,
  });

  const fetchMilestones = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/journey");
      const json = await res.json();
      if (json.success) {
        setMilestones(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMilestones();
  }, []);

  const openCreateModal = () => {
    setEditingMilestone(null);
    const nextOrder = milestones.length + 1;
    const padded = nextOrder < 10 ? "0" + nextOrder : nextOrder;
    setFormData({
      year: new Date().getFullYear().toString(),
      title: "",
      label: padded + " // PHASE",
      summary: "",
      description: "",
      highlightMetric: "",
      accent: nextOrder % 5 === 1 ? "embryo" : nextOrder % 5 === 2 ? "oceanic" : nextOrder % 5 === 3 ? "nexus" : nextOrder % 5 === 4 ? "gas_giant" : "radiant",
      published: true,
      order: nextOrder,
    });
    setModalOpen(true);
  };

  const openEditModal = (m: IJourneyMilestone) => {
    setEditingMilestone(m);
    setFormData({
      year: m.year,
      title: m.title,
      label: m.label || m.phaseLabel || "",
      summary: m.summary || "",
      description: m.description,
      highlightMetric: m.highlightMetric || m.metric || "",
      accent: m.accent || m.planetType || "oceanic",
      published: m.published !== false,
      order: m.order || 1,
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const isEdit = Boolean(editingMilestone);
      const id = (editingMilestone as any)?._id || editingMilestone?.id;
      const url = isEdit ? "/api/admin/journey/" + id : "/api/admin/journey";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (json.success) {
        setModalOpen(false);
        fetchMilestones();
      } else {
        alert(json.error || "Failed to save milestone.");
      }
    } catch {
      alert("Network error.");
    } finally {
      setSaving(false);
    }
  };

  const handleReorder = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= milestones.length) return;

    const currentItem = milestones[index];
    const targetItem = milestones[targetIndex];
    if (!currentItem || !targetItem) return;

    const currentId = (currentItem as any)._id || currentItem.id;
    const targetId = (targetItem as any)._id || targetItem.id;

    // Swap orders
    const currentOrder = currentItem.order || index + 1;
    const targetOrder = targetItem.order || targetIndex + 1;

    try {
      await Promise.all([
        fetch("/api/admin/journey/" + currentId, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order: targetOrder }),
        }),
        fetch("/api/admin/journey/" + targetId, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order: currentOrder }),
        }),
      ]);
      fetchMilestones();
    } catch (err) {
      console.error("Failed to reorder:", err);
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    setSaving(true);

    try {
      const id = (itemToDelete as any)._id || itemToDelete.id;
      const res = await fetch("/api/admin/journey/" + id, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        setDeleteModalOpen(false);
        setItemToDelete(null);
        fetchMilestones();
      } else {
        alert(json.error || "Failed to delete milestone.");
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
        title="Journey Space Exploration CMS"
        subtitle="Manage dynamic milestone planets, orbital path sequence, and published timeline records"
        onToggleSidebar={() => {}}
      />

      <main className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-xl font-bold text-typo-white">
              Dynamic Milestones ({milestones.length})
            </h2>
            <p className="text-xs font-sans text-typo-gray">
              Milestones dynamically generate interactive planets along the orbital flight path.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-blue hover:bg-blue-600 text-typo-white text-xs font-sans font-semibold shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Milestone</span>
          </button>
        </div>

        {loading ? (
          <div className="p-12 rounded-2xl bg-foundation-dark border border-foundation-slate text-center text-xs font-sans text-typo-gray">
            Loading timeline records...
          </div>
        ) : (
          <div className="rounded-2xl bg-foundation-dark border border-foundation-slate overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-foundation-slate/40 text-typo-gray border-b border-foundation-slate uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-4">Seq</th>
                    <th className="p-4">Stage / Year</th>
                    <th className="p-4">Milestone Title</th>
                    <th className="p-4">Planet Theme</th>
                    <th className="p-4">Metric</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-foundation-slate/50">
                  {milestones.map((m, idx) => (
                    <tr
                      key={(m as any)._id || m.id}
                      className="hover:bg-foundation-slate/20 transition-colors"
                    >
                      {/* Sequence & Reorder Buttons */}
                      <td className="p-4 font-mono text-typo-gray whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="w-6">#{m.order || idx + 1}</span>
                          <div className="flex flex-col gap-0.5">
                            <button
                              type="button"
                              onClick={() => handleReorder(idx, "up")}
                              disabled={idx === 0}
                              title="Move Up"
                              className="p-0.5 rounded hover:bg-foundation-slate text-slate-400 hover:text-white disabled:opacity-20"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleReorder(idx, "down")}
                              disabled={idx === milestones.length - 1}
                              title="Move Down"
                              className="p-0.5 rounded hover:bg-foundation-slate text-slate-400 hover:text-white disabled:opacity-20"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Stage & Year */}
                      <td className="p-4 whitespace-nowrap">
                        <span className="font-mono text-xs text-brand-cyan font-bold block">
                          {m.year}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {m.label || m.phaseLabel || "0" + (idx + 1)}
                        </span>
                      </td>

                      {/* Title & Summary */}
                      <td className="p-4 max-w-md">
                        <span className="font-semibold text-typo-white block">
                          {m.title}
                        </span>
                        <span className="text-[11px] text-typo-gray truncate block mt-0.5">
                          {m.summary || m.description}
                        </span>
                      </td>

                      {/* Planet Theme */}
                      <td className="p-4 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider bg-slate-900 border border-slate-700/60 text-slate-300">
                          {m.accent || m.planetType || "oceanic"}
                        </span>
                      </td>

                      {/* Metric */}
                      <td className="p-4 whitespace-nowrap text-typo-gray">
                        {m.highlightMetric || m.metric || "—"}
                      </td>

                      {/* Status (Live vs Draft) */}
                      <td className="p-4 whitespace-nowrap">
                        {m.published !== false ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-950/60 border border-emerald-500/40 text-emerald-400">
                            <Eye className="w-3 h-3" />
                            Live
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-950/60 border border-amber-500/40 text-amber-400">
                            <EyeOff className="w-3 h-3" />
                            Draft
                          </span>
                        )}
                      </td>

                      {/* Action Buttons */}
                      <td className="p-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(m)}
                            className="p-1.5 rounded-lg bg-foundation-slate/50 hover:bg-foundation-slate text-typo-white transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setItemToDelete(m);
                              setDeleteModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/50 text-red-300 border border-red-500/30 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
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
        title={editingMilestone ? "Edit Journey Milestone" : "Add Journey Milestone"}
        subtitle="Dynamically generates a planet, SVG path segment, and rocket destination"
        maxWidth="2xl"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                Stage Label (e.g. 01 // BEGIN)
              </label>
              <input
                type="text"
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                placeholder="01 // BEGIN"
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
                onChange={(e) =>
                  setFormData({ ...formData, order: Number(e.target.value) })
                }
                className="w-full px-4 py-2.5 rounded-xl bg-foundation-slate/50 border border-foundation-slate text-typo-white text-xs focus:outline-none focus:border-brand-cyan"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-typo-gray uppercase tracking-wider">
                Milestone Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Prototyping Laboratory Inauguration"
                className="w-full px-4 py-2.5 rounded-xl bg-foundation-slate/50 border border-foundation-slate text-typo-white text-xs focus:outline-none focus:border-brand-cyan"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-typo-gray uppercase tracking-wider">
                Planet Visual Theme
              </label>
              <select
                value={formData.accent}
                onChange={(e) => setFormData({ ...formData, accent: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-foundation-slate/50 border border-foundation-slate text-typo-white text-xs focus:outline-none focus:border-brand-cyan"
              >
                <option value="embryo">Embryo (Warm Amber Molten Core)</option>
                <option value="oceanic">Oceanic (Sapphire Blue Biosphere)</option>
                <option value="nexus">Nexus (Digital Cyan/Emerald Grid)</option>
                <option value="gas_giant">Gas Giant (Ringed Deep Violet)</option>
                <option value="radiant">Radiant (Electric Cyan Starburst)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-typo-gray uppercase tracking-wider">
                Highlight Metric (Optional)
              </label>
              <input
                type="text"
                value={formData.highlightMetric}
                onChange={(e) =>
                  setFormData({ ...formData, highlightMetric: e.target.value })
                }
                placeholder="e.g. 50+ Prototypes Fabricated"
                className="w-full px-4 py-2.5 rounded-xl bg-foundation-slate/50 border border-foundation-slate text-typo-white text-xs focus:outline-none focus:border-brand-cyan"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-typo-gray uppercase tracking-wider">
                Short Summary
              </label>
              <input
                type="text"
                value={formData.summary}
                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                placeholder="Concise overview sentence"
                className="w-full px-4 py-2.5 rounded-xl bg-foundation-slate/50 border border-foundation-slate text-typo-white text-xs focus:outline-none focus:border-brand-cyan"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-typo-gray uppercase tracking-wider">
              Narrative Description *
            </label>
            <textarea
              required
              rows={4}
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Full contextual story of this milestone..."
              className="w-full px-4 py-2.5 rounded-xl bg-foundation-slate/50 border border-foundation-slate text-typo-white text-xs focus:outline-none focus:border-brand-cyan"
            />
          </div>

          {/* Published Toggle */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-foundation-slate/30 border border-foundation-slate">
            <input
              type="checkbox"
              id="published"
              checked={formData.published}
              onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
              className="w-4 h-4 rounded text-brand-blue focus:ring-brand-cyan"
            />
            <label htmlFor="published" className="text-xs text-slate-300 font-medium cursor-pointer">
              Published on Public Journey (Uncheck to keep as draft)
            </label>
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
              {saving ? "Saving..." : editingMilestone ? "Save Changes" : "Add Milestone"}
            </Button>
          </div>
        </form>
      </AdminModal>

      {/* Delete Confirmation */}
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        title={itemToDelete?.title || ""}
        itemDescription="Milestone"
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
