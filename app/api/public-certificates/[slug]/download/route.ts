import { createClient } from "@/lib/supabase/server"

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function POST(request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: "Invalid download request." }, { status: 400 })
  }

  const token = body && typeof body === "object" && "token" in body ? body.token : null
  if (typeof token !== "string" || !uuidPattern.test(token)) {
    return Response.json({ error: "Invalid download request." }, { status: 400 })
  }

  const supabase = await createClient()
  const { data, error } = await supabase.rpc("record_published_certificate_download", {
    p_slug: slug,
    p_token: token,
  })
  if (error) {
    return Response.json({ error: "Could not record this download." }, { status: 500 })
  }
  if (!data) {
    return Response.json({ error: "This download is unavailable." }, { status: 404 })
  }
  return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } })
}
