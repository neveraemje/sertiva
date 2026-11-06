"use client"

import { useRef, useState } from "react"
import { ChevronDownIcon, DownloadIcon, FileSpreadsheetIcon, LoaderCircleIcon, UploadIcon, XIcon } from "lucide-react"

import type { CertificateRecord } from "@/components/certificate/types"
import { useMessages } from "@/components/i18n/locale-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { exampleCsv, MAX_BULK_ROWS, readBulkCsv, uniqueFileNames, type BulkCsv } from "@/lib/certificates/bulk-csv"
import { createPdfDownload } from "@/lib/certificates/pdf-download"
import { drawCertificate, loadDesign, saveFile, type DownloadFormat } from "@/lib/certificates/render"

const messages = {
  en: {
    singleTitle: "Single download",
    nameLabel: "Name on certificate",
    format: "Format",
    download: "Download",
    downloadZip: "Download ZIP",
    title: "Bulk download",
    description: "CSV with 2 columns: file name, then name.",
    sampleFile: "sertiva-sample.csv",
    sampleHint: "Download the sample CSV",
    import: "Import CSV",
    replace: "Replace",
    remove: "Remove CSV",
    count: (count: number) => `${count} ${count === 1 ? "certificate" : "certificates"}`,
    skipped: (lines: number[]) => `Skipped ${lines.length === 1 ? "row" : "rows"} ${lines.join(", ")}: no name in column 2.`,
    tooMany: (count: number) => `This CSV has ${count} names. Use up to ${MAX_BULK_ROWS} per download.`,
    empty: "No names found. Put the file name in column 1 and the name in column 2.",
    readFailed: "Could not read this file. Save it as CSV and try again.",
    fileName: "File name",
    name: "Name on certificate",
    more: (count: number) => `+ ${count} more`,
    preparing: (done: number, total: number) => `Preparing ${done} of ${total}…`,
    cancel: "Cancel",
    done: (count: number) => `Downloaded ${count} ${count === 1 ? "certificate" : "certificates"}.`,
    failed: "Could not prepare the download.",
    noDesign: "Upload a design to download certificates.",
  },
  id: {
    singleTitle: "Unduh satuan",
    nameLabel: "Nama di sertifikat",
    format: "Format",
    download: "Unduh",
    downloadZip: "Unduh ZIP",
    title: "Unduh massal",
    description: "CSV dengan 2 kolom: nama file, lalu nama.",
    sampleFile: "contoh-sertiva.csv",
    sampleHint: "Unduh contoh CSV",
    import: "Impor CSV",
    replace: "Ganti",
    remove: "Hapus CSV",
    count: (count: number) => `${count} sertifikat`,
    skipped: (lines: number[]) => `Baris ${lines.join(", ")} dilewati: tidak ada nama di kolom 2.`,
    tooMany: (count: number) => `CSV ini berisi ${count} nama. Gunakan maksimal ${MAX_BULK_ROWS} per unduhan.`,
    empty: "Tidak ada nama. Isi nama file di kolom 1 dan nama di kolom 2.",
    readFailed: "Tidak dapat membaca file ini. Simpan sebagai CSV lalu coba lagi.",
    fileName: "Nama file",
    name: "Nama di sertifikat",
    more: (count: number) => `+ ${count} lainnya`,
    preparing: (done: number, total: number) => `Menyiapkan ${done} dari ${total}…`,
    cancel: "Batal",
    done: (count: number) => `${count} sertifikat diunduh.`,
    failed: "Tidak dapat menyiapkan unduhan.",
    noDesign: "Unggah desain untuk mengunduh sertifikat.",
  },
}

const PREVIEW_ROWS = 5

// Builds a ZIP as entries are added; PDFs and PNGs are already compressed, so entries are stored as is.
async function createZip() {
  const { Zip, ZipPassThrough } = await import("fflate")
  const chunks: Uint8Array[] = []
  let finish!: (zip: Blob) => void
  let fail!: (error: Error) => void
  const result = new Promise<Blob>((resolve, reject) => {
    finish = resolve
    fail = reject
  })
  const zip = new Zip((error, chunk, final) => {
    if (error) return fail(error)
    chunks.push(chunk)
    if (final) finish(new Blob(chunks as BlobPart[], { type: "application/zip" }))
  })

  return {
    async add(name: string, file: Blob) {
      const entry = new ZipPassThrough(name)
      zip.add(entry)
      entry.push(new Uint8Array(await file.arrayBuffer()), true)
    },
    finish() {
      zip.end()
      return result
    },
    cancel() {
      zip.terminate()
    },
  }
}

// Safe file name from free text, keeping letters in any language.
function fileNameFrom(text: string) {
  return text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "") || "certificate"
}

function AccordionSection({ id, title, open, onToggle, children }: {
  id: string
  title: string
  open: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <section className="border-b">
      <h3>
        <button type="button" aria-expanded={open} aria-controls={id} className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left text-sm font-semibold hover:bg-muted/40" onClick={onToggle}>
          {title}
          <ChevronDownIcon className={cn("size-4 text-muted-foreground transition-transform", open && "rotate-180")} />
        </button>
      </h3>
      {open && <div id={id} className="space-y-4 px-4 pb-5">{children}</div>}
    </section>
  )
}

function FormatRadio({ name, label, value, onChange, disabled }: {
  name: string
  label: string
  value: DownloadFormat
  onChange: (format: DownloadFormat) => void
  disabled: boolean
}) {
  return (
    <fieldset className="flex items-center gap-4 text-sm" disabled={disabled}>
      <legend className="sr-only">{label}</legend>
      <span aria-hidden="true" className="text-muted-foreground">{label}</span>
      {(["pdf", "png"] as const).map((format) => (
        <label key={format} className="flex items-center gap-1.5">
          <input type="radio" name={name} value={format} checked={value === format} onChange={() => onChange(format)} className="accent-foreground" />
          {format.toUpperCase()}
        </label>
      ))}
    </fieldset>
  )
}

export function DownloadPanel({ certificate, onNameChange }: { certificate: CertificateRecord; onNameChange: (name: string) => void }) {
  const t = useMessages(messages)
  const inputRef = useRef<HTMLInputElement>(null)
  const cancelled = useRef(false)
  const [csv, setCsv] = useState<(BulkCsv & { file: string }) | null>(null)
  const [readError, setReadError] = useState<string | null>(null)
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null)
  const designUrl = certificate.template.previewUrl ?? (certificate.template.kind === "image" ? certificate.template.url : null)
  const tooMany = (csv?.rows.length ?? 0) > MAX_BULK_ROWS
  const [single, setSingle] = useState<DownloadFormat | null>(null)
  const [singleFormat, setSingleFormat] = useState<DownloadFormat>("pdf")
  const [bulkFormat, setBulkFormat] = useState<DownloadFormat>("pdf")
  // One section open at a time; a running bulk download keeps its section open.
  const [openSection, setOpenSection] = useState<"single" | "bulk" | null>("single")

  function toggleSection(section: "single" | "bulk") {
    if (progress) return
    setOpenSection((current) => current === section ? null : section)
  }
  const [singleError, setSingleError] = useState<string | null>(null)
  const busy = single !== null || progress !== null

  // Downloads one certificate with the name typed on the design, like a recipient would get it.
  async function downloadOne(format: DownloadFormat) {
    if (!designUrl || busy) return
    const name = certificate.editor.recipientName.trim()
    setSingle(format)
    setSingleError(null)
    let image: ImageBitmap | null = null
    try {
      image = await loadDesign(designUrl)
      const png = await drawCertificate(image, certificate.editor, name)
      const file = format === "pdf" ? await createPdfDownload(png, `${certificate.name} - ${name}`, certificate.editor.pages) : png
      const url = URL.createObjectURL(file)
      saveFile(url, `${fileNameFrom(`${certificate.name}-${name}`)}.${format}`)
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
    } catch (caught) {
      setSingleError(caught instanceof Error ? caught.message : t.failed)
    } finally {
      image?.close()
      setSingle(null)
    }
  }

  async function importCsv(file: File | undefined) {
    if (!file) return
    setStatus(null)
    setReadError(null)
    try {
      const result = readBulkCsv(await file.text())
      setCsv({ ...result, file: file.name })
      if (result.rows.length === 0) setReadError(t.empty)
    } catch {
      setCsv(null)
      setReadError(t.readFailed)
    } finally {
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  function downloadExample() {
    const url = URL.createObjectURL(new Blob([exampleCsv], { type: "text/csv" }))
    saveFile(url, t.sampleFile)
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
  }

  async function downloadAll(format: DownloadFormat) {
    if (!csv || !designUrl || busy || tooMany || csv.rows.length === 0) return
    const rows = csv.rows
    const fileNames = uniqueFileNames(rows, format)
    cancelled.current = false
    setStatus(null)
    setProgress({ done: 0, total: rows.length })
    let image: ImageBitmap | null = null
    let zip: Awaited<ReturnType<typeof createZip>> | null = null
    try {
      image = await loadDesign(designUrl)
      zip = await createZip()
      for (const [index, row] of rows.entries()) {
        if (cancelled.current) {
          zip.cancel()
          return
        }
        const png = await drawCertificate(image, certificate.editor, row.name)
        const file = format === "pdf" ? await createPdfDownload(png, `${certificate.name} - ${row.name}`, certificate.editor.pages) : png
        await zip.add(fileNames[index], file)
        setProgress({ done: index + 1, total: rows.length })
      }
      const url = URL.createObjectURL(await zip.finish())
      const zipName = certificate.name.replace(/[\\/:*?"<>|]+/g, "-").trim() || "certificates"
      saveFile(url, `${zipName}.zip`)
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
      setStatus({ ok: true, text: t.done(rows.length) })
    } catch (caught) {
      zip?.cancel()
      setStatus({ ok: false, text: caught instanceof Error ? caught.message : t.failed })
    } finally {
      image?.close()
      setProgress(null)
    }
  }

  if (!designUrl) {
    return <p className="px-4 py-5 text-sm text-muted-foreground">{t.noDesign}</p>
  }

  return (
    <div>
    <AccordionSection id="single-download" title={t.singleTitle} open={openSection === "single"} onToggle={() => toggleSection("single")}>
      <div className="space-y-2">
        <Label htmlFor="download-name">{t.nameLabel}</Label>
        <Input id="download-name" value={certificate.editor.recipientName} maxLength={100} onChange={(event) => onNameChange(event.target.value)} className="border-border/70 bg-muted/60 shadow-none" />
      </div>
      <FormatRadio name="single-format" label={t.format} value={singleFormat} onChange={setSingleFormat} disabled={busy} />
      <Button type="button" variant="secondary" className="w-full" disabled={busy || !certificate.editor.recipientName.trim()} onClick={() => void downloadOne(singleFormat)}>
        {single ? <LoaderCircleIcon className="animate-spin" data-icon="inline-start" /> : <DownloadIcon data-icon="inline-start" />}
        {t.download}
      </Button>
      {singleError && <p role="alert" className="text-xs text-destructive">{singleError}</p>}
    </AccordionSection>

    <AccordionSection id="bulk-download" title={t.title} open={openSection === "bulk"} onToggle={() => toggleSection("bulk")}>
      <p className="text-xs leading-relaxed text-muted-foreground">{t.description}</p>

      <button type="button" className="flex items-center gap-1.5 text-sm font-medium underline-offset-2 hover:underline" title={t.sampleHint} onClick={downloadExample}>
        <FileSpreadsheetIcon className="size-4 shrink-0 text-emerald-700" />
        {t.sampleFile}
      </button>

      <input ref={inputRef} type="file" accept=".csv,text/csv" className="sr-only" tabIndex={-1} onChange={(event) => void importCsv(event.target.files?.[0])} />

      {csv ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 rounded-lg border px-3 py-2">
            <FileSpreadsheetIcon className="size-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{csv.file}</p>
              <p className="text-xs text-muted-foreground">{t.count(csv.rows.length)}</p>
            </div>
            <Button type="button" variant="ghost" size="xs" disabled={busy} onClick={() => inputRef.current?.click()}>{t.replace}</Button>
            <Button type="button" variant="ghost" size="icon-xs" aria-label={t.remove} disabled={busy} onClick={() => {
              setCsv(null)
              setReadError(null)
              setStatus(null)
            }}><XIcon /></Button>
          </div>

          {csv.skipped.length > 0 && <p className="text-xs text-amber-700">{t.skipped(csv.skipped)}</p>}
          {tooMany && <p role="alert" className="text-xs text-destructive">{t.tooMany(csv.rows.length)}</p>}

          {csv.rows.length > 0 && (
            <div className="overflow-hidden rounded-lg border text-xs">
              <div className="grid grid-cols-2 gap-2 border-b bg-muted/50 px-3 py-1.5 font-medium text-muted-foreground">
                <span>{t.fileName}</span>
                <span>{t.name}</span>
              </div>
              {csv.rows.slice(0, PREVIEW_ROWS).map((row) => (
                <div key={row.line} className="grid grid-cols-2 gap-2 border-b px-3 py-1.5 last:border-b-0">
                  <span className="truncate" title={row.fileName}>{row.fileName}</span>
                  <span className="truncate" title={row.name}>{row.name}</span>
                </div>
              ))}
              {csv.rows.length > PREVIEW_ROWS && <p className="px-3 py-1.5 text-muted-foreground">{t.more(csv.rows.length - PREVIEW_ROWS)}</p>}
            </div>
          )}
        </div>
      ) : (
        <Button type="button" variant="outline" className="w-full" onClick={() => inputRef.current?.click()}>
          <UploadIcon data-icon="inline-start" /> {t.import}
        </Button>
      )}

      {readError && <p role="alert" className="text-xs text-destructive">{readError}</p>}

      {csv && csv.rows.length > 0 && (
        <div className="space-y-3">
          {progress ? (
            <div className="space-y-2" role="status">
              <div className="flex items-center gap-2 text-sm">
                <LoaderCircleIcon className="size-4 animate-spin" />
                <span className="flex-1">{t.preparing(progress.done, progress.total)}</span>
                <Button type="button" variant="ghost" size="xs" onClick={() => { cancelled.current = true }}>{t.cancel}</Button>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full bg-foreground transition-[width]" style={{ width: `${progress.done / progress.total * 100}%` }} />
              </div>
            </div>
          ) : (
            <>
              <FormatRadio name="bulk-format" label={t.format} value={bulkFormat} onChange={setBulkFormat} disabled={busy} />
              {/* Downloads every certificate in one ZIP file. */}
              <Button type="button" variant="secondary" className="w-full" disabled={tooMany || busy} onClick={() => void downloadAll(bulkFormat)}>
                <DownloadIcon data-icon="inline-start" /> {t.downloadZip}
              </Button>
            </>
          )}
          {status && <p role={status.ok ? "status" : "alert"} className={status.ok ? "text-xs text-emerald-700" : "text-xs text-destructive"}>{status.text}</p>}
        </div>
      )}
    </AccordionSection>
    </div>
  )
}
