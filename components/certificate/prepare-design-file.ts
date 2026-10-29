export type PreparedDesignFile = {
  file: File
  dataUrl: string
  previewUrl: string
  width: number
  height: number
}

export async function prepareDesignFile(file: File): Promise<PreparedDesignFile> {
  const dataUrl = await readAsDataUrl(file)

  if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
    return preparePdf(file, dataUrl)
  }

  const dimensions = await readImageDimensions(dataUrl)
  return { file, dataUrl, previewUrl: dataUrl, ...dimensions }
}

async function preparePdf(file: File, dataUrl: string): Promise<PreparedDesignFile> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs")
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/legacy/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString()

  const loadingTask = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) })
  const document = await loadingTask.promise
  const page = await document.getPage(1)
  const naturalViewport = page.getViewport({ scale: 1 })
  const scale = Math.min(2.5, 1600 / naturalViewport.width)
  const viewport = page.getViewport({ scale })
  const canvas = window.document.createElement("canvas")
  const context = canvas.getContext("2d")

  if (!context) throw new Error("Unable to create a PDF preview")

  canvas.width = Math.ceil(viewport.width)
  canvas.height = Math.ceil(viewport.height)
  await page.render({ canvas, canvasContext: context, viewport, background: "#ffffff" }).promise

  const prepared = {
    file,
    dataUrl,
    previewUrl: canvas.toDataURL("image/png"),
    width: naturalViewport.width,
    height: naturalViewport.height,
  }

  await loadingTask.destroy()
  return prepared
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
