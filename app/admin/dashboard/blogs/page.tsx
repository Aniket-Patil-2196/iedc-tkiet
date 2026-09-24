"use client";

import React, { useState, useEffect, useRef } from "react";
import { Plus, Edit2, Trash2, FileText, Eye, EyeOff, Link as LinkIcon, Image as ImageIcon, X } from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminModal } from "@/components/admin/AdminModal";
import { DeleteConfirmModal } from "@/components/admin/DeleteConfirmModal";
import { ImageInput } from "@/components/admin/ImageInput";
import { Button } from "@/components/ui/Button";
import { IBlog, IBlogImage, IBlogReference } from "@/types/content";
import { slugifyBlogSlug } from "@/lib/utils/blog-validation";

export default function AdminBlogsPage() {
  const [blogs, setBlogs] = useState<IBlog[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState<IBlog | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [blogToDelete, setBlogToDelete] = useState<IBlog | null>(null);
  const [saving, setSaving] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const slugTouchedRef = useRef(false);

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    author: "IEDC TKIET",
    excerpt: "",
    content: "",
    coverImage: "/images/placeholders/gallery-2.svg",
    images: [] as IBlogImage[],
    references: [] as IBlogReference[],
    publicationDate: "",
    publishedAt: "",
    readTimeMinutes: 4,
    published: true,
    category: "",
    tags: [] as string[],
    location: "",
    seo: { title: "", description: "" },
  });

  const fetchBlogs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/blogs", { cache: "no-store" });
      const json = await res.json();
      if (json.success) {
        setBlogs(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  const openCreateModal = () => {
    setEditingBlog(null);
    slugTouchedRef.current = false;
    setTagInput("");
    const now = new Date();
    setFormData({
      title: "",
      slug: "",
      author: "IEDC TKIET",
      excerpt: "",
      content: "",
      coverImage: "/images/placeholders/gallery-2.svg",
      images: [
        { url: "/images/placeholders/gallery-2.svg", alt: "Article cover", caption: "", order: 0 },
      ],
      references: [],
      publicationDate: now.toISOString().split("T")[0],
      publishedAt: now.toISOString().slice(0, 16),
      readTimeMinutes: 4,
      published: true,
      category: "",
      tags: [],
      location: "",
      seo: { title: "", description: "" },
    });
    setModalOpen(true);
  };

  const openEditModal = (blog: IBlog) => {
    setEditingBlog(blog);
    slugTouchedRef.current = true; // never auto-regen existing slug from title
    setTagInput("");
    const pubAtStr = blog.publishedAt
      ? new Date(blog.publishedAt).toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16);

    const images = blog.images && blog.images.length > 0
      ? blog.images.map((img, i) => ({ ...img, order: img.order ?? i }))
      : blog.coverImage
      ? [{ url: blog.coverImage, alt: blog.title, caption: "", order: 0 }]
      : [];

    setFormData({
      title: blog.title,
      slug: blog.slug,
      author: blog.author || "IEDC TKIET",
      excerpt: blog.excerpt,
      content: blog.content,
      coverImage: blog.coverImage || "/images/placeholders/gallery-2.svg",
      images,
      references: (blog.references || []).map((ref, i) => ({
        ...ref,
        order: ref.order ?? i,
      })),
      publicationDate: blog.publicationDate
        ? blog.publicationDate.split("T")[0]
        : pubAtStr.split("T")[0],
      publishedAt: pubAtStr,
      readTimeMinutes: blog.readTimeMinutes || 4,
      published: Boolean(blog.published),
      category: blog.category || "",
      tags: Array.isArray(blog.tags) ? blog.tags : [],
      location: blog.location || "",
      seo: {
        title: blog.seo?.title || "",
        description: blog.seo?.description || "",
      },
    });
    setModalOpen(true);
  };

  const handleTitleChange = (title: string) => {
    // Auto-slug from title only for new posts, and only until the slug is manually edited
    if (!editingBlog && !slugTouchedRef.current) {
      setFormData((prev) => ({
        ...prev,
        title,
        slug: slugifyBlogSlug(title),
      }));
      return;
    }
    setFormData((prev) => ({ ...prev, title }));
  };

  const handleAddImage = () => {
    if (formData.images.length >= 4) return;
    setFormData({
      ...formData,
      images: [
        ...formData.images,
        {
          url: "",
          alt: `Figure ${formData.images.length + 1}`,
          caption: "",
          order: formData.images.length,
        },
      ],
    });
  };

  const handleRemoveImage = (index: number) => {
    const updated = formData.images
      .filter((_, i) => i !== index)
      .map((img, i) => ({ ...img, order: i }));
    setFormData({ ...formData, images: updated });
  };

  const handleAddReference = () => {
    if (formData.references.length >= 8) return;
    setFormData({
      ...formData,
      references: [
        ...formData.references,
        { label: "", url: "", order: formData.references.length },
      ],
    });
  };

  const handleRemoveReference = (index: number) => {
    const updated = formData.references
      .filter((_, i) => i !== index)
      .map((ref, i) => ({ ...ref, order: i }));
    setFormData({ ...formData, references: updated });
  };

  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (!tag) return;
    const exists = formData.tags.some((t) => t.toLowerCase() === tag.toLowerCase());
    if (exists) {
      setTagInput("");
      return;
    }
    setFormData({ ...formData, tags: [...formData.tags, tag] });
    setTagInput("");
  };

  const handleRemoveTag = (index: number) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((_, i) => i !== index),
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const isEdit = Boolean(editingBlog);
      const url = isEdit
        ? `/api/admin/blogs/${(editingBlog as any)._id || editingBlog?.id}`
        : "/api/admin/blogs";
      const method = isEdit ? "PUT" : "POST";

      const payload = {
        ...formData,
        images: formData.images.map((img, i) => ({ ...img, order: img.order ?? i })),
        references: formData.references.map((ref, i) => ({
          ...ref,
          order: ref.order ?? i,
        })),
        category: formData.category.trim() || null,
        location: formData.location.trim() || null,
        tags: formData.tags,
        seo: {
          title: formData.seo.title.trim(),
          description: formData.seo.description.trim(),
        },
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        setModalOpen(false);
        fetchBlogs();
      } else {
        alert(json.error || "Failed to save article");
      }
    } catch (e) {
      console.error(e);
      alert("Network error saving article");
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async (blog: IBlog) => {
    try {
      const isCurrentlyPublished = blog.published !== false;
      const res = await fetch(`/api/admin/blogs/${(blog as any)._id || blog.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: !isCurrentlyPublished }),
      });
      const json = await res.json();
      if (json.success) {
        fetchBlogs();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async () => {
    if (!blogToDelete) return;
    setSaving(true);
    try {
      const res = await fetch(
        `/api/admin/blogs/${(blogToDelete as any)._id || blogToDelete.id}`,
        { method: "DELETE" }
      );
      const json = await res.json();
      if (json.success) {
        setDeleteModalOpen(false);
        setBlogToDelete(null);
        fetchBlogs();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col flex-1">
      <AdminHeader
        title="Blog Editorial Console"
        subtitle="Manage institutional engineering essays and startup dispatches"
        onToggleSidebar={() => {}}
      />

      <main className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-xl font-bold text-typo-white">
              Articles Archive ({blogs.length})
            </h2>
            <p className="text-xs font-sans text-typo-gray">
              Manage published manuscripts and drafts. Drafts are completely hidden from the public site.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-blue hover:bg-blue-600 text-typo-white text-xs font-sans font-semibold shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Write New Article</span>
          </button>
        </div>

        {loading ? (
          <div className="p-12 rounded-2xl bg-foundation-dark border border-foundation-slate text-center text-xs font-sans text-typo-gray">
            Loading articles registry...
          </div>
        ) : blogs.length === 0 ? (
          <div className="p-12 rounded-2xl bg-foundation-dark border border-foundation-slate text-center space-y-3">
            <FileText className="w-10 h-10 text-typo-gray/60 mx-auto" />
            <h3 className="font-display text-base font-bold text-typo-white">
              No articles authored yet.
            </h3>
            <p className="text-xs font-sans text-typo-gray">
              Draft your first thought piece or innovation report.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl bg-foundation-dark border border-foundation-slate overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-foundation-slate/40 text-typo-gray border-b border-foundation-slate uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-4">Status</th>
                    <th className="p-4">Article Title</th>
                    <th className="p-4">Author</th>
                    <th className="p-4">Published Date</th>
                    <th className="p-4">Read Time</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-foundation-slate/50">
                  {blogs.map((blog) => {
                    const isPublished = blog.published !== false;
                    return (
                      <tr
                        key={(blog as any)._id || blog.id || blog.slug}
                        className="hover:bg-foundation-slate/20 transition-colors"
                      >
                        <td className="p-4 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => togglePublish(blog)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold transition-all ${
                              isPublished
                                ? "bg-emerald-950/60 text-emerald-400 border border-emerald-500/50"
                                : "bg-amber-950/60 text-amber-400 border border-amber-500/50"
                            }`}
                            title="Click to toggle publish status"
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

                        <td className="p-4 max-w-sm">
                          <span className="font-semibold text-typo-white block truncate">
                            {blog.title}
                          </span>
                          <span className="text-[11px] text-typo-gray truncate block">
                            /{blog.slug}
                          </span>
                        </td>

                        <td className="p-4 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded bg-foundation-slate text-[11px] text-brand-cyan">
                            {blog.author || "IEDC TKIET"}
                          </span>
                        </td>

                        <td className="p-4 whitespace-nowrap font-mono text-typo-gray">
                          {blog.publicationDate
                            ? blog.publicationDate.split("T")[0]
                            : "—"}
                        </td>

                        <td className="p-4 whitespace-nowrap text-typo-gray">
                          {blog.readTimeMinutes || 4} min read
                        </td>

                        <td className="p-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openEditModal(blog)}
                              className="p-1.5 rounded-lg bg-foundation-slate/50 hover:bg-foundation-slate text-typo-white transition-colors"
                              title="Edit Article"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setBlogToDelete(blog);
                                setDeleteModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/50 text-red-300 border border-red-500/30 transition-colors"
                              title="Delete Article"
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
        title={editingBlog ? "Edit Blog Article" : "Draft New Article"}
        subtitle="Articles and figures for The Innovation Blog"
        maxWidth="3xl"
      >
        <form onSubmit={handleSave} className="space-y-5 max-h-[80vh] overflow-y-auto pr-1">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-typo-gray uppercase tracking-wider">
              Article Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="e.g. Fostering an Engineering Innovation Culture"
              className="w-full px-4 py-2.5 rounded-xl bg-foundation-slate/50 border border-foundation-slate text-typo-white text-xs focus:outline-none focus:border-brand-cyan"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-typo-gray uppercase tracking-wider">
              Slug *
            </label>
            <input
              type="text"
              required
              value={formData.slug}
              onChange={(e) => {
                slugTouchedRef.current = true;
                setFormData({ ...formData, slug: slugifyBlogSlug(e.target.value) });
              }}
              placeholder="url-safe-slug"
              pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
              title="Lowercase letters, numbers, and hyphens only"
              className="w-full px-4 py-2.5 rounded-xl bg-foundation-slate/50 border border-foundation-slate text-typo-white text-xs font-mono focus:outline-none focus:border-brand-cyan"
            />
            <p className="text-[10px] text-typo-gray">
              /blog/{formData.slug || "…"}
              {editingBlog ? " · Editing does not auto-regenerate the slug from the title." : ""}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-typo-gray uppercase tracking-wider">
                Author Name *
              </label>
              <input
                type="text"
                required
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                placeholder="IEDC TKIET"
                className="w-full px-4 py-2.5 rounded-xl bg-foundation-slate/50 border border-foundation-slate text-typo-white text-xs focus:outline-none focus:border-brand-cyan"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-typo-gray uppercase tracking-wider">
                Publication Date (IST) *
              </label>
              <input
                type="datetime-local"
                required
                value={formData.publishedAt}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    publishedAt: e.target.value,
                    publicationDate: e.target.value.split("T")[0],
                  })
                }
                className="w-full px-4 py-2.5 rounded-xl bg-foundation-slate/50 border border-foundation-slate text-typo-white text-xs focus:outline-none focus:border-brand-cyan"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-typo-gray uppercase tracking-wider">
                Category
              </label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="e.g. Entrepreneurship, Patents"
                className="w-full px-4 py-2.5 rounded-xl bg-foundation-slate/50 border border-foundation-slate text-typo-white text-xs focus:outline-none focus:border-brand-cyan"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-typo-gray uppercase tracking-wider">
                Location
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Optional place name"
                className="w-full px-4 py-2.5 rounded-xl bg-foundation-slate/50 border border-foundation-slate text-typo-white text-xs focus:outline-none focus:border-brand-cyan"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-typo-gray uppercase tracking-wider">
              Tags
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Add a tag and press Enter"
                className="flex-1 px-4 py-2.5 rounded-xl bg-foundation-slate/50 border border-foundation-slate text-typo-white text-xs focus:outline-none focus:border-brand-cyan"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-3 py-2 rounded-xl bg-foundation-slate/50 border border-foundation-slate text-brand-cyan text-xs font-mono hover:border-brand-cyan transition-colors"
              >
                Add
              </button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {formData.tags.map((tag, idx) => (
                  <span
                    key={`${tag}-${idx}`}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-foundation-slate text-[11px] text-typo-white"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(idx)}
                      className="text-typo-gray hover:text-red-300"
                      title="Remove tag"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-typo-gray uppercase tracking-wider">
                SEO Title
              </label>
              <input
                type="text"
                value={formData.seo.title}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    seo: { ...formData.seo, title: e.target.value },
                  })
                }
                placeholder="Falls back to article title"
                className="w-full px-4 py-2.5 rounded-xl bg-foundation-slate/50 border border-foundation-slate text-typo-white text-xs focus:outline-none focus:border-brand-cyan"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-typo-gray uppercase tracking-wider">
                SEO Description
              </label>
              <input
                type="text"
                value={formData.seo.description}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    seo: { ...formData.seo, description: e.target.value },
                  })
                }
                placeholder="Falls back to excerpt"
                className="w-full px-4 py-2.5 rounded-xl bg-foundation-slate/50 border border-foundation-slate text-typo-white text-xs focus:outline-none focus:border-brand-cyan"
              />
            </div>
          </div>

          {/* Figures / Stamp Images Section (Up to 4 images) */}
          <div className="space-y-3 p-4 rounded-xl bg-foundation-slate/30 border border-foundation-slate/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-brand-cyan" />
                <span className="text-xs font-semibold text-typo-white uppercase tracking-wider">
                  Postage Stamp Figures ({formData.images.length}/4)
                </span>
              </div>
              {formData.images.length < 4 && (
                <button
                  type="button"
                  onClick={handleAddImage}
                  className="text-xs font-mono text-brand-cyan hover:underline inline-flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Figure</span>
                </button>
              )}
            </div>

            {formData.images.map((img, idx) => (
              <div key={idx} className="space-y-2 p-3 rounded-lg bg-foundation-dark/60 border border-foundation-slate/40 relative">
                <div className="flex items-center justify-between pb-1">
                  <span className="text-[11px] font-mono text-typo-gray">
                    Figure {idx + 1} {idx === 0 ? "(Primary Postage Stamp)" : "(Secondary Offset)"}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="text-red-400 hover:text-red-300 p-1"
                    title="Remove Figure"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <ImageInput
                  label={`Image URL`}
                  value={img.url}
                  onChange={(url) => {
                    const copy = [...formData.images];
                    copy[idx] = { ...copy[idx], url, order: idx };
                    setFormData({ ...formData, images: copy, coverImage: copy[0]?.url || formData.coverImage });
                  }}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <input
                    type="text"
                    value={img.alt}
                    onChange={(e) => {
                      const copy = [...formData.images];
                      copy[idx] = { ...copy[idx], alt: e.target.value, order: idx };
                      setFormData({ ...formData, images: copy });
                    }}
                    placeholder="Alt description for accessibility"
                    className="px-3 py-1.5 rounded-lg bg-foundation-slate/50 border border-foundation-slate text-typo-white text-xs focus:outline-none focus:border-brand-cyan"
                  />
                  <input
                    type="text"
                    value={img.caption || ""}
                    onChange={(e) => {
                      const copy = [...formData.images];
                      copy[idx] = { ...copy[idx], caption: e.target.value, order: idx };
                      setFormData({ ...formData, images: copy });
                    }}
                    placeholder="Optional figure caption"
                    className="px-3 py-1.5 rounded-lg bg-foundation-slate/50 border border-foundation-slate text-typo-white text-xs focus:outline-none focus:border-brand-cyan"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* References / Sources Section (Up to 8 links) */}
          <div className="space-y-3 p-4 rounded-xl bg-foundation-slate/30 border border-foundation-slate/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-brand-cyan" />
                <span className="text-xs font-semibold text-typo-white uppercase tracking-wider">
                  References &amp; Sources ({formData.references.length}/8)
                </span>
              </div>
              {formData.references.length < 8 && (
                <button
                  type="button"
                  onClick={handleAddReference}
                  className="text-xs font-mono text-brand-cyan hover:underline inline-flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Reference</span>
                </button>
              )}
            </div>

            {formData.references.map((ref, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  required
                  value={ref.label}
                  onChange={(e) => {
                    const copy = [...formData.references];
                    copy[idx] = { ...copy[idx], label: e.target.value, order: idx };
                    setFormData({ ...formData, references: copy });
                  }}
                  placeholder="Label (e.g. Patent Gazette Publication)"
                  className="w-1/2 px-3 py-2 rounded-lg bg-foundation-slate/50 border border-foundation-slate text-typo-white text-xs focus:outline-none focus:border-brand-cyan"
                />
                <input
                  type="url"
                  required
                  value={ref.url}
                  onChange={(e) => {
                    const copy = [...formData.references];
                    copy[idx] = { ...copy[idx], url: e.target.value, order: idx };
                    setFormData({ ...formData, references: copy });
                  }}
                  placeholder="https://example.org/source"
                  className="w-1/2 px-3 py-2 rounded-lg bg-foundation-slate/50 border border-foundation-slate text-typo-white text-xs focus:outline-none focus:border-brand-cyan"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveReference(idx)}
                  className="text-red-400 hover:text-red-300 p-1"
                  title="Remove reference"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-typo-gray uppercase tracking-wider">
              Excerpt / Lead Synopsis *
            </label>
            <textarea
              required
              rows={2}
              value={formData.excerpt}
              onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
              placeholder="Short summary introducing the essay..."
              className="w-full px-4 py-2.5 rounded-xl bg-foundation-slate/50 border border-foundation-slate text-typo-white text-xs focus:outline-none focus:border-brand-cyan"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-typo-gray uppercase tracking-wider">
              Full Article Content *
            </label>
            <textarea
              required
              rows={8}
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder={"Write or paste article text. Supports ## / ### headings, lists, **bold**, *italic*, [links](url), and > blockquotes."}
              className="w-full px-4 py-2.5 rounded-xl bg-foundation-slate/50 border border-foundation-slate text-typo-white text-xs focus:outline-none focus:border-brand-cyan font-serif"
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
              <span>Publish Immediately (Visible on /blog)</span>
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
                {saving ? "Saving..." : editingBlog ? "Save Changes" : "Publish Article"}
              </Button>
            </div>
          </div>
        </form>
      </AdminModal>

      {/* Delete Confirmation */}
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        title={blogToDelete?.title || ""}
        itemDescription="Article publication"
        isDeleting={saving}
        onConfirm={handleDelete}
        onCancel={() => {
          setDeleteModalOpen(false);
          setBlogToDelete(null);
        }}
      />
    </div>
  );
}
