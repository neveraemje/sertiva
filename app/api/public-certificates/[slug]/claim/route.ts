import { createClient } from "@/lib/supabase/server"
import type { CertificateEditorState } from "@/components/certificate/types"

type ClaimRow = {
  name: string
  design_path: string
  preview_path: string | null
  editor: CertificateEditorState
  download_token: string
}

export async function POST(request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return Response.json({ error: "Enter your name and try again." }, { status: 400 })
  }

  if (!body || typeof body !== "object") {
    return Response.json({ error: "Enter your name and try again." }, { status: 400 })
  }

  const values = body as Record<string, unknown>
  const name = typeof values.name === "string" ? values.name.trim() : ""
  const email = typeof values.email === "string" ? values.email.trim().toLowerCase() : null
  if (!name || name.length > 100) {
    return Response.json({ error: "Enter a name of up to 100 characters." }, { status: 400 })
  }
  if (email && (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
    return Response.json({ error: "Enter a valid email address." }, { status: 400 })
  }

  const supabase = await createClient()
  const { data, error } = await supabase.rpc("claim_published_certificate", {
    p_slug: slug,
    p_name: name,
    p_email: email,
  })

  if (error) {
    return Response.json({ error: error.message }, { status: 400 })
  }

  const publication = (data as ClaimRow[] | null)?.[0]
  if (!publication) {
    return Response.json({ error: "This certificate link is unavailable." }, { status: 404 })
  }

  const { data: signed, error: storageError } = await supabase.storage
    .from("certificate-designs")
    .createSignedUrl(publication.preview_path ?? publication.design_path, 60 * 60)

  if (storageError) {
    return Response.json({ error: "The certificate design could not be loaded." }, { status: 500 })
  }

  return Response.json({
    title: publication.name,
    imageUrl: signed.signedUrl,
    editor: publication.editor,
    downloadToken: publication.download_token,
  }, { headers: { "Cache-Control": "no-store" } })
}
