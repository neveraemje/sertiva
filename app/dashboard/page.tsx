import { redirect } from "next/navigation"

import { CertificateAdmin } from "@/components/certificate/certificate-admin"
import type { CertificateView } from "@/components/certificate/types"
import { getCurrentUser } from "@/lib/auth"

export const instant = false

export default async function DashboardPage({ searchParams }: {
  searchParams: Promise<{ certificate?: string | string[]; view?: string | string[]; section?: string | string[] }>
}) {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  const params = await searchParams
  const initialCertificateId = typeof params.certificate === "string" ? params.certificate : null
  const initialSection = params.section === "settings" ? "settings" : "certificates"
  const initialView: CertificateView | null = params.view === "edit" || params.view === "preview" || params.view === "details" ? params.view : null

  return <CertificateAdmin key={user.id} user={user} initialCertificateId={initialCertificateId} initialView={initialView} initialSection={initialSection} />
}
