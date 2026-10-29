"use client"

import { useRef, useState, type KeyboardEvent } from "react"
import { XIcon } from "lucide-react"
import { cn } from "cn"

type EmailChipInputProps = {
  emails: string[]
  onChange: (emails: string[]) => void
}

function parseEmails(value: string) {
  return value
    .split(/[\s,;]+/)
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function EmailChipInput({ emails, onChange }: EmailChipInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [draft, setDraft] = useState("")
  const [error, setError] = useState("")

  function commitDraft() {
    const candidates = parseEmails(draft)
    if (candidates.length === 0) return

    if (candidates.some((email) => !isValidEmail(email))) {
      setError("Enter a valid email address.")
      return
    }

    const nextEmails = Array.from(new Set([...emails, ...candidates]))
    onChange(nextEmails)
    setDraft("")
    setError("")
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (["Enter", ",", ";"].includes(event.key)) {
      event.preventDefault()
      commitDraft()
      return
    }

    if (event.key === "Backspace" && draft === "" && emails.length > 0) {
      onChange(emails.slice(0, -1))
    }
  }

  function removeEmail(emailToRemove: string) {
    onChange(emails.filter((email) => email !== emailToRemove))
    setError("")
    window.setTimeout(() => inputRef.current?.focus(), 0)
  }

  return (
    <div className="space-y-2">
      <div
        className={cn(
          "flex min-h-11 flex-wrap items-center gap-1.5 rounded-lg bg-muted/70 p-1.5 outline-none transition-shadow focus-within:ring-3 focus-within:ring-ring/40",
          error && "ring-2 ring-destructive/30 focus-within:ring-destructive/30"
        )}
        onClick={() => inputRef.current?.focus()}
      >
        {emails.map((email) => (
          <span
            key={email}
            className="inline-flex h-7 max-w-full items-center gap-1 rounded-md bg-background px-2 text-xs font-medium shadow-sm ring-1 ring-foreground/10"
          >
            <span className="truncate">{email}</span>
            <button
              type="button"
              aria-label={`Remove ${email}`}
              className="-mr-1 flex size-5 shrink-0 items-center justify-center rounded-sm text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40"
              onClick={(event) => {
                event.stopPropagation()
                removeEmail(email)
              }}
            >
              <XIcon className="size-3" />
            </button>
          </span>
        ))}

        <input
          ref={inputRef}
          type="email"
          value={draft}
          aria-label="Add recipient email"
          aria-invalid={Boolean(error)}
          placeholder={emails.length === 0 ? "Type an email and press Enter" : "Add another email"}
          className="h-7 min-w-44 flex-1 bg-transparent px-1 text-sm outline-none placeholder:text-muted-foreground"
          onChange={(event) => {
            setDraft(event.target.value)
            setError("")
          }}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            if (draft.trim()) commitDraft()
          }}
        />
      </div>

      <p className={cn("text-xs text-muted-foreground", error && "text-destructive")}>
        {error || "Press Enter or comma after each email address."}
      </p>
    </div>
  )
}
