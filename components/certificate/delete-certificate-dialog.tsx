"use client"

import { useState } from "react"
import { Trash2Icon } from "lucide-react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import type { CertificateRecord } from "@/components/certificate/types"
import { useMessages } from "@/components/i18n/locale-provider"

type DeleteCertificateDialogProps = {
  certificate: CertificateRecord | null
  onOpenChange: (open: boolean) => void
  onConfirm: (id: string) => Promise<void>
}

const messages = {
  en: {
    deleteFailed: "Could not delete this certificate.",
    title: "Delete certificate?",
    description: (name: string) => `“${name}” will be permanently removed. This action cannot be undone.`,
    fallbackDescription: "This certificate will be permanently removed.",
    cancel: "Cancel",
    deleting: "Deleting…",
    confirm: "Delete certificate",
  },
  id: {
    deleteFailed: "Tidak dapat menghapus sertifikat ini.",
    title: "Hapus sertifikat?",
    description: (name: string) => `“${name}” akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan.`,
    fallbackDescription: "Sertifikat ini akan dihapus secara permanen.",
    cancel: "Batal",
    deleting: "Menghapus…",
    confirm: "Hapus sertifikat",
  },
}

export function DeleteCertificateDialog({ certificate, onOpenChange, onConfirm }: DeleteCertificateDialogProps) {
  const t = useMessages(messages)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function confirmDelete() {
    if (!certificate) return
    setDeleting(true)
    setError(null)
    try {
      await onConfirm(certificate.id)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t.deleteFailed)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <AlertDialog open={Boolean(certificate)} onOpenChange={(open) => {
      if (!open) setError(null)
      onOpenChange(open)
    }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/10 text-destructive">
            <Trash2Icon />
          </AlertDialogMedia>
          <AlertDialogTitle>{t.title}</AlertDialogTitle>
          <AlertDialogDescription>
            {certificate ? t.description(certificate.name) : t.fallbackDescription}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <AlertDialogFooter>
          <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={deleting}
            onClick={() => { void confirmDelete() }}
          >
            {deleting ? t.deleting : t.confirm}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
