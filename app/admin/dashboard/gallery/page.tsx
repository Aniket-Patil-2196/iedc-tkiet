"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Plus, Edit2, Trash2, Image as ImageIcon, Eye, EyeOff, AlertCircle } from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminModal } from "@/components/admin/AdminModal";
import { DeleteConfirmModal } from "@/components/admin/DeleteConfirmModal";
import { ImageInput } from "@/components/admin/ImageInput";
import { Button } from "@/components/ui/Button";
import { IGalleryImage } from "@/types/content";

export default function AdminGalleryPage() {
  const [photos, setPhotos] = useState<IGalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<IGalleryImage | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<IGalleryImage | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    caption: "",
    imageUrl: "/images/placeholders/gallery-1.svg",
    tags: "Workshop",
    order: 1,
    published: true,
  });

  const fetchPhotos = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/gallery");
      const json = await res.json();
      if (json.success) {
        setPhotos(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPhotos();
  }, []);

  const openCreateModal = () => {
    setEditingItem(null);
    setFormError(null);
    setFormData({
      title: "",
      caption: "",
      imageUrl: "/images/placeholders/gallery-1.svg",
      tags: "Workshop",
      order: photos.length + 1,
      published: true,
    });
    setModalOpen(true);
  };

  const openEditModal = (item: IGalleryImage) => {
    setEditingItem(item);
    setFormError(null);
    setFormData({
      title: item.title || "",
      caption: item.caption || "",
      imageUrl: item.imageUrl || "",
      tags: Array.isArray(item.tags) ? item.tags.join(", ") : (item.tags || "Workshop"),
      order: item.order || 1,
      published: (item as any).published !== false,
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);

    try {
      const isEdit = Boolean(editingItem);
      const url = isEdit
        ? `/api/admin/gallery/${(editingItem as any)._id || editingItem?.id}`
        : "/api/admin/gallery";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (json.success && json.data) {
        // Immediate optimistic update of gallery photos list
        if (isEdit) {
          setPhotos((prev) =>
            prev.map((p) =>
              ((p as any)._id || p.id) === ((json.data as any)._id || json.data.id)
                ? json.data
                : p
            )
          );
        } else {
          setPhotos((prev) => [...prev, json.data]);
        }
        setModalOpen(false);
        setFormError(null);
        await fetchPhotos();
      } else {
        const msg = json.error || "Failed to save photo.";
        setFormError(msg);
      }
    } catch {
      setFormError("Network error while contacting server. Please check your connection.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    setSaving(true);

    try {
      const id = (itemToDelete as any)._id || itemToDelete.id;
      const res = await fetch(`/api/admin/gallery/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        setDeleteModalOpen(false);
        setItemToDelete(null);
        fetchPhotos();
      } else {
        alert(json.error || "Failed to delete photo.");
      }
    } catch {
      alert("Network error.");
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async (item: IGalleryImage) => {
    const id = (item as any)._id || item.id;
    const currentPublished = (item as any).published !== false;
    try {
      await fetch(`/api/admin/gallery/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: !currentPublished }),
      });
      fetchPhotos();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col flex-1">
      <AdminHeader
        title="3D Photo Globe Gallery"
        subtitle="Manage images and activity records that map to the interactive 3D spatial sphere"
        onToggleSidebar={() => {}}
      />

      <main className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-xl font-bold text-typo-white">
              Spatial Photo Nodes ({photos.length})
            </h2>
            <p className="text-xs font-sans text-typo-gray">
              Published photographs automatically map to the Three.js sphere on /gallery.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-blue hover:bg-blue-600 text-typo-white text-xs font-sans font-semibold shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Gallery Asset</span>
          </button>
        </div>

        {loading ? (
          <div className="p-12 rounded-2xl bg-foundation-dark border border-foundation-slate text-center text-xs font-sans text-typo-gray">
            Loading 3D media assets...
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {photos.map((item) => {
              const isPublished = (item as any).published !== false;
              return (
                <div
                  key={(item as any)._id || item.id}
                  className="rounded-2xl bg-foundation-dark border border-foundation-slate overflow-hidden flex flex-col justify-between group hover:border-brand-blue/50 transition-all"
                >
                  <div className="relative w-full aspect-[16/10] bg-foundation-space">
                    <AdminGalleryCardThumbnail
                      imageUrl={item.imageUrl}
                      title={item.title}
                    />
                    <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-foundation-dark/80 backdrop-blur-md text-[10px] font-mono text-brand-cyan border border-foundation-slate">
                        #{item.order}
                      </span>
                    </div>

                    <div className="absolute top-3 right-3 z-10">
                      <button
                        type="button"
                        onClick={() => togglePublish(item)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold transition-all ${
                          isPublished
                            ? "bg-emerald-950/80 text-emerald-400 border border-emerald-500/60"
                            : "bg-amber-950/80 text-amber-400 border border-amber-500/60"
                        }`}
                        title="Toggle visibility in 3D globe"
                      >
                        {isPublished ? (
                          <>
                            <Eye className="w-2.5 h-2.5" />
                            <span>GLOBE</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-2.5 h-2.5" />
                            <span>HIDDEN</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="font-display font-bold text-typo-white text-sm line-clamp-1">
                        {item.title}
                      </h4>
                      {item.caption && (
                        <p className="font-sans text-[11px] text-typo-gray line-clamp-2 mt-0.5">
                          {item.caption}
                        </p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-foundation-slate/50 flex items-center justify-between text-xs">
                      <span className="text-[10px] font-mono text-typo-gray">
                        {Array.isArray(item.tags) ? item.tags[0] : "Record"}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditModal(item)}
                          className="p-1 rounded-md bg-foundation-slate/50 hover:bg-foundation-slate text-typo-white transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setItemToDelete(item);
                            setDeleteModalOpen(true);
                          }}
                          className="p-1 rounded-md bg-red-950/40 hover:bg-red-900/50 text-red-300 border border-red-500/30 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Editor Modal */}
      <AdminModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingItem ? "Edit Gallery Photo" : "Add Gallery Asset"}
        subtitle="Images appear as interactive nodes in the Three.js 3D spherical constellation"
        maxWidth="2xl"
      >
        <form onSubmit={handleSave} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/60 text-red-200 text-xs flex items-start gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">{formError}</div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-typo-gray uppercase tracking-wider">
              Title / Activity Name *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Rapid Prototyping & 3D Fabrication Session"
              className="w-full px-4 py-2.5 rounded-xl bg-foundation-slate/50 border border-foundation-slate text-typo-white text-xs focus:outline-none focus:border-brand-cyan"
            />
          </div>

          <ImageInput
            label="Image Asset *"
            value={formData.imageUrl}
            onChange={(url) => setFormData({ ...formData, imageUrl: url })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-typo-gray uppercase tracking-wider">
                Event / Activity Tag
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="Workshop, Prototyping, Hackathon"
                className="w-full px-4 py-2.5 rounded-xl bg-foundation-slate/50 border border-foundation-slate text-typo-white text-xs focus:outline-none focus:border-brand-cyan"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-typo-gray uppercase tracking-wider">
                Spherical Node Order
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

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-typo-gray uppercase tracking-wider">
              Caption / Contextual Description
            </label>
            <textarea
              rows={3}
              value={formData.caption}
              onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
              placeholder="Hands-on calibration of additive manufacturing systems for physical prototypes..."
              className="w-full px-4 py-2.5 rounded-xl bg-foundation-slate/50 border border-foundation-slate text-typo-white text-xs focus:outline-none focus:border-brand-cyan"
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-foundation-slate/60">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-sans text-typo-white">
              <input
                type="checkbox"
                checked={formData.published}
                onChange={(e) =>
                  setFormData({ ...formData, published: e.target.checked })
                }
                className="w-4 h-4 rounded bg-foundation-slate border border-foundation-slate text-brand-blue focus:ring-0"
              />
              <span>Render in 3D Photo Globe (Visible on /gallery)</span>
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
                {saving ? "Saving..." : editingItem ? "Save Changes" : "Add to Globe"}
              </Button>
            </div>
          </div>
        </form>
      </AdminModal>

      {/* Delete Confirmation */}
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        title={itemToDelete?.title || ""}
        itemDescription="Gallery photo node"
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

function AdminGalleryCardThumbnail({
  imageUrl,
  title,
}: {
  imageUrl: string;
  title: string;
}) {
  const [hasError, setHasError] = useState(false);
  const isInternal = imageUrl?.startsWith("/api/images/");

  if (hasError || !imageUrl) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-foundation-slate/20 p-2 text-center">
        <ImageIcon className="w-6 h-6 text-brand-cyan/60 mb-1" />
        <span className="text-[9px] font-mono text-typo-gray">
          No Preview
        </span>
      </div>
    );
  }

  return (
    <Image
      src={imageUrl}
      alt={title}
      fill
      unoptimized={isInternal}
      className="object-cover"
      onError={() => setHasError(true)}
    />
  );
}
