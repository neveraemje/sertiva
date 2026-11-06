export type PreparedDesignFile = {
  file: File
  dataUrl: string
  previewUrl: string
  width: number
  height: number
  // Relative page heights when a PDF has more than one page (see pages.ts).
  pages?: number[]
}

export const MAX_PDF_PAGES = 10

export class TooManyPagesError extends Error {
  constructor(readonly pageCount: number) {
    super(`PDFs can have up to ${MAX_PDF_PAGES} pages.`)
  }
}

// Safari refuses canvases larger than about 16.7 million pixels, so the stacked image stays below that.
const MAX_CANVAS_AREA = 16_000_000
const MAX_CANVAS_HEIGHT = 16_000
// PDF pages are drawn at 300 DPI (PDF sizes are in points, 72 per inch), the usual print quality,
// so downloads keep the sharpness of the uploaded file. Images are stored at their original size.
const PDF_RENDER_SCALE = 300 / 72

export async function prepareDesignFile(file: File): Promise<PreparedDesignFile> {
  const dataUrl = await readAsDataUrl(file)

  if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
    return preparePdf(file, dataUrl)
  }

  const dimensions = await readImageDimensions(dataUrl)
  return { file, dataUrl, previewUrl: dataUrl, ...dimensions }
}

// Renders every page into one image, stacked top to bottom at the same width.
async function preparePdf(file: File, dataUrl: string): Promise<PreparedDesignFile> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs")
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/legacy/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString()

  const loadingTask = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) })
  try {
    const document = await loadingTask.promise
    if (document.numPages > MAX_PDF_PAGES) throw new TooManyPagesError(document.numPages)

    const pages = await Promise.all(Array.from({ length: document.numPages }, (_, index) => document.getPage(index + 1)))
    const sizes = pages.map((page) => page.getViewport({ scale: 1 }))
    // Each page's height when its width matches the first page.
    const firstWidth = sizes[0].width
    const heights = sizes.map((size) => size.height * firstWidth / size.width)
    const totalRatio = heights.reduce((sum, height) => sum + height, 0) / firstWidth
    const width = Math.floor(Math.min(
      firstWidth * PDF_RENDER_SCALE,
      MAX_CANVAS_HEIGHT / totalRatio,
      Math.sqrt(MAX_CANVAS_AREA / totalRatio),
    ))

    const canvas = window.document.createElement("canvas")
    const context = canvas.getContext("2d")
    if (!context) throw new Error("Unable to create a PDF preview")
    canvas.width = width
    canvas.height = Math.ceil(width * totalRatio)
    context.fillStyle = "#ffffff"
    context.fillRect(0, 0, canvas.width, canvas.height)

    let top = 0
    for (const [index, page] of pages.entries()) {
      const viewport = page.getViewport({ scale: width / sizes[index].width })
      const pageCanvas = window.document.createElement("canvas")
      pageCanvas.width = width
      pageCanvas.height = Math.ceil(viewport.height)
      await page.render({ canvas: pageCanvas, viewport, background: "#ffffff" }).promise
      context.drawImage(pageCanvas, 0, Math.round(top))
      top += viewport.height
    }

    return {
      file,
      dataUrl,
      previewUrl: canvas.toDataURL("image/png"),
      width: firstWidth,
      height: heights.reduce((sum, height) => sum + height, 0),
      ...(pages.length > 1 ? { pages: heights.map((height) => Math.round(height * 100) / 100) } : {}),
    }
  } finally {
    await loadingTask.destroy()
  }
}

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error ?? new Error("Unable to read the design file"))
    reader.readAsDataURL(file)
  })
}

function readImageDimensions(url: string) {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight })
    image.onerror = () => reject(new Error("Unable to read image dimensions"))
    image.src = url
  })
}
