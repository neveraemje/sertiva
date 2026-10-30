"use client"

import { FileTextIcon, PlusIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { CertificateCard } from "@/components/certificate/certificate-card"
import { useMessages } from "@/components/i18n/locale-provider"
import type { CertificateRecord } from "@/components/certificate/types"

type CertificateListProps = {
  certificates: CertificateRecord[]
  loading: boolean
  error: string | null
  onRetry: () => void
  onCreate: () => void
  onOpen: (id: string) => void
}

const messages = {
  en: {
    workspace: "Workspace",
    title: "Certificates",
    subtitle: "Create and edit your certificate templates.",
    newCertificate: "New certificate",
    loading: "Loading certificates…",
    loadFailed: (error: string) => error ? `Could not load certificates: ${error}` : "Could not load certificates.",
    tryAgain: "Try again",
    emptyTitle: "No certificates yet",
    emptyDescription: "Upload a design to create your first certificate.",
  },
  id: {
    workspace: "Ruang kerja",
    title: "Sertifikat",
    subtitle: "Buat dan edit templat sertifikat Anda.",
    newCertificate: "Sertifikat baru",
    loading: "Memuat sertifikat…",
    loadFailed: (error: string) => error ? `Tidak dapat memuat sertifikat: ${error}` : "Tidak dapat memuat sertifikat.",
    tryAgain: "Coba lagi",
    emptyTitle: "Belum ada sertifikat",
    emptyDescription: "Unggah desain untuk membuat sertifikat pertama Anda.",
  },
}

export function CertificateList({ certificates, loading, error, onRetry, onCreate, onOpen }: CertificateListProps) {
  const t = useMessages(messages)

  return (
    <div className="flex w-full flex-col gap-8 px-4 py-6 lg:px-8 lg:py-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="flex items-start gap-2">
          <SidebarTrigger className="mt-4 -ml-2 md:hidden" />
          <div>
            <p className="mb-2 text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase">{t.workspace}</p>
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{t.title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{t.subtitle}</p>
          </div>
        </div>
        <Button onClick={onCreate}><PlusIcon data-icon="inline-start" /> {t.newCertificate}</Button>
      </div>

      {!loading && error === null && certificates.length > 0 && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4 xl:gap-6">
          {certificates.map((certificate) => (
            <CertificateCard
              key={certificate.id}
              certificate={certificate}
              onOpen={onOpen}
            />
          ))}
        </div>
      )}

      {loading && <div className="py-16 text-center text-sm text-muted-foreground">{t.loading}</div>}

      {!loading && error !== null && (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <p role="alert" className="text-sm text-destructive">{t.loadFailed(error)}</p>
          <Button variant="outline" size="sm" onClick={onRetry}>{t.tryAgain}</Button>
        </div>
      )}

      {!loading && error === null && certificates.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border bg-background px-6 py-16 text-center">
          <span className="mb-3 flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground"><FileTextIcon className="size-5" /></span>
          <p className="text-sm font-medium">{t.emptyTitle}</p>
          <p className="mt-1 text-xs text-muted-foreground">{t.emptyDescription}</p>
          <Button className="mt-5" size="sm" onClick={onCreate}><PlusIcon /> {t.newCertificate}</Button>
        </div>
      )}
    </div>
  )
}
