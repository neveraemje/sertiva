import { createClient } from "@/lib/supabase/client"

export type CertificateEntry = {
  id: string
  recipient_name: string
  recipient_email: string | null
  created_at: string
  download_count: number
  last_downloaded_at: string | null
}

export type CertificateDownload = {
  id: string
  downloadedAt: string
  recipientName: string
  recipientEmail: string | null
}

export const activityPageSize = 50

export async function loadPublicationMetrics(certificateId: string): Promise<{ submissionCount: number; downloadCount: number }> {
  const { data, error } = await createClient()
    .from("published_certificates")
    .select("submission_count,download_count")
    .eq("certificate_id", certificateId)
    .single()

  if (error) throw error
  return { submissionCount: Number(data.submission_count), downloadCount: Number(data.download_count) }
}

export async function loadCertificateEntries(certificateId: string, offset = 0): Promise<CertificateEntry[]> {
  const { data, error } = await createClient()
    .from("published_certificate_entries")
    .select("id,recipient_name,recipient_email,created_at,download_count,last_downloaded_at")
    .eq("certificate_id", certificateId)
    .order("created_at", { ascending: false })
    .range(offset, offset + activityPageSize - 1)

  if (error) throw error
  return data as CertificateEntry[]
}

export async function loadCertificateDownloads(certificateId: string, offset = 0): Promise<CertificateDownload[]> {
  const { data, error } = await createClient()
    .from("published_certificate_downloads")
    .select("id,downloaded_at,entry:published_certificate_entries!published_certificate_downloads_entry_id_fkey(recipient_name,recipient_email)")
    .eq("certificate_id", certificateId)
    .order("downloaded_at", { ascending: false })
    .range(offset, offset + activityPageSize - 1)

  if (error) throw error
  const rows = data as unknown as Array<{
    id: string
    downloaded_at: string
    entry: { recipient_name: string; recipient_email: string | null } | null
  }>
  return rows.filter((row) => row.entry !== null).map((row) => ({
    id: row.id,
    downloadedAt: row.downloaded_at,
    recipientName: row.entry!.recipient_name,
    recipientEmail: row.entry!.recipient_email,
  }))
}
