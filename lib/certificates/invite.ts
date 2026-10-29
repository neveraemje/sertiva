export const defaultInviteMessage = "You have been invited to claim your certificate. Open the link below. Thank you"

export function defaultInviteTitle(certificateName: string) {
  return `Your certificate: "${certificateName}"`
}

// Emails the public link to every allowed address and returns a status line for the UI.
export async function sendPublicationInvite(certificateId: string, invite: { title: string; message: string }) {
  const response = await fetch(`/api/publications/${certificateId}/invite`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(invite),
  })
  const result = await response.json().catch(() => ({})) as { sent?: number; failed?: string[]; error?: string }
  if (!response.ok) throw new Error(result.error ?? "Could not send emails.")
  if (result.failed?.length) return `Sent ${result.sent} email(s). Could not send to ${result.failed.join(", ")}.`
  return `Sent the link to ${result.sent} email address${result.sent === 1 ? "" : "es"}.`
}
