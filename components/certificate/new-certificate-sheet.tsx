"use client"

import { useRef, useState } from "react"

import { DesignFilePreview } from "@/components/certificate/design-file-preview"
import { prepareDesignFile, type PreparedDesignFile } from "@/components/certificate/prepare-design-file"
import { useMessages } from "@/components/i18n/locale-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

type NewCertificateSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreate: (name: string, design: PreparedDesignFile) => Promise<void>
}

const messages = {
  en: {
    fileError: "This file could not be previewed. Try another PDF, PNG, or JPG.",
    saveFailed: "Could not save the certificate.",
    title: "New certificate",
    description: "Name the certificate and upload its finished design.",
    nameLabel: "Certificate name",
    namePlaceholder: "e.g. Leadership Award",
    designLabel: "Design file",
    cancel: "Cancel",
    saving: "Saving…",
    create: "Create certificate",
  },
  id: {
    fileError: "Pratinjau file ini tidak dapat ditampilkan. Coba file PDF, PNG, atau JPG lain.",
    saveFailed: "Tidak dapat menyimpan sertifikat.",
    title: "Sertifikat baru",
    description: "Beri nama sertifikat dan unggah desain finalnya.",
    nameLabel: "Nama sertifikat",
    namePlaceholder: "mis. Penghargaan Kepemimpinan",
    designLabel: "File desain",
    cancel: "Batal",
    saving: "Menyimpan…",
    create: "Buat sertifikat",
  },
}

export function NewCertificateSheet({ open, onOpenChange, onCreate }: NewCertificateSheetProps) {
  const t = useMessages(messages)
  const [name, setName] = useState("")
  const [design, setDesign] = useState<PreparedDesignFile | null>(null)
  const [preparing, setPreparing] = useState(false)
  const [fileError, setFileError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function selectFile(nextFile: File | null) {
    setDesign(null)
    setFileError(null)
    setCreateError(null)
    if (!nextFile) return

    setPreparing(true)
    try {
      setDesign(await prepareDesignFile(nextFile))
    } catch {
      setFileError(t.fileError)
    } finally {
      setPreparing(false)
    }
  }

  function clearForm() {
    setName("")
    setDesign(null)
    setPreparing(false)
    setFileError(null)
    setCreateError(null)
    if (inputRef.current) inputRef.current.value = ""
  }

  function changeOpen(nextOpen: boolean) {
    if (!nextOpen) clearForm()
    onOpenChange(nextOpen)
  }

  async function createCertificate() {
    if (!name.trim() || !design) return
    setCreating(true)
    setCreateError(null)
    try {
      await onCreate(name.trim(), design)
      clearForm()
    } catch (caught) {
      setCreateError(caught instanceof Error ? caught.message : t.saveFailed)
    } finally {
      setCreating(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={changeOpen}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader className="border-b p-6">
          <SheetTitle>{t.title}</SheetTitle>
          <SheetDescription>{t.description}</SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-6 py-2">
          <div className="space-y-2">
            <Label htmlFor="certificate-name">{t.nameLabel}</Label>
            <Input
              id="certificate-name"
              placeholder={t.namePlaceholder}
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label>{t.designLabel}</Label>
            <button
              type="button"
              className="flex min-h-44 w-full flex-col items-center justify-center rounded-xl border border-dashed bg-muted/30 p-4 text-center transition-colors hover:bg-muted/60"
              onClick={() => inputRef.current?.click()}
            >
              <DesignFilePreview
                file={design?.file ?? null}
                previewUrl={design?.previewUrl ?? null}
                width={design?.width}
                height={design?.height}
                loading={preparing}
              />
            </button>
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
              className="hidden"
              onClick={(event) => { event.currentTarget.value = "" }}
              onChange={(event) => { void selectFile(event.target.files?.[0] ?? null) }}
            />
            {fileError && <p className="text-xs text-destructive">{fileError}</p>}
            {createError && <p role="alert" className="text-xs text-destructive">{createError}</p>}
          </div>
        </div>

        <SheetFooter className="flex-row justify-between border-t p-6">
          <Button variant="outline" size="lg" onClick={() => changeOpen(false)}>{t.cancel}</Button>
          <Button size="lg" disabled={!name.trim() || !design || preparing || creating} onClick={() => { void createCertificate() }}>
            {creating ? t.saving : t.create}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
