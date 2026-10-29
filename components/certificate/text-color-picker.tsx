"use client"

import { useRef, type PointerEvent } from "react"
import { Popover as PopoverPrimitive } from "@base-ui/react/popover"
import { PipetteIcon } from "lucide-react"

type Hsv = {
  h: number
  s: number
  v: number
}

type EyeDropperConstructor = new () => {
  open: () => Promise<{ sRGBHex: string }>
}

type TextColorPickerProps = {
  color: string
  opacity: number
  onChange: (color: string, opacity: number) => void
}

export function TextColorPicker({ color, opacity, onChange }: TextColorPickerProps) {
  const areaRef = useRef<HTMLDivElement>(null)
  const nativeColorInputRef = useRef<HTMLInputElement>(null)
  const safeOpacity = opacity ?? 100
  const hsv = hexToHsv(color)

  function commit(next: Hsv, nextOpacity = safeOpacity) {
    const nextHex = hsvToHex(next)
    onChange(nextHex, nextOpacity)
  }

  function pickFromArea(event: PointerEvent<HTMLDivElement>) {
    if (!areaRef.current) return
    const bounds = areaRef.current.getBoundingClientRect()
    const s = clamp(((event.clientX - bounds.left) / bounds.width) * 100)
    const v = clamp(100 - ((event.clientY - bounds.top) / bounds.height) * 100)
    commit({ ...hsv, s, v })
  }

  function commitHex(value: string) {
    const cleaned = value.replace(/[^0-9a-f]/gi, "").slice(0, 6).toUpperCase()
    if (cleaned.length === 6) {
      const nextColor = `#${cleaned}`
      onChange(nextColor, safeOpacity)
    }
  }

  function openNativeColorPicker() {
    const input = nativeColorInputRef.current
    if (!input) return
    try {
      input.showPicker()
    } catch {
      input.click()
    }
  }

  function pickColorFromScreen() {
    const EyeDropper = (window as Window & { EyeDropper?: EyeDropperConstructor }).EyeDropper
    if (!EyeDropper) {
      openNativeColorPicker()
      return
    }

    void new EyeDropper().open().then(({ sRGBHex }) => {
      onChange(sRGBHex.toUpperCase(), safeOpacity)
    }).catch((error: unknown) => {
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        openNativeColorPicker()
      }
    })
  }

  const hueColor = hsvToHex({ h: hsv.h, s: 100, v: 100 })

  return (
    <PopoverPrimitive.Root>
      <div className="flex h-10 w-full items-center overflow-hidden rounded-lg border border-border/70 bg-muted/60 text-sm transition-colors focus-within:ring-2 focus-within:ring-ring/40 hover:bg-muted/80">
        <PopoverPrimitive.Trigger
          className="ml-2 flex size-6 shrink-0 items-center justify-center rounded border shadow-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
          style={{ backgroundColor: color, opacity: safeOpacity / 100 }}
          aria-label="Open text color picker"
        />
        <input
          key={color}
          defaultValue={cleanHex(color)}
          onChange={(event) => commitHex(event.target.value)}
          onFocus={(event) => event.currentTarget.select()}
          className="h-full min-w-0 flex-1 bg-transparent px-3 font-mono text-sm uppercase outline-none"
          aria-label="Text color hex"
        />
        <span className="flex h-full w-[78px] shrink-0 items-center gap-1 border-l px-3 tabular-nums">
          <input
            type="number"
            min={0}
            max={100}
            value={safeOpacity}
            onChange={(event) => onChange(color, clamp(Number(event.target.value)))}
            onFocus={(event) => event.currentTarget.select()}
            className="min-w-0 flex-1 appearance-none bg-transparent text-right outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            aria-label="Text color opacity"
          />
          <span className="text-muted-foreground">%</span>
        </span>
      </div>

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Positioner className="z-50" side="left" align="start" sideOffset={12}>
          <PopoverPrimitive.Popup className="w-[300px] origin-(--transform-origin) rounded-xl border bg-popover p-3 text-popover-foreground shadow-xl outline-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95">
            <div
              ref={areaRef}
              className="relative aspect-square w-full cursor-crosshair overflow-hidden rounded-lg border touch-none"
              style={{
                backgroundColor: hueColor,
                backgroundImage: "linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, transparent)",
              }}
              onPointerDown={(event) => {
                event.currentTarget.setPointerCapture(event.pointerId)
                pickFromArea(event)
              }}
              onPointerMove={(event) => {
                if (event.currentTarget.hasPointerCapture(event.pointerId)) pickFromArea(event)
              }}
              aria-label="Color saturation and brightness"
            >
              <span
                className="pointer-events-none absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white shadow-md ring-1 ring-black/30"
                style={{ left: `${hsv.s}%`, top: `${100 - hsv.v}%`, backgroundColor: color }}
              />
            </div>

            <div className="mt-4 grid grid-cols-[20px_1fr] items-center gap-x-3 gap-y-3">
              <div className="row-span-2">
                <button
                  type="button"
                  className="flex size-5 items-center justify-center rounded-sm text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
                  aria-label="Pick a color from the screen"
                  title="Pick a color from the screen"
                  onClick={pickColorFromScreen}
                >
                  <PipetteIcon className="size-4" />
                </button>
                <input
                  ref={nativeColorInputRef}
                  type="color"
                  value={color}
                  onChange={(event) => onChange(event.target.value.toUpperCase(), safeOpacity)}
                  tabIndex={-1}
                  aria-hidden="true"
                  className="sr-only"
                />
              </div>
              <input
                type="range"
                min={0}
                max={360}
                value={Math.round(hsv.h)}
                onChange={(event) => commit({ ...hsv, h: Number(event.target.value) })}
                className="h-3 w-full cursor-pointer appearance-none rounded-full border border-black/10 bg-[linear-gradient(to_right,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)] accent-white [&::-moz-range-thumb]:size-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-[3px] [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-transparent [&::-webkit-slider-thumb]:size-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-[3px] [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-transparent [&::-webkit-slider-thumb]:shadow-md"
                aria-label="Hue"
              />
              <input
                type="range"
                min={0}
                max={100}
                value={safeOpacity}
                onChange={(event) => onChange(color, Number(event.target.value))}
                className="h-3 w-full cursor-pointer appearance-none rounded-full border border-black/10 accent-white [&::-moz-range-thumb]:size-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-[3px] [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-transparent [&::-webkit-slider-thumb]:size-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-[3px] [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-transparent [&::-webkit-slider-thumb]:shadow-md"
                style={{
                  backgroundColor: "#fff",
                  backgroundImage: `linear-gradient(to right, transparent, ${color}), conic-gradient(#d4d4d4 25%, #fff 0 50%, #d4d4d4 0 75%, #fff 0)`,
                  backgroundSize: "100% 100%, 10px 10px",
                }}
                aria-label="Opacity"
              />
            </div>

            <div className="mt-4 grid grid-cols-[64px_1fr_82px] overflow-hidden rounded-lg border border-border/70 bg-muted/60 text-sm">
              <div className="flex items-center border-r px-3 text-muted-foreground">Hex</div>
              <div className="flex items-center gap-1 border-r px-3">
                <input
                  key={color}
                  defaultValue={cleanHex(color)}
                  onChange={(event) => commitHex(event.target.value)}
                  className="h-10 min-w-0 flex-1 bg-transparent font-mono text-xs uppercase outline-none"
                  aria-label="Hex color"
                />
              </div>
              <div className="flex items-center gap-1 px-3 tabular-nums">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={safeOpacity}
                  onChange={(event) => onChange(color, clamp(Number(event.target.value)))}
                  className="h-10 min-w-0 flex-1 appearance-none bg-transparent text-right outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  aria-label="Color opacity"
                />
                <span className="text-muted-foreground">%</span>
              </div>
            </div>
          </PopoverPrimitive.Popup>
        </PopoverPrimitive.Positioner>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}

function cleanHex(value: string) {
  return value.replace("#", "").toUpperCase()
}

function clamp(value: number) {
  return Math.min(100, Math.max(0, value))
}

function hexToHsv(hex: string): Hsv {
  const normalized = cleanHex(hex).padEnd(6, "0")
  const r = parseInt(normalized.slice(0, 2), 16) / 255
  const g = parseInt(normalized.slice(2, 4), 16) / 255
  const b = parseInt(normalized.slice(4, 6), 16) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const delta = max - min
  let h = 0

  if (delta) {
    if (max === r) h = 60 * (((g - b) / delta) % 6)
    else if (max === g) h = 60 * ((b - r) / delta + 2)
    else h = 60 * ((r - g) / delta + 4)
  }

  if (h < 0) h += 360
  return { h, s: max === 0 ? 0 : (delta / max) * 100, v: max * 100 }
}

function hsvToHex({ h, s, v }: Hsv) {
  const saturation = s / 100
  const value = v / 100
  const chroma = value * saturation
  const x = chroma * (1 - Math.abs(((h / 60) % 2) - 1))
  const match = value - chroma
  let [r, g, b] = [0, 0, 0]

  if (h < 60) [r, g, b] = [chroma, x, 0]
  else if (h < 120) [r, g, b] = [x, chroma, 0]
  else if (h < 180) [r, g, b] = [0, chroma, x]
  else if (h < 240) [r, g, b] = [0, x, chroma]
  else if (h < 300) [r, g, b] = [x, 0, chroma]
  else [r, g, b] = [chroma, 0, x]

  return `#${[r, g, b].map((channel) => Math.round((channel + match) * 255).toString(16).padStart(2, "0")).join("").toUpperCase()}`
}
