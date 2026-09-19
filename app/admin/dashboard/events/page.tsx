"use client";

import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Calendar, Eye, EyeOff, Link2, ExternalLink } from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminModal } from "@/components/admin/AdminModal";
import { DeleteConfirmModal } from "@/components/admin/DeleteConfirmModal";
import { ImageInput } from "@/components/admin/ImageInput";
import { Button } from "@/components/ui/Button";
import { IEvent, EventStatusOverride } from "@/types/content";

export default function AdminEventsPage() {
  const [events, setEvents] = useState<IEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<IEvent | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<IEvent | null>(null);
  const [saving, setSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    category: "Workshop",
    shortDescription: "",
    description: "",
    startDate: "",
    startTime: "10:00 AM",
    endDate: "",
    endTime: "01:00 PM",
    venue: "Main Seminar Hall, TKIET",
    registrationUrl: "",
    statusOverride: "" as EventStatusOverride | "",
    coverImage: "/images/placeholders/gallery-1.svg",
    published: true,
  });

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/events");
      const json = await res.json();
      if (json.success) {
        setEvents(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const openCreateModal = () => {
    setEditingEvent(null);
    setFormData({
      title: "",
      slug: "",
      category: "Workshop",
      shortDescription: "",
      description: "",
      startDate: new Date().toISOString().split("T")[0],
      startTime: "10:00 AM",
      endDate: "",
      endTime: "01:00 PM",
      venue: "Main Seminar Hall, TKIET",
      registrationUrl: "https://docs.google.com/forms/...",
      statusOverride: "",
      coverImage: "/images/placeholders/gallery-1.svg",
      published: true,
    });
    setModalOpen(true);
  };

  const openEditModal = (event: IEvent) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      slug: event.slug,
      category: event.category || "Workshop",
      shortDescription: event.shortDescription || "",
      description: event.description || "",
      startDate: event.startDate ? event.startDate.split("T")[0] : "",
      startTime: event.startTime || "10:00 AM",
      endDate: event.endDate ? event.endDate.split("T")[0] : "",
      endTime: event.endTime || "01:00 PM",
      venue: event.venue,
      registrationUrl: event.registrationUrl || "",
      statusOverride: event.statusOverride || "",
      coverImage: event.coverImage || "/images/placeholders/gallery-1.svg",
      published: Boolean(event.published),
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const isEdit = Boolean(editingEvent);
      const url = isEdit
        ? `/api/admin/events/${(editingEvent as any)._id || editingEvent?.id}`
        : "/api/admin/events";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          statusOverride: formData.statusOverride || null,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setModalOpen(false);
        fetchEvents();
      } else {
        alert(json.error || "Failed to save event.");
      }
    } catch {
      alert("Network error.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!eventToDelete) return;
    setSaving(true);

    try {
      const id = (eventToDelete as any)._id || eventToDelete.id;
      const res = await fetch(`/api/admin/events/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        setDeleteModalOpen(false);
        setEventToDelete(null);
        fetchEvents();
      } else {
        alert(json.error || "Failed to delete event.");
      }
    } catch {
      alert("Network error.");
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async (event: IEvent) => {
    const id = (event as any)._id || event.id;
    try {
      await fetch(`/api/admin/events/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: !event.published }),
      });
      fetchEvents();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col flex-1">
      <AdminHeader
        title="Events Management"
        subtitle="Manage upcoming hackathons, innovation workshops, and registration links"
        onToggleSidebar={() => {}}
      />

      <main className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-xl font-bold text-typo-white">
              Scheduled Events ({events.length})
            </h2>
            <p className="text-xs font-sans text-typo-gray">
              Draft events remain invisible to the public. Published events sync with /events.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-blue hover:bg-blue-600 text-typo-white text-xs font-sans font-semibold shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Event</span>
          </button>
        </div>

        {/* Table / Card List */}
        {loading ? (
          <div className="p-12 rounded-2xl bg-foundation-dark border border-foundation-slate text-center text-xs font-sans text-typo-gray">
            Loading events registry...
          </div>
        ) : events.length === 0 ? (
          <div className="p-12 rounded-2xl bg-foundation-dark border border-foundation-slate text-center space-y-3">
            <Calendar className="w-10 h-10 text-typo-gray/60 mx-auto" />
            <h3 className="font-display text-base font-bold text-typo-white">
              No events scheduled yet.
            </h3>
            <p className="text-xs font-sans text-typo-gray">
              Create your first innovation workshop or hackathon to display on the public calendar.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl bg-foundation-dark border border-foundation-slate overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-foundation-slate/40 text-typo-gray border-b border-foundation-slate uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-4">Status</th>
                    <th className="p-4">Event Title</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Date &amp; Venue</th>
                    <th className="p-4">Google Form</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-foundation-slate/50">
                  {events.map((event) => {
                    const isPublished = event.published !== false;
                    return (
                      <tr
                        key={(event as any)._id || event.id || event.slug}
                        className="hover:bg-foundation-slate/20 transition-colors"
                      >
                        <td className="p-4 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => togglePublish(event)}
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

                        <td className="p-4 max-w-xs">
                          <span className="font-semibold text-typo-white block truncate">
                            {event.title}
                          </span>
                          <span className="text-[11px] text-typo-gray truncate block">
                            /{event.slug}
                          </span>
                        </td>

                        <td className="p-4 text-typo-gray whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded bg-foundation-slate text-[11px] text-brand-cyan">
                            {event.category}
                          </span>
                        </td>

                        <td className="p-4 whitespace-nowrap">
                          <span className="text-typo-white font-mono block">
                            {event.startDate ? event.startDate.split("T")[0] : "—"}
                          </span>
                          <span className="text-[11px] text-typo-gray block">
                            {event.venue}
                          </span>
                        </td>

                        <td className="p-4 whitespace-nowrap">
                          {event.registrationUrl ? (
                            <a
                              href={event.registrationUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-brand-cyan hover:underline inline-flex items-center gap-1"
                            >
                              <Link2 className="w-3.5 h-3.5" />
                              <span>Form Link</span>
                            </a>
                          ) : (
                            <span className="text-typo-gray/50">None</span>
                          )}
                        </td>

                        <td className="p-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openEditModal(event)}
                              className="p-1.5 rounded-lg bg-foundation-slate/50 hover:bg-foundation-slate text-typo-white transition-colors"
                              title="Edit Event"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEventToDelete(event);
                                setDeleteModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/50 text-red-300 border border-red-500/30 transition-colors"
                              title="Delete Event"
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
        title={editingEvent ? "Edit Scheduled Event" : "Create New Event"}
        subtitle="Events are automatically synchronized with public registration triggers"
        maxWidth="3xl"
      >
        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-typo-gray uppercase tracking-wider">
                Event Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Annual Campus Hackathon 2024"
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
                placeholder="Workshop, Hackathon, Ideation"
                className="w-full px-4 py-2.5 rounded-xl bg-foundation-slate/50 border border-foundation-slate text-typo-white text-xs focus:outline-none focus:border-brand-cyan"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-typo-gray uppercase tracking-wider">
                Event Date *
              </label>
              <input
                type="date"
                required
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-foundation-slate/50 border border-foundation-slate text-typo-white text-xs focus:outline-none focus:border-brand-cyan"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-typo-gray uppercase tracking-wider">
                Start Time
              </label>
              <input
                type="text"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                placeholder="10:00 AM"
                className="w-full px-4 py-2.5 rounded-xl bg-foundation-slate/50 border border-foundation-slate text-typo-white text-xs focus:outline-none focus:border-brand-cyan"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-typo-gray uppercase tracking-wider">
                End Time
              </label>
              <input
                type="text"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                placeholder="01:00 PM"
                className="w-full px-4 py-2.5 rounded-xl bg-foundation-slate/50 border border-foundation-slate text-typo-white text-xs focus:outline-none focus:border-brand-cyan"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-typo-gray uppercase tracking-wider">
                Venue Location *
              </label>
              <input
                type="text"
                required
                value={formData.venue}
                onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                placeholder="e.g. Prototyping Lab, TKIET"
                className="w-full px-4 py-2.5 rounded-xl bg-foundation-slate/50 border border-foundation-slate text-typo-white text-xs focus:outline-none focus:border-brand-cyan"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-typo-gray uppercase tracking-wider">
                Status Override (Optional)
              </label>
              <select
                value={formData.statusOverride}
                onChange={(e) => setFormData({ ...formData, statusOverride: e.target.value as any })}
                className="w-full px-4 py-2.5 rounded-xl bg-foundation-slate/50 border border-foundation-slate text-typo-white text-xs focus:outline-none focus:border-brand-cyan"
              >
                <option value="">Auto (Calculate by date)</option>
                <option value="Registration Open">Registration Open</option>
                <option value="Registration Closed">Registration Closed</option>
                <option value="Upcoming">Upcoming</option>
                <option value="Ongoing">Ongoing</option>
                <option value="Completed">Completed</option>
                <option value="Postponed">Postponed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-typo-gray uppercase tracking-wider">
              Google Form Registration URL
            </label>
            <input
              type="url"
              value={formData.registrationUrl}
              onChange={(e) => setFormData({ ...formData, registrationUrl: e.target.value })}
              placeholder="https://forms.google.com/..."
              className="w-full px-4 py-2.5 rounded-xl bg-foundation-slate/50 border border-foundation-slate text-typo-white text-xs focus:outline-none focus:border-brand-cyan"
            />
          </div>

          <ImageInput
            label="Cover / Poster Image"
            value={formData.coverImage}
            onChange={(url) => setFormData({ ...formData, coverImage: url })}
          />

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-typo-gray uppercase tracking-wider">
              Short Summary
            </label>
            <input
              type="text"
              value={formData.shortDescription}
              onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
              placeholder="Brief 1-sentence teaser for cards"
              className="w-full px-4 py-2.5 rounded-xl bg-foundation-slate/50 border border-foundation-slate text-typo-white text-xs focus:outline-none focus:border-brand-cyan"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-typo-gray uppercase tracking-wider">
              Full Description *
            </label>
            <textarea
              required
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Comprehensive event details, guidelines, and schedule..."
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
              <span>Publish Immediately (Visible on /events)</span>
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
                {saving ? "Saving..." : editingEvent ? "Save Changes" : "Create Event"}
              </Button>
            </div>
          </div>
        </form>
      </AdminModal>

      {/* Delete Confirmation */}
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        title={eventToDelete?.title || ""}
        itemDescription="Event listing"
        isDeleting={saving}
        onConfirm={handleDelete}
        onCancel={() => {
          setDeleteModalOpen(false);
          setEventToDelete(null);
        }}
      />
    </div>
  );
}
