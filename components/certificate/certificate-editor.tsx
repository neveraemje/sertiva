"use client"

import { useRef, useState } from "react"
import { ArrowLeftIcon, Trash2Icon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { CertificatePreview } from "@/components/certificate/certificate-preview"
import { DeleteCertificateDialog } from "@/components/certificate/delete-certificate-dialog"
import { EditorActions } from "@/components/certificate/editor-actions"
import { FieldSettings } from "@/components/certificate/field-settings"
import { PublishCertificateDialog } from "@/components/certificate/publish-certificate-dialog"
import { PublishedDetail } from "@/components/certificate/published-detail"
import type { CertificateEditorState, CertificateRecord, CertificateView, FieldPosition } from "@/components/certificate/types"
import { Badge } from "@/components/ui/badge"

type CertificateEditorProps = {
  certificate: CertificateRecord
  view: CertificateView
  onViewChange: (view: CertificateView) => void
  userId: string
  onBack: () => void
  onChange: (patch: Partial<CertificateEditorState>) => void
  onSave: () => Promise<void>
  onDelete: (id: string) => Promise<void>
  onViewActivity: () => void
  saveStatus: "idle" | "saving" | "saved" | "error"
  onPublished: () => Promise<void>
}

export function CertificateEditor({ certificate, view, onViewChange, userId, onBack, onChange, onSave, onDelete, onViewActivity, saveStatus, onPublished }: CertificateEditorProps) {
  const previewMode = view === "preview"
  const editing = view !== "details"
  const [publishOpen, setPublishOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const sidebarRef = useRef<HTMLElement>(null)

  function showPublishedDetails() {
    onViewChange("details")
    if (window.matchMedia("(max-width: 1279px)").matches) {
      window.requestAnimationFrame(() => sidebarRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }))
    }
  }

  function showProperties() {
    onViewChange("edit")
    if (window.matchMedia("(max-width: 1279px)").matches) {
      window.requestAnimationFrame(() => sidebarRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }))
    }
  }

  return (
    <div className="flex min-h-svh min-w-0 flex-1 flex-col xl:h-svh xl:min-h-0 xl:flex-row xl:overflow-hidden">
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex min-h-14 items-center gap-3 border-b bg-background px-4 lg:px-6">
          <SidebarTrigger className="md:hidden" />
          <Button variant="ghost" size="icon-sm" onClick={onBack} aria-label="Back to certificates"><ArrowLeftIcon /></Button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-medium">{certificate.name}</p>
              {certificate.publication
                ? <Badge className="bg-emerald-50 text-emerald-700">Published</Badge>
                : <Badge variant="secondary">Draft</Badge>}
            </div>
            <p className="truncate text-[11px] text-muted-foreground">{certificate.template.name}</p>
          </div>
          <EditorActions
            previewMode={previewMode}
            onPreviewToggle={() => onViewChange(previewMode ? "edit" : "preview")}
            onSave={onSave}
            saveStatus={saveStatus}
            onPublish={() => setPublishOpen(true)}
            published={Boolean(certificate.publication)}
            editing={editing}
            onEdit={showProperties}
            onActivity={showPublishedDetails}
          />
        </div>

        <div
          className="min-h-0 flex-1 bg-[#f6f6f6] xl:overflow-auto"
          style={{
            backgroundImage: "radial-gradient(circle, var(--border) 1px, transparent 1px)",
            backgroundSize: "18px 18px",
          }}
        >
          <div className="min-h-full p-4 lg:p-6">
            <CertificatePreview
              className="min-h-[calc(100vh-7rem)]"
              template={certificate.template}
              editor={certificate.editor}
              previewMode={previewMode || !editing}
              onPositionChange={(position: FieldPosition) => onChange({ position })}
              onNameChange={(recipientName) => onChange({ recipientName })}
            />
          </div>

        </div>
      </div>

      {!previewMode && (
        <aside ref={sidebarRef} className="w-full shrink-0 scroll-mt-4 border-t bg-white xl:flex xl:h-svh xl:min-h-0 xl:w-[320px] xl:flex-col xl:overflow-hidden xl:border-t-0 xl:border-l">
          <div className="flex h-12 items-center border-b px-4 text-sm font-medium">{editing ? "Properties" : "Published detail"}</div>
          <div className="xl:min-h-0 xl:flex-1 xl:overflow-y-auto">
            {editing ? (
              <FieldSettings
                className="rounded-none border-0 bg-white shadow-none ring-0 backdrop-blur-none"
                editor={certificate.editor}
                onChange={onChange}
              />
            ) : <PublishedDetail certificate={certificate} active onSettingsChanged={onPublished} onViewActivity={onViewActivity} />}
          </div>
          <div className="border-t p-4">
            <Button type="button" variant="destructive" className="w-full" onClick={() => setDeleteOpen(true)}>
              <Trash2Icon /> Delete certificate
            </Button>
          </div>
        </aside>
      )}

      <DeleteCertificateDialog
        certificate={deleteOpen ? certificate : null}
        onOpenChange={setDeleteOpen}
        onConfirm={onDelete}
      />

      <PublishCertificateDialog
        certificate={certificate}
        userId={userId}
        open={publishOpen}
        onOpenChange={setPublishOpen}
        onSave={onSave}
        onPublished={async () => {
          await onPublished()
          onViewChange("details")
        }}
      />
    </div>
  )
}
