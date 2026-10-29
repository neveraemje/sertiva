import { sendInviteEmails } from "@/lib/email"
import { publicSiteUrl } from "@/lib/site-url"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request, context: { params: Promise<{ certificateId: string }> }) {
  const { certificateId } = await context.params
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return Response.json({ error: "Enter a title and message." }, { status: 400 })
  }

  const values = (body && typeof body === "object" ? body : {}) as Record<string, unknown>
  const title = typeof values.title === "string" ? values.title.trim() : ""
  const message = typeof values.message === "string" ? values.message.trim() : ""
  if (!title || title.length > 200) {
    return Response.json({ error: "Enter an email title of up to 200 characters." }, { status: 400 })
  }
  if (!message || message.length > 5000) {
    return Response.json({ error: "Enter an email message of up to 5000 characters." }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ error: "Sign in to send invitations." }, { status: 401 })
  }

  // RLS only returns publications owned by the signed-in user.
  const { data: publication, error } = await supabase
    .from("published_certificates")
    .select("slug,access_mode,allowed_emails")
    .eq("certificate_id", certificateId)
    .maybeSingle()

  if (error) {
    return Response.json({ error: error.message }, { status: 400 })
  }
  if (!publication || publication.access_mode !== "restricted" || publication.allowed_emails.length === 0) {
    return Response.json({ error: "Only restricted publications can send invitations." }, { status: 404 })
  }

  const siteUrl = publicSiteUrl(new URL(request.url).origin)
  const link = `${siteUrl}/${publication.slug}`
  try {
    const failed = await sendInviteEmails((publication.allowed_emails as string[]).map((to) => ({ to, title, message, link, siteUrl })))
    return Response.json({ sent: publication.allowed_emails.length - failed.length, failed })
  } catch (caught) {
    return Response.json({ error: caught instanceof Error ? caught.message : "Could not send emails." }, { status: 500 })
  }
}
