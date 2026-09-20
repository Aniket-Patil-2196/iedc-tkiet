"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Edit2, Trash2, Calendar, Eye, EyeOff, Link2, ExternalLink, Ticket, Clock, Coins, AlertTriangle } from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminModal } from "@/components/admin/AdminModal";
import { DeleteConfirmModal } from "@/components/admin/DeleteConfirmModal";
import { ImageInput } from "@/components/admin/ImageInput";
import { Button } from "@/components/ui/Button";
import { IEvent, EventStatusOverride } from "@/types/content";
import { utcDateToIstInputString, istInputToUtcDate, formatDateIST } from "@/lib/utils/date-ist";
import { isEventDateValid } from "@/lib/utils/event-status";
import { cn } from "@/lib/utils";

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
    fee: 0,
    registrationDeadline: "",
    capacity: "",
    registrationOpen: true,
    registrationMode: "external" as "external" | "onsite" | "none",
    registrationUrl: "",
    statusOverride: "" as EventStatusOverride | "",
    coverImage: "/images/placeholders/gallery-1.svg",
    posterWidth: undefined as number | undefined,
    posterHeight: undefined as number | undefined,
    published: true,
  });

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/events", { cache: "no-store" });
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
      fee: 0,
      registrationDeadline: "",
      capacity: "",
      registrationOpen: true,
      registrationMode: "external",
      registrationUrl: "",
      statusOverride: "",
      coverImage: "/images/placeholders/gallery-1.svg",
      posterWidth: undefined as number | undefined,
      posterHeight: undefined as number | undefined,
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
      fee: event.fee !== undefined ? event.fee : 0,
      registrationDeadline: utcDateToIstInputString(event.registrationDeadline),
      capacity: event.capacity !== undefined && event.capacity !== null ? String(event.capacity) : "",
      registrationOpen: event.registrationOpen !== false,
      registrationMode: event.registrationMode || (event.registrationUrl ? "external" : "none"),
      registrationUrl: event.registrationUrl || "",
      statusOverride: event.statusOverride || "",
      coverImage: event.coverImage || "/images/placeholders/gallery-1.svg",
      posterWidth: event.posterWidth,
      posterHeight: event.posterHeight,
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

      const payload = {
        ...formData,
        fee: Math.max(0, parseInt(String(formData.fee), 10) || 0),
        capacity: formData.capacity ? Math.max(1, parseInt(String(formData.capacity), 10) || 0) : null,
        registrationDeadline: formData.registrationDeadline ? istInputToUtcDate(formData.registrationDeadline) : null,
        registrationOpen: Boolean(formData.registrationOpen),
        statusOverride: formData.statusOverride || null,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
                    <th className="p-4">Registration</th>
                    <th className="p-4">External Form</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-foundation-slate/50">
                  {events.map((event) => {
                    const isPublished = event.published !== false;
                    const eventId = (event as any)._id || event.id;
                    const isRegOpen = event.registrationOpen !== false;
                    const feeText = event.fee && event.fee > 0 ? `₹${event.fee}` : "Free";
                    return (
                      <tr
                        key={eventId || event.slug}
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
                          {!isEventDateValid(event) && event.statusOverride !== "Postponed" && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 mt-1 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-mono">
                              <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0" />
                              <span>Missing/invalid date</span>
                            </span>
                          )}
                        </td>

                        <td className="p-4 whitespace-nowrap">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-typo-white">{feeText}</span>
                              <span
                                className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                                  isRegOpen
                                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                    : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                                }`}
                              >
                                {isRegOpen ? "OPEN" : "CLOSED"}
                              </span>
                            </div>
                            {event.capacity && (
                              <span className="text-[10px] text-typo-gray font-mono">
                                Cap: {event.capacity} seats
                              </span>
                            )}
                          </div>
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
                            <Link
                              href={`/admin/dashboard/registrations?eventId=${eventId}`}
                              className="p-1.5 rounded-lg bg-brand-blue/20 hover:bg-brand-blue/40 text-brand-cyan border border-brand-cyan/30 transition-colors inline-flex items-center gap-1"
                              title="View Registrations"
                            >
                              <Ticket className="w-3.5 h-3.5" />
                              <span className="text-[11px] font-medium hidden sm:inline">Regs</span>
                            </Link>
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

          {/* Registration Mode Selector */}
          <div className="space-y-2 pt-2 border-t border-foundation-slate/60">
            <label className="text-xs font-semibold text-typo-gray uppercase tracking-wider block">
              Registration Architecture *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  value: "external",
                  label: "External Link",
                  desc: "Google Form / Unstop / Devfolio",
                  icon: ExternalLink,
                },
                {
                  value: "onsite",
                  label: "On-Site Modal",
                  desc: "Built-in Razorpay / Free Ticket",
                  icon: Ticket,
                },
                {
                  value: "none",
                  label: "No Registration",
                  desc: "Open Entry / Walk-in Session",
                  icon: EyeOff,
                },
              ].map((opt) => {
                const Icon = opt.icon;
                const isSelected = formData.registrationMode === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        registrationMode: opt.value as any,
                      })
                    }
                    className={cn(
                      "p-3 rounded-xl border text-left transition-all flex flex-col justify-between gap-2",
                      isSelected
                        ? "bg-brand-blue/20 border-brand-cyan text-typo-white shadow-[0_0_15px_rgba(56,189,248,0.15)]"
                        : "bg-foundation-slate/30 border-foundation-slate/80 text-typo-gray hover:text-typo-white hover:bg-foundation-slate/50"
                    )}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-bold text-typo-white">{opt.label}</span>
                      <Icon className={cn("w-3.5 h-3.5", isSelected ? "text-brand-cyan" : "text-typo-gray")} />
                    </div>
                    <span className="text-[10px] text-typo-gray leading-tight">{opt.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Conditional Mode Panels - Strictly mutually exclusive */}
          {formData.registrationMode === "external" && (
            <div className="p-4 rounded-xl bg-foundation-dark/80 border border-brand-blue/30 space-y-2 animate-fade-in">
              <label className="text-xs font-semibold text-typo-gray uppercase tracking-wider flex items-center gap-1.5">
                <ExternalLink className="w-3.5 h-3.5 text-brand-cyan" />
                <span>External Registration URL *</span>
              </label>
              <input
                type="url"
                required
                value={formData.registrationUrl}
                onChange={(e) => setFormData({ ...formData, registrationUrl: e.target.value })}
                placeholder="https://forms.google.com/..."
                className="w-full px-4 py-2.5 rounded-xl bg-foundation-slate/50 border border-foundation-slate text-typo-white text-xs focus:outline-none focus:border-brand-cyan"
              />
              <span className="text-[10px] text-typo-gray block">
                Attendees will be directed to this external link in a secure new tab.
              </span>
            </div>
          )}

          {formData.registrationMode === "onsite" && (
            <div className="p-4 rounded-xl bg-foundation-dark/80 border border-brand-blue/30 space-y-4 animate-fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-foundation-slate/60">
                <div className="flex items-center gap-2">
                  <Ticket className="w-4 h-4 text-brand-cyan" />
                  <span className="text-xs font-bold text-typo-white uppercase tracking-wider">
                    On-Site Modal Configuration
                  </span>
                </div>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-typo-white">
                  <input
                    type="checkbox"
                    checked={formData.registrationOpen}
                    onChange={(e) => setFormData({ ...formData, registrationOpen: e.target.checked })}
                    className="w-4 h-4 rounded text-brand-blue focus:ring-brand-cyan bg-foundation-slate border-foundation-slate"
                  />
                  <span className={formData.registrationOpen ? "text-emerald-400 font-semibold" : "text-typo-gray"}>
                    {formData.registrationOpen ? "Registration Open" : "Registration Closed"}
                  </span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-typo-gray uppercase tracking-wider flex items-center gap-1">
                    <Coins className="w-3.5 h-3.5 text-brand-cyan" />
                    Fee (INR ₹) *
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    required
                    value={formData.fee}
                    onChange={(e) => setFormData({ ...formData, fee: Math.max(0, parseInt(e.target.value, 10) || 0) })}
                    placeholder="0 for Free"
                    className="w-full px-4 py-2.5 rounded-xl bg-foundation-slate/50 border border-foundation-slate text-typo-white text-xs focus:outline-none focus:border-brand-cyan"
                  />
                  <span className="text-[10px] text-typo-gray block">
                    0 = Free (Instant). &gt;0 uses Razorpay.
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-typo-gray uppercase tracking-wider flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-brand-cyan" />
                    Deadline (IST)
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.registrationDeadline}
                    onChange={(e) => setFormData({ ...formData, registrationDeadline: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-foundation-slate/50 border border-foundation-slate text-typo-white text-xs focus:outline-none focus:border-brand-cyan"
                  />
                  <span className="text-[10px] text-typo-gray block">
                    Indian Standard Time. Optional cut-off.
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-typo-gray uppercase tracking-wider flex items-center gap-1">
                    <Ticket className="w-3.5 h-3.5 text-brand-cyan" />
                    Capacity (Seats)
                  </label>
                  <input
                    type="number"
                    min={1}
                    step={1}
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    placeholder="Unlimited"
                    className="w-full px-4 py-2.5 rounded-xl bg-foundation-slate/50 border border-foundation-slate text-typo-white text-xs focus:outline-none focus:border-brand-cyan"
                  />
                  <span className="text-[10px] text-typo-gray block">
                    Empty = Unlimited seats.
                  </span>
                </div>
              </div>
            </div>
          )}

          {formData.registrationMode === "none" && (
            <div className="p-3.5 rounded-xl bg-foundation-slate/30 border border-foundation-slate/60 text-xs text-typo-gray flex items-center gap-2">
              <EyeOff className="w-4 h-4 text-typo-gray shrink-0" />
              <span>No registration needed. This event will be displayed as open entry / walk-in attendance.</span>
            </div>
          )}

          <ImageInput
            label="Cover / Poster Image"
            value={formData.coverImage}
            onChange={(url) => setFormData({ ...formData, coverImage: url })}
            onDimensionsChange={(dims) =>
              setFormData((prev) => ({
                ...prev,
                posterWidth: dims.width,
                posterHeight: dims.height,
              }))
            }
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
