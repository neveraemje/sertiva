"use client"

import { RotateCcwIcon } from "lucide-react"

import { CanvasAlignmentControls, TextAlignmentControl } from "@/components/certificate/alignment-controls"
import { SettingRow } from "@/components/certificate/setting-row"
import { TextColorPicker } from "@/components/certificate/text-color-picker"
import type { CertificateEditorState } from "@/components/certificate/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
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

export function FieldSettings({ editor, onChange, className }: FieldSettingsProps) {
  const selectedFont = [...standardFonts, ...thmanyahFonts, ...googleFonts].find((font) => font.value === editor.fontFamily)

  return (
    <Card className={cn("h-fit gap-0 bg-background/95 py-0 backdrop-blur-md", className)}>
      <CardContent className="p-0">
        <section className="space-y-4 px-4 py-5">
          <h3 className="text-sm font-semibold">Typography</h3>

          <SettingRow label="Font">
            <Select value={editor.fontFamily} onValueChange={(value) => onChange({ fontFamily: value as string })}>
              <SelectTrigger className="w-full border-border/70 bg-muted/60 shadow-none"><SelectValue>{selectedFont?.label ?? editor.fontFamily}</SelectValue></SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Standard</SelectLabel>
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

          <SettingRow label="Weight">
            <Select value={String(editor.fontWeight ?? 400)} onValueChange={(value) => onChange({ fontWeight: Number(value) })}>
              <SelectTrigger className="w-full border-border/70 bg-muted/60 shadow-none"><SelectValue>{fontWeightLabel(editor.fontWeight ?? 400)}</SelectValue></SelectTrigger>
              <SelectContent>
                <SelectItem value="400">Regular</SelectItem>
                <SelectItem value="500">Medium</SelectItem>
                <SelectItem value="600">Semibold</SelectItem>
                <SelectItem value="700">Bold</SelectItem>
              </SelectContent>
            </Select>
          </SettingRow>

          <SettingRow label="Size" htmlFor="font-size" className="items-start">
            <div className="space-y-2">
              <div className="relative">
                <Input id="font-size" type="number" min={18} max={72} value={editor.fontSize} onChange={(event) => onChange({ fontSize: Number(event.target.value) })} className="h-9 border-border/70 bg-muted/60 pr-8 shadow-none" />
                <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-muted-foreground">px</span>
              </div>
              <input className="w-full accent-black" type="range" min={18} max={72} value={editor.fontSize} onChange={(event) => onChange({ fontSize: Number(event.target.value) })} aria-label="Font size" />
            </div>
          </SettingRow>

          <SettingRow label="Color">
            <TextColorPicker
              color={editor.textColor}
              opacity={editor.textOpacity}
              onChange={(textColor, textOpacity) => onChange({ textColor, textOpacity })}
            />
          </SettingRow>

          <SettingRow label="Align">
            <TextAlignmentControl value={editor.textAlign} onChange={(textAlign) => onChange({ textAlign })} />
          </SettingRow>
        </section>

        <Separator />

        <section className="space-y-4 px-4 py-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Position</h3>
            <Button size="xs" variant="ghost" onClick={() => onChange({ position: { x: 50, y: 57 } })}><RotateCcwIcon /> Reset</Button>
          </div>

          <SettingRow label="Align">
            <CanvasAlignmentControls position={editor.position} onChange={(position) => onChange({ position })} />
          </SettingRow>

          <SettingRow label="X position" htmlFor="position-x">
            <Input id="position-x" type="number" min={0} max={100} value={editor.position.x} onChange={(event) => onChange({ position: { ...editor.position, x: Number(event.target.value) } })} className="border-border/70 bg-muted/60 shadow-none" />
          </SettingRow>

          <SettingRow label="Y position" htmlFor="position-y">
            <Input id="position-y" type="number" min={0} max={100} value={editor.position.y} onChange={(event) => onChange({ position: { ...editor.position, y: Number(event.target.value) } })} className="border-border/70 bg-muted/60 shadow-none" />
          </SettingRow>
        </section>

        <Separator />

        <section className="px-4 py-5">
          <SettingRow label="Auto-fit" htmlFor="auto-fit">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs leading-relaxed text-muted-foreground">Reduce long names to fit.</p>
              <Switch id="auto-fit" checked={editor.autoFit} onCheckedChange={(checked) => onChange({ autoFit: checked })} aria-label="Auto-fit text" />
            </div>
          </SettingRow>
        </section>
      </CardContent>
    </Card>
  )
}

function fontWeightLabel(weight: number) {
  if (weight === 500) return "Medium"
  if (weight === 600) return "Semibold"
  if (weight === 700) return "Bold"
  return "Regular"
}
