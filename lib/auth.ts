import "server-only"

import { defaultLocale, isLocale, type Locale } from "@/lib/i18n/locale"
import { createClient } from "@/lib/supabase/server"

export type CurrentUser = {
  id: string
  email?: string
  name: string
  avatarUrl?: string
  locale: Locale
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  "use cache: private"

  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()

  if (!data?.claims || typeof data.claims.sub !== "string") {
    return null
  }

  const email = typeof data.claims.email === "string" ? data.claims.email : undefined
  const metadata = data.claims.user_metadata && typeof data.claims.user_metadata === "object"
    ? data.claims.user_metadata as Record<string, unknown>
    : {}
  // display_name is set in Settings and wins, because Google sign-in rewrites full_name and name on every login.
  const metadataName = [metadata.display_name, metadata.full_name, metadata.name]
    .find((value): value is string => typeof value === "string" && value.trim().length > 0)
  const metadataAvatar = [metadata.avatar_url, metadata.picture]
    .find((value): value is string => typeof value === "string" && value.trim().length > 0)

  return {
    id: data.claims.sub,
    email,
    name: metadataName ?? email?.split("@")[0] ?? "Sertiva user",
    avatarUrl: metadataAvatar,
    locale: isLocale(metadata.locale) ? metadata.locale : defaultLocale,
  }
}
