"use client"

import { type PointerEvent, useEffect, useRef, useState } from "react"
import { GripIcon } from "lucide-react"

import type { CertificateEditorState, FieldPosition, TemplateAsset } from "@/components/certificate/types"
import { cn } from "@/lib/utils"

type CertificatePreviewProps = {
  template: TemplateAsset
  editor: CertificateEditorState
  onPositionChange: (position: FieldPosition) => void
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

export function CertificatePreview({ template, editor, onPositionChange, onNameChange, previewMode = false, className }: CertificatePreviewProps) {
  const preview = useRef<HTMLDivElement>(null)
  const dragSession = useRef<DragSession | null>(null)
  const pendingPosition = useRef<FieldPosition | null>(null)
  const animationFrame = useRef<number | null>(null)
  const [dragging, setDragging] = useState(false)
  const [dragPosition, setDragPosition] = useState<FieldPosition | null>(null)
  const position = dragPosition ?? editor.position
  const aspectRatio = template.width && template.height ? template.width / template.height : 1.414
  const designPreviewUrl = template.previewUrl ?? (template.kind === "image" ? template.url : null)
  const fittedFontSize = editor.autoFit
    ? `clamp(18px, ${145 / Math.max(editor.recipientName.length, 1)}cqw, ${editor.fontSize}px)`
    : `${editor.fontSize}px`

  useEffect(() => () => {
    if (animationFrame.current !== null) cancelAnimationFrame(animationFrame.current)
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
      <div className="flex flex-1 items-center justify-center py-4 md:px-8 md:py-6">
        <div
          ref={preview}
          className="relative max-w-5xl overflow-hidden bg-white shadow-2xl shadow-black/15 ring-1 ring-black/10 select-none"
          style={{
            aspectRatio,
            width: `min(100%, calc((100vh - ${previewMode ? 7 : 10}rem) * ${aspectRatio}))`,
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
            className={cn(
              "absolute z-10 max-w-[78%] leading-none",
              !previewMode && "border border-black bg-white/70 shadow-sm backdrop-blur-[1px]"
            )}
            style={{
              left: `${position.x}%`,
              top: `${position.y}%`,
              width: "60%",
              transform: "translate(-50%, -50%)",
              containerType: "inline-size",
            }}
          >
            {previewMode ? (
              <p
                className="w-full overflow-hidden px-3 py-1 whitespace-nowrap"
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
                  aria-label="Drag recipient name field"
                >
                  <GripIcon className="size-2.5" /> Name field
                </button>
                <input
                  className="w-full bg-transparent px-3 py-1 text-inherit outline-none"
                  value={editor.recipientName}
                  placeholder="Recipient name"
                  onChange={(event) => onNameChange(event.target.value)}
                  aria-label="Edit recipient name"
                  style={{
                    color: editor.textColor,
                    fontFamily: editor.fontFamily,
                    fontSize: fittedFontSize,
                    fontWeight: editor.fontWeight ?? 400,
                    opacity: (editor.textOpacity ?? 100) / 100,
                    textAlign: editor.textAlign,
                  }}
                />
                <span className="absolute -top-1 -left-1 size-2 border border-black bg-white" />
                <span className="absolute -top-1 -right-1 size-2 border border-black bg-white" />
                <span className="absolute -bottom-1 -left-1 size-2 border border-black bg-white" />
                <span className="absolute -right-1 -bottom-1 size-2 border border-black bg-white" />
              </>
            )}
          </div>
        </div>
      </div>

      {!previewMode && (
        <footer className="flex items-center justify-between gap-3 py-3 text-xs text-muted-foreground">
          <span><strong className="text-foreground">Tip:</strong> Edit the name on the design, then drag its label to move it.</span>
          <span className="rounded-full border bg-background/90 px-3 py-1 shadow-sm backdrop-blur">X {position.x}% · Y {position.y}%</span>
        </footer>
      )}
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
