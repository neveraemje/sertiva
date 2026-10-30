import { EyeIcon, EyeOffIcon, ListIcon } from "lucide-react"

import { useMessages } from "@/components/i18n/locale-provider"
import { Button } from "@/components/ui/button"

type EditorActionsProps = {
  previewMode: boolean
  onPreviewToggle: () => void
  onSave: () => Promise<void>
  saveStatus: "idle" | "saving" | "saved" | "error"
  onPublish: () => void
  published: boolean
  editing: boolean
  onEdit: () => void
  onActivity: () => void
}

const messages = {
  en: {
    saving: "Saving…",
    saved: "Saved",
    draftSaved: "Draft saved",
    saveFailed: "Save failed",
    exitPreview: "Exit preview",
    previewCertificate: "Preview certificate",
    savingDraft: "Saving draft…",
    saveAsDraft: "Save as draft",
    publishedDetail: "Published detail",
    publishChanges: "Publish changes",
    edit: "Edit",
    publish: "Publish",
  },
  id: {
    saving: "Menyimpan…",
    saved: "Tersimpan",
    draftSaved: "Draf tersimpan",
    saveFailed: "Gagal menyimpan",
    exitPreview: "Keluar dari pratinjau",
    previewCertificate: "Pratinjau sertifikat",
    savingDraft: "Menyimpan draf…",
    saveAsDraft: "Simpan sebagai draf",
    publishedDetail: "Detail terbitan",
    publishChanges: "Terbitkan perubahan",
    edit: "Edit",
    publish: "Terbitkan",
  },
}

export function EditorActions({ previewMode, onPreviewToggle, onSave, saveStatus, onPublish, published, editing, onEdit, onActivity }: EditorActionsProps) {
  const t = useMessages(messages)

  return (
    <div className="ml-auto flex shrink-0 items-center gap-2">
      {editing && <span className="hidden text-xs text-muted-foreground sm:inline" role={saveStatus === "error" ? "alert" : undefined}>
        {saveStatus === "saving" ? t.saving : saveStatus === "saved" ? published ? t.saved : t.draftSaved : saveStatus === "error" ? t.saveFailed : ""}
      </span>}
      {editing && <Button
        type="button"
        variant="secondary"
        size="icon-lg"
        onClick={onPreviewToggle}
        aria-label={previewMode ? t.exitPreview : t.previewCertificate}
        aria-pressed={previewMode}
      >
        {previewMode ? <EyeOffIcon /> : <EyeIcon />}
      </Button>}
      {editing && !published && <Button type="button" variant="secondary" size="lg" onClick={() => { void onSave().catch(() => {}) }}>
        {saveStatus === "saving" ? t.savingDraft : saveStatus === "saved" ? t.draftSaved : t.saveAsDraft}
      </Button>}
      {published && editing && <Button type="button" variant="outline" size="lg" onClick={onActivity}>
        <ListIcon /> {t.publishedDetail}
      </Button>}
      <Button type="button" size="lg" onClick={published && !editing ? onEdit : onPublish}>
        {published ? editing ? t.publishChanges : t.edit : t.publish}
      </Button>
    </div>
  )
}
