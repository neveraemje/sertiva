"use client"

import {
  AlignCenterIcon,
  AlignHorizontalJustifyCenterIcon,
  AlignHorizontalJustifyEndIcon,
  AlignHorizontalJustifyStartIcon,
  AlignLeftIcon,
  AlignRightIcon,
  AlignVerticalJustifyCenterIcon,
  AlignVerticalJustifyEndIcon,
  AlignVerticalJustifyStartIcon,
} from "lucide-react"

import { useMessages } from "@/components/i18n/locale-provider"
import { Button } from "@/components/ui/button"
import type { FieldPosition, TextAlignment } from "@/components/certificate/types"
import { cn } from "@/lib/utils"

type TextAlignmentControlProps = {
  value: TextAlignment
  onChange: (value: TextAlignment) => void
}

const messages = {
  en: {
    textAlignment: "Text alignment",
    textAlign: { left: "Align text left", center: "Align text center", right: "Align text right" },
    horizontal: "Horizontal canvas alignment",
    vertical: "Vertical canvas alignment",
    fieldLeft: "Align field left",
    fieldCenterX: "Center field horizontally",
    fieldRight: "Align field right",
    fieldTop: "Align field to top",
    fieldCenterY: "Center field vertically",
    fieldBottom: "Align field to bottom",
  },
  id: {
    textAlignment: "Perataan teks",
    textAlign: { left: "Rata kiri", center: "Rata tengah", right: "Rata kanan" },
    horizontal: "Perataan horizontal di kanvas",
    vertical: "Perataan vertikal di kanvas",
    fieldLeft: "Ratakan kolom ke kiri",
    fieldCenterX: "Tengahkan kolom secara horizontal",
    fieldRight: "Ratakan kolom ke kanan",
    fieldTop: "Ratakan kolom ke atas",
    fieldCenterY: "Tengahkan kolom secara vertikal",
    fieldBottom: "Ratakan kolom ke bawah",
  },
}

const textAlignments = [
  { value: "left" as const, icon: AlignLeftIcon },
  { value: "center" as const, icon: AlignCenterIcon },
  { value: "right" as const, icon: AlignRightIcon },
]

export function TextAlignmentControl({ value, onChange }: TextAlignmentControlProps) {
  const t = useMessages(messages)

  return (
    <div className="grid grid-cols-3 rounded-lg bg-muted p-1" role="group" aria-label={t.textAlignment}>
      {textAlignments.map((item) => (
        <SegmentButton key={item.value} active={value === item.value} label={t.textAlign[item.value]} onClick={() => onChange(item.value)}>
          <item.icon />
        </SegmentButton>
      ))}
    </div>
  )
}

type CanvasAlignmentControlsProps = {
  position: FieldPosition
  onChange: (position: FieldPosition) => void
}

export function CanvasAlignmentControls({ position, onChange }: CanvasAlignmentControlsProps) {
  const t = useMessages(messages)

  return (
    <div className="grid grid-cols-2 gap-2">
      <div className="grid grid-cols-3 rounded-lg bg-muted p-1" role="group" aria-label={t.horizontal}>
        <SegmentButton active={position.x === 12} label={t.fieldLeft} onClick={() => onChange({ ...position, x: 12 })}><AlignHorizontalJustifyStartIcon /></SegmentButton>
        <SegmentButton active={position.x === 50} label={t.fieldCenterX} onClick={() => onChange({ ...position, x: 50 })}><AlignHorizontalJustifyCenterIcon /></SegmentButton>
        <SegmentButton active={position.x === 88} label={t.fieldRight} onClick={() => onChange({ ...position, x: 88 })}><AlignHorizontalJustifyEndIcon /></SegmentButton>
      </div>
      <div className="grid grid-cols-3 rounded-lg bg-muted p-1" role="group" aria-label={t.vertical}>
        <SegmentButton active={position.y === 15} label={t.fieldTop} onClick={() => onChange({ ...position, y: 15 })}><AlignVerticalJustifyStartIcon /></SegmentButton>
        <SegmentButton active={position.y === 50} label={t.fieldCenterY} onClick={() => onChange({ ...position, y: 50 })}><AlignVerticalJustifyCenterIcon /></SegmentButton>
        <SegmentButton active={position.y === 85} label={t.fieldBottom} onClick={() => onChange({ ...position, y: 85 })}><AlignVerticalJustifyEndIcon /></SegmentButton>
      </div>
    </div>
  )
}

type SegmentButtonProps = {
  active?: boolean
  label: string
  onClick: () => void
  children: React.ReactNode
}

function SegmentButton({ active = false, label, onClick, children }: SegmentButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      className={cn("w-full rounded-md text-muted-foreground hover:text-foreground", active && "bg-background text-foreground shadow-sm hover:bg-background")}
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
    >
      {children}
    </Button>
  )
}
