"use client"

import { useEffect, useEffectEvent, useState } from "react"
import { CheckCircle2Icon, CopyIcon, ExternalLinkIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ExpirationDatePicker } from "@/components/certificate/expiration-date-picker"
import { EmailChipInput } from "@/components/certificate/email-chip-input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { CertificateRecord } from "@/components/certificate/types"
import { useMessages } from "@/components/i18n/locale-provider"
import { defaultInviteMessage, defaultInviteTitle, sendPublicationInvite, type InviteResult } from "@/lib/certificates/invite"
import { loadPublicationSettings, publishCertificate, type PublicationSettings } from "@/lib/certificates/publish"
import { publicSiteUrl } from "@/lib/site-url"

type PublishCertificateDialogProps = {
  certificate: CertificateRecord
  userId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: () => Promise<void>
  onPublished: () => Promise<void>
}

const messages = {
  en: {
    settingsMissing: "Publishing settings are not set up in this Supabase project yet. Apply the publication settings database migration.",
    publishFailed: "Could not publish this certificate.",
    refreshFailed: "Published successfully, but the dashboard could not refresh. Reload it to see the latest status.",
    inviteFailed: (message: string) => `Published, but the emails were not sent: ${message}`,
    unknownError: "unknown error",
    inviteSent: ({ sent, failed }: InviteResult) => failed.length
      ? `Sent ${sent} email(s). Could not send to ${failed.join(", ")}.`
      : `Sent the link to ${sent} email address${sent === 1 ? "" : "es"}.`,
    copyFailed: "Could not copy the link. Select and copy it from the field instead.",
    publishedTitle: "Certificate published",
    restrictedDescription: "Visitors must enter an allowed email before they can make a named copy. Email ownership is not verified.",
    anyoneDescription: "Anyone with this link can enter a name, preview the certificate, and download it without signing in.",
    publishedLink: "Published link",
    copied: "Copied",
    copy: "Copy",
    openPublicPage: "Open public page",
    done: "Done",
    title: "Publish certificate",
    description: (name: string) => `Create a shareable link for ${name}. Anyone with the link can make a named copy.`,
    whoCanUse: "Who can use this link?",
    anyone: "Anyone with the link",
    anyoneHint: "No email is required.",
    restricted: "Restricted by email",
    restrictedHint: "Only addresses on your list can continue.",
    allowedEmails: "Allowed email addresses",
    notVerified: "Visitors only enter an email address. Ownership is not verified.",
    firstPublishNote: (sender: string) => `When you publish, the certificate link is emailed to every address above from ${sender}.`,
    alreadyPublishedNote: "Already published. Use Send link by email in the publication details to email these addresses.",
    howManyNames: "How many names?",
    single: "Single input",
    singleHint: "The first preview claims this link for one name.",
    repeat: "Repeat input",
    repeatHint: "The link can be used for multiple names.",
    expirationDate: "Expiration date (optional)",
    cancel: "Cancel",
    publishing: "Publishing…",
    loadingSettings: "Loading settings…",
  },
  id: {
    settingsMissing: "Pengaturan publikasi belum disiapkan di proyek Supabase ini. Terapkan migrasi database pengaturan publikasi.",
    publishFailed: "Tidak dapat menerbitkan sertifikat ini.",
    refreshFailed: "Berhasil diterbitkan, tetapi dasbor tidak dapat dimuat ulang. Muat ulang halaman untuk melihat status terbaru.",
    inviteFailed: (message: string) => `Sudah diterbitkan, tetapi email tidak terkirim: ${message}`,
    unknownError: "kesalahan tidak diketahui",
    inviteSent: ({ sent, failed }: InviteResult) => failed.length
      ? `${sent} email terkirim. Tidak dapat mengirim ke ${failed.join(", ")}.`
      : `Tautan dikirim ke ${sent} alamat email.`,
    copyFailed: "Tidak dapat menyalin tautan. Pilih dan salin tautan dari kolom di atas.",
    publishedTitle: "Sertifikat diterbitkan",
    restrictedDescription: "Pengunjung harus memasukkan email yang diizinkan sebelum dapat membuat salinan bernama. Kepemilikan email tidak diverifikasi.",
    anyoneDescription: "Siapa saja yang memiliki tautan ini dapat memasukkan nama, melihat pratinjau sertifikat, dan mengunduhnya tanpa masuk.",
    publishedLink: "Tautan yang diterbitkan",
    copied: "Disalin",
    copy: "Salin",
    openPublicPage: "Buka halaman publik",
    done: "Selesai",
    title: "Terbitkan sertifikat",
    description: (name: string) => `Buat tautan yang dapat dibagikan untuk ${name}. Siapa saja yang memiliki tautan dapat membuat salinan bernama.`,
    whoCanUse: "Siapa yang dapat menggunakan tautan ini?",
    anyone: "Siapa saja yang memiliki tautan",
    anyoneHint: "Email tidak diperlukan.",
    restricted: "Dibatasi dengan email",
    restrictedHint: "Hanya alamat dalam daftar Anda yang dapat melanjutkan.",
    allowedEmails: "Alamat email yang diizinkan",
    notVerified: "Pengunjung hanya memasukkan alamat email. Kepemilikan tidak diverifikasi.",
    firstPublishNote: (sender: string) => `Saat Anda menerbitkan, tautan sertifikat akan dikirim ke setiap alamat di atas dari ${sender}.`,
    alreadyPublishedNote: "Sudah diterbitkan. Gunakan Kirim tautan lewat email di detail publikasi untuk mengirim email ke alamat-alamat ini.",
    howManyNames: "Berapa banyak nama?",
    single: "Input tunggal",
    singleHint: "Pratinjau pertama akan mengklaim tautan ini untuk satu nama.",
    repeat: "Input berulang",
    repeatHint: "Tautan dapat digunakan untuk beberapa nama.",
    expirationDate: "Tanggal kedaluwarsa (opsional)",
    cancel: "Batal",
    publishing: "Menerbitkan…",
    loadingSettings: "Memuat pengaturan…",
  },
}

type Messages = (typeof messages)["en"]

function publishErrorMessage(caught: unknown, t: Messages) {
  if (caught && typeof caught === "object") {
    const error = caught as { code?: unknown; message?: unknown }
    if (["PGRST205", "PGRST202", "PGRST204", "42703"].includes(String(error.code))) {
      return t.settingsMissing
    }
    if (typeof error.message === "string" && error.message) return error.message
  }
  return t.publishFailed
}

export function PublishCertificateDialog({
  certificate,
  userId,
  open,
  onOpenChange,
  onSave,
  onPublished,
}: PublishCertificateDialogProps) {
  const t = useMessages(messages)
  // An effect event, so a language change doesn't rerun the loading effect.
  const loadErrorMessage = useEffectEvent((caught: unknown) => publishErrorMessage(caught, t))
  const [publicUrl, setPublicUrl] = useState<string | null>(null)
  const [expirationDate, setExpirationDate] = useState<Date>()
  const [accessMode, setAccessMode] = useState<PublicationSettings["accessMode"]>("anyone")
  const [allowedEmails, setAllowedEmails] = useState<string[]>([])
  const [inputMode, setInputMode] = useState<PublicationSettings["inputMode"]>("repeat")
  const [loadingSettings, setLoadingSettings] = useState(true)
  const [publishing, setPublishing] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [firstPublish, setFirstPublish] = useState(false)
  const [inviteStatus, setInviteStatus] = useState<InviteResult | { error: string } | null>(null)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    void loadPublicationSettings(certificate.id).then((settings) => {
      if (cancelled) return
      setFirstPublish(!settings)
      setAccessMode(settings?.accessMode ?? "anyone")
      setAllowedEmails(settings?.allowedEmails ?? [])
      setInputMode(settings?.inputMode ?? "repeat")
      setExpirationDate(settings?.expiresAt ? new Date(new Date(settings.expiresAt).getTime() - 1) : undefined)
    }).catch((caught) => {
      if (!cancelled) setError(loadErrorMessage(caught))
    }).finally(() => {
      if (!cancelled) setLoadingSettings(false)
    })
    return () => { cancelled = true }
  }, [open, certificate.id])

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setPublicUrl(null)
      setCopied(false)
      setError(null)
      setLoadingSettings(true)
      setInviteStatus(null)
    }
    onOpenChange(nextOpen)
  }

  async function handlePublish() {
    setPublishing(true)
    setError(null)
    try {
      await onSave()
      const expiresAt = expirationDate
        ? new Date(expirationDate.getFullYear(), expirationDate.getMonth(), expirationDate.getDate() + 1).toISOString()
        : null
      const slug = await publishCertificate(userId, certificate, {
        accessMode,
        allowedEmails,
        inputMode,
        expiresAt,
      })
      setPublicUrl(`${publicSiteUrl(window.location.origin)}/${slug}`)
      if (firstPublish && accessMode === "restricted") {
        setInviteStatus(await sendInviteEmails())
      }
      await onPublished().catch(() => {
        setError(t.refreshFailed)
      })
    } catch (caught) {
      setError(publishErrorMessage(caught, t))
    } finally {
      setPublishing(false)
    }
  }

  async function sendInviteEmails() {
    try {
      return await sendPublicationInvite(certificate.id, {
        title: defaultInviteTitle(certificate.name),
        message: defaultInviteMessage,
      })
    } catch (caught) {
      return { error: caught instanceof Error ? caught.message : t.unknownError }
    }
  }

  async function handleCopy() {
    if (!publicUrl) return
    try {
      await navigator.clipboard.writeText(publicUrl)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setError(t.copyFailed)
    }
  }

  if (publicUrl) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="gap-5 p-7 sm:max-w-xl sm:p-8">
          <div className="flex flex-col items-center px-4 py-5 text-center">
            <span className="mb-4 flex size-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
              <CheckCircle2Icon className="size-6" />
            </span>
            <DialogHeader className="items-center">
              <DialogTitle className="text-lg">{t.publishedTitle}</DialogTitle>
              <DialogDescription className="max-w-sm">
                {accessMode === "restricted"
                  ? t.restrictedDescription
                  : t.anyoneDescription}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="space-y-3 rounded-xl bg-muted/60 p-3">
            <Label htmlFor="published-url" className="text-xs text-muted-foreground">{t.publishedLink}</Label>
            <div className="flex gap-2">
              <Input id="published-url" readOnly value={publicUrl} onFocus={(event) => event.target.select()} className="h-9 bg-background" />
              <Button type="button" variant="outline" size="lg" onClick={() => void handleCopy()}>
                <CopyIcon /> {copied ? t.copied : t.copy}
              </Button>
            </div>
          </div>

          {inviteStatus && <p role="status" className="text-sm text-muted-foreground">{"error" in inviteStatus ? t.inviteFailed(inviteStatus.error) : t.inviteSent(inviteStatus)}</p>}
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

          <DialogFooter className="-mx-7 -mb-7 px-7 py-4 sm:-mx-8 sm:-mb-8 sm:px-8">
            <Button type="button" variant="outline" size="lg" onClick={() => window.open(publicUrl, "_blank", "noopener,noreferrer")}>
              <ExternalLinkIcon /> {t.openPublicPage}
            </Button>
            <Button type="button" size="lg" onClick={() => handleOpenChange(false)}>{t.done}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="gap-5 p-7 sm:max-w-xl sm:p-8">
        <DialogHeader className="pr-8">
          <DialogTitle className="text-lg">{t.title}</DialogTitle>
          <DialogDescription>
            {t.description(certificate.name)}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[min(68vh,600px)] space-y-6 overflow-y-auto py-1 pr-1">
          <fieldset className="space-y-3">
            <legend className="mb-2 text-sm font-medium">{t.whoCanUse}</legend>
            <label className="flex cursor-pointer gap-3 rounded-xl border p-4 text-sm has-checked:border-foreground has-checked:bg-muted/40">
              <input type="radio" name="access-mode" value="anyone" checked={accessMode === "anyone"} onChange={() => setAccessMode("anyone")} className="mt-0.5 accent-foreground" />
              <span><span className="block font-medium">{t.anyone}</span><span className="mt-1 block text-xs text-muted-foreground">{t.anyoneHint}</span></span>
            </label>
            <label className="flex cursor-pointer gap-3 rounded-xl border p-4 text-sm has-checked:border-foreground has-checked:bg-muted/40">
              <input type="radio" name="access-mode" value="restricted" checked={accessMode === "restricted"} onChange={() => setAccessMode("restricted")} className="mt-0.5 accent-foreground" />
              <span><span className="block font-medium">{t.restricted}</span><span className="mt-1 block text-xs text-muted-foreground">{t.restrictedHint}</span></span>
            </label>
            {accessMode === "restricted" && (
              <div className="space-y-2 pl-1">
                <Label>{t.allowedEmails}</Label>
                <EmailChipInput emails={allowedEmails} onChange={setAllowedEmails} />
                <p className="text-xs text-amber-700">{t.notVerified}</p>
                {firstPublish ? (
                  <p className="pt-1 text-xs text-muted-foreground">{t.firstPublishNote("sertiva.app@gmail.com")}</p>
                ) : (
                  <p className="pt-1 text-xs text-muted-foreground">{t.alreadyPublishedNote}</p>
                )}
              </div>
            )}
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="mb-2 text-sm font-medium">{t.howManyNames}</legend>
            <label className="flex cursor-pointer gap-3 rounded-xl border p-4 text-sm has-checked:border-foreground has-checked:bg-muted/40">
              <input type="radio" name="input-mode" value="single" checked={inputMode === "single"} onChange={() => setInputMode("single")} className="mt-0.5 accent-foreground" />
              <span><span className="block font-medium">{t.single}</span><span className="mt-1 block text-xs text-muted-foreground">{t.singleHint}</span></span>
            </label>
            <label className="flex cursor-pointer gap-3 rounded-xl border p-4 text-sm has-checked:border-foreground has-checked:bg-muted/40">
              <input type="radio" name="input-mode" value="repeat" checked={inputMode === "repeat"} onChange={() => setInputMode("repeat")} className="mt-0.5 accent-foreground" />
              <span><span className="block font-medium">{t.repeat}</span><span className="mt-1 block text-xs text-muted-foreground">{t.repeatHint}</span></span>
            </label>
          </fieldset>

          <div className="space-y-2">
            <Label htmlFor="expiration-date">{t.expirationDate}</Label>
            <ExpirationDatePicker id="expiration-date" size="lg" value={expirationDate} onChange={setExpirationDate} />
          </div>
        </div>

        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

        <DialogFooter className="-mx-7 -mb-7 px-7 py-4 sm:-mx-8 sm:-mb-8 sm:px-8">
          <Button type="button" variant="outline" size="lg" onClick={() => handleOpenChange(false)}>{t.cancel}</Button>
          <Button type="button" size="lg" disabled={publishing || loadingSettings || (accessMode === "restricted" && allowedEmails.length === 0)} onClick={() => void handlePublish()}>
            {publishing ? t.publishing : loadingSettings ? t.loadingSettings : t.title}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
