"use client"

import { useEffect, useState, useSyncExternalStore } from "react"
import { format } from "date-fns"
import { CheckIcon, CopyIcon, MailIcon, PencilIcon } from "lucide-react"

import { EmailChipInput } from "@/components/certificate/email-chip-input"
import type { CertificateRecord } from "@/components/certificate/types"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  activityPageSize,
  loadCertificateDownloads,
  type CertificateDownload,
} from "@/lib/certificates/activity"
import { defaultInviteMessage, defaultInviteTitle, sendPublicationInvite } from "@/lib/certificates/invite"
import { updatePublicationSettings, type PublicationSettings } from "@/lib/certificates/publish"
import { publicSiteUrl } from "@/lib/site-url"

function subscribeOrigin() { return () => {} }
function clientOrigin() { return publicSiteUrl(window.location.origin) }
function serverOrigin() { return "" }

function dateLabel(value: string) {
  return new Date(value).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "?"
}

type Setting = "access" | "names" | "expires"

export function PublishedDetail({ certificate, active, onSettingsChanged, onViewActivity }: { certificate: CertificateRecord; active: boolean; onSettingsChanged: () => Promise<void>; onViewActivity: () => void }) {
  const publication = certificate.publication
  const origin = useSyncExternalStore(subscribeOrigin, clientOrigin, serverOrigin)
  const [downloads, setDownloads] = useState<CertificateDownload[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingSetting, setEditingSetting] = useState<Setting | null>(null)
  const [draftAccessMode, setDraftAccessMode] = useState<PublicationSettings["accessMode"]>("anyone")
  const [draftAllowedEmails, setDraftAllowedEmails] = useState<string[]>([])
  const [draftInputMode, setDraftInputMode] = useState<PublicationSettings["inputMode"]>("repeat")
  const [draftExpirationDate, setDraftExpirationDate] = useState("")
  const [savingSettings, setSavingSettings] = useState(false)
  const [settingsError, setSettingsError] = useState<string | null>(null)
  const [sendingInvite, setSendingInvite] = useState(false)
  const [inviteStatus, setInviteStatus] = useState<{ ok: boolean; text: string } | null>(null)

  useEffect(() => {
    if (!active || !publication) return
    let cancelled = false
    void loadCertificateDownloads(certificate.id).then((rows) => {
      if (cancelled) return
      setDownloads(rows)
      setHasMore(rows.length === activityPageSize)
      setError(null)
    }).catch((caught) => {
      if (!cancelled) setError(caught instanceof Error ? caught.message : "Could not load downloads.")
    }).finally(() => {
      if (!cancelled) setLoading(false)
    })
    return () => { cancelled = true }
  }, [active, certificate.id, publication])

  if (!publication) return null

  const publicUrl = `${origin}/${publication.slug}`
  const status = publication.isExpired ? "Expired"
    : publication.inputMode === "single" && publication.isClaimed ? "Used"
      : "Active"

  function startEditing(setting: Setting) {
    if (savingSettings) return
    setDraftAccessMode(publication!.accessMode)
    setDraftAllowedEmails(publication!.allowedEmails)
    setDraftInputMode(publication!.inputMode)
    setDraftExpirationDate(publication!.expiresAt ? format(new Date(new Date(publication!.expiresAt).getTime() - 1), "yyyy-MM-dd") : "")
    setSettingsError(null)
    setEditingSetting(setting)
  }

  function stopEditing() {
    setEditingSetting(null)
    setSettingsError(null)
  }

  async function saveSetting() {
    if (!editingSetting) return
    const expirationDate = draftExpirationDate ? new Date(`${draftExpirationDate}T00:00:00`) : null
    const expiresAt = editingSetting === "expires"
      ? expirationDate
        ? new Date(expirationDate.getFullYear(), expirationDate.getMonth(), expirationDate.getDate() + 1).toISOString()
        : null
      : publication!.expiresAt
    setSavingSettings(true)
    setSettingsError(null)
    try {
      await updatePublicationSettings(certificate.id, {
        accessMode: editingSetting === "access" ? draftAccessMode : publication!.accessMode,
        allowedEmails: editingSetting === "access" ? draftAllowedEmails : publication!.allowedEmails,
        inputMode: editingSetting === "names" ? draftInputMode : publication!.inputMode,
        expiresAt,
      })
      await onSettingsChanged()
      setEditingSetting(null)
    } catch (caught) {
      setSettingsError(caught instanceof Error ? caught.message : "Could not update publication settings.")
    } finally {
      setSavingSettings(false)
    }
  }

  async function sendInvite() {
    setSendingInvite(true)
    setInviteStatus(null)
    try {
      const text = await sendPublicationInvite(certificate.id, {
        title: defaultInviteTitle(certificate.name),
        message: defaultInviteMessage,
      })
      setInviteStatus({ ok: true, text })
    } catch (caught) {
      setInviteStatus({ ok: false, text: caught instanceof Error ? caught.message : "Could not send emails." })
    } finally {
      setSendingInvite(false)
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(`${publicSiteUrl(window.location.origin)}/${publication!.slug}`)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setError("Could not copy the link. You can select and copy the URL above.")
    }
  }

  async function loadMore() {
    setLoadingMore(true)
    setError(null)
    try {
      const rows = await loadCertificateDownloads(certificate.id, downloads.length)
      setDownloads((current) => [...current, ...rows])
      setHasMore(rows.length === activityPageSize)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load more downloads.")
    } finally {
      setLoadingMore(false)
    }
  }

  return (
    <div className="space-y-5 px-4 py-5">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">Publication</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Published {dateLabel(publication.publishedAt)}</p>
        </div>
        <Badge variant={status === "Expired" ? "destructive" : "secondary"}>{status}</Badge>
      </div>

      <dl className="divide-y rounded-xl border text-sm">
        <div className="flex items-center justify-between gap-3 px-3 py-2.5">
          <dt className="text-muted-foreground">Access</dt>
          <dd><button type="button" className="flex items-center gap-1.5 text-right font-medium hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-ring" aria-label="Edit access" aria-expanded={editingSetting === "access"} disabled={savingSettings} onClick={() => startEditing("access")}>
            {publication.accessMode === "restricted" ? "Restricted by email" : "Anyone with link"}<PencilIcon className="size-3 text-muted-foreground" />
          </button></dd>
        </div>
        {editingSetting === "access" && <div className="space-y-3 px-3 py-3">
          <fieldset className="space-y-2">
            <legend className="sr-only">Access setting</legend>
            <label className="flex items-center gap-2 text-xs"><input type="radio" name="detail-access-mode" checked={draftAccessMode === "anyone"} onChange={() => setDraftAccessMode("anyone")} />Anyone with link</label>
            <label className="flex items-center gap-2 text-xs"><input type="radio" name="detail-access-mode" checked={draftAccessMode === "restricted"} onChange={() => setDraftAccessMode("restricted")} />Restricted by email</label>
          </fieldset>
          {draftAccessMode === "restricted" && <div className="space-y-2">
            <Label>Allowed email addresses</Label>
            <EmailChipInput emails={draftAllowedEmails} onChange={setDraftAllowedEmails} />
            <p className="text-xs text-muted-foreground">Email ownership is not verified.</p>
          </div>}
          <div className="flex justify-end gap-2"><Button type="button" size="sm" variant="outline" disabled={savingSettings} onClick={stopEditing}>Cancel</Button><Button type="button" size="sm" disabled={savingSettings || (draftAccessMode === "restricted" && draftAllowedEmails.length === 0)} onClick={() => void saveSetting()}>{savingSettings ? "Saving…" : "Save"}</Button></div>
        </div>}
        <div className="flex items-center justify-between gap-3 px-3 py-2.5">
          <dt className="text-muted-foreground">Names</dt>
          <dd><button type="button" className="flex items-center gap-1.5 text-right font-medium hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-ring" aria-label="Edit names" aria-expanded={editingSetting === "names"} disabled={savingSettings} onClick={() => startEditing("names")}>
            {publication.inputMode === "single" ? "Single input" : "Repeat input"}<PencilIcon className="size-3 text-muted-foreground" />
          </button></dd>
        </div>
        {editingSetting === "names" && <div className="space-y-3 px-3 py-3">
          <fieldset className="space-y-2">
            <legend className="sr-only">Names setting</legend>
            <label className="flex items-center gap-2 text-xs"><input type="radio" name="detail-input-mode" checked={draftInputMode === "single"} onChange={() => setDraftInputMode("single")} />Single input</label>
            <label className="flex items-center gap-2 text-xs"><input type="radio" name="detail-input-mode" checked={draftInputMode === "repeat"} onChange={() => setDraftInputMode("repeat")} />Repeat input</label>
          </fieldset>
          {draftInputMode === "single" && publication.inputMode !== "single" && publication.submissionCount > 0 && <p className="text-xs text-muted-foreground">This link has already received a name. Single input will mark it as used.</p>}
          <div className="flex justify-end gap-2"><Button type="button" size="sm" variant="outline" disabled={savingSettings} onClick={stopEditing}>Cancel</Button><Button type="button" size="sm" disabled={savingSettings} onClick={() => void saveSetting()}>{savingSettings ? "Saving…" : "Save"}</Button></div>
        </div>}
        <div className="flex items-center justify-between gap-3 px-3 py-2.5">
          <dt className="text-muted-foreground">Expires</dt>
          <dd><button type="button" className="flex items-center gap-1.5 text-right font-medium hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-ring" aria-label="Edit expiration" aria-expanded={editingSetting === "expires"} disabled={savingSettings} onClick={() => startEditing("expires")}>
            {publication.expiresAt ? dateLabel(publication.expiresAt) : "Never"}<PencilIcon className="size-3 text-muted-foreground" />
          </button></dd>
        </div>
        {editingSetting === "expires" && <div className="space-y-3 px-3 py-3">
          <div className="space-y-1.5"><Label htmlFor={`detail-expiration-${certificate.id}`}>Expiration date</Label><Input id={`detail-expiration-${certificate.id}`} type="date" min={format(new Date(), "yyyy-MM-dd")} value={draftExpirationDate} onChange={(event) => setDraftExpirationDate(event.target.value)} /><p className="text-xs text-muted-foreground">The link expires at the end of the selected day.</p></div>
          <Button type="button" size="xs" variant="ghost" onClick={() => setDraftExpirationDate("")}>No expiration</Button>
          <div className="flex justify-end gap-2"><Button type="button" size="sm" variant="outline" disabled={savingSettings} onClick={stopEditing}>Cancel</Button><Button type="button" size="sm" disabled={savingSettings} onClick={() => void saveSetting()}>{savingSettings ? "Saving…" : "Save"}</Button></div>
        </div>}
      </dl>
      {settingsError && <p role="alert" className="text-xs text-destructive">{settingsError}</p>}

      {publication.accessMode === "restricted" && <div className="space-y-2">
        <p className="text-xs font-medium">Allowed emails</p>
        <div className="flex flex-wrap gap-1.5">
          {publication.allowedEmails.map((email) => <span key={email} className="max-w-full truncate rounded-md bg-muted px-2 py-1 text-xs" title={email}>{email}</span>)}
        </div>
        <p className="text-xs text-muted-foreground">Visitors enter an address; ownership is not verified.</p>
        <Button type="button" variant="outline" size="sm" disabled={sendingInvite || publication.isExpired} onClick={() => void sendInvite()}>
          <MailIcon /> {sendingInvite ? "Sending…" : "Send link by email"}
        </Button>
        {inviteStatus && <p role={inviteStatus.ok ? "status" : "alert"} className={inviteStatus.ok ? "text-xs text-muted-foreground" : "text-xs text-destructive"}>{inviteStatus.text}</p>}
      </div>}

      <div className="space-y-2">
        <p className="text-xs font-medium">Public link</p>
        <a href={`/${publication.slug}`} target="_blank" rel="noopener noreferrer" title={publicUrl} className="block w-full truncate py-1.5 text-sm font-medium text-blue-600 underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-blue-600">
          {publicUrl}
        </a>
        <Button type="button" variant="outline" size="sm" onClick={() => void copyLink()}>
          {copied ? <CheckIcon /> : <CopyIcon />} {copied ? "Copied" : "Copy link"}
        </Button>
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold">Download list</h3>
          <Button type="button" variant="link" size="xs" className="px-0 text-xs" onClick={onViewActivity}>
            View all activity
          </Button>
        </div>
        {loading ? <p className="rounded-xl border px-3 py-6 text-center text-xs text-muted-foreground">Loading downloads…</p>
          : downloads.length === 0 ? <p className="rounded-xl border px-3 py-6 text-center text-xs text-muted-foreground">No downloads recorded yet.</p>
            : <ol className="divide-y rounded-xl border">
              {downloads.map((download) => <li key={download.id} className="flex gap-2 px-3 py-3">
                <Avatar className="mt-0.5" aria-hidden="true">
                  <AvatarFallback className="text-xs font-semibold text-foreground">{getInitials(download.recipientName)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium">{download.recipientName}</p>
                  {download.recipientEmail && <p className="truncate text-xs text-muted-foreground">{download.recipientEmail}</p>}
                  <p className="mt-1 text-[11px] text-muted-foreground">{dateLabel(download.downloadedAt)}</p>
                </div>
              </li>)}
            </ol>}
        {hasMore && <Button type="button" variant="outline" size="sm" className="w-full" disabled={loadingMore} onClick={() => void loadMore()}>
          {loadingMore ? "Loading…" : "Load more downloads"}
        </Button>}
        <p className="text-[11px] text-muted-foreground">Individual downloads are listed from this update onward.</p>
      </section>

      {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
