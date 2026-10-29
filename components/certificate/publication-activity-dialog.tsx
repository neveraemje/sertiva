"use client"

import { useEffect, useState } from "react"
import { DownloadIcon, UsersIcon } from "lucide-react"

import type { CertificateRecord } from "@/components/certificate/types"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { activityPageSize, loadCertificateEntries, loadPublicationMetrics, type CertificateEntry } from "@/lib/certificates/activity"

function dateLabel(value: string) {
  return new Date(value).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
}

export function PublicationActivityDialog({
  certificate,
  onOpenChange,
}: {
  certificate: CertificateRecord | null
  onOpenChange: (open: boolean) => void
}) {
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
      if (!cancelled) setError(caught instanceof Error ? caught.message : "Could not load activity.")
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
      setError(caught instanceof Error ? caught.message : "Could not load more activity.")
    } finally {
      setLoadingMore(false)
    }
  }

  const publication = certificate?.publication

  return (
    <Dialog open={Boolean(publication)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(85vh,800px)] gap-5 overflow-hidden p-6 sm:max-w-2xl">
        <DialogHeader className="pr-8">
          <DialogTitle>Published activity</DialogTitle>
          <DialogDescription>{certificate?.name} · Names entered through the public certificate link.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border bg-muted/30 p-4">
            <UsersIcon className="mb-3 size-4 text-muted-foreground" />
            <p className="text-2xl font-semibold tabular-nums">{metrics?.submissionCount ?? publication?.submissionCount ?? 0}</p>
            <p className="text-xs text-muted-foreground">Names submitted</p>
          </div>
          <div className="rounded-xl border bg-muted/30 p-4">
            <DownloadIcon className="mb-3 size-4 text-muted-foreground" />
            <p className="text-2xl font-semibold tabular-nums">{metrics?.downloadCount ?? publication?.downloadCount ?? 0}</p>
            <p className="text-xs text-muted-foreground">Downloads</p>
          </div>
        </div>

        <div className="min-h-0 overflow-y-auto rounded-xl border">
          <div className="sticky top-0 border-b bg-background px-4 py-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            People who filled in this certificate
          </div>
          {loading ? <p className="px-4 py-8 text-center text-sm text-muted-foreground">Loading activity…</p>
            : entries.length === 0 ? <p className="px-4 py-8 text-center text-sm text-muted-foreground">No names recorded yet.</p>
              : <ul className="divide-y">
                {entries.map((entry) => (
                  <li key={entry.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{entry.recipient_name}</p>
                      {entry.recipient_email && <p className="truncate text-xs text-muted-foreground">{entry.recipient_email}</p>}
                      <p className="mt-1 text-xs text-muted-foreground">{dateLabel(entry.created_at)}</p>
                    </div>
                    <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{entry.download_count} downloads</span>
                  </li>
                ))}
              </ul>}
          {hasMore && <div className="border-t p-3 text-center">
            <Button variant="outline" size="sm" disabled={loadingMore} onClick={() => void loadMore()}>
              {loadingMore ? "Loading…" : "Load more"}
            </Button>
          </div>}
        </div>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <p className="text-xs text-muted-foreground">Names and downloads are tracked from this update onward. Earlier repeat-link activity cannot be recovered.</p>
      </DialogContent>
    </Dialog>
  )
}
