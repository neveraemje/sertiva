import { notFound } from "next/navigation"
import { connection } from "next/server"
import { Suspense } from "react"

import { PublicCertificate } from "@/components/certificate/public-certificate"
import type { CertificateEditorState } from "@/components/certificate/types"
import { createClient } from "@/lib/supabase/server"

export const instant = false

type PublicationStatus = {
  name: string
  access_mode: "anyone" | "restricted"
  input_mode: "single" | "repeat"
  available: boolean
}

async function PublishedCertificateContent({ params }: PageProps<"/[slug]">) {
  // Supabase session initialization reads the current time, so it must run per request.
  await connection()
  const { slug } = await params
  const supabase = await createClient()
  const { data, error } = await supabase
    .rpc("published_certificate_status", { p_slug: slug })
    .maybeSingle()
  const publication = data as PublicationStatus | null

  if (error?.code === "PGRST202") {
    const { data: legacy, error: legacyError } = await supabase
      .from("published_certificates")
      .select("name,design_path,preview_path,editor")
      .eq("slug", slug)
      .maybeSingle()
    if (legacyError) throw legacyError
    if (!legacy) notFound()

    const { data: signed, error: storageError } = await supabase.storage
      .from("certificate-designs")
      .createSignedUrl(legacy.preview_path ?? legacy.design_path, 60 * 60)
    if (storageError) throw storageError

    return <PublicCertificate slug={slug} title={legacy.name} accessMode="anyone" inputMode="repeat"
      available legacyAsset={{ imageUrl: signed.signedUrl, editor: legacy.editor as CertificateEditorState }} />
  }
  if (error) throw error
  if (!publication) notFound()

  return (
    <PublicCertificate
      slug={slug}
      title={publication.name}
      accessMode={publication.access_mode}
      inputMode={publication.input_mode}
      available={publication.available}
    />
  )
}

export default function PublishedCertificatePage(props: PageProps<"/[slug]">) {
  return (
    <Suspense fallback={<main className="min-h-screen bg-background" />}>
      <PublishedCertificateContent {...props} />
    </Suspense>
  )
}
