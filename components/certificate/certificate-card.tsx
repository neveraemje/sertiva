import { DesignThumbnail, designFormatMessages, getDesignFormat } from "@/components/certificate/design-thumbnail"
import type { CertificateRecord } from "@/components/certificate/types"
import { useLocale, useMessages } from "@/components/i18n/locale-provider"
import { Badge } from "@/components/ui/badge"

type CertificateCardProps = {
  certificate: CertificateRecord
  onOpen: (id: string) => void
}

const messages = {
  en: {
    published: "Published",
    draft: "Draft",
    open: (name: string) => `Open ${name}`,
    edited: (time: string) => `Edited ${time}`,
    justNow: "just now",
    recently: "recently",
  },
  id: {
    published: "Diterbitkan",
    draft: "Draf",
    open: (name: string) => `Buka ${name}`,
    edited: (time: string) => `Diedit ${time}`,
    justNow: "baru saja",
    recently: "baru-baru ini",
  },
}

export function CertificateCard({ certificate, onOpen }: CertificateCardProps) {
  const t = useMessages(messages)
  const formatT = useMessages(designFormatMessages)
  const { localeTag } = useLocale()
  // "Just now" and "Recently" are sentinels set by the certificate loaders.
  const updatedAt = certificate.updatedAt === "Just now" ? t.justNow
    : certificate.updatedAt === "Recently" ? t.recently
      : new Date(certificate.updatedAt).toLocaleDateString(localeTag, { month: "short", day: "numeric", year: "numeric" })

  return (
    <article className="group relative min-w-0 overflow-hidden rounded-2xl border bg-card transition-colors hover:border-foreground/25 focus-within:border-foreground/25">
      <Badge className={`pointer-events-none absolute top-3 left-3 z-10 shadow-sm ${certificate.publication ? "bg-emerald-600 text-white" : "bg-zinc-700 text-white"}`}>
        {certificate.publication ? t.published : t.draft}
      </Badge>
      <button
        type="button"
        className="block w-full overflow-hidden text-left outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
        aria-label={t.open(certificate.name)}
        onClick={() => onOpen(certificate.id)}
      >
        <span className="block transition-transform duration-200 group-hover:scale-[1.015]">
          <DesignThumbnail template={certificate.template} variant="card" />
        </span>
      </button>

      <div className="flex min-w-0 items-center gap-3 border-t px-3.5 py-3">
        <button
          type="button"
          className="min-w-0 flex-1 text-left outline-none focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-ring"
          title={certificate.template.name}
          onClick={() => onOpen(certificate.id)}
        >
          <span className="block truncate text-sm font-medium">{certificate.name}</span>
          <span className="mt-0.5 block truncate text-xs text-muted-foreground">
            {getDesignFormat(certificate.template, formatT.image)} · {t.edited(updatedAt)}
          </span>
        </button>
      </div>
    </article>
  )
}
