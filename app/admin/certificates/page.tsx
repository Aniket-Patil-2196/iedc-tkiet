import { redirect } from "next/navigation";

export default function CertificatesRedirect() {
  redirect("/admin/dashboard/certificates");
}
