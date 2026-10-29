"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import { CalendarDaysIcon, CheckCircle2Icon, CopyIcon, ExternalLinkIcon } from "lucide-react"
import { cn } from "cn"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import type { CertificateRecord } from "@/components/certificate/types"
import { defaultInviteMessage, defaultInviteTitle, sendPublicationInvite } from "@/lib/certificates/invite"
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

function publishErrorMessage(caught: unknown) {
  if (caught && typeof caught === "object") {
    const error = caught as { code?: unknown; message?: unknown }
    if (["PGRST205", "PGRST202", "PGRST204", "42703"].includes(String(error.code))) {
      return "Publishing settings are not set up in this Supabase project yet. Apply the publication settings database migration."
    }
    if (typeof error.message === "string" && error.message) return error.message
  }
  return "Could not publish this certificate."
}

export function PublishCertificateDialog({
  certificate,
  userId,
  open,
  onOpenChange,
  onSave,
  onPublished,
}: PublishCertificateDialogProps) {
  const [publicUrl, setPublicUrl] = useState<string | null>(null)
  const [expirationDate, setExpirationDate] = useState<Date>()
  const [accessMode, setAccessMode] = useState<PublicationSettings["accessMode"]>("anyone")
  const [allowedEmails, setAllowedEmails] = useState<string[]>([])
  const [inputMode, setInputMode] = useState<PublicationSettings["inputMode"]>("repeat")
  const [loadingSettings, setLoadingSettings] = useState(true)
  const [expirationPickerOpen, setExpirationPickerOpen] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [firstPublish, setFirstPublish] = useState(false)
  const [inviteStatus, setInviteStatus] = useState<string | null>(null)

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
      if (!cancelled) setError(publishErrorMessage(caught))
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
      setExpirationPickerOpen(false)
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
        setError("Published successfully, but the dashboard could not refresh. Reload it to see the latest status.")
      })
    } catch (caught) {
      setError(publishErrorMessage(caught))
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
      return `Published, but the emails were not sent: ${caught instanceof Error ? caught.message : "unknown error"}`
    }
  }

  async function handleCopy() {
    if (!publicUrl) return
    try {
      await navigator.clipboard.writeText(publicUrl)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setError("Could not copy the link. Select and copy it from the field instead.")
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
              <DialogTitle className="text-lg">Certificate published</DialogTitle>
              <DialogDescription className="max-w-sm">
                {accessMode === "restricted"
                  ? "Visitors must enter an allowed email before they can make a named copy. Email ownership is not verified."
                  : "Anyone with this link can enter a name, preview the certificate, and download it without signing in."}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="space-y-3 rounded-xl bg-muted/60 p-3">
            <Label htmlFor="published-url" className="text-xs text-muted-foreground">Published link</Label>
            <div className="flex gap-2">
              <Input id="published-url" readOnly value={publicUrl} onFocus={(event) => event.target.select()} className="h-9 bg-background" />
              <Button type="button" variant="outline" size="lg" onClick={() => void handleCopy()}>
                <CopyIcon /> {copied ? "Copied" : "Copy"}
              </Button>
            </div>
          </div>

          {inviteStatus && <p role="status" className="text-sm text-muted-foreground">{inviteStatus}</p>}
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

          <DialogFooter className="-mx-7 -mb-7 px-7 py-4 sm:-mx-8 sm:-mb-8 sm:px-8">
            <Button type="button" variant="outline" size="lg" onClick={() => window.open(publicUrl, "_blank", "noopener,noreferrer")}>
              <ExternalLinkIcon /> Open public page
            </Button>
            <Button type="button" size="lg" onClick={() => handleOpenChange(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="gap-5 p-7 sm:max-w-xl sm:p-8">
        <DialogHeader className="pr-8">
          <DialogTitle className="text-lg">Publish certificate</DialogTitle>
          <DialogDescription>
            Create a shareable link for {certificate.name}. Anyone with the link can make a named copy.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[min(68vh,600px)] space-y-6 overflow-y-auto py-1 pr-1">
          <fieldset className="space-y-3">
            <legend className="mb-2 text-sm font-medium">Who can use this link?</legend>
            <label className="flex cursor-pointer gap-3 rounded-xl border p-4 text-sm has-checked:border-foreground has-checked:bg-muted/40">
              <input type="radio" name="access-mode" value="anyone" checked={accessMode === "anyone"} onChange={() => setAccessMode("anyone")} className="mt-0.5 accent-foreground" />
              <span><span className="block font-medium">Anyone with the link</span><span className="mt-1 block text-xs text-muted-foreground">No email is required.</span></span>
            </label>
            <label className="flex cursor-pointer gap-3 rounded-xl border p-4 text-sm has-checked:border-foreground has-checked:bg-muted/40">
              <input type="radio" name="access-mode" value="restricted" checked={accessMode === "restricted"} onChange={() => setAccessMode("restricted")} className="mt-0.5 accent-foreground" />
              <span><span className="block font-medium">Restricted by email</span><span className="mt-1 block text-xs text-muted-foreground">Only addresses on your list can continue.</span></span>
            </label>
            {accessMode === "restricted" && (
              <div className="space-y-2 pl-1">
                <Label>Allowed email addresses</Label>
                <EmailChipInput emails={allowedEmails} onChange={setAllowedEmails} />
                <p className="text-xs text-amber-700">Visitors only enter an email address. Ownership is not verified.</p>
                {firstPublish ? (
                  <p className="pt-1 text-xs text-muted-foreground">When you publish, the certificate link is emailed to every address above from sertiva.app@gmail.com.</p>
                ) : (
                  <p className="pt-1 text-xs text-muted-foreground">Already published. Use Send link by email in the publication details to email these addresses.</p>
                )}
              </div>
            )}
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="mb-2 text-sm font-medium">How many names?</legend>
            <label className="flex cursor-pointer gap-3 rounded-xl border p-4 text-sm has-checked:border-foreground has-checked:bg-muted/40">
              <input type="radio" name="input-mode" value="single" checked={inputMode === "single"} onChange={() => setInputMode("single")} className="mt-0.5 accent-foreground" />
              <span><span className="block font-medium">Single input</span><span className="mt-1 block text-xs text-muted-foreground">The first preview claims this link for one name.</span></span>
            </label>
            <label className="flex cursor-pointer gap-3 rounded-xl border p-4 text-sm has-checked:border-foreground has-checked:bg-muted/40">
              <input type="radio" name="input-mode" value="repeat" checked={inputMode === "repeat"} onChange={() => setInputMode("repeat")} className="mt-0.5 accent-foreground" />
              <span><span className="block font-medium">Repeat input</span><span className="mt-1 block text-xs text-muted-foreground">The link can be used for multiple names.</span></span>
            </label>
          </fieldset>

          <div className="space-y-2">
            <Label htmlFor="expiration-date">Expiration date (optional)</Label>
            <Popover open={expirationPickerOpen} onOpenChange={setExpirationPickerOpen}>
              <PopoverTrigger
                render={
                  <Button
                    id="expiration-date"
                    type="button"
                    variant="outline"
                    size="lg"
                    className={cn("w-full justify-between bg-background font-normal", !expirationDate && "text-muted-foreground")}
                  />
                }
              >
                {expirationDate ? format(expirationDate, "PPP") : "No expiration"}
                <CalendarDaysIcon />
              </PopoverTrigger>
              <PopoverContent align="start" className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={expirationDate}
                  onSelect={(date) => {
                    setExpirationDate(date)
                    if (date) setExpirationPickerOpen(false)
                  }}
                  disabled={{ before: new Date() }}
                />
                {expirationDate && (
                  <div className="border-t p-2">
                    <Button type="button" variant="ghost" size="sm" className="w-full" onClick={() => setExpirationDate(undefined)}>
                      Clear expiration date
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

        <DialogFooter className="-mx-7 -mb-7 px-7 py-4 sm:-mx-8 sm:-mb-8 sm:px-8">
          <Button type="button" variant="outline" size="lg" onClick={() => handleOpenChange(false)}>Cancel</Button>
          <Button type="button" size="lg" disabled={publishing || loadingSettings || (accessMode === "restricted" && allowedEmails.length === 0)} onClick={() => void handlePublish()}>
            {publishing ? "Publishing…" : loadingSettings ? "Loading settings…" : "Publish certificate"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
