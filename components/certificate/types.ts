export type TemplateAsset = {
  name: string
  kind: "image" | "pdf" | "sample"
  url: string | null
  previewUrl?: string | null
  width?: number
  height?: number
}

export type FieldPosition = {
  x: number
  y: number
}

export type TextAlignment = "left" | "center" | "right"

export type CertificateView = "edit" | "preview" | "details"

export type CertificateEditorState = {
  recipientName: string
  fontSize: number
  fontFamily: string
  fontWeight: number
  textColor: string
  textOpacity: number
  textAlign: TextAlignment
  position: FieldPosition
  autoFit: boolean
}

export type CertificatePublication = {
  slug: string
  publishedAt: string
  expiresAt: string | null
  isExpired: boolean
  isClaimed: boolean
  accessMode: "anyone" | "restricted"
  allowedEmails: string[]
  inputMode: "single" | "repeat"
  submissionCount: number
  downloadCount: number
}

export type CertificateRecord = {
  id: string
  name: string
  template: TemplateAsset
  editor: CertificateEditorState
  updatedAt: string
  publication: CertificatePublication | null
}
