"use client"

import { useEffect, useEffectEvent, useState } from "react"
import { DownloadIcon, UsersIcon } from "lucide-react"

import type { CertificateRecord } from "@/components/certificate/types"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useLocale, useMessages } from "@/components/i18n/locale-provider"
import { activityPageSize, loadCertificateEntries, loadPublicationMetrics, type CertificateEntry } from "@/lib/certificates/activity"

const messages = {
  en: {
    loadFailed: "Could not load activity.",
    loadMoreFailed: "Could not load more activity.",
    title: "Published activity",
    description: "Names entered through the public certificate link.",
    namesSubmitted: "Names submitted",
    downloads: "Downloads",
    people: "People who filled in this certificate",
    loading: "Loading activity…",
    empty: "No names recorded yet.",
    downloadCount: (n: number) => `${n} downloads`,
    loadingMore: "Loading…",
    loadMore: "Load more",
    note: "Names and downloads are tracked from this update onward. Earlier repeat-link activity cannot be recovered.",
  },
  id: {
    loadFailed: "Tidak dapat memuat aktivitas.",
    loadMoreFailed: "Tidak dapat memuat aktivitas lainnya.",
    title: "Aktivitas publikasi",
    description: "Nama yang dimasukkan melalui tautan sertifikat publik.",
    namesSubmitted: "Nama dikirim",
    downloads: "Unduhan",
    people: "Orang yang mengisi sertifikat ini",
    loading: "Memuat aktivitas…",
    empty: "Belum ada nama yang tercatat.",
    downloadCount: (n: number) => `${n} unduhan`,
    loadingMore: "Memuat…",
    loadMore: "Muat lainnya",
    note: "Nama dan unduhan dicatat mulai pembaruan ini. Aktivitas tautan berulang sebelumnya tidak dapat dipulihkan.",
  },
}

function dateLabel(value: string, localeTag: string) {
  return new Date(value).toLocaleString(localeTag, { dateStyle: "medium", timeStyle: "short" })
}

export function PublicationActivityDialog({
  certificate,
  onOpenChange,
}: {
  certificate: CertificateRecord | null
  onOpenChange: (open: boolean) => void
}) {
  const t = useMessages(messages)
  // An effect event, so a language change doesn't rerun the loading effect.
  const loadErrorMessage = useEffectEvent((caught: unknown) => caught instanceof Error ? caught.message : t.loadFailed)
  const { localeTag } = useLocale()
  const [entries, setEntries] = useState<CertificateEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [metrics, setMetrics] = useState<{ submissionCount: number; downloadCount: number } | null>(null)

  useEffect(() => {
    if (!certificate?.publication) return
    let cancelled = false
    const certificateId = certificate.id
    void Promise.all([loadCertificateEntries(certificateId), loadPublicationMetrics(certificateId)]).then(([rows, latestMetrics]) => {
      if (cancelled) return
      setEntries(rows)
      setMetrics(latestMetrics)
      setHasMore(rows.length === activityPageSize)
    }).catch((caught) => {
      if (!cancelled) setError(loadErrorMessage(caught))
    }).finally(() => {
      if (!cancelled) setLoading(false)
    })
    return () => { cancelled = true }
  }, [certificate?.id, certificate?.publication])

  async function loadMore() {
    if (!certificate) return
    setLoadingMore(true)
    setError(null)
    try {
      const rows = await loadCertificateEntries(certificate.id, entries.length)
      setEntries((current) => [...current, ...rows])
      setHasMore(rows.length === activityPageSize)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t.loadMoreFailed)
    } finally {
      setLoadingMore(false)
    }
  }

  const publication = certificate?.publication

  return (
    <Dialog open={Boolean(publication)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(85vh,800px)] gap-5 overflow-hidden p-6 sm:max-w-2xl">
        <DialogHeader className="pr-8">
          <DialogTitle>{t.title}</DialogTitle>
          <DialogDescription>{certificate?.name} · {t.description}</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border bg-muted/30 p-4">
            <UsersIcon className="mb-3 size-4 text-muted-foreground" />
            <p className="text-2xl font-semibold tabular-nums">{metrics?.submissionCount ?? publication?.submissionCount ?? 0}</p>
            <p className="text-xs text-muted-foreground">{t.namesSubmitted}</p>
          </div>
          <div className="rounded-xl border bg-muted/30 p-4">
            <DownloadIcon className="mb-3 size-4 text-muted-foreground" />
            <p className="text-2xl font-semibold tabular-nums">{metrics?.downloadCount ?? publication?.downloadCount ?? 0}</p>
            <p className="text-xs text-muted-foreground">{t.downloads}</p>
          </div>
        </div>

        <div className="min-h-0 overflow-y-auto rounded-xl border">
          <div className="sticky top-0 border-b bg-background px-4 py-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            {t.people}
          </div>
          {loading ? <p className="px-4 py-8 text-center text-sm text-muted-foreground">{t.loading}</p>
            : entries.length === 0 ? <p className="px-4 py-8 text-center text-sm text-muted-foreground">{t.empty}</p>
              : <ul className="divide-y">
                {entries.map((entry) => (
                  <li key={entry.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{entry.recipient_name}</p>
                      {entry.recipient_email && <p className="truncate text-xs text-muted-foreground">{entry.recipient_email}</p>}
                      <p className="mt-1 text-xs text-muted-foreground">{dateLabel(entry.created_at, localeTag)}</p>
                    </div>
                    <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{t.downloadCount(entry.download_count)}</span>
                  </li>
                ))}
              </ul>}
          {hasMore && <div className="border-t p-3 text-center">
            <Button variant="outline" size="sm" disabled={loadingMore} onClick={() => void loadMore()}>
              {loadingMore ? t.loadingMore : t.loadMore}
            </Button>
          </div>}
        </div>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <p className="text-xs text-muted-foreground">{t.note}</p>
      </DialogContent>
    </Dialog>
  )
}
