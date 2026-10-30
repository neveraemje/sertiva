"use client"

import { useEffect, useEffectEvent, useState, useSyncExternalStore } from "react"
import { CheckIcon, CopyIcon, MailIcon, PencilIcon } from "lucide-react"

import { ExpirationDatePicker } from "@/components/certificate/expiration-date-picker"
import { EmailChipInput } from "@/components/certificate/email-chip-input"
import type { CertificateRecord } from "@/components/certificate/types"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useLocale, useMessages } from "@/components/i18n/locale-provider"
import {
  activityPageSize,
  loadCertificateDownloads,
  type CertificateDownload,
} from "@/lib/certificates/activity"
import { defaultInviteMessage, defaultInviteTitle, sendPublicationInvite, type InviteResult } from "@/lib/certificates/invite"
import { updatePublicationSettings, type PublicationSettings } from "@/lib/certificates/publish"
import { publicSiteUrl } from "@/lib/site-url"

function subscribeOrigin() { return () => {} }
function clientOrigin() { return publicSiteUrl(window.location.origin) }
function serverOrigin() { return "" }

const messages = {
  en: {
    loadFailed: "Could not load downloads.",
    loadMoreFailed: "Could not load more downloads.",
    updateFailed: "Could not update publication settings.",
    sendFailed: "Could not send emails.",
    copyFailed: "Could not copy the link. You can select and copy the URL above.",
    inviteSent: ({ sent, failed }: InviteResult) => failed.length
      ? `Sent ${sent} email(s). Could not send to ${failed.join(", ")}.`
      : `Sent the link to ${sent} email address${sent === 1 ? "" : "es"}.`,
    publication: "Publication",
    published: (date: string) => `Published ${date}`,
    status: { expired: "Expired", used: "Used", active: "Active" },
    access: "Access",
    editAccess: "Edit access",
    accessSetting: "Access setting",
    anyone: "Anyone with link",
    restricted: "Restricted by email",
    allowedEmailAddresses: "Allowed email addresses",
    ownershipNotVerified: "Email ownership is not verified.",
    cancel: "Cancel",
    save: "Save",
    saving: "Saving…",
    names: "Names",
    editNames: "Edit names",
    namesSetting: "Names setting",
    single: "Single input",
    repeat: "Repeat input",
    singleWarning: "This link has already received a name. Single input will mark it as used.",
    expires: "Expires",
    editExpiration: "Edit expiration",
    never: "Never",
    expirationDate: "Expiration date",
    expiresHint: "The link expires at the end of the selected day.",
    allowedEmails: "Allowed emails",
    visitorsNote: "Visitors enter an address; ownership is not verified.",
    sending: "Sending…",
    sendLink: "Send link by email",
    publicLink: "Public link",
    copied: "Copied",
    copyLink: "Copy link",
    downloadList: "Download list",
    viewAllActivity: "View all activity",
    loading: "Loading downloads…",
    empty: "No downloads recorded yet.",
    loadingMore: "Loading…",
    loadMore: "Load more downloads",
    downloadsNote: "Individual downloads are listed from this update onward.",
  },
  id: {
    loadFailed: "Tidak dapat memuat unduhan.",
    loadMoreFailed: "Tidak dapat memuat unduhan lainnya.",
    updateFailed: "Tidak dapat memperbarui pengaturan publikasi.",
    sendFailed: "Tidak dapat mengirim email.",
    copyFailed: "Tidak dapat menyalin tautan. Anda dapat memilih dan menyalin URL di atas.",
    inviteSent: ({ sent, failed }: InviteResult) => failed.length
      ? `${sent} email terkirim. Tidak dapat mengirim ke ${failed.join(", ")}.`
      : `Tautan dikirim ke ${sent} alamat email.`,
    publication: "Publikasi",
    published: (date: string) => `Diterbitkan ${date}`,
    status: { expired: "Kedaluwarsa", used: "Terpakai", active: "Aktif" },
    access: "Akses",
    editAccess: "Edit akses",
    accessSetting: "Pengaturan akses",
    anyone: "Siapa saja yang memiliki tautan",
    restricted: "Dibatasi dengan email",
    allowedEmailAddresses: "Alamat email yang diizinkan",
    ownershipNotVerified: "Kepemilikan email tidak diverifikasi.",
    cancel: "Batal",
    save: "Simpan",
    saving: "Menyimpan…",
    names: "Nama",
    editNames: "Edit nama",
    namesSetting: "Pengaturan nama",
    single: "Input tunggal",
    repeat: "Input berulang",
    singleWarning: "Tautan ini sudah menerima nama. Input tunggal akan menandainya sebagai terpakai.",
    expires: "Kedaluwarsa",
    editExpiration: "Edit tanggal kedaluwarsa",
    never: "Tidak pernah",
    expirationDate: "Tanggal kedaluwarsa",
    expiresHint: "Tautan kedaluwarsa di akhir hari yang dipilih.",
    allowedEmails: "Email yang diizinkan",
    visitorsNote: "Pengunjung memasukkan alamat email; kepemilikan tidak diverifikasi.",
    sending: "Mengirim…",
    sendLink: "Kirim tautan lewat email",
    publicLink: "Tautan publik",
    copied: "Disalin",
    copyLink: "Salin tautan",
    downloadList: "Daftar unduhan",
    viewAllActivity: "Lihat semua aktivitas",
    loading: "Memuat unduhan…",
    empty: "Belum ada unduhan yang tercatat.",
    loadingMore: "Memuat…",
    loadMore: "Muat unduhan lainnya",
    downloadsNote: "Unduhan individual dicatat mulai pembaruan ini.",
  },
}

function dateLabel(value: string, localeTag: string) {
  return new Date(value).toLocaleString(localeTag, { dateStyle: "medium", timeStyle: "short" })
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
  const t = useMessages(messages)
  // An effect event, so a language change doesn't rerun the loading effect.
  const loadErrorMessage = useEffectEvent((caught: unknown) => caught instanceof Error ? caught.message : t.loadFailed)
  const { localeTag } = useLocale()
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
  const [draftExpirationDate, setDraftExpirationDate] = useState<Date>()
  const [savingSettings, setSavingSettings] = useState(false)
  const [settingsError, setSettingsError] = useState<string | null>(null)
  const [sendingInvite, setSendingInvite] = useState(false)
  const [inviteStatus, setInviteStatus] = useState<{ ok: true; result: InviteResult } | { ok: false; text: string } | null>(null)

  useEffect(() => {
    if (!active || !publication) return
    let cancelled = false
    void loadCertificateDownloads(certificate.id).then((rows) => {
      if (cancelled) return
      setDownloads(rows)
      setHasMore(rows.length === activityPageSize)
      setError(null)
    }).catch((caught) => {
      if (!cancelled) setError(loadErrorMessage(caught))
    }).finally(() => {
      if (!cancelled) setLoading(false)
    })
    return () => { cancelled = true }
  }, [active, certificate.id, publication])

  if (!publication) return null

  const publicUrl = `${origin}/${publication.slug}`
  const status = publication.isExpired ? "expired"
    : publication.inputMode === "single" && publication.isClaimed ? "used"
      : "active"

  function startEditing(setting: Setting) {
    if (savingSettings) return
    setDraftAccessMode(publication!.accessMode)
    setDraftAllowedEmails(publication!.allowedEmails)
    setDraftInputMode(publication!.inputMode)
    setDraftExpirationDate(publication!.expiresAt ? new Date(new Date(publication!.expiresAt).getTime() - 1) : undefined)
    setSettingsError(null)
    setEditingSetting(setting)
  }

  function stopEditing() {
    setEditingSetting(null)
    setSettingsError(null)
  }

  async function saveSetting() {
    if (!editingSetting) return
    const expirationDate = draftExpirationDate
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
      setSettingsError(caught instanceof Error ? caught.message : t.updateFailed)
    } finally {
      setSavingSettings(false)
    }
  }

  async function sendInvite() {
    setSendingInvite(true)
    setInviteStatus(null)
    try {
      const result = await sendPublicationInvite(certificate.id, {
        title: defaultInviteTitle(certificate.name),
        message: defaultInviteMessage,
      })
      setInviteStatus({ ok: true, result })
    } catch (caught) {
      setInviteStatus({ ok: false, text: caught instanceof Error ? caught.message : t.sendFailed })
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
      setError(t.copyFailed)
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
      setError(caught instanceof Error ? caught.message : t.loadMoreFailed)
    } finally {
      setLoadingMore(false)
    }
  }

  return (
    <div className="space-y-5 px-4 py-5">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">{t.publication}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{t.published(dateLabel(publication.publishedAt, localeTag))}</p>
        </div>
        <Badge variant={status === "expired" ? "destructive" : "secondary"}>{t.status[status]}</Badge>
      </div>

      <dl className="divide-y rounded-xl border text-sm">
        <div className="flex items-center justify-between gap-3 px-3 py-2.5">
          <dt className="text-muted-foreground">{t.access}</dt>
          <dd><button type="button" className="flex items-center gap-1.5 text-right font-medium hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-ring" aria-label={t.editAccess} aria-expanded={editingSetting === "access"} disabled={savingSettings} onClick={() => startEditing("access")}>
            {publication.accessMode === "restricted" ? t.restricted : t.anyone}<PencilIcon className="size-3 text-muted-foreground" />
          </button></dd>
        </div>
        {editingSetting === "access" && <div className="space-y-3 px-3 py-3">
          <fieldset className="space-y-2">
            <legend className="sr-only">{t.accessSetting}</legend>
            <label className="flex items-center gap-2 text-xs"><input type="radio" name="detail-access-mode" checked={draftAccessMode === "anyone"} onChange={() => setDraftAccessMode("anyone")} />{t.anyone}</label>
            <label className="flex items-center gap-2 text-xs"><input type="radio" name="detail-access-mode" checked={draftAccessMode === "restricted"} onChange={() => setDraftAccessMode("restricted")} />{t.restricted}</label>
          </fieldset>
          {draftAccessMode === "restricted" && <div className="space-y-2">
            <Label>{t.allowedEmailAddresses}</Label>
            <EmailChipInput emails={draftAllowedEmails} onChange={setDraftAllowedEmails} />
            <p className="text-xs text-muted-foreground">{t.ownershipNotVerified}</p>
          </div>}
          <div className="flex justify-end gap-2"><Button type="button" size="sm" variant="outline" disabled={savingSettings} onClick={stopEditing}>{t.cancel}</Button><Button type="button" size="sm" disabled={savingSettings || (draftAccessMode === "restricted" && draftAllowedEmails.length === 0)} onClick={() => void saveSetting()}>{savingSettings ? t.saving : t.save}</Button></div>
        </div>}
        <div className="flex items-center justify-between gap-3 px-3 py-2.5">
          <dt className="text-muted-foreground">{t.names}</dt>
          <dd><button type="button" className="flex items-center gap-1.5 text-right font-medium hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-ring" aria-label={t.editNames} aria-expanded={editingSetting === "names"} disabled={savingSettings} onClick={() => startEditing("names")}>
            {publication.inputMode === "single" ? t.single : t.repeat}<PencilIcon className="size-3 text-muted-foreground" />
          </button></dd>
        </div>
        {editingSetting === "names" && <div className="space-y-3 px-3 py-3">
          <fieldset className="space-y-2">
            <legend className="sr-only">{t.namesSetting}</legend>
            <label className="flex items-center gap-2 text-xs"><input type="radio" name="detail-input-mode" checked={draftInputMode === "single"} onChange={() => setDraftInputMode("single")} />{t.single}</label>
            <label className="flex items-center gap-2 text-xs"><input type="radio" name="detail-input-mode" checked={draftInputMode === "repeat"} onChange={() => setDraftInputMode("repeat")} />{t.repeat}</label>
          </fieldset>
          {draftInputMode === "single" && publication.inputMode !== "single" && publication.submissionCount > 0 && <p className="text-xs text-muted-foreground">{t.singleWarning}</p>}
          <div className="flex justify-end gap-2"><Button type="button" size="sm" variant="outline" disabled={savingSettings} onClick={stopEditing}>{t.cancel}</Button><Button type="button" size="sm" disabled={savingSettings} onClick={() => void saveSetting()}>{savingSettings ? t.saving : t.save}</Button></div>
        </div>}
        <div className="flex items-center justify-between gap-3 px-3 py-2.5">
          <dt className="text-muted-foreground">{t.expires}</dt>
          <dd><button type="button" className="flex items-center gap-1.5 text-right font-medium hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-ring" aria-label={t.editExpiration} aria-expanded={editingSetting === "expires"} disabled={savingSettings} onClick={() => startEditing("expires")}>
            {publication.expiresAt ? dateLabel(publication.expiresAt, localeTag) : t.never}<PencilIcon className="size-3 text-muted-foreground" />
          </button></dd>
        </div>
        {editingSetting === "expires" && <div className="space-y-3 px-3 py-3">
          <div className="space-y-1.5"><Label htmlFor={`detail-expiration-${certificate.id}`}>{t.expirationDate}</Label><ExpirationDatePicker id={`detail-expiration-${certificate.id}`} value={draftExpirationDate} onChange={setDraftExpirationDate} /><p className="text-xs text-muted-foreground">{t.expiresHint}</p></div>
          <div className="flex justify-end gap-2"><Button type="button" size="sm" variant="outline" disabled={savingSettings} onClick={stopEditing}>{t.cancel}</Button><Button type="button" size="sm" disabled={savingSettings} onClick={() => void saveSetting()}>{savingSettings ? t.saving : t.save}</Button></div>
        </div>}
      </dl>
      {settingsError && <p role="alert" className="text-xs text-destructive">{settingsError}</p>}

      {publication.accessMode === "restricted" && <div className="space-y-2">
        <p className="text-xs font-medium">{t.allowedEmails}</p>
        <div className="flex flex-wrap gap-1.5">
          {publication.allowedEmails.map((email) => <span key={email} className="max-w-full truncate rounded-md bg-muted px-2 py-1 text-xs" title={email}>{email}</span>)}
        </div>
        <p className="text-xs text-muted-foreground">{t.visitorsNote}</p>
        <Button type="button" variant="outline" size="sm" disabled={sendingInvite || publication.isExpired} onClick={() => void sendInvite()}>
          <MailIcon /> {sendingInvite ? t.sending : t.sendLink}
        </Button>
        {inviteStatus && <p role={inviteStatus.ok ? "status" : "alert"} className={inviteStatus.ok ? "text-xs text-muted-foreground" : "text-xs text-destructive"}>{inviteStatus.ok ? t.inviteSent(inviteStatus.result) : inviteStatus.text}</p>}
      </div>}

      <div className="space-y-2">
        <p className="text-xs font-medium">{t.publicLink}</p>
        <a href={`/${publication.slug}`} target="_blank" rel="noopener noreferrer" title={publicUrl} className="block w-full truncate py-1.5 text-sm font-medium text-blue-600 underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-blue-600">
          {publicUrl}
        </a>
        <Button type="button" variant="outline" size="sm" onClick={() => void copyLink()}>
          {copied ? <CheckIcon /> : <CopyIcon />} {copied ? t.copied : t.copyLink}
        </Button>
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold">{t.downloadList}</h3>
          <Button type="button" variant="link" size="xs" className="px-0 text-xs" onClick={onViewActivity}>
            {t.viewAllActivity}
          </Button>
        </div>
        {loading ? <p className="rounded-xl border px-3 py-6 text-center text-xs text-muted-foreground">{t.loading}</p>
          : downloads.length === 0 ? <p className="rounded-xl border px-3 py-6 text-center text-xs text-muted-foreground">{t.empty}</p>
            : <ol className="divide-y rounded-xl border">
              {downloads.map((download) => <li key={download.id} className="flex gap-2 px-3 py-3">
                <Avatar className="mt-0.5" aria-hidden="true">
                  <AvatarFallback className="text-xs font-semibold text-foreground">{getInitials(download.recipientName)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium">{download.recipientName}</p>
                  {download.recipientEmail && <p className="truncate text-xs text-muted-foreground">{download.recipientEmail}</p>}
                  <p className="mt-1 text-[11px] text-muted-foreground">{dateLabel(download.downloadedAt, localeTag)}</p>
                </div>
              </li>)}
            </ol>}
        {hasMore && <Button type="button" variant="outline" size="sm" className="w-full" disabled={loadingMore} onClick={() => void loadMore()}>
          {loadingMore ? t.loadingMore : t.loadMore}
        </Button>}
        <p className="text-[11px] text-muted-foreground">{t.downloadsNote}</p>
      </section>

      {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
