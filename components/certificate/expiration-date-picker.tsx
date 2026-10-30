"use client"

import { useState } from "react"
import { format } from "date-fns"
import { CalendarDaysIcon } from "lucide-react"
import { cn } from "cn"

import { useLocale, useMessages } from "@/components/i18n/locale-provider"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

type ExpirationDatePickerProps = {
  id: string
  value: Date | undefined
  onChange: (value: Date | undefined) => void
  size?: "default" | "lg"
}

const messages = {
  en: { noExpiration: "No expiration", clearExpiration: "Clear expiration date", clearDate: "Clear date" },
  id: { noExpiration: "Tanpa kedaluwarsa", clearExpiration: "Hapus tanggal kedaluwarsa", clearDate: "Hapus tanggal" },
}

export function ExpirationDatePicker({ id, value, onChange, size = "default" }: ExpirationDatePickerProps) {
  const t = useMessages(messages)
  const { dateLocale } = useLocale()
  const [open, setOpen] = useState(false)

  function clear() {
    onChange(undefined)
    setOpen(false)
  }

  return (
    <div className="flex items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              id={id}
              type="button"
              variant="outline"
              size={size}
              className={cn("min-w-0 flex-1 justify-between bg-background font-normal", !value && "text-muted-foreground")}
            />
          }
        >
          {value ? format(value, "PPP", { locale: dateLocale }) : t.noExpiration}
          <CalendarDaysIcon className="ml-auto" />
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-0">
          <Calendar
            mode="single"
            selected={value}
            onSelect={(date) => {
              onChange(date)
              if (date) setOpen(false)
            }}
            disabled={{ before: new Date() }}
            locale={dateLocale}
          />
          <div className="border-t p-2">
            <Button type="button" variant="ghost" size="sm" className="w-full" disabled={!value} onClick={clear}>
              {t.clearExpiration}
            </Button>
          </div>
        </PopoverContent>
      </Popover>
      {value && (
        <Button type="button" variant="secondary" size={size} className="shrink-0" onClick={clear}>
          {t.clearDate}
        </Button>
      )}
    </div>
  )
}
