import type { ReactNode } from "react"

import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

type SettingRowProps = {
  label: string
  children: ReactNode
  htmlFor?: string
  className?: string
}

export function SettingRow({ label, children, htmlFor, className }: SettingRowProps) {
  return (
    <div className={cn("grid grid-cols-[72px_minmax(0,1fr)] items-center gap-3", className)}>
      <Label htmlFor={htmlFor} className="text-muted-foreground">{label}</Label>
      <div className="min-w-0">{children}</div>
    </div>
  )
}
