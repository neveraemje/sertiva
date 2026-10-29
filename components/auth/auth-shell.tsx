import Link from "next/link"

import { SertivaLogo } from "@/components/sertiva-logo"

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative flex min-h-svh items-center justify-center overflow-hidden bg-muted/40 px-5 py-14 sm:px-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-45 [background-image:radial-gradient(circle_at_center,var(--color-border)_1px,transparent_1px)] [background-size:24px_24px]"
      />
      <Link
        href="/"
        className="absolute left-5 top-5 z-10 flex items-center gap-2.5 text-lg font-semibold sm:left-8 sm:top-7"
      >
        <span className="flex size-8 items-center justify-center">
          <SertivaLogo className="h-7 w-auto" />
        </span>
        Sertiva
      </Link>

      <div className="relative z-10 w-full max-w-[420px]">
        {children}
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Secure certificate management for your organization.
        </p>
      </div>
    </main>
  )
}
