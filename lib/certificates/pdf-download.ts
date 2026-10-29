export async function createPdfDownload(imageUrl: string, title: string) {
  const { PDFDocument } = await import("pdf-lib")
  const imageResponse = await fetch(imageUrl)
  if (!imageResponse.ok) throw new Error("Could not prepare the PDF download.")

  const pdf = await PDFDocument.create()
  const image = await pdf.embedPng(await imageResponse.arrayBuffer())
  const scale = 842 / Math.max(image.width, image.height)
  const width = image.width * scale
  const height = image.height * scale
  const page = pdf.addPage([width, height])
  page.drawImage(image, { x: 0, y: 0, width, height })
  pdf.setTitle(title)

  const bytes = await pdf.save()
  return new Blob([Uint8Array.from(bytes)], { type: "application/pdf" })
}
