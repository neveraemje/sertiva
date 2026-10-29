import { FileTextIcon, ImageIcon, LoaderCircleIcon, UploadIcon } from "lucide-react"

type DesignFilePreviewProps = {
  file: File | null
  previewUrl: string | null
  width?: number
  height?: number
  loading?: boolean
}

export function DesignFilePreview({ file, previewUrl, width, height, loading = false }: DesignFilePreviewProps) {
  if (loading) {
    return (
      <>
        <span className="mb-4 flex size-10 items-center justify-center rounded-lg border bg-background">
          <LoaderCircleIcon className="size-5 animate-spin" />
        </span>
        <span className="text-sm font-medium">Preparing preview…</span>
        <span className="mt-1 text-xs text-muted-foreground">Reading the design dimensions</span>
      </>
    )
  }

  if (!file || !previewUrl) {
    return (
      <>
        <span className="mb-4 flex size-10 items-center justify-center rounded-lg border bg-background">
          <UploadIcon className="size-5" />
        </span>
        <span className="text-sm font-medium">Choose a design file</span>
        <span className="mt-1 text-xs text-muted-foreground">PDF, PNG, or JPG</span>
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
          aria-label={`${file.name} preview`}
        />
      </span>

      <span className="flex max-w-full items-center gap-2">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-background">
          {isPdf ? <FileTextIcon className="size-4" /> : <ImageIcon className="size-4" />}
        </span>
        <span className="min-w-0 text-left">
          <span className="block truncate text-sm font-medium">{file.name}</span>
          <span className="block text-xs text-muted-foreground">Click to replace</span>
        </span>
      </span>
    </>
  )
}
