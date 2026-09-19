"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";

const AdminSidebar = dynamic(
  () => import("@/components/admin/AdminSidebar").then((mod) => mod.AdminSidebar),
  { ssr: false }
);

export default function AdminDashboardLayoutShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-foundation-space flex flex-col lg:flex-row text-typo-white font-sans selection:bg-brand-blue selection:text-typo-white">
      {/* Responsive Sidebar */}
      <AdminSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 pb-16">{children}</div>
      </div>
    </div>
  );
}
