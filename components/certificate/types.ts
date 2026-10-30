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

// Name box size as a percentage of the certificate. No height means the box follows the text height.
export type FieldSize = {
  width: number
  height?: number
}

export const defaultFieldSize: FieldSize = { width: 60 }

// Space between the name and the box edges, in px on a 1000px-wide certificate (like fontSize).
export type FieldMargin = {
  x: number
  y: number
}

export const defaultFieldMargin: FieldMargin = { x: 20, y: 5 }

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
  size?: FieldSize
  margin?: FieldMargin
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
