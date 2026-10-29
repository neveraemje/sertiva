"use client"

import { useRef, useState } from "react"

import { DesignFilePreview } from "@/components/certificate/design-file-preview"
import { prepareDesignFile, type PreparedDesignFile } from "@/components/certificate/prepare-design-file"
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

export function NewCertificateSheet({ open, onOpenChange, onCreate }: NewCertificateSheetProps) {
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
      setFileError("This file could not be previewed. Try another PDF, PNG, or JPG.")
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
      setCreateError(caught instanceof Error ? caught.message : "Could not save the certificate.")
    } finally {
      setCreating(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={changeOpen}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader className="border-b p-6">
          <SheetTitle>New certificate</SheetTitle>
          <SheetDescription>Name the certificate and upload its finished design.</SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-6 py-2">
          <div className="space-y-2">
            <Label htmlFor="certificate-name">Certificate name</Label>
            <Input
              id="certificate-name"
              placeholder="e.g. Leadership Award"
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label>Design file</Label>
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
          <Button variant="outline" size="lg" onClick={() => changeOpen(false)}>Cancel</Button>
          <Button size="lg" disabled={!name.trim() || !design || preparing || creating} onClick={() => { void createCertificate() }}>
            {creating ? "Saving…" : "Create certificate"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
