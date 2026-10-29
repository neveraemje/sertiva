import { EyeIcon, EyeOffIcon, ListIcon } from "lucide-react"

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

export function EditorActions({ previewMode, onPreviewToggle, onSave, saveStatus, onPublish, published, editing, onEdit, onActivity }: EditorActionsProps) {
  return (
    <div className="ml-auto flex shrink-0 items-center gap-2">
      {editing && <span className="hidden text-xs text-muted-foreground sm:inline" role={saveStatus === "error" ? "alert" : undefined}>
        {saveStatus === "saving" ? "Saving…" : saveStatus === "saved" ? published ? "Saved" : "Draft saved" : saveStatus === "error" ? "Save failed" : ""}
      </span>}
      {editing && <Button
        type="button"
        variant="secondary"
        size="icon-lg"
        onClick={onPreviewToggle}
        aria-label={previewMode ? "Exit preview" : "Preview certificate"}
        aria-pressed={previewMode}
      >
        {previewMode ? <EyeOffIcon /> : <EyeIcon />}
      </Button>}
      {editing && !published && <Button type="button" variant="secondary" size="lg" onClick={() => { void onSave().catch(() => {}) }}>
        {saveStatus === "saving" ? "Saving draft…" : saveStatus === "saved" ? "Draft saved" : "Save as draft"}
      </Button>}
      {published && editing && <Button type="button" variant="outline" size="lg" onClick={onActivity}>
        <ListIcon /> Published detail
      </Button>}
      <Button type="button" size="lg" onClick={published && !editing ? onEdit : onPublish}>
        {published ? editing ? "Publish changes" : "Edit" : "Publish"}
      </Button>
    </div>
  )
}
