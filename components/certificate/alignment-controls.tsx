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

import { Button } from "@/components/ui/button"
import type { FieldPosition, TextAlignment } from "@/components/certificate/types"
import { cn } from "@/lib/utils"

type TextAlignmentControlProps = {
  value: TextAlignment
  onChange: (value: TextAlignment) => void
}

const textAlignments = [
  { value: "left" as const, label: "Align text left", icon: AlignLeftIcon },
  { value: "center" as const, label: "Align text center", icon: AlignCenterIcon },
  { value: "right" as const, label: "Align text right", icon: AlignRightIcon },
]

export function TextAlignmentControl({ value, onChange }: TextAlignmentControlProps) {
  return (
    <div className="grid grid-cols-3 rounded-lg bg-muted p-1" role="group" aria-label="Text alignment">
      {textAlignments.map((item) => (
        <SegmentButton key={item.value} active={value === item.value} label={item.label} onClick={() => onChange(item.value)}>
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
  return (
    <div className="grid grid-cols-2 gap-2">
      <div className="grid grid-cols-3 rounded-lg bg-muted p-1" role="group" aria-label="Horizontal canvas alignment">
        <SegmentButton active={position.x === 12} label="Align field left" onClick={() => onChange({ ...position, x: 12 })}><AlignHorizontalJustifyStartIcon /></SegmentButton>
        <SegmentButton active={position.x === 50} label="Center field horizontally" onClick={() => onChange({ ...position, x: 50 })}><AlignHorizontalJustifyCenterIcon /></SegmentButton>
        <SegmentButton active={position.x === 88} label="Align field right" onClick={() => onChange({ ...position, x: 88 })}><AlignHorizontalJustifyEndIcon /></SegmentButton>
      </div>
      <div className="grid grid-cols-3 rounded-lg bg-muted p-1" role="group" aria-label="Vertical canvas alignment">
        <SegmentButton active={position.y === 15} label="Align field to top" onClick={() => onChange({ ...position, y: 15 })}><AlignVerticalJustifyStartIcon /></SegmentButton>
        <SegmentButton active={position.y === 50} label="Center field vertically" onClick={() => onChange({ ...position, y: 50 })}><AlignVerticalJustifyCenterIcon /></SegmentButton>
        <SegmentButton active={position.y === 85} label="Align field to bottom" onClick={() => onChange({ ...position, y: 85 })}><AlignVerticalJustifyEndIcon /></SegmentButton>
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
