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

type DeleteCertificateDialogProps = {
  certificate: CertificateRecord | null
  onOpenChange: (open: boolean) => void
  onConfirm: (id: string) => Promise<void>
}

export function DeleteCertificateDialog({ certificate, onOpenChange, onConfirm }: DeleteCertificateDialogProps) {
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function confirmDelete() {
    if (!certificate) return
    setDeleting(true)
    setError(null)
    try {
      await onConfirm(certificate.id)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not delete this certificate.")
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
          <AlertDialogTitle>Delete certificate?</AlertDialogTitle>
          <AlertDialogDescription>
            {certificate ? `“${certificate.name}” will be permanently removed. This action cannot be undone.` : "This certificate will be permanently removed."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={deleting}
            onClick={() => { void confirmDelete() }}
          >
            {deleting ? "Deleting…" : "Delete certificate"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
