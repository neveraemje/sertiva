import { NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const requestedNext = requestUrl.searchParams.get("next") ?? "/dashboard"
  const next = requestedNext.startsWith("/") && !requestedNext.startsWith("//")
    ? requestedNext
    : "/dashboard"

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const forwardedHost = request.headers.get("x-forwarded-host")
      const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https"
      const origin = forwardedHost
        ? `${forwardedProto}://${forwardedHost}`
        : requestUrl.origin

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(new URL("/auth/auth-code-error", requestUrl.origin))
}
