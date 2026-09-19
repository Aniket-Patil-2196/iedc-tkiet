"use client";

import React, { useState, useEffect } from "react";
import { Mail, Check, Trash2, Eye, Clock, User, MessageSquare } from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminModal } from "@/components/admin/AdminModal";
import { DeleteConfirmModal } from "@/components/admin/DeleteConfirmModal";
import { IContactSubmission } from "@/types/content";

export default function AdminContactPage() {
  const [submissions, setSubmissions] = useState<IContactSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<IContactSubmission | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<IContactSubmission | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/contact", { cache: "no-store" });
      const json = await res.json();
      if (json.success) {
        setSubmissions(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const toggleReadStatus = async (item: IContactSubmission) => {
    const id = (item as any)._id || item.id;
    try {
      await fetch(`/api/admin/contact/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ read: !item.read }),
      });
      fetchContacts();
    } catch (err) {
      console.error(err);
    }
  };

  const handleInspect = async (item: IContactSubmission) => {
    setSelectedItem(item);
    if (!item.read) {
      // Mark as read automatically when inspected
      toggleReadStatus(item);
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    setSaving(true);

    try {
      const id = (itemToDelete as any)._id || itemToDelete.id;
      const res = await fetch(`/api/admin/contact/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        setDeleteModalOpen(false);
        setItemToDelete(null);
        if (selectedItem && ((selectedItem as any)._id || selectedItem.id) === id) {
          setSelectedItem(null);
        }
        fetchContacts();
      } else {
        alert(json.error || "Failed to delete submission.");
      }
    } catch {
      alert("Network error.");
    } finally {
      setSaving(false);
    }
  };

  const unreadCount = submissions.filter((s) => !s.read).length;

  return (
    <div className="flex flex-col flex-1">
      <AdminHeader
        title="Contact & Incubation Inquiries"
        subtitle="Manage student startup ideas, lab bench requests, and collaboration inquiries"
        onToggleSidebar={() => {}}
      />

      <main className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-xl font-bold text-typo-white">
              Inbound Messages ({submissions.length})
            </h2>
            <p className="text-xs font-sans text-typo-gray">
              {unreadCount > 0
                ? `${unreadCount} unread submissions requiring coordinator attention.`
                : "All inbound messages have been reviewed."}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="p-12 rounded-2xl bg-foundation-dark border border-foundation-slate text-center text-xs font-sans text-typo-gray">
            Loading contact submissions...
          </div>
        ) : submissions.length === 0 ? (
          <div className="p-12 rounded-2xl bg-foundation-dark border border-foundation-slate text-center space-y-3">
            <Mail className="w-10 h-10 text-typo-gray/60 mx-auto" />
            <h3 className="font-display text-base font-bold text-typo-white">
              No inquiries logged yet.
            </h3>
            <p className="text-xs font-sans text-typo-gray max-w-md mx-auto">
              Inquiries submitted through the public /contact form will be stored here in real time.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl bg-foundation-dark border border-foundation-slate overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-foundation-slate/40 text-typo-gray border-b border-foundation-slate uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-4">Read</th>
                    <th className="p-4">Sender</th>
                    <th className="p-4">Inquiry Domain</th>
                    <th className="p-4">Subject &amp; Message Snippet</th>
                    <th className="p-4">Date</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-foundation-slate/50">
                  {submissions.map((item) => {
                    const isRead = item.read;
                    return (
                      <tr
                        key={(item as any)._id || item.id}
                        className={`transition-colors cursor-pointer ${
                          isRead
                            ? "hover:bg-foundation-slate/20 opacity-80"
                            : "bg-brand-blue/5 hover:bg-brand-blue/10 font-semibold"
                        }`}
                        onClick={() => handleInspect(item)}
                      >
                        <td className="p-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => toggleReadStatus(item)}
                            className={`w-6 h-6 rounded-md border flex items-center justify-center transition-colors ${
                              isRead
                                ? "bg-foundation-slate/60 border-foundation-slate text-typo-gray"
                                : "bg-brand-blue border-brand-cyan text-typo-white"
                            }`}
                            title={isRead ? "Mark as unread" : "Mark as read"}
                          >
                            {isRead ? <Check className="w-3.5 h-3.5" /> : <Mail className="w-3.5 h-3.5" />}
                          </button>
                        </td>

                        <td className="p-4 whitespace-nowrap">
                          <span className="font-semibold text-typo-white block">
                            {item.name}
                          </span>
                          <span className="text-[11px] text-brand-cyan font-mono block">
                            {item.email}
                          </span>
                        </td>

                        <td className="p-4 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded bg-foundation-slate text-[11px] text-brand-cyan">
                            {item.category || "General"}
                          </span>
                        </td>

                        <td className="p-4 max-w-sm">
                          <span className="text-typo-white block truncate">
                            {item.subject}
                          </span>
                          <span className="text-[11px] text-typo-gray truncate block font-normal">
                            {item.message}
                          </span>
                        </td>

                        <td className="p-4 whitespace-nowrap font-mono text-typo-gray">
                          {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "—"}
                        </td>

                        <td className="p-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleInspect(item)}
                              className="p-1.5 rounded-lg bg-foundation-slate/50 hover:bg-foundation-slate text-typo-white transition-colors"
                              title="Inspect Message"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setItemToDelete(item);
                                setDeleteModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/50 text-red-300 border border-red-500/30 transition-colors"
                              title="Delete Submission"
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

      {/* Detail Inspection Modal */}
      <AdminModal
        isOpen={Boolean(selectedItem)}
        onClose={() => setSelectedItem(null)}
        title="Inbound Inquiry Record"
        subtitle={`Submitted by ${selectedItem?.name}`}
        maxWidth="2xl"
      >
        {selectedItem && (
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-foundation-slate/30 border border-foundation-slate space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="text-typo-gray uppercase text-[10px] font-mono block">
                    Full Name
                  </span>
                  <span className="font-semibold text-typo-white text-sm">
                    {selectedItem.name}
                  </span>
                </div>

                <div>
                  <span className="text-typo-gray uppercase text-[10px] font-mono block">
                    Contact Email
                  </span>
                  <a
                    href={`mailto:${selectedItem.email}`}
                    className="font-mono text-brand-cyan hover:underline text-sm"
                  >
                    {selectedItem.email}
                  </a>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-foundation-slate/40">
                <div>
                  <span className="text-typo-gray uppercase text-[10px] font-mono block">
                    Inquiry Domain
                  </span>
                  <span className="text-typo-white font-medium">
                    {selectedItem.category || "General"}
                  </span>
                </div>

                <div>
                  <span className="text-typo-gray uppercase text-[10px] font-mono block">
                    Submission Time
                  </span>
                  <span className="font-mono text-typo-gray">
                    {selectedItem.createdAt
                      ? new Date(selectedItem.createdAt).toLocaleString()
                      : "—"}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs uppercase font-mono tracking-wider text-typo-gray font-semibold block">
                Subject
              </span>
              <p className="p-3 rounded-xl bg-foundation-slate/40 border border-foundation-slate text-sm font-semibold text-typo-white">
                {selectedItem.subject}
              </p>
            </div>

            <div className="space-y-2">
              <span className="text-xs uppercase font-mono tracking-wider text-typo-gray font-semibold block">
                Message Body
              </span>
              <div className="p-4 rounded-xl bg-foundation-slate/30 border border-foundation-slate text-xs font-sans text-typo-white leading-relaxed whitespace-pre-wrap">
                {selectedItem.message}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-foundation-slate/60">
              <a
                href={`mailto:${selectedItem.email}?subject=Re: ${encodeURIComponent(
                  selectedItem.subject
                )}`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-blue hover:bg-blue-600 text-typo-white text-xs font-sans font-semibold transition-colors shadow-md"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Reply via Institutional Email</span>
              </a>

              <button
                type="button"
                onClick={() => {
                  setItemToDelete(selectedItem);
                  setDeleteModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-950/40 hover:bg-red-900/50 text-red-300 border border-red-500/30 text-xs font-sans transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        )}
      </AdminModal>

      {/* Delete Confirmation */}
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        title={itemToDelete?.subject || "Inquiry"}
        itemDescription={`From ${itemToDelete?.name}`}
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
