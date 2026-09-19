"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Plus, Edit2, Trash2, Mic, Eye, EyeOff, Building, Calendar } from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminModal } from "@/components/admin/AdminModal";
import { DeleteConfirmModal } from "@/components/admin/DeleteConfirmModal";
import { ImageInput } from "@/components/admin/ImageInput";
import { Button } from "@/components/ui/Button";
import { IPreviousSpeaker } from "@/types/content";

export default function AdminSpeakersPage() {
  const [speakers, setSpeakers] = useState<IPreviousSpeaker[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSpeaker, setEditingSpeaker] = useState<IPreviousSpeaker | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [speakerToDelete, setSpeakerToDelete] = useState<IPreviousSpeaker | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    designation: "",
    organization: "",
    photo: "",
    shortDescription: "",
    eventAssociation: "",
    displayOrder: 1,
    published: true,
  });

  const fetchSpeakers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/speakers", { cache: "no-store" });
      const json = await res.json();
      if (json.success) {
        setSpeakers(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpeakers();
  }, []);

  const openCreateModal = () => {
    setEditingSpeaker(null);
    setFormData({
      name: "",
      designation: "",
      organization: "",
      photo: "/images/placeholders/speaker-1.svg",
      shortDescription: "",
      eventAssociation: "",
      displayOrder: speakers.length + 1,
      published: true,
    });
    setModalOpen(true);
  };

  const openEditModal = (s: IPreviousSpeaker) => {
    setEditingSpeaker(s);
    setFormData({
      name: s.name,
      designation: s.designation,
      organization: s.organization || "",
      photo: s.photo,
      shortDescription: s.shortDescription || "",
      eventAssociation: s.eventAssociation || "",
      displayOrder: s.displayOrder || 1,
      published: s.published !== false,
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const isEdit = Boolean(editingSpeaker);
      const url = isEdit
        ? `/api/admin/speakers/${(editingSpeaker as any)._id || editingSpeaker?.id}`
        : "/api/admin/speakers";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const json = await res.json();

      if (json.success) {
        setModalOpen(false);
        fetchSpeakers();
      } else {
        alert(json.error || "Failed to save speaker.");
      }
    } catch (e) {
      console.error(e);
      alert("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!speakerToDelete) return;
    setSaving(true);

    try {
      const res = await fetch(
        `/api/admin/speakers/${(speakerToDelete as any)._id || speakerToDelete.id}`,
        { method: "DELETE" }
      );
      const json = await res.json();
      if (json.success) {
        setDeleteModalOpen(false);
        setSpeakerToDelete(null);
        fetchSpeakers();
      } else {
        alert(json.error || "Failed to delete speaker.");
      }
    } catch (e) {
      console.error(e);
      alert("Network error.");
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async (s: IPreviousSpeaker) => {
    try {
      const id = (s as any)._id || s.id;
      const res = await fetch(`/api/admin/speakers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: !s.published }),
      });
      if (res.ok) {
        setSpeakers((prev) =>
          prev.map((item) =>
            ((item as any)._id || item.id) === id
              ? { ...item, published: !item.published }
              : item
          )
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex flex-col flex-1">
      <AdminHeader
        title="Previous Speakers"
        subtitle="Manage distinguished guest speakers, keynote leaders, and mentors featured on the Home page"
        onToggleSidebar={() => {}}
      />

      <main className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Top Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-bold text-typo-white">
              Previous Speakers Directory
            </h2>
            <p className="text-xs font-sans text-typo-gray mt-1">
              Curate the keynote founders, institutional scientists, and ecosystem mentors displayed in the 3D carousel.
            </p>
          </div>

          <Button onClick={openCreateModal} variant="primary" size="sm">
            <Plus className="w-4 h-4 mr-1.5" />
            <span>Add Speaker</span>
          </Button>
        </div>

        {/* Speakers List */}
        {loading ? (
          <div className="p-12 text-center text-typo-gray animate-pulse font-sans">
            Loading speaker records...
          </div>
        ) : speakers.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-foundation-slate p-12 text-center space-y-4">
            <Mic className="w-10 h-10 text-brand-cyan/40 mx-auto" />
            <h3 className="font-display font-bold text-lg text-typo-white">
              No Previous Speakers Published Yet
            </h3>
            <p className="text-sm text-typo-gray max-w-md mx-auto">
              Add key leaders, founders, and industry mentors who have delivered guest sessions at IEDC TKIET.
            </p>
            <Button onClick={openCreateModal} variant="primary" size="sm">
              Add First Speaker
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {speakers.map((s) => (
              <div
                key={(s as any)._id || s.id}
                className="rounded-2xl bg-foundation-dark border border-foundation-slate/80 p-5 flex flex-col justify-between hover:border-brand-blue/50 transition-colors group"
              >
                <div className="space-y-4">
                  {/* Photo & Status */}
                  <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-foundation-slate/40 border border-foundation-slate/60">
                    {s.photo ? (
                      <Image
                        src={s.photo}
                        alt={s.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-typo-gray/40">
                        <Mic className="w-8 h-8" />
                      </div>
                    )}

                    {/* Badges */}
                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleTogglePublish(s)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-sans font-semibold uppercase tracking-wider backdrop-blur-sm border flex items-center gap-1 transition-colors ${
                          s.published
                            ? "bg-emerald-950/80 text-emerald-400 border-emerald-800/80"
                            : "bg-slate-900/80 text-typo-gray border-foundation-slate"
                        }`}
                      >
                        {s.published ? (
                          <>
                            <Eye className="w-3 h-3" />
                            <span>Published</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3 h-3" />
                            <span>Draft</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Speaker Info */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-brand-cyan uppercase tracking-wider">
                        Order: #{s.displayOrder}
                      </span>
                      {s.organization && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-sans text-typo-gray truncate max-w-[160px]">
                          <Building className="w-3 h-3 text-typo-gray/60 shrink-0" />
                          <span className="truncate">{s.organization}</span>
                        </span>
                      )}
                    </div>

                    <h4 className="font-display font-bold text-lg text-typo-white group-hover:text-brand-cyan transition-colors">
                      {s.name}
                    </h4>
                    <p className="text-xs font-sans text-typo-gray line-clamp-2">
                      {s.designation}
                    </p>

                    {s.eventAssociation && (
                      <div className="pt-1 flex items-center gap-1.5 text-[11px] font-sans text-brand-cyan/80">
                        <Calendar className="w-3 h-3 shrink-0" />
                        <span className="truncate">{s.eventAssociation}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-4 mt-4 border-t border-foundation-slate/60 flex items-center justify-end gap-2">
                  <Button
                    onClick={() => openEditModal(s)}
                    variant="outline"
                    size="sm"
                    className="h-8 px-2.5 text-xs"
                  >
                    <Edit2 className="w-3.5 h-3.5 mr-1" />
                    <span>Edit</span>
                  </Button>
                  <Button
                    onClick={() => {
                      setSpeakerToDelete(s);
                      setDeleteModalOpen(true);
                    }}
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-950/30"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                    <span>Delete</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create / Edit Modal */}
        <AdminModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editingSpeaker ? "Edit Previous Speaker" : "Add Previous Speaker"}
          maxWidth="xl"
        >
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-sans font-semibold text-typo-gray mb-1">
                  Speaker Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g. Upasana Kamineni"
                  className="w-full px-3.5 py-2 rounded-xl bg-foundation-slate/50 border border-foundation-slate text-sm text-typo-white focus:outline-none focus:border-brand-cyan"
                />
              </div>

              <div>
                <label className="block text-xs font-sans font-semibold text-typo-gray mb-1">
                  Organization / Company
                </label>
                <input
                  type="text"
                  value={formData.organization}
                  onChange={(e) =>
                    setFormData({ ...formData, organization: e.target.value })
                  }
                  placeholder="e.g. Apollo Foundation & URLife"
                  className="w-full px-3.5 py-2 rounded-xl bg-foundation-slate/50 border border-foundation-slate text-sm text-typo-white focus:outline-none focus:border-brand-cyan"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-sans font-semibold text-typo-gray mb-1">
                Designation / Role *
              </label>
              <input
                type="text"
                required
                value={formData.designation}
                onChange={(e) =>
                  setFormData({ ...formData, designation: e.target.value })
                }
                placeholder="e.g. Founder & CEO of MathonGo"
                className="w-full px-3.5 py-2 rounded-xl bg-foundation-slate/50 border border-foundation-slate text-sm text-typo-white focus:outline-none focus:border-brand-cyan"
              />
            </div>

            <ImageInput
              label="Speaker Photo (Portrait format)"
              value={formData.photo}
              onChange={(url) => setFormData({ ...formData, photo: url })}
            />

            <div>
              <label className="block text-xs font-sans font-semibold text-typo-gray mb-1">
                Associated Event (Optional)
              </label>
              <input
                type="text"
                value={formData.eventAssociation}
                onChange={(e) =>
                  setFormData({ ...formData, eventAssociation: e.target.value })
                }
                placeholder="e.g. Annual Entrepreneurship Summit 2025"
                className="w-full px-3.5 py-2 rounded-xl bg-foundation-slate/50 border border-foundation-slate text-sm text-typo-white focus:outline-none focus:border-brand-cyan"
              />
            </div>

            <div>
              <label className="block text-xs font-sans font-semibold text-typo-gray mb-1">
                Session Summary / Key Topics (Optional)
              </label>
              <textarea
                rows={3}
                value={formData.shortDescription}
                onChange={(e) =>
                  setFormData({ ...formData, shortDescription: e.target.value })
                }
                placeholder="Brief note about the key insights shared during the keynote or panel..."
                className="w-full px-3.5 py-2 rounded-xl bg-foundation-slate/50 border border-foundation-slate text-sm text-typo-white focus:outline-none focus:border-brand-cyan resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-sans font-semibold text-typo-gray mb-1">
                  Display Order
                </label>
                <input
                  type="number"
                  min={1}
                  value={formData.displayOrder}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      displayOrder: parseInt(e.target.value) || 1,
                    })
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-foundation-slate/50 border border-foundation-slate text-sm text-typo-white focus:outline-none focus:border-brand-cyan"
                />
              </div>

              <div className="flex items-center pt-6">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.published}
                    onChange={(e) =>
                      setFormData({ ...formData, published: e.target.checked })
                    }
                    className="w-4 h-4 rounded border-foundation-slate bg-foundation-slate text-brand-cyan focus:ring-brand-cyan"
                  />
                  <span className="text-xs font-sans font-semibold text-typo-white">
                    Published to Public Website
                  </span>
                </label>
              </div>
            </div>

            <div className="pt-4 border-t border-foundation-slate/60 flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={saving}>
                {saving ? "Saving..." : editingSpeaker ? "Save Changes" : "Add Speaker"}
              </Button>
            </div>
          </form>
        </AdminModal>

        {/* Delete Confirmation Modal */}
        <DeleteConfirmModal
          isOpen={deleteModalOpen}
          title={speakerToDelete?.name || "Speaker"}
          itemDescription={speakerToDelete?.designation}
          isDeleting={saving}
          onConfirm={handleDelete}
          onCancel={() => setDeleteModalOpen(false)}
        />
      </main>
    </div>
  );
}
