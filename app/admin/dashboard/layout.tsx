export const dynamic = "force-dynamic";
export const revalidate = 0;

import React from "react";
import AdminDashboardLayoutShell from "@/components/admin/AdminDashboardLayoutShell";

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminDashboardLayoutShell>{children}</AdminDashboardLayoutShell>;
}
