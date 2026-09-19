"use client";

import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Users, GraduationCap, Briefcase } from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminModal } from "@/components/admin/AdminModal";
import { DeleteConfirmModal } from "@/components/admin/DeleteConfirmModal";
import { ImageInput } from "@/components/admin/ImageInput";
import { Button } from "@/components/ui/Button";
import { ITeamMember, TeamCategory } from "@/types/content";

export default function AdminTeamPage() {
  const [members, setMembers] = useState<ITeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<ITeamMember | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<ITeamMember | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    role: "",
    department: "Computer Science & Engineering",
    year: "Final Year",
    category: "student_lead" as TeamCategory,
    bio: "",
    avatarUrl: "",
    order: 1,
    linkedinUrl: "",
    githubUrl: "",
  });

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/team", { cache: "no-store" });
      const json = await res.json();
      if (json.success) {
        setMembers(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const openCreateModal = () => {
    setEditingMember(null);
    setFormData({
      name: "",
      role: "",
      department: "Computer Science & Engineering",
      year: "Final Year",
      category: "student_lead",
      bio: "",
      avatarUrl: "",
      order: members.length + 1,
      linkedinUrl: "",
      githubUrl: "",
    });
    setModalOpen(true);
  };

  const openEditModal = (m: ITeamMember) => {
    setEditingMember(m);
    setFormData({
      name: m.name,
      role: m.role,
      department: m.department || "",
      year: (m as any).year || "",
      category: m.category,
      bio: m.bio || "",
      avatarUrl: m.avatarUrl || "",
      order: m.order || 1,
      linkedinUrl: m.linkedinUrl || "",
      githubUrl: m.githubUrl || "",
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const isEdit = Boolean(editingMember);
      const url = isEdit
        ? `/api/admin/team/${(editingMember as any)._id || editingMember?.id}`
        : "/api/admin/team";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (json.success) {
        setModalOpen(false);
        fetchMembers();
      } else {
        alert(json.error || "Failed to save team member.");
      }
    } catch {
      alert("Network error.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!memberToDelete) return;
    setSaving(true);

    try {
      const id = (memberToDelete as any)._id || memberToDelete.id;
      const res = await fetch(`/api/admin/team/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        setDeleteModalOpen(false);
        setMemberToDelete(null);
        fetchMembers();
      } else {
        alert(json.error || "Failed to delete team member.");
      }
    } catch {
      alert("Network error.");
    } finally {
      setSaving(false);
    }
  };

  // Group by Student vs Faculty
  const studentMembers = members.filter(
    (m) => m.category === "student_lead" || m.category === "core_team"
  );
  const facultyMembers = members.filter(
    (m) => m.category === "faculty_coordinator" || m.category === "advisory"
  );

  return (
    <div className="flex flex-col flex-1">
      <AdminHeader
        title="Team Directory"
        subtitle="Manage official student leads and faculty coordinator appointments"
        onToggleSidebar={() => {}}
      />

      <main className="p-6 sm:p-8 space-y-8 max-w-7xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-xl font-bold text-typo-white">
              Cell Appointments ({members.length})
            </h2>
            <p className="text-xs font-sans text-typo-gray">
              Student appointments render first publicly, followed by Faculty coordinators.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-blue hover:bg-blue-600 text-typo-white text-xs font-sans font-semibold shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Team Member</span>
          </button>
        </div>

        {/* Student Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-mono text-brand-cyan">
            <GraduationCap className="w-4 h-4" />
            <span className="uppercase tracking-wider font-semibold">
              Student Council &amp; Initiative Leads ({studentMembers.length})
            </span>
          </div>

          <div className="rounded-2xl bg-foundation-dark border border-foundation-slate overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-foundation-slate/40 text-typo-gray border-b border-foundation-slate uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-4">Order</th>
                    <th className="p-4">Name</th>
                    <th className="p-4">Official Role / Position</th>
                    <th className="p-4">Department &amp; Year</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-foundation-slate/50">
                  {studentMembers.map((m) => (
                    <tr
                      key={(m as any)._id || m.id}
                      className="hover:bg-foundation-slate/20 transition-colors"
                    >
                      <td className="p-4 font-mono text-typo-gray w-16">
                        #{m.order}
                      </td>
                      <td className="p-4 font-semibold text-typo-white">
                        {m.name}
                      </td>
                      <td className="p-4 text-brand-cyan font-medium">
                        {m.role}
                      </td>
                      <td className="p-4 text-typo-gray">
                        {m.department || "Engineering"}
                      </td>
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
                              setMemberToDelete(m);
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
        </div>

        {/* Faculty Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-mono text-typo-white">
            <Briefcase className="w-4 h-4 text-brand-cyan" />
            <span className="uppercase tracking-wider font-semibold">
              Faculty Coordination &amp; Advisory ({facultyMembers.length})
            </span>
          </div>

          <div className="rounded-2xl bg-foundation-dark border border-foundation-slate overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-foundation-slate/40 text-typo-gray border-b border-foundation-slate uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-4">Order</th>
                    <th className="p-4">Name</th>
                    <th className="p-4">Official Designation</th>
                    <th className="p-4">Department</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-foundation-slate/50">
                  {facultyMembers.map((m) => (
                    <tr
                      key={(m as any)._id || m.id}
                      className="hover:bg-foundation-slate/20 transition-colors"
                    >
                      <td className="p-4 font-mono text-typo-gray w-16">
                        #{m.order}
                      </td>
                      <td className="p-4 font-semibold text-typo-white">
                        {m.name}
                      </td>
                      <td className="p-4 text-brand-cyan font-medium">
                        {m.role}
                      </td>
                      <td className="p-4 text-typo-gray">
                        {m.department || "Department of Engineering"}
                      </td>
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
                              setMemberToDelete(m);
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
        </div>
      </main>

      {/* Editor Modal */}
      <AdminModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingMember ? "Edit Team Member" : "Add Team Member"}
        subtitle="Specify official position title, academic department, and display order"
        maxWidth="2xl"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-typo-gray uppercase tracking-wider">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Prof. R. B. Patil"
                className="w-full px-4 py-2.5 rounded-xl bg-foundation-slate/50 border border-foundation-slate text-typo-white text-xs focus:outline-none focus:border-brand-cyan"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-typo-gray uppercase tracking-wider">
                Team Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value as TeamCategory })
                }
                className="w-full px-4 py-2.5 rounded-xl bg-foundation-slate/50 border border-foundation-slate text-typo-white text-xs focus:outline-none focus:border-brand-cyan"
              >
                <option value="student_lead">Student Council Lead</option>
                <option value="core_team">Student Core Team</option>
                <option value="faculty_coordinator">Faculty Coordinator</option>
                <option value="advisory">Faculty Advisor</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-typo-gray uppercase tracking-wider">
                Official Position Title *
              </label>
              <input
                type="text"
                required
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                placeholder="e.g. Lead: Student Initiatives"
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
                Department
              </label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                placeholder="e.g. Mechanical Engineering"
                className="w-full px-4 py-2.5 rounded-xl bg-foundation-slate/50 border border-foundation-slate text-typo-white text-xs focus:outline-none focus:border-brand-cyan"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-typo-gray uppercase tracking-wider">
                Year / Cohort
              </label>
              <input
                type="text"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                placeholder="e.g. Final Year, TKIET"
                className="w-full px-4 py-2.5 rounded-xl bg-foundation-slate/50 border border-foundation-slate text-typo-white text-xs focus:outline-none focus:border-brand-cyan"
              />
            </div>
          </div>

          <ImageInput
            label="Avatar Photo"
            value={formData.avatarUrl}
            onChange={(url) => setFormData({ ...formData, avatarUrl: url })}
          />

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-typo-gray uppercase tracking-wider">
              Short Bio / Responsibility
            </label>
            <textarea
              rows={3}
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Coordinates cell-wide ideathons, hackathons, and technical bootcamps."
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
              {saving ? "Saving..." : editingMember ? "Save Changes" : "Add Member"}
            </Button>
          </div>
        </form>
      </AdminModal>

      {/* Delete Confirmation */}
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        title={memberToDelete?.name || ""}
        itemDescription={memberToDelete?.role}
        isDeleting={saving}
        onConfirm={handleDelete}
        onCancel={() => {
          setDeleteModalOpen(false);
          setMemberToDelete(null);
        }}
      />
    </div>
  );
}
