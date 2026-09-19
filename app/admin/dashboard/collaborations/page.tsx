"use client";

import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Layers, ExternalLink } from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminModal } from "@/components/admin/AdminModal";
import { DeleteConfirmModal } from "@/components/admin/DeleteConfirmModal";
import { ImageInput } from "@/components/admin/ImageInput";
import { Button } from "@/components/ui/Button";
import { ICollaboration } from "@/types/content";

export default function AdminCollaborationsPage() {
  const [collabs, setCollabs] = useState<ICollaboration[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ICollaboration | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ICollaboration | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    partnerName: "",
    partnerType: "Ecosystem Partner",
    logoUrl: "",
    description: "",
    websiteUrl: "",
    order: 1,
  });

  const fetchCollabs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/collaborations");
      const json = await res.json();
      if (json.success) {
        setCollabs(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollabs();
  }, []);

  const openCreateModal = () => {
    setEditingItem(null);
    setFormData({
      partnerName: "",
      partnerType: "Ecosystem Partner",
      logoUrl: "",
      description: "",
      websiteUrl: "",
      order: collabs.length + 1,
    });
    setModalOpen(true);
  };

  const openEditModal = (item: ICollaboration) => {
    setEditingItem(item);
    setFormData({
      partnerName: item.partnerName,
      partnerType: item.partnerType,
      logoUrl: item.logoUrl || "",
      description: item.description,
      websiteUrl: item.websiteUrl || "",
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
        ? `/api/admin/collaborations/${(editingItem as any)._id || editingItem?.id}`
        : "/api/admin/collaborations";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (json.success) {
        setModalOpen(false);
        fetchCollabs();
      } else {
        alert(json.error || "Failed to save collaboration.");
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
      const res = await fetch(`/api/admin/collaborations/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        setDeleteModalOpen(false);
        setItemToDelete(null);
        fetchCollabs();
      } else {
        alert(json.error || "Failed to delete collaboration.");
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
        title="Institutional Collaborations"
        subtitle="Manage national competition partnerships, innovation councils, and future ecosystem allies"
        onToggleSidebar={() => {}}
      />

      <main className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-xl font-bold text-typo-white">
              Active Partnerships ({collabs.length})
            </h2>
            <p className="text-xs font-sans text-typo-gray">
              Initial foundations: NEC &amp; IIC. CMS allows adding new institutional partners at any time.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-blue hover:bg-blue-600 text-typo-white text-xs font-sans font-semibold shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Partner Organization</span>
          </button>
        </div>

        {loading ? (
          <div className="p-12 rounded-2xl bg-foundation-dark border border-foundation-slate text-center text-xs font-sans text-typo-gray">
            Loading collaborations...
          </div>
        ) : (
          <div className="rounded-2xl bg-foundation-dark border border-foundation-slate overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-foundation-slate/40 text-typo-gray border-b border-foundation-slate uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-4">Order</th>
                    <th className="p-4">Partner Name</th>
                    <th className="p-4">Classification</th>
                    <th className="p-4">Overview</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-foundation-slate/50">
                  {collabs.map((item) => (
                    <tr
                      key={(item as any)._id || item.id}
                      className="hover:bg-foundation-slate/20 transition-colors"
                    >
                      <td className="p-4 font-mono text-typo-gray w-16">
                        #{item.order}
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <span className="font-semibold text-typo-white block">
                          {item.partnerName}
                        </span>
                        {item.websiteUrl && (
                          <a
                            href={item.websiteUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] text-brand-cyan hover:underline inline-flex items-center gap-1"
                          >
                            <span>Visit Portal</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-foundation-slate text-[11px] text-brand-cyan">
                          {item.partnerType}
                        </span>
                      </td>
                      <td className="p-4 max-w-md">
                        <p className="text-typo-gray truncate">
                          {item.description}
                        </p>
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
        title={editingItem ? "Edit Partner Organization" : "Add Partner Organization"}
        subtitle="Organizations appear on /collaborations with institutional details"
        maxWidth="2xl"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-typo-gray uppercase tracking-wider">
                Organization Name *
              </label>
              <input
                type="text"
                required
                value={formData.partnerName}
                onChange={(e) => setFormData({ ...formData, partnerName: e.target.value })}
                placeholder="e.g. National Entrepreneurship Challenge (NEC)"
                className="w-full px-4 py-2.5 rounded-xl bg-foundation-slate/50 border border-foundation-slate text-typo-white text-xs focus:outline-none focus:border-brand-cyan"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-typo-gray uppercase tracking-wider">
                Classification Type
              </label>
              <input
                type="text"
                value={formData.partnerType}
                onChange={(e) => setFormData({ ...formData, partnerType: e.target.value })}
                placeholder="National Initiative, Innovation Council"
                className="w-full px-4 py-2.5 rounded-xl bg-foundation-slate/50 border border-foundation-slate text-typo-white text-xs focus:outline-none focus:border-brand-cyan"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-typo-gray uppercase tracking-wider">
                Official Website Link
              </label>
              <input
                type="url"
                value={formData.websiteUrl}
                onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                placeholder="https://..."
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
            label="Organization Logo / Insignia"
            value={formData.logoUrl}
            onChange={(url) => setFormData({ ...formData, logoUrl: url })}
          />

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-typo-gray uppercase tracking-wider">
              Collaboration Scope &amp; Description *
            </label>
            <textarea
              required
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Outline the institutional relationship, shared initiatives, and student opportunities..."
              className="w-full px-4 py-2.5 rounded-xl bg-foundation-slate/50 border border-foundation-slate text-typo-white text-xs focus:outline-none focus:border-brand-cyan"
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
              {saving ? "Saving..." : editingItem ? "Save Changes" : "Add Partner"}
            </Button>
          </div>
        </form>
      </AdminModal>

      {/* Delete Confirmation */}
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        title={itemToDelete?.partnerName || ""}
        itemDescription="Partner record"
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
