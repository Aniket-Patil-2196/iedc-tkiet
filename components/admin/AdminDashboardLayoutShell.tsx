"use client";

import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";

const AdminSidebar = dynamic(
  () => import("@/components/admin/AdminSidebar").then((mod) => mod.AdminSidebar),
  { ssr: false }
);

interface AdminSidebarContextValue {
  isOpen: boolean;
  toggle: () => void;
  close: () => void;
  open: () => void;
}

const AdminSidebarContext = createContext<AdminSidebarContextValue | null>(null);

/** Used by AdminHeader (and others) to open/close the layout-owned mobile sidebar. */
export function useAdminSidebar() {
  const ctx = useContext(AdminSidebarContext);
  if (!ctx) {
    return {
      isOpen: false,
      toggle: () => {},
      close: () => {},
      open: () => {},
    };
  }
  return ctx;
}

export default function AdminDashboardLayoutShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggle = useCallback(() => setIsSidebarOpen((v) => !v), []);
  const close = useCallback(() => setIsSidebarOpen(false), []);
  const open = useCallback(() => setIsSidebarOpen(true), []);

  const value = useMemo(
    () => ({ isOpen: isSidebarOpen, toggle, close, open }),
    [isSidebarOpen, toggle, close, open]
  );

  return (
    <AdminSidebarContext.Provider value={value}>
      <div className="min-h-screen bg-foundation-space flex flex-col lg:flex-row text-typo-white font-sans selection:bg-brand-blue selection:text-typo-white">
        <AdminSidebar isOpen={isSidebarOpen} onClose={close} />

        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 pb-16">{children}</div>
        </div>
      </div>
    </AdminSidebarContext.Provider>
  );
}
