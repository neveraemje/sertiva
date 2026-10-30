import { FileTextIcon, ImageIcon, LoaderCircleIcon, UploadIcon } from "lucide-react"

import { useMessages } from "@/components/i18n/locale-provider"

type DesignFilePreviewProps = {
  file: File | null
  previewUrl: string | null
  width?: number
  height?: number
  loading?: boolean
}

const messages = {
  en: {
    preparing: "Preparing preview…",
    readingDimensions: "Reading the design dimensions",
    choose: "Choose a design file",
    formats: "PDF, PNG, or JPG",
    preview: (name: string) => `${name} preview`,
    replace: "Click to replace",
  },
  id: {
    preparing: "Menyiapkan pratinjau…",
    readingDimensions: "Membaca dimensi desain",
    choose: "Pilih file desain",
    formats: "PDF, PNG, atau JPG",
    preview: (name: string) => `Pratinjau ${name}`,
    replace: "Klik untuk mengganti",
  },
}

export function DesignFilePreview({ file, previewUrl, width, height, loading = false }: DesignFilePreviewProps) {
  const t = useMessages(messages)

  if (loading) {
    return (
      <>
        <span className="mb-4 flex size-10 items-center justify-center rounded-lg border bg-background">
          <LoaderCircleIcon className="size-5 animate-spin" />
        </span>
        <span className="text-sm font-medium">{t.preparing}</span>
        <span className="mt-1 text-xs text-muted-foreground">{t.readingDimensions}</span>
      </>
    )
  }

  if (!file || !previewUrl) {
    return (
      <>
        <span className="mb-4 flex size-10 items-center justify-center rounded-lg border bg-background">
          <UploadIcon className="size-5" />
        </span>
        <span className="text-sm font-medium">{t.choose}</span>
        <span className="mt-1 text-xs text-muted-foreground">{t.formats}</span>
      </>
    )
  }

  const isPdf = file.type === "application/pdf"

  return (
    <>
      <span
        className="mb-4 block w-full overflow-hidden rounded-lg border bg-white shadow-sm"
        style={{ aspectRatio: width && height ? `${width} / ${height}` : "4 / 3" }}
      >
        <span
          className="block size-full bg-contain bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${previewUrl})` }}
          role="img"
          aria-label={t.preview(file.name)}
        />
      </span>

      <span className="flex max-w-full items-center gap-2">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-background">
          {isPdf ? <FileTextIcon className="size-4" /> : <ImageIcon className="size-4" />}
        </span>
        <span className="min-w-0 text-left">
          <span className="block truncate text-sm font-medium">{file.name}</span>
          <span className="block text-xs text-muted-foreground">{t.replace}</span>
        </span>
      </span>
    </>
  )
}
