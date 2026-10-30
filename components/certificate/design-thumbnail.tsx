import { FileTextIcon } from "lucide-react"

import type { TemplateAsset } from "@/components/certificate/types"
import { useMessages } from "@/components/i18n/locale-provider"
import { cn } from "@/lib/utils"

type DesignThumbnailProps = {
  template: TemplateAsset
  variant?: "compact" | "card"
}

export const designFormatMessages = {
  en: { image: "IMAGE" },
  id: { image: "GAMBAR" },
}

export function getDesignFormat(template: TemplateAsset, imageLabel = designFormatMessages.en.image) {
  if (template.kind === "pdf") return "PDF"

  const extension = template.name.split(".").pop()?.toUpperCase()
  if (extension === "JPEG") return "JPG"
  if (extension === "PNG" || extension === "JPG") return extension

  return imageLabel
}

export function DesignThumbnail({ template, variant = "compact" }: DesignThumbnailProps) {
  const t = useMessages(designFormatMessages)
  const format = getDesignFormat(template, t.image)
  const isCard = variant === "card"

  return (
    <span className={cn(
      "relative flex shrink-0 overflow-hidden border bg-white",
      isCard ? "aspect-video w-full border-0 bg-muted/45" : "aspect-[1.414/1] w-24 rounded-lg shadow-xs"
    )}>
      {(template.previewUrl || (template.kind === "image" && template.url)) && (
        <span
          className={cn("absolute inset-0 bg-center bg-no-repeat", isCard ? "bg-cover" : "bg-contain")}
          style={{ backgroundImage: `url(${template.previewUrl ?? template.url})` }}
          aria-hidden="true"
        />
      )}

      {template.kind === "sample" && (
        <span className={cn("absolute inset-0 bg-[#fbfaf7]", isCard ? "p-5" : "p-1.5")}>
          <span className="flex size-full flex-col items-center border border-neutral-500 px-1 pt-1">
            <span className={cn("rounded-full border border-neutral-700", isCard ? "mt-8 size-8" : "mt-0.5 size-2")} />
            <span className={cn("bg-neutral-500", isCard ? "mt-8 h-px w-1/2" : "mt-1 h-px w-8")} />
            <span className={cn("bg-neutral-800", isCard ? "mt-6 h-3 w-2/3" : "mt-1 h-1 w-12")} />
            <span className={cn("bg-neutral-300", isCard ? "mt-10 h-px w-1/2" : "mt-1.5 h-px w-9")} />
            <span className={cn("mt-auto grid grid-cols-2", isCard ? "mb-8 w-2/3 gap-8" : "mb-1 w-10 gap-2")}><span className="h-px bg-neutral-400" /><span className="h-px bg-neutral-400" /></span>
          </span>
        </span>
      )}

      {((template.kind === "image" && !template.url) || (template.kind === "pdf" && !template.previewUrl)) && (
        <span className="flex size-full flex-col items-center justify-center gap-2 bg-muted/35 text-muted-foreground">
          <FileTextIcon className={isCard ? "size-8" : "size-4"} />
          <span className={cn("font-semibold tracking-wide", isCard ? "text-xs" : "text-[8px]")}>{format}</span>
        </span>
      )}
    </span>
  )
}
