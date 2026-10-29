import type { CertificateRecord } from "@/components/certificate/types"
import { createClient } from "@/lib/supabase/client"

const reservedSlugs = new Set(["api", "auth", "dashboard", "login", "signup"])

export type PublicationSettings = {
  accessMode: "anyone" | "restricted"
  allowedEmails: string[]
  inputMode: "single" | "repeat"
  expiresAt: string | null
}

export async function loadPublicationSettings(certificateId: string): Promise<PublicationSettings | null> {
  const { data, error } = await createClient()
    .from("published_certificates")
    .select("access_mode,allowed_emails,input_mode,expires_at")
    .eq("certificate_id", certificateId)
    .maybeSingle()

  if (error?.code === "42703" || error?.code === "PGRST204") {
    const { data: legacy, error: legacyError } = await createClient()
      .from("published_certificates")
      .select("expires_at")
      .eq("certificate_id", certificateId)
      .maybeSingle()
    if (legacyError) throw legacyError
    return legacy ? { accessMode: "anyone", allowedEmails: [], inputMode: "repeat", expiresAt: legacy.expires_at } : null
  }
  if (error) throw error
  if (!data) return null
  return {
    accessMode: data.access_mode,
    allowedEmails: data.allowed_emails,
    inputMode: data.input_mode,
    expiresAt: data.expires_at,
  }
}

export async function updatePublicationSettings(certificateId: string, settings: PublicationSettings): Promise<void> {
  const allowedEmails = Array.from(new Set(settings.allowedEmails.map((email) => email.trim().toLowerCase()).filter(Boolean)))
  if (settings.accessMode === "restricted" && allowedEmails.length === 0) {
    throw new Error("Add at least one allowed email address.")
  }
  if (allowedEmails.some((email) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
    throw new Error("Enter a valid email address.")
  }
  const supabase = createClient()
  const { data: current, error: currentError } = await supabase
    .from("published_certificates")
    .select("published_at,submission_count,claimed_at,expires_at")
    .eq("certificate_id", certificateId)
    .single()
  if (currentError) throw currentError
  if (settings.expiresAt !== current.expires_at && settings.expiresAt
    && (!Number.isFinite(Date.parse(settings.expiresAt)) || Date.parse(settings.expiresAt) <= Date.now())) {
    throw new Error("Choose a future expiration date.")
  }

  const { data, error } = await supabase
    .from("published_certificates")
    .update({
      access_mode: settings.accessMode,
      allowed_emails: settings.accessMode === "restricted" ? allowedEmails : [],
      input_mode: settings.inputMode,
      expires_at: settings.expiresAt,
      claimed_at: settings.inputMode === "single" && Number(current.submission_count) > 0
        ? current.claimed_at ?? new Date().toISOString()
        : current.claimed_at,
    })
    .eq("certificate_id", certificateId)
    .eq("published_at", current.published_at)
    .eq("submission_count", current.submission_count)
    .select("certificate_id")
    .maybeSingle()
  if (error) throw error
  if (!data) throw new Error("This publication changed while you were editing. Refresh and try again.")
}

function slugify(value: string) {
  const slug = value
    .normalize("NFKD")
    .toLowerCase()
    .trim()
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")

  return reservedSlugs.has(slug) || !slug ? `certificate-${slug || "link"}` : slug
}

export async function publishCertificate(
  userId: string,
  certificate: CertificateRecord,
  settings: PublicationSettings
) {
  const allowedEmails = Array.from(new Set(settings.allowedEmails.map((email) => email.trim().toLowerCase()).filter(Boolean)))
  if (settings.accessMode === "restricted" && allowedEmails.length === 0) {
    throw new Error("Add at least one allowed email address.")
  }

  const supabase = createClient()
  const { data: source, error: sourceError } = await supabase
    .from("certificates")
    .select("design_path,preview_path,width,height")
    .eq("id", certificate.id)
    .eq("user_id", userId)
    .single()

  if (sourceError) throw sourceError

  const { data: current, error: currentError } = await supabase
    .from("published_certificates")
    .select("slug")
    .eq("certificate_id", certificate.id)
    .maybeSingle()

  if (currentError) throw currentError

  const baseSlug = slugify(certificate.name)
  const slugs = current?.slug
    ? [current.slug]
    : [baseSlug, `${baseSlug}-${certificate.id.slice(0, 8)}`]

  for (const slug of slugs) {
    const { data, error } = await supabase
      .from("published_certificates")
      .upsert({
        certificate_id: certificate.id,
        slug,
        name: certificate.name,
        design_path: source.design_path,
        preview_path: source.preview_path,
        width: source.width,
        height: source.height,
        editor: certificate.editor,
        access_mode: settings.accessMode,
        allowed_emails: settings.accessMode === "restricted" ? allowedEmails : [],
        input_mode: settings.inputMode,
        expires_at: settings.expiresAt,
        claimed_at: null,
        claimed_name: null,
        published_at: new Date().toISOString(),
      }, { onConflict: "certificate_id" })
      .select("slug")
      .single()

    if (!error) return data.slug as string
    if (error.code !== "23505") throw error
  }

  throw new Error("This certificate link is already in use. Please rename the certificate.")
}
