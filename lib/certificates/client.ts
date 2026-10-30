import type { PreparedDesignFile } from "@/components/certificate/prepare-design-file"
import type { CertificateEditorState, CertificateRecord, TemplateAsset } from "@/components/certificate/types"
import { createClient } from "@/lib/supabase/client"

const bucket = "certificate-designs"
const signedUrlLifetime = 60 * 60 * 24
const maxFileSize = 20 * 1024 * 1024

type CertificateRow = {
  id: string
  user_id: string
  name: string
  design_name: string
  design_mime: string
  design_path: string
  preview_path: string | null
  width: number
  height: number
  editor: CertificateEditorState
  updated_at: string
}

type PublicationRow = {
  certificate_id: string
  slug: string
  published_at: string
  expires_at: string | null
  claimed_at: string | null
  access_mode: "anyone" | "restricted"
  allowed_emails: string[]
  input_mode: "single" | "repeat"
  submission_count: number
  download_count: number
}

// Keeps the timestamp so the card can format it in the dashboard language.
function formatUpdatedAt(value: string) {
  return Number.isNaN(new Date(value).getTime()) ? "Recently" : value
}

async function signedUrl(path: string) {
  const { data, error } = await createClient().storage.from(bucket).createSignedUrl(path, signedUrlLifetime)
  if (error) throw error
  return data.signedUrl
}

async function toRecord(row: CertificateRow): Promise<CertificateRecord> {
  const [url, previewUrl] = await Promise.all([
    signedUrl(row.design_path),
    row.preview_path ? signedUrl(row.preview_path) : Promise.resolve(null),
  ])

  const template: TemplateAsset = {
    name: row.design_name,
    kind: row.design_mime === "application/pdf" ? "pdf" : "image",
    url,
    previewUrl: previewUrl ?? (row.design_mime === "application/pdf" ? null : url),
    width: row.width,
    height: row.height,
  }

  return { id: row.id, name: row.name, template, editor: row.editor, updatedAt: formatUpdatedAt(row.updated_at), publication: null }
}

export async function loadCertificates(userId: string): Promise<CertificateRecord[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("certificates")
    .select("id,user_id,name,design_name,design_mime,design_path,preview_path,width,height,editor,updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })

  if (error) throw error
  const rows = data as CertificateRow[]
  if (rows.length === 0) return []

  const { data: publications, error: publicationError } = await supabase
    .from("published_certificates")
    .select("certificate_id,slug,published_at,expires_at,claimed_at,access_mode,allowed_emails,input_mode,submission_count,download_count")
    .in("certificate_id", rows.map((row) => row.id))
  if (publicationError) throw publicationError

  const byCertificate = new Map((publications as PublicationRow[]).map((row) => [row.certificate_id, row]))
  return Promise.all(rows.map(async (row) => {
    const record = await toRecord(row)
    const publication = byCertificate.get(row.id)
    return {
      ...record,
      publication: publication ? {
        slug: publication.slug,
        publishedAt: publication.published_at,
        expiresAt: publication.expires_at,
        isExpired: publication.expires_at !== null && new Date(publication.expires_at).getTime() <= Date.now(),
        isClaimed: publication.claimed_at !== null,
        accessMode: publication.access_mode,
        allowedEmails: publication.allowed_emails,
        inputMode: publication.input_mode,
        submissionCount: Number(publication.submission_count),
        downloadCount: Number(publication.download_count),
      } : null,
    }
  }))
}

export async function createCertificate(
  userId: string,
  name: string,
  design: PreparedDesignFile,
  editor: CertificateEditorState
): Promise<CertificateRecord> {
  if (design.file.size > maxFileSize) throw new Error("The design file must be smaller than 20 MB.")

  const supabase = createClient()
  const id = crypto.randomUUID()
  const fileName = design.file.name.toLowerCase()
  const isPdf = design.file.type === "application/pdf" || fileName.endsWith(".pdf")
  const isJpeg = design.file.type === "image/jpeg" || /\.jpe?g$/.test(fileName)
  const mime = isPdf ? "application/pdf" : isJpeg ? "image/jpeg" : "image/png"
  const extension = isPdf ? "pdf" : mime === "image/jpeg" ? "jpg" : "png"
  const designPath = `${userId}/${id}/design.${extension}`
  const previewPath = isPdf ? `${userId}/${id}/preview.png` : null
  const uploadedPaths: string[] = []

  try {
    const { error: designError } = await supabase.storage.from(bucket).upload(designPath, design.file, {
      contentType: mime,
      upsert: false,
    })
    if (designError) throw designError
    uploadedPaths.push(designPath)

    if (previewPath) {
      const previewBlob = await fetch(design.previewUrl).then((response) => response.blob())
      const { error: previewError } = await supabase.storage.from(bucket).upload(previewPath, previewBlob, {
        contentType: "image/png",
        upsert: false,
      })
      if (previewError) throw previewError
      uploadedPaths.push(previewPath)
    }

    const { error: insertError } = await supabase.from("certificates").insert({
      id,
      user_id: userId,
      name,
      design_name: design.file.name,
      design_mime: mime,
      design_path: designPath,
      preview_path: previewPath,
      width: design.width,
      height: design.height,
      editor,
    })
    if (insertError) throw insertError

    return {
      id,
      name,
      template: {
        name: design.file.name,
        kind: isPdf ? "pdf" : "image",
        url: design.dataUrl,
        previewUrl: design.previewUrl,
        width: design.width,
        height: design.height,
      },
      editor,
      updatedAt: "Just now",
      publication: null,
    }
  } catch (error) {
    if (uploadedPaths.length > 0) {
      await supabase.storage.from(bucket).remove(uploadedPaths)
    }
    throw error
  }
}

export async function saveCertificateEditor(userId: string, id: string, editor: CertificateEditorState) {
  const { data, error } = await createClient()
    .from("certificates")
    .update({ editor, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId)
    .select("id")
    .single()

  if (error) throw error
  if (!data) throw new Error("Certificate not found.")
}

export async function deleteCertificate(userId: string, id: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("certificates")
    .delete()
    .eq("id", id)
    .eq("user_id", userId)
    .select("design_path,preview_path")
    .single()

  if (error) throw error
  const paths = [data.design_path, data.preview_path].filter((path): path is string => Boolean(path))
  const { error: storageError } = await supabase.storage.from(bucket).remove(paths)
  if (storageError) console.error("Certificate file cleanup failed:", storageError)
}
