export const defaultInviteMessage = "You have been invited to claim your certificate. Open the link below. Thank you"

export function defaultInviteTitle(certificateName: string) {
  return `Your certificate: "${certificateName}"`
}

export type InviteResult = { sent: number; failed: string[] }

// Emails the public link to every allowed address and returns how many were sent and which failed.
export async function sendPublicationInvite(certificateId: string, invite: { title: string; message: string }): Promise<InviteResult> {
  const response = await fetch(`/api/publications/${certificateId}/invite`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(invite),
  })
  const result = await response.json().catch(() => ({})) as { sent?: number; failed?: string[]; error?: string }
  if (!response.ok) throw new Error(result.error ?? "Could not send emails.")
  return { sent: result.sent ?? 0, failed: result.failed ?? [] }
}
