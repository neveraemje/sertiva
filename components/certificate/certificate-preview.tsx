"use client"

import { type PointerEvent, useEffect, useRef, useState } from "react"
import { GripIcon, MinusIcon, PlusIcon } from "lucide-react"

import { defaultFieldMargin, defaultFieldSize, type CertificateEditorState, type FieldPosition, type FieldSize, type TemplateAsset } from "@/components/certificate/types"
import { useMessages } from "@/components/i18n/locale-provider"
import { cn } from "@/lib/utils"

type CertificatePreviewProps = {
  template: TemplateAsset
  editor: CertificateEditorState
  onPositionChange: (position: FieldPosition) => void
  onBoxChange: (box: { position: FieldPosition; size: FieldSize }) => void
  onNameChange: (name: string) => void
  previewMode?: boolean
  className?: string
}

type DragSession = {
  pointerId: number
  startX: number
  startY: number
  startPosition: FieldPosition
  width: number
  height: number
  snappedX: boolean
  snappedY: boolean
}

type ResizeEdge = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw"

type ResizeSession = {
  pointerId: number
  edge: ResizeEdge
  startX: number
  startY: number
  // Box edges in percent of the certificate when the resize started.
  left: number
  right: number
  top: number
  bottom: number
  width: number
  height: number
}

type FieldBox = { position: FieldPosition; size: FieldSize }

const MIN_WIDTH = 15
const MIN_HEIGHT = 4

const resizeHandles: { edge: ResizeEdge; className: string }[] = [
  { edge: "nw", className: "-top-1 -left-1 size-2 cursor-nwse-resize" },
  { edge: "ne", className: "-top-1 -right-1 size-2 cursor-nesw-resize" },
  { edge: "sw", className: "-bottom-1 -left-1 size-2 cursor-nesw-resize" },
  { edge: "se", className: "-right-1 -bottom-1 size-2 cursor-nwse-resize" },
  { edge: "n", className: "-top-1 left-1/2 h-2 w-3 -translate-x-1/2 cursor-ns-resize" },
  { edge: "s", className: "-bottom-1 left-1/2 h-2 w-3 -translate-x-1/2 cursor-ns-resize" },
  { edge: "w", className: "top-1/2 -left-1 h-3 w-2 -translate-y-1/2 cursor-ew-resize" },
  { edge: "e", className: "top-1/2 -right-1 h-3 w-2 -translate-y-1/2 cursor-ew-resize" },
]

function roundPercent(value: number) {
  return Math.round(value * 100) / 100
}

// Moves only the dragged edges, so the opposite edge stays where it was.
function resizedBox(event: PointerEvent<HTMLElement>, session: ResizeSession, explicitHeight: boolean): FieldBox {
  const dx = (event.clientX - session.startX) / session.width * 100
  const dy = (event.clientY - session.startY) / session.height * 100
  let { left, right, top, bottom } = session
  if (session.edge.includes("w")) left = clamp(left + dx, 0, right - MIN_WIDTH)
  if (session.edge.includes("e")) right = clamp(right + dx, left + MIN_WIDTH, 100)
  if (session.edge.includes("n")) top = clamp(top + dy, 0, bottom - MIN_HEIGHT)
  if (session.edge.includes("s")) bottom = clamp(bottom + dy, top + MIN_HEIGHT, 100)
  const changesHeight = session.edge.includes("n") || session.edge.includes("s")

  return {
    position: { x: roundPercent((left + right) / 2), y: roundPercent((top + bottom) / 2) },
    size: {
      width: roundPercent(right - left),
      ...(changesHeight || explicitHeight ? { height: roundPercent(bottom - top) } : {}),
    },
  }
}

const MIN_ZOOM = 0.25
const MAX_ZOOM = 4
const ZOOM_STEPS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4]
const MAX_FIT_WIDTH = 1024
// Screen height taken by the top bar, canvas padding and zoom bar, so a fitted certificate needs no scrolling.
const FIT_CHROME_REM = 13.25

function nextZoom(zoom: number, direction: 1 | -1) {
  const steps = direction === 1 ? ZOOM_STEPS : [...ZOOM_STEPS].reverse()
  return steps.find((step) => direction === 1 ? step > zoom + 0.001 : step < zoom - 0.001) ?? zoom
}

const SNAP_IN_PX = 12
const SNAP_OUT_PX = 20

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function snapToCenter(value: number, size: number, snapped: boolean) {
  const distance = Math.abs(value - 50) * size / 100
  const shouldSnap = distance <= (snapped ? SNAP_OUT_PX : SNAP_IN_PX)
  return { value: shouldSnap ? 50 : value, snapped: shouldSnap }
}

function dragPositionFor(event: PointerEvent<HTMLButtonElement>, session: DragSession): FieldPosition {
  const rawX = clamp(session.startPosition.x + ((event.clientX - session.startX) / session.width) * 100, 10, 90)
  const rawY = clamp(session.startPosition.y + ((event.clientY - session.startY) / session.height) * 100, 14, 86)
  const x = snapToCenter(rawX, session.width, session.snappedX)
  const y = snapToCenter(rawY, session.height, session.snappedY)
  session.snappedX = x.snapped
  session.snappedY = y.snapped
  return {
    x: Math.round(x.value * 100) / 100,
    y: Math.round(y.value * 100) / 100,
  }
}

const messages = {
  en: {
    dragField: "Drag recipient name field",
    nameField: "Name field",
    namePlaceholder: "Recipient name",
    editName: "Edit recipient name",
    tip: "Tip:",
    tipText: "Edit the name on the design, drag its label to move it, and drag its edges or corners to resize it.",
    resizeField: "Resize name field",
    autoHeight: "auto",
    zoomIn: "Zoom in",
    zoomOut: "Zoom out",
    fit: "Fit",
    fitToScreen: "Fit to screen",
    zoomHint: "Ctrl or ⌘ + scroll to zoom",
  },
  id: {
    dragField: "Seret kolom nama penerima",
    nameField: "Kolom nama",
    namePlaceholder: "Nama penerima",
    editName: "Edit nama penerima",
    tip: "Tips:",
    tipText: "Edit nama pada desain, seret labelnya untuk memindahkannya, dan seret tepi atau sudutnya untuk mengubah ukurannya.",
    resizeField: "Ubah ukuran kolom nama",
    autoHeight: "otomatis",
    zoomIn: "Perbesar",
    zoomOut: "Perkecil",
    fit: "Pas",
    fitToScreen: "Paskan ke layar",
    zoomHint: "Ctrl atau ⌘ + gulir untuk zoom",
  },
}

export function CertificatePreview({ template, editor, onPositionChange, onBoxChange, onNameChange, previewMode = false, className }: CertificatePreviewProps) {
  const t = useMessages(messages)
  const preview = useRef<HTMLDivElement>(null)
  const canvasArea = useRef<HTMLDivElement>(null)
  const [fitWidth, setFitWidth] = useState<number | null>(null)
  const [zoom, setZoom] = useState(1)
  const dragSession = useRef<DragSession | null>(null)
  const pendingPosition = useRef<FieldPosition | null>(null)
  const animationFrame = useRef<number | null>(null)
  const [dragging, setDragging] = useState(false)
  const [dragPosition, setDragPosition] = useState<FieldPosition | null>(null)
  const field = useRef<HTMLDivElement>(null)
  const resizeSession = useRef<ResizeSession | null>(null)
  const [resizeBox, setResizeBox] = useState<FieldBox | null>(null)
  const position = resizeBox?.position ?? dragPosition ?? editor.position
  const size = resizeBox?.size ?? editor.size ?? defaultFieldSize
  const fixedHeight = size.height !== undefined
  const margin = editor.margin ?? defaultFieldMargin
  const aspectRatio = template.width && template.height ? template.width / template.height : 1.414
  const designPreviewUrl = template.previewUrl ?? (template.kind === "image" ? template.url : null)
  // cqw/cqh are relative to the name box; with a fixed height the text also shrinks to fit it.
  const widthFit = `${145 / Math.max(editor.recipientName.length, 1)}cqw`
  const fittedFontSize = editor.autoFit
    ? fixedHeight
      ? `min(${widthFit}, 80cqh, ${editor.fontSize}px)`
      : `clamp(18px, ${widthFit}, ${editor.fontSize}px)`
    : `${editor.fontSize}px`

  useEffect(() => () => {
    if (animationFrame.current !== null) cancelAnimationFrame(animationFrame.current)
  }, [])

  // The fit width is the 100% zoom size: as large as the canvas area allows, measured in px.
  useEffect(() => {
    const area = canvasArea.current
    if (!area) return
    const measure = () => {
      const style = getComputedStyle(area)
      const available = area.clientWidth - Number.parseFloat(style.paddingLeft) - Number.parseFloat(style.paddingRight)
      const rem = Number.parseFloat(getComputedStyle(document.documentElement).fontSize)
      const byHeight = (window.innerHeight - FIT_CHROME_REM * rem) * aspectRatio
      setFitWidth(Math.max(200, Math.min(available, byHeight, MAX_FIT_WIDTH)))
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(area)
    window.addEventListener("resize", measure)
    return () => {
      observer.disconnect()
      window.removeEventListener("resize", measure)
    }
  }, [aspectRatio])

  // Ctrl/⌘ + wheel (and trackpad pinch, which browsers send as ctrl + wheel) zooms the canvas.
  useEffect(() => {
    const area = canvasArea.current
    if (!area) return
    const onWheel = (event: WheelEvent) => {
      if (!event.ctrlKey && !event.metaKey) return
      event.preventDefault()
      setZoom((current) => clamp(Math.round(current * Math.exp(-event.deltaY * 0.01) * 100) / 100, MIN_ZOOM, MAX_ZOOM))
    }
    area.addEventListener("wheel", onWheel, { passive: false })
    return () => area.removeEventListener("wheel", onWheel)
  }, [])

  function startDragging(event: PointerEvent<HTMLButtonElement>) {
    if (!preview.current) return
    event.preventDefault()
    const bounds = preview.current.getBoundingClientRect()
    dragSession.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startPosition: position,
      width: bounds.width,
      height: bounds.height,
      snappedX: position.x === 50,
      snappedY: position.y === 50,
    }
    setDragPosition(position)
    setDragging(true)
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function moveName(event: PointerEvent<HTMLButtonElement>) {
    const session = dragSession.current
    if (!session || session.pointerId !== event.pointerId) return
    pendingPosition.current = dragPositionFor(event, session)
    if (animationFrame.current !== null) return
    animationFrame.current = requestAnimationFrame(() => {
      animationFrame.current = null
      if (dragSession.current && pendingPosition.current) setDragPosition(pendingPosition.current)
    })
  }

  function stopDragging(event: PointerEvent<HTMLButtonElement>) {
    const session = dragSession.current
    if (!session || session.pointerId !== event.pointerId) return
    const next = dragPositionFor(event, session)
    dragSession.current = null
    pendingPosition.current = null
    if (animationFrame.current !== null) cancelAnimationFrame(animationFrame.current)
    animationFrame.current = null
    setDragging(false)
    setDragPosition(null)
    if (next.x !== session.startPosition.x || next.y !== session.startPosition.y) onPositionChange(next)
  }

  function startResizing(event: PointerEvent<HTMLSpanElement>, edge: ResizeEdge) {
    if (!preview.current || !field.current) return
    event.preventDefault()
    event.stopPropagation()
    const bounds = preview.current.getBoundingClientRect()
    const box = field.current.getBoundingClientRect()
    const width = box.width / bounds.width * 100
    const height = box.height / bounds.height * 100
    resizeSession.current = {
      pointerId: event.pointerId,
      edge,
      startX: event.clientX,
      startY: event.clientY,
      left: position.x - width / 2,
      right: position.x + width / 2,
      top: position.y - height / 2,
      bottom: position.y + height / 2,
      width: bounds.width,
      height: bounds.height,
    }
    setResizeBox({ position, size })
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function resize(event: PointerEvent<HTMLSpanElement>) {
    const session = resizeSession.current
    if (!session || session.pointerId !== event.pointerId) return
    setResizeBox(resizedBox(event, session, fixedHeight))
  }

  function stopResizing(event: PointerEvent<HTMLSpanElement>) {
    const session = resizeSession.current
    if (!session || session.pointerId !== event.pointerId) return
    const next = resizedBox(event, session, fixedHeight)
    resizeSession.current = null
    setResizeBox(null)
    onBoxChange(next)
  }

  function cancelResizing(event: PointerEvent<HTMLSpanElement>) {
    if (resizeSession.current?.pointerId !== event.pointerId) return
    resizeSession.current = null
    setResizeBox(null)
  }

  function cancelDragging(event: PointerEvent<HTMLButtonElement>) {
    if (dragSession.current?.pointerId !== event.pointerId) return
    dragSession.current = null
    pendingPosition.current = null
    if (animationFrame.current !== null) cancelAnimationFrame(animationFrame.current)
    animationFrame.current = null
    setDragging(false)
    setDragPosition(null)
  }

  return (
    <section className={cn("flex min-h-[560px] flex-col", className)}>
      <div
        ref={canvasArea}
        className="flex flex-1 py-4 max-xl:overflow-x-auto md:px-8 md:py-6 xl:min-h-0 xl:overflow-auto"
        // "safe" keeps the left and top of a zoomed-in certificate reachable by scrolling.
        style={{ justifyContent: "safe center", alignItems: "safe center" }}
      >
        {/* The frame takes the zoomed size in the layout so the area can scroll; CSS zoom scales the text and box with it. */}
        <div className="flex-none" style={fitWidth ? { width: fitWidth * zoom, height: fitWidth * zoom / aspectRatio } : { width: "100%" }}>
        <div
          ref={preview}
          className="relative overflow-hidden bg-white [container-type:inline-size] shadow-2xl shadow-black/15 ring-1 ring-black/10 select-none"
          style={{
            aspectRatio,
            width: fitWidth ?? `min(100%, calc((100svh - ${FIT_CHROME_REM}rem) * ${aspectRatio}))`,
            zoom,
            ...(designPreviewUrl ? { backgroundImage: `url(${designPreviewUrl})`, backgroundPosition: "center", backgroundRepeat: "no-repeat", backgroundSize: "100% 100%" } : {}),
          }}
        >
          {template.kind === "sample" && <SampleCertificate />}

          {!previewMode && dragging && (
            <>
              <span
                aria-hidden="true"
                className={cn("pointer-events-none absolute inset-y-0 z-[5] border-l shadow-[0_0_0_1px_rgba(255,255,255,0.45)]", position.x === 50 ? "border-l-2 border-sky-500" : "border-dashed border-sky-500/90")}
                style={{ left: `${position.x}%` }}
              />
              <span
                aria-hidden="true"
                className={cn("pointer-events-none absolute inset-x-0 z-[5] border-t shadow-[0_0_0_1px_rgba(255,255,255,0.45)]", position.y === 50 ? "border-t-2 border-sky-500" : "border-dashed border-sky-500/90")}
                style={{ top: `${position.y}%` }}
              />
            </>
          )}

          <div
            ref={field}
            className={cn(
              "absolute z-10 flex items-center leading-none",
              !previewMode && "border border-black bg-white/70 shadow-sm backdrop-blur-[1px]"
            )}
            style={{
              left: `${position.x}%`,
              top: `${position.y}%`,
              width: `${size.width}%`,
              height: fixedHeight ? `${size.height}%` : undefined,
              transform: "translate(-50%, -50%)",
              containerType: fixedHeight ? "size" : "inline-size",
              // cqw here is the certificate width, so the margin scales like it does in the download.
              padding: `${margin.y / 10}cqw ${margin.x / 10}cqw`,
            }}
          >
            {previewMode ? (
              <p
                className="w-full overflow-hidden whitespace-nowrap"
                style={{
                  color: editor.textColor,
                  fontFamily: editor.fontFamily,
                  fontSize: fittedFontSize,
                  fontWeight: editor.fontWeight ?? 400,
                  opacity: (editor.textOpacity ?? 100) / 100,
                  textAlign: editor.textAlign,
                }}
              >
                {editor.recipientName}
              </p>
            ) : (
              <>
                <button
                  type="button"
                  className="absolute -top-5 left-[-1px] flex cursor-grab touch-none items-center gap-1 rounded-t bg-black px-1.5 py-1 font-sans text-[8px] font-medium text-white active:cursor-grabbing"
                  onPointerDown={startDragging}
                  onPointerMove={moveName}
                  onPointerUp={stopDragging}
                  onPointerCancel={cancelDragging}
                  onLostPointerCapture={cancelDragging}
                  aria-label={t.dragField}
                >
                  <GripIcon className="size-2.5" /> {t.nameField}
                </button>
                <input
                  className="w-full bg-transparent text-inherit outline-none"
                  value={editor.recipientName}
                  placeholder={t.namePlaceholder}
                  onChange={(event) => onNameChange(event.target.value)}
                  aria-label={t.editName}
                  style={{
                    color: editor.textColor,
                    fontFamily: editor.fontFamily,
                    fontSize: fittedFontSize,
                    fontWeight: editor.fontWeight ?? 400,
                    opacity: (editor.textOpacity ?? 100) / 100,
                    textAlign: editor.textAlign,
                  }}
                />
                {resizeHandles.map((handle) => (
                  <span
                    key={handle.edge}
                    aria-hidden="true"
                    title={t.resizeField}
                    className={cn("absolute z-[1] touch-none border border-black bg-white", handle.className)}
                    onPointerDown={(event) => startResizing(event, handle.edge)}
                    onPointerMove={resize}
                    onPointerUp={stopResizing}
                    onPointerCancel={cancelResizing}
                    onLostPointerCapture={cancelResizing}
                  />
                ))}
              </>
            )}
          </div>
        </div>
        </div>
      </div>

      <footer className="sticky bottom-0 z-20 -mx-4 flex flex-wrap items-center justify-between gap-3 bg-[#f6f6f6]/90 px-4 py-3 text-xs text-muted-foreground backdrop-blur-sm lg:-mx-6 lg:px-6">
        {!previewMode ? <span className="min-w-0 flex-1"><strong className="text-foreground">{t.tip}</strong> {t.tipText}</span> : <span className="hidden sm:block">{t.zoomHint}</span>}
        <div className="ml-auto flex shrink-0 items-center gap-2">
          {!previewMode && <span className="rounded-full border bg-background/90 px-3 py-1 shadow-sm backdrop-blur">X {position.x}% · Y {position.y}% · W {size.width}% · H {fixedHeight ? `${size.height}%` : t.autoHeight}</span>}
          <div className="flex items-center rounded-full border bg-background/90 p-0.5 text-foreground shadow-sm backdrop-blur" title={t.zoomHint}>
            <button type="button" className="flex size-7 items-center justify-center rounded-full hover:bg-muted disabled:opacity-40" aria-label={t.zoomOut} disabled={zoom <= MIN_ZOOM} onClick={() => setZoom((current) => nextZoom(current, -1))}><MinusIcon className="size-3.5" /></button>
            <button type="button" className="min-w-12 rounded-full px-1.5 py-1 text-center font-medium tabular-nums hover:bg-muted" aria-label={t.fitToScreen} title={t.fitToScreen} onClick={() => setZoom(1)}>{Math.round(zoom * 100)}%</button>
            <button type="button" className="flex size-7 items-center justify-center rounded-full hover:bg-muted disabled:opacity-40" aria-label={t.zoomIn} disabled={zoom >= MAX_ZOOM} onClick={() => setZoom((current) => nextZoom(current, 1))}><PlusIcon className="size-3.5" /></button>
            <span className="mx-0.5 h-4 w-px bg-border" />
            <button type="button" className="rounded-full px-2.5 py-1 font-medium hover:bg-muted" onClick={() => setZoom(1)}>{t.fit}</button>
          </div>
        </div>
      </footer>
    </section>
  )
}

function SampleCertificate() {
  return (
    <div className="absolute inset-0 bg-[#fbfaf7] p-[4%] text-neutral-950">
      <div className="relative flex size-full flex-col items-center border border-neutral-900 px-[8%] py-[6%] text-center">
        <div className="absolute inset-2 border border-neutral-300" />
        <div className="z-[1] flex size-9 items-center justify-center rounded-full border border-neutral-900 text-[9px] font-black tracking-tight">S</div>
        <p className="z-[1] mt-[4%] text-[clamp(6px,.65vw,10px)] font-medium tracking-[0.34em] uppercase">Certificate of achievement</p>
        <h2 className="z-[1] mt-[2%] font-serif text-[clamp(18px,2.2vw,34px)] font-normal tracking-tight whitespace-nowrap">Excellence in Leadership</h2>
        <p className="z-[1] mt-[3%] text-[clamp(5px,.55vw,8px)] tracking-[0.12em] text-neutral-500 uppercase">This certificate is proudly presented to</p>
        <div className="z-[1] mt-[14%] h-px w-[58%] bg-neutral-300" />
        <p className="z-[1] mt-[4%] max-w-[60%] text-[clamp(5px,.58vw,8px)] leading-relaxed text-neutral-500">In recognition of exceptional dedication, meaningful contribution, and positive impact.</p>
        <div className="z-[1] mt-auto grid w-[68%] grid-cols-2 gap-[18%] text-[clamp(5px,.52vw,8px)]">
          <span className="border-t border-neutral-400 pt-2"><strong className="block font-medium">Marcus Lee</strong><small className="text-neutral-500">Program Director</small></span>
          <span className="border-t border-neutral-400 pt-2"><strong className="block font-medium">October 10, 2026</strong><small className="text-neutral-500">Date awarded</small></span>
        </div>
      </div>
    </div>
  )
}
