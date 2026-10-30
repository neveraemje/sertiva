"use client"

import { RotateCcwIcon } from "lucide-react"

import { CanvasAlignmentControls, TextAlignmentControl } from "@/components/certificate/alignment-controls"
import { SettingRow } from "@/components/certificate/setting-row"
import { TextColorPicker } from "@/components/certificate/text-color-picker"
import { defaultFieldMargin, defaultFieldSize, type CertificateEditorState } from "@/components/certificate/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { useMessages } from "@/components/i18n/locale-provider"
import { cn } from "@/lib/utils"

type FieldSettingsProps = {
  editor: CertificateEditorState
  onChange: (patch: Partial<CertificateEditorState>) => void
  className?: string
}

const standardFonts = [
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Timeless Sans", value: "Timeless Sans Grotesk, sans-serif" },
  { label: "Arial", value: "Arial, sans-serif" },
  { label: "Monospace", value: "monospace" },
]

const googleFonts = [
  { label: "Inter", value: '"Inter Variable", sans-serif' },
  { label: "Roboto", value: '"Roboto Variable", sans-serif' },
  { label: "Montserrat", value: '"Montserrat Variable", sans-serif' },
  { label: "Open Sans", value: '"Open Sans Variable", sans-serif' },
  { label: "Poppins", value: "Poppins, sans-serif" },
  { label: "Playfair Display", value: '"Playfair Display Variable", serif' },
  { label: "Merriweather", value: '"Merriweather Variable", serif' },
  { label: "Dancing Script", value: '"Dancing Script Variable", cursive' },
  { label: "Amiri", value: "Amiri, serif" },
]

const thmanyahFonts = [
  { label: "Thmanyah Sans", value: '"Thmanyah Sans", sans-serif' },
  { label: "Thmanyah Serif Display", value: '"Thmanyah Serif Display", serif' },
  { label: "Thmanyah Serif Text", value: '"Thmanyah Serif Text", serif' },
]

const messages = {
  en: {
    typography: "Typography",
    font: "Font",
    standard: "Standard",
    weight: "Weight",
    weights: { 400: "Regular", 500: "Medium", 600: "Semibold", 700: "Bold" } as Record<number, string>,
    size: "Size",
    fontSize: "Font size",
    color: "Color",
    align: "Align",
    position: "Position",
    reset: "Reset",
    xPosition: "X position",
    yPosition: "Y position",
    width: "Width (%)",
    height: "Height (%)",
    autoHeight: "Auto",
    marginX: "X margin (px)",
    marginY: "Y margin (px)",
    autoFit: "Auto-fit",
    autoFitHint: "Reduce long names to fit.",
    autoFitText: "Auto-fit text",
  },
  id: {
    typography: "Tipografi",
    font: "Font",
    standard: "Standar",
    weight: "Ketebalan",
    weights: { 400: "Reguler", 500: "Sedang", 600: "Semitebal", 700: "Tebal" } as Record<number, string>,
    size: "Ukuran",
    fontSize: "Ukuran font",
    color: "Warna",
    align: "Perataan",
    position: "Posisi",
    reset: "Atur ulang",
    xPosition: "Posisi X",
    yPosition: "Posisi Y",
    width: "Lebar (%)",
    height: "Tinggi (%)",
    autoHeight: "Otomatis",
    marginX: "Margin X (px)",
    marginY: "Margin Y (px)",
    autoFit: "Sesuaikan otomatis",
    autoFitHint: "Perkecil nama panjang agar muat.",
    autoFitText: "Sesuaikan teks otomatis",
  },
}

const fontWeights = [400, 500, 600, 700]

// Typed sizes are only kept within 1-100% so typing "40" isn't forced up after the "4".
function clampPercent(value: string) {
  const number = Number(value)
  return Number.isFinite(number) && value !== "" ? Math.min(100, Math.max(1, number)) : undefined
}

function clampMargin(value: string) {
  const number = Number(value)
  return Number.isFinite(number) && value !== "" ? Math.min(200, Math.max(0, number)) : undefined
}

export function FieldSettings({ editor, onChange, className }: FieldSettingsProps) {
  const t = useMessages(messages)
  const size = editor.size ?? defaultFieldSize
  const margin = editor.margin ?? defaultFieldMargin
  const selectedFont = [...standardFonts, ...thmanyahFonts, ...googleFonts].find((font) => font.value === editor.fontFamily)

  return (
    <Card className={cn("h-fit gap-0 bg-background/95 py-0 backdrop-blur-md", className)}>
      <CardContent className="p-0">
        <section className="space-y-4 px-4 py-5">
          <h3 className="text-sm font-semibold">{t.typography}</h3>

          <SettingRow label={t.font}>
            <Select value={editor.fontFamily} onValueChange={(value) => onChange({ fontFamily: value as string })}>
              <SelectTrigger className="w-full border-border/70 bg-muted/60 shadow-none"><SelectValue>{selectedFont?.label ?? editor.fontFamily}</SelectValue></SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>{t.standard}</SelectLabel>
                  {standardFonts.map((font) => <SelectItem key={font.value} value={font.value} style={{ fontFamily: font.value }}>{font.label}</SelectItem>)}
                </SelectGroup>
                <SelectSeparator />
                <SelectGroup>
                  <SelectLabel>Thmanyah</SelectLabel>
                  {thmanyahFonts.map((font) => <SelectItem key={font.value} value={font.value} style={{ fontFamily: font.value }}>{font.label}</SelectItem>)}
                </SelectGroup>
                <SelectSeparator />
                <SelectGroup>
                  <SelectLabel>Google Fonts</SelectLabel>
                  {googleFonts.map((font) => <SelectItem key={font.value} value={font.value} style={{ fontFamily: font.value }}>{font.label}</SelectItem>)}
                </SelectGroup>
              </SelectContent>
            </Select>
          </SettingRow>

          <SettingRow label={t.weight}>
            <Select value={String(editor.fontWeight ?? 400)} onValueChange={(value) => onChange({ fontWeight: Number(value) })}>
              <SelectTrigger className="w-full border-border/70 bg-muted/60 shadow-none"><SelectValue>{fontWeightLabel(editor.fontWeight ?? 400, t.weights)}</SelectValue></SelectTrigger>
              <SelectContent>
                {fontWeights.map((weight) => <SelectItem key={weight} value={String(weight)}>{t.weights[weight]}</SelectItem>)}
              </SelectContent>
            </Select>
          </SettingRow>

          <SettingRow label={t.size} htmlFor="font-size" className="items-start">
            <div className="space-y-2">
              <div className="relative">
                <Input id="font-size" type="number" min={18} max={72} value={editor.fontSize} onChange={(event) => onChange({ fontSize: Number(event.target.value) })} className="h-9 border-border/70 bg-muted/60 pr-8 shadow-none" />
                <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-muted-foreground">px</span>
              </div>
              <input className="w-full accent-black" type="range" min={18} max={72} value={editor.fontSize} onChange={(event) => onChange({ fontSize: Number(event.target.value) })} aria-label={t.fontSize} />
            </div>
          </SettingRow>

          <SettingRow label={t.color}>
            <TextColorPicker
              color={editor.textColor}
              opacity={editor.textOpacity}
              onChange={(textColor, textOpacity) => onChange({ textColor, textOpacity })}
            />
          </SettingRow>

          <SettingRow label={t.align}>
            <TextAlignmentControl value={editor.textAlign} onChange={(textAlign) => onChange({ textAlign })} />
          </SettingRow>
        </section>

        <Separator />

        <section className="space-y-4 px-4 py-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">{t.position}</h3>
            <Button size="xs" variant="ghost" onClick={() => onChange({ position: { x: 50, y: 57 }, size: undefined, margin: undefined })}><RotateCcwIcon /> {t.reset}</Button>
          </div>

          <SettingRow label={t.align}>
            <CanvasAlignmentControls position={editor.position} onChange={(position) => onChange({ position })} />
          </SettingRow>

          <SettingRow label={t.xPosition} htmlFor="position-x">
            <Input id="position-x" type="number" min={0} max={100} value={editor.position.x} onChange={(event) => onChange({ position: { ...editor.position, x: Number(event.target.value) } })} className="border-border/70 bg-muted/60 shadow-none" />
          </SettingRow>

          <SettingRow label={t.yPosition} htmlFor="position-y">
            <Input id="position-y" type="number" min={0} max={100} value={editor.position.y} onChange={(event) => onChange({ position: { ...editor.position, y: Number(event.target.value) } })} className="border-border/70 bg-muted/60 shadow-none" />
          </SettingRow>

          <SettingRow label={t.width} htmlFor="field-width">
            <Input id="field-width" type="number" min={15} max={100} value={size.width} onChange={(event) => onChange({ size: { ...size, width: clampPercent(event.target.value) ?? size.width } })} className="border-border/70 bg-muted/60 shadow-none" />
          </SettingRow>

          <SettingRow label={t.height} htmlFor="field-height">
            {/* Empty height means the box follows the text height. */}
            <Input id="field-height" type="number" min={4} max={100} placeholder={t.autoHeight} value={size.height ?? ""} onChange={(event) => onChange({ size: { width: size.width, ...(event.target.value === "" ? {} : { height: clampPercent(event.target.value) ?? size.height }) } })} className="border-border/70 bg-muted/60 shadow-none" />
          </SettingRow>

          <SettingRow label={t.marginX} htmlFor="field-margin-x">
            <Input id="field-margin-x" type="number" min={0} max={200} value={margin.x} onChange={(event) => onChange({ margin: { ...margin, x: clampMargin(event.target.value) ?? margin.x } })} className="border-border/70 bg-muted/60 shadow-none" />
          </SettingRow>

          <SettingRow label={t.marginY} htmlFor="field-margin-y">
            <Input id="field-margin-y" type="number" min={0} max={200} value={margin.y} onChange={(event) => onChange({ margin: { ...margin, y: clampMargin(event.target.value) ?? margin.y } })} className="border-border/70 bg-muted/60 shadow-none" />
          </SettingRow>
        </section>

        <Separator />

        <section className="px-4 py-5">
          <SettingRow label={t.autoFit} htmlFor="auto-fit">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs leading-relaxed text-muted-foreground">{t.autoFitHint}</p>
              <Switch id="auto-fit" checked={editor.autoFit} onCheckedChange={(checked) => onChange({ autoFit: checked })} aria-label={t.autoFitText} />
            </div>
          </SettingRow>
        </section>
      </CardContent>
    </Card>
  )
}

function fontWeightLabel(weight: number, labels: Record<number, string>) {
  return labels[weight] ?? labels[400]
}
