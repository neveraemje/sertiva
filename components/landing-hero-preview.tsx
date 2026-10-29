"use client"

import { useLayoutEffect, useRef, useState } from "react"
import { DownloadIcon } from "lucide-react"
import { toBlob } from "html-to-image"
import "@fontsource/pirata-one/latin-400.css"
import "@fontsource/pinyon-script/latin-400.css"

import { createPdfDownload } from "@/lib/certificates/pdf-download"

import "./landing-hero-preview.css"

type DownloadFormat = "pdf" | "png"

function Flourish({ bottom = false }: { bottom?: boolean }) {
  return (
    <svg
      aria-hidden="true"
      className={bottom ? "landingHeroPreview__bottomFlourish" : "landingHeroPreview__topFlourish"}
      viewBox="0 0 136 24"
      fill="none"
    >
      <path d="M3 12h37c7 0 10-8 4-10-5-2-10 3-7 7 3 5 12 4 19 3M133 12H96c-7 0-10-8-4-10 5-2 10 3 7 7-3 5-12 4-19 3" />
      <path d="M56 12c4 0 7-3 12-8 5 5 8 8 12 8-4 0-7 3-12 8-5-5-8-8-12-8Z" />
      <path d="M64 12h8" />
    </svg>
  )
}

export function HeroPreview() {
  const [name, setName] = useState("Alex Morgan")
  const displayName = name.trim() || "Your name"
  const certificateRef = useRef<HTMLDivElement>(null)
  const certificateNameRef = useRef<HTMLParagraphElement>(null)
  const [downloading, setDownloading] = useState<DownloadFormat | null>(null)
  const [downloadError, setDownloadError] = useState("")

  async function download(format: DownloadFormat) {
    const certificate = certificateRef.current
    if (!certificate || downloading) return

    setDownloading(format)
    setDownloadError("")
    let imageUrl = ""
    let fileUrl = ""
    try {
      await document.fonts.ready
      // Render at a fixed width so the file looks the same on phones and desktops.
      const width = certificate.offsetWidth
      const png = await toBlob(certificate, { pixelRatio: 1800 / width, cacheBust: true })
      if (!png) throw new Error("Could not create the certificate image.")
      imageUrl = URL.createObjectURL(png)
      fileUrl = format === "png" ? imageUrl : URL.createObjectURL(await createPdfDownload(imageUrl, `Certificate for ${displayName}`))

      const filename = displayName.replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "").toLowerCase() || "certificate"
      const link = document.createElement("a")
      link.href = fileUrl
      link.download = `sertiva-${filename}.${format}`
      link.click()
    } catch {
      setDownloadError("Could not prepare the download. Please try again.")
    } finally {
      // Give the browser a moment to start the download before releasing the files.
      window.setTimeout(() => {
        if (imageUrl) URL.revokeObjectURL(imageUrl)
        if (fileUrl && fileUrl !== imageUrl) URL.revokeObjectURL(fileUrl)
      }, 1000)
      setDownloading(null)
    }
  }

  useLayoutEffect(() => {
    const nameElement = certificateNameRef.current
    const nameContainer = nameElement?.parentElement
    if (!nameElement || !nameContainer) return

    const fitName = () => {
      nameElement.style.fontSize = ""
      const maxSize = Number.parseFloat(getComputedStyle(nameElement).fontSize)

      for (let size = maxSize; size >= 8; size -= 1) {
        nameElement.style.fontSize = `${size}px`
        const lineHeight = Number.parseFloat(getComputedStyle(nameElement).lineHeight)
        const nameHeight = nameElement.getBoundingClientRect().height
        if (nameHeight <= lineHeight * 2 + 1 && nameHeight <= nameContainer.getBoundingClientRect().height + 1) break
      }
    }

    fitName()
    let mounted = true
    void document.fonts.ready.then(() => {
      if (mounted) fitName()
    })
    const resizeObserver = new ResizeObserver(fitName)
    resizeObserver.observe(nameContainer)
    return () => {
      mounted = false
      resizeObserver.disconnect()
    }
  }, [displayName])

  return (
    <div className="landingHeroPreview__preview">
      <div ref={certificateRef} className="landingHeroPreview__certificate" role="group" aria-label="Personalized certificate preview">
        <div className="landingHeroPreview__outerFrame" aria-hidden="true" />
        <div className="landingHeroPreview__innerFrame" aria-hidden="true" />
        <span className="landingHeroPreview__corner landingHeroPreview__topLeft" aria-hidden="true">❦</span>
        <span className="landingHeroPreview__corner landingHeroPreview__topRight" aria-hidden="true">❦</span>
        <span className="landingHeroPreview__corner landingHeroPreview__bottomLeft" aria-hidden="true">❦</span>
        <span className="landingHeroPreview__corner landingHeroPreview__bottomRight" aria-hidden="true">❦</span>

        <div className="landingHeroPreview__certificateBody">
          <div className="landingHeroPreview__headingBlock">
            <Flourish />
            <p className="landingHeroPreview__issuer">Sertiva</p>
            <p className="landingHeroPreview__title">Certificate</p>
            <p className="landingHeroPreview__subtitle">of participation</p>
            <p className="landingHeroPreview__presentedTo">This certificate is presented to</p>
          </div>

          <div className="landingHeroPreview__nameArea">
            <p ref={certificateNameRef} className="landingHeroPreview__recipientName" title={displayName}>
              {displayName}
            </p>
          </div>

          <div className="landingHeroPreview__footerBlock">
            <p className="landingHeroPreview__occasion">For taking part in the community workshop</p>
            <div className="landingHeroPreview__signatures" aria-hidden="true">
              <div className="landingHeroPreview__signature">
                <span className="landingHeroPreview__signatureScript">Approved</span>
                <span className="landingHeroPreview__signatureLine" />
                <span className="landingHeroPreview__signatureLabel">Event host</span>
              </div>
              <div className="landingHeroPreview__seal">
                <span className="landingHeroPreview__sealMark" />
              </div>
              <div className="landingHeroPreview__signature">
                <span className="landingHeroPreview__signatureScript">Sertiva</span>
                <span className="landingHeroPreview__signatureLine" />
                <span className="landingHeroPreview__signatureLabel">Certificate issuer</span>
              </div>
            </div>
            <Flourish bottom />
          </div>
        </div>
      </div>

      <div className="landingHeroPreview__nameControl">
        <label htmlFor="hero-recipient-name">Try your name</label>
        <input
          id="hero-recipient-name"
          type="text"
          autoComplete="name"
          maxLength={60}
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Type your name"
        />
      </div>
      <div className="landingHeroPreview__downloadOptions">
        {(["pdf", "png"] as const).map((format) => (
          <button
            key={format}
            type="button"
            className="landingHeroPreview__downloadOption"
            disabled={downloading !== null}
            aria-label={`Download certificate as ${format.toUpperCase()}`}
            onClick={() => void download(format)}
          >
            <DownloadIcon size={16} /> {downloading === format ? "Preparing…" : format.toUpperCase()}
          </button>
        ))}
      </div>
      {downloadError ? <p className="landingHeroPreview__downloadError" role="alert">{downloadError}</p> : null}
    </div>
  )
}
