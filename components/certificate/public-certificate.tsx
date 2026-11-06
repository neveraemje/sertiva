"use client"

import { type FormEvent, useEffect, useRef, useState } from "react"
import { DownloadIcon } from "lucide-react"

import { SertivaLogo } from "@/components/sertiva-logo"
import { isMultiPage } from "@/components/certificate/pages"
import type { CertificateEditorState } from "@/components/certificate/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createPdfDownload } from "@/lib/certificates/pdf-download"
import { renderCertificate } from "@/lib/certificates/render"
import { cn } from "@/lib/utils"

type PublicCertificateProps = {
  slug: string
  title: string
  accessMode: "anyone" | "restricted"
  inputMode: "single" | "repeat"
  available: boolean
  legacyAsset?: ClaimedCertificate
}

type ClaimedCertificate = {
  imageUrl: string
  editor: CertificateEditorState
  downloadToken?: string
}

type DownloadFormat = "pdf" | "png"

export function PublicCertificate({ slug, title, accessMode, inputMode, available, legacyAsset }: PublicCertificateProps) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [previewName, setPreviewName] = useState("")
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  // Page layout of the previewed design, so the PDF download can split it back into pages.
  const [previewPages, setPreviewPages] = useState<number[] | undefined>()
  const [downloadToken, setDownloadToken] = useState<string | null>(null)
  const [downloading, setDownloading] = useState<DownloadFormat | null>(null)
  const downloadInProgress = useRef(false)
  const [claimed, setClaimed] = useState(false)
  const claimedCertificate = useRef<ClaimedCertificate | null>(null)
  const [rendering, setRendering] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  async function handlePreview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmedName = name.trim()
    if (!trimmedName) {
      setError("Enter your name to preview the certificate.")
      return
    }
    if (accessMode === "restricted" && !email.trim()) {
      setError("Enter an allowed email address to continue.")
      return
    }
    if (inputMode === "single" && claimed && previewUrl) return

    setRendering(true)
    setError(null)
    try {
      let certificate = legacyAsset ?? claimedCertificate.current
      if (!certificate) {
        const response = await fetch(`/api/public-certificates/${encodeURIComponent(slug)}/claim`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: trimmedName, email: email.trim() || null }),
        })
        const result = await response.json() as {
          error?: string
          imageUrl?: string
          editor?: CertificateEditorState
          downloadToken?: string
        }
        if (!response.ok || !result.imageUrl || !result.editor) {
          throw new Error(result.error || "Could not prepare the certificate.")
        }
        certificate = { imageUrl: result.imageUrl, editor: result.editor, downloadToken: result.downloadToken }
        if (inputMode === "single") {
          claimedCertificate.current = certificate
          setClaimed(true)
        }
      }
      const url = await renderCertificate(certificate.imageUrl, certificate.editor, trimmedName)
      setPreviewName(trimmedName)
      setPreviewUrl(url)
      setPreviewPages(certificate.editor.pages)
      setDownloadToken(certificate.downloadToken ?? null)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not preview the certificate.")
    } finally {
      setRendering(false)
    }
  }

  const filename = `${title}-${previewName}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "certificate"

  async function handleDownload(format: DownloadFormat) {
    if (!previewUrl || downloadInProgress.current) return
    downloadInProgress.current = true
    setDownloading(format)
    setError(null)
    let pdfUrl: string | null = null
    try {
      if (format === "pdf") {
        const pdf = await createPdfDownload(previewUrl, `${title} - ${previewName}`, previewPages)
        pdfUrl = URL.createObjectURL(pdf)
      }
      if (downloadToken) {
        const response = await fetch(`/api/public-certificates/${encodeURIComponent(slug)}/download`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: downloadToken }),
        })
        if (!response.ok) throw new Error("Could not start the download. Please try again.")
      }
      const link = document.createElement("a")
      link.href = pdfUrl ?? previewUrl
      link.download = `${filename}.${format}`
      document.body.append(link)
      link.click()
      link.remove()
      if (pdfUrl) {
        const urlToRevoke = pdfUrl
        window.setTimeout(() => URL.revokeObjectURL(urlToRevoke), 60_000)
        pdfUrl = null
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not start the download.")
    } finally {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl)
      downloadInProgress.current = false
      setDownloading(null)
    }
  }

  return (
    <main className="min-h-svh bg-[#f6f6f6] px-4 py-8 text-foreground sm:px-6 sm:py-12">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 flex items-center justify-between">
          <span className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <SertivaLogo className="h-6 w-auto" />
            <span>Sertiva<span className="text-muted-foreground">.</span></span>
          </span>
          <span className="rounded-full border bg-white px-3 py-1 text-xs text-muted-foreground">Certificate</span>
        </header>

        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
          <div className="border-b px-5 py-6 sm:px-8">
            <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">Personalize your certificate</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">Enter your name, preview your certificate, then download your copy.</p>
          </div>

          <div className="grid gap-8 p-5 sm:p-8 lg:grid-cols-[280px_minmax(0,1fr)]">
            {available ? <form onSubmit={(event) => void handlePreview(event)} className="space-y-4">
              {accessMode === "restricted" && (
                <div className="space-y-2">
                  <Label htmlFor="recipient-email">Your email</Label>
                  <Input
                    id="recipient-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    disabled={claimed}
                    placeholder="name@example.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="h-11"
                  />
                  <p className="text-xs text-muted-foreground">This link checks the entered address against the allowed list. It does not verify email ownership.</p>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="recipient-name">Your name</Label>
                <Input
                  id="recipient-name"
                  name="name"
                  autoComplete="name"
                  autoFocus
                  maxLength={100}
                  disabled={claimed}
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="h-11"
                />
              </div>

              {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

              {inputMode === "single" && !claimed && (
                <p className="text-xs text-muted-foreground">This link accepts one name total. Previewing claims the link.</p>
              )}

              {(!claimed || !previewUrl) && <Button type="submit" size="lg" disabled={rendering || downloading !== null} className="w-full">
                {rendering ? "Preparing preview…" : claimed ? "Retry preview" : previewUrl ? "Update preview" : "Preview certificate"}
              </Button>}

              {previewUrl && (
                <div className="space-y-3 border-t pt-5">
                  <p className="text-sm font-medium">Download</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button type="button" variant="outline" size="lg" className="w-full" aria-label="Download PDF" disabled={downloading !== null} onClick={() => void handleDownload("pdf")}>
                      <DownloadIcon className="size-4" /> {downloading === "pdf" ? "Preparing…" : "PDF"}
                    </Button>
                    <Button type="button" variant="outline" size="lg" className="w-full" aria-label="Download PNG" disabled={downloading !== null} onClick={() => void handleDownload("png")}>
                      <DownloadIcon className="size-4" /> {downloading === "png" ? "Starting…" : "PNG"}
                    </Button>
                  </div>
                </div>
              )}
            </form> : <div className="rounded-xl border bg-muted/50 p-5 text-sm text-muted-foreground">This certificate link has already been used.</div>}

            <div className="flex min-h-60 items-center justify-center overflow-hidden rounded-xl border bg-[#fafafa] p-3 sm:p-5">
              {previewUrl ? (
                // The generated Blob URL is created locally from the published design.
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewUrl} alt={`Certificate for ${previewName}`} className={cn("w-full object-contain shadow-lg", !isMultiPage(previewPages) && "max-h-[70vh]")} />
              ) : (
                <div className="text-center text-muted-foreground">
                  <p className="text-sm">Your preview will appear here</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
