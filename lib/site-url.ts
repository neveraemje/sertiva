// Shared certificate links use NEXT_PUBLIC_SITE_URL (for example https://example.com) so they work
// for recipients even when the dashboard is opened on localhost. Falls back to the current origin.
export function publicSiteUrl(fallbackOrigin: string) {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (!configured) return fallbackOrigin
  try {
    return new URL(configured).origin
  } catch {
    return fallbackOrigin
  }
}
