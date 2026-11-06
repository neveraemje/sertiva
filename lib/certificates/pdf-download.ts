import { pageBounds } from "@/components/certificate/pages"

// `image` is a PNG URL or Blob. `pages` splits a tall image of stacked pages back into one PDF page each (see pages.ts).
export async function createPdfDownload(image: string | Blob, title: string, pages?: number[]) {
  const { PDFDocument } = await import("pdf-lib")
  let png: Blob
  if (typeof image === "string") {
    const imageResponse = await fetch(image)
    if (!imageResponse.ok) throw new Error("Could not prepare the PDF download.")
    png = await imageResponse.blob()
  } else {
    png = image
  }

  const pdf = await PDFDocument.create()
  const bounds = pageBounds(pages)
  const pageImages = bounds.length > 1
    ? await splitPages(png, bounds)
    : [await png.arrayBuffer()]

  for (const bytes of pageImages) {
    const image = await pdf.embedPng(bytes)
    const scale = 842 / Math.max(image.width, image.height)
    const width = image.width * scale
    const height = image.height * scale
    const page = pdf.addPage([width, height])
    page.drawImage(image, { x: 0, y: 0, width, height })
  }
  pdf.setTitle(title)

  const bytes = await pdf.save()
  return new Blob([Uint8Array.from(bytes)], { type: "application/pdf" })
}

async function splitPages(blob: Blob, bounds: ReturnType<typeof pageBounds>) {
  const image = await createImageBitmap(blob)
  try {
    return await Promise.all(bounds.map(async ({ top, bottom }) => {
      const y = Math.round(image.height * top / 100)
      const height = Math.round(image.height * bottom / 100) - y
      const canvas = document.createElement("canvas")
      canvas.width = image.width
      canvas.height = height
      const context = canvas.getContext("2d")
      if (!context) throw new Error("Could not prepare the PDF download.")
      context.drawImage(image, 0, y, image.width, height, 0, 0, image.width, height)
      const page = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((result) => result ? resolve(result) : reject(new Error("Could not prepare the PDF download.")), "image/png")
      })
      return page.arrayBuffer()
    }))
  } finally {
    image.close()
  }
}
