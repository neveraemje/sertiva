import type { CertificateEditorState } from "@/components/certificate/types"

export type DownloadFormat = "pdf" | "png"

export function canvasFontFamily(value: string) {
  return value.startsWith("Timeless Sans Grotesk")
    ? '"Timeless Sans Grotesk", sans-serif'
    : value
}

// Draws the recipient's name onto the design and returns a blob URL of the PNG. Used by the public page and the dashboard.
export async function renderCertificate(imageUrl: string, editor: CertificateEditorState, name: string) {
  const image = await loadDesign(imageUrl)
  try {
    return URL.createObjectURL(await drawCertificate(image, editor, name))
  } finally {
    image.close()
  }
}

// Loads the design once, so bulk downloads can draw many names on it. Close it when done.
export async function loadDesign(imageUrl: string) {
  const response = await fetch(imageUrl)
  if (!response.ok) throw new Error("The certificate design could not be loaded.")
  return createImageBitmap(await response.blob())
}

// Draws the name onto the design and returns it as a PNG. Downloads keep every pixel of the design.
export async function drawCertificate(image: ImageBitmap, editor: CertificateEditorState, name: string) {
  const canvas = document.createElement("canvas")
  canvas.width = image.width
  canvas.height = image.height
  const context = canvas.getContext("2d")
  if (!context) throw new Error("Your browser could not create a certificate preview.")

  context.drawImage(image, 0, 0)

  const family = canvasFontFamily(editor.fontFamily)
  await document.fonts.load(`${editor.fontWeight || 400} ${editor.fontSize}px ${family}`)

  const { fontSize, maxWidth } = fitNameText(context, editor, name, canvas.width, canvas.height)

  const position = editor.position ?? { x: 50, y: 57 }
  const centerX = canvas.width * position.x / 100
  const centerY = canvas.height * position.y / 100
  const align = editor.textAlign || "center"
  context.fillStyle = editor.textColor || "#171717"
  context.globalAlpha = Math.min(1, Math.max(0, (editor.textOpacity ?? 100) / 100))
  context.textAlign = align
  context.textBaseline = "middle"
  context.font = `${editor.fontWeight || 400} ${fontSize}px ${family}`
  const textX = align === "left" ? centerX - maxWidth / 2
    : align === "right" ? centerX + maxWidth / 2
    : centerX
  context.fillText(name, textX, centerY, maxWidth)

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => result ? resolve(result) : reject(new Error("Could not create the certificate image.")), "image/png")
  })
}

// Font size and text width for the name on a design of the given pixel size. The editor uses this
// too, so what it shows matches the download. Sizes are in px on a 1000px-wide certificate.
export function fitNameText(context: CanvasRenderingContext2D, editor: CertificateEditorState, name: string, width: number, height: number) {
  const family = canvasFontFamily(editor.fontFamily)
  const scale = width / 1000
  let fontSize = (editor.fontSize || 34) * scale
  // The text area is the name box minus its margin.
  const size = editor.size ?? { width: 60 }
  const margin = editor.margin ?? { x: 20, y: 5 }
  const maxWidth = Math.max(1, width * size.width / 100 - 2 * margin.x * scale)
  const lineHeight = editor.lineHeight ?? 1.2
  const maxHeight = size.height ? Math.max(1, height * size.height / 100 - 2 * margin.y * scale) / lineHeight : Infinity
  context.font = `${editor.fontWeight || 400} ${fontSize}px ${family}`
  if (editor.autoFit) {
    while ((context.measureText(name).width > maxWidth || fontSize > maxHeight) && fontSize > width * 0.018) {
      fontSize -= Math.max(1, scale)
      context.font = `${editor.fontWeight || 400} ${fontSize}px ${family}`
    }
  }
  return { fontSize, maxWidth }
}

// Starts a browser download of a blob or object URL.
export function saveFile(url: string, filename: string) {
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.append(link)
  link.click()
  link.remove()
}
