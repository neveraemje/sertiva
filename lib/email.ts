import { readFile } from "node:fs/promises"
import path from "node:path"
import nodemailer from "nodemailer"

export type InviteEmail = {
  to: string
  title: string
  message: string
  link: string
  siteUrl: string
}

const logoCid = "sertiva-logo"

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function createTransport() {
  // TODO: Securely load this value from an environment variable or secrets vault. Do not hardcode.
  const user = process.env.GMAIL_USER
  // TODO: Securely load this value from an environment variable or secrets vault. Do not hardcode.
  const pass = process.env.GMAIL_APP_PASSWORD

  if (!user || !pass) {
    throw new Error("Email sending is not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD.")
  }

  return { user, transport: nodemailer.createTransport({ service: "gmail", auth: { user, pass } }) }
}

// Gmail does not render SVG, so the email uses a PNG copy of the logo attached inline.
async function loadLogo() {
  try {
    return await readFile(path.join(process.cwd(), "public/email/sertiva-logo.png"))
  } catch {
    return null
  }
}

function inviteText({ title, message, link, siteUrl }: InviteEmail) {
  return [
    title,
    "",
    message,
    "",
    link,
    "",
    "---",
    "Sertiva is free. Design a certificate once, share one link, and let every recipient make their own copy.",
    `Create yours for free: ${siteUrl}`,
  ].join("\n")
}

function inviteHtml({ title, message, link, siteUrl }: InviteEmail, hasLogo: boolean) {
  const font = "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif"
  const logo = hasLogo
    ? `<img src="cid:${logoCid}" width="23" height="24" alt="" style="display:inline-block;vertical-align:middle;border:0">`
    : ""

  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#f4f4f5">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;${font}">
<tr><td align="center" style="padding:32px 16px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px">
    <tr><td style="padding:0 4px 20px">
      ${logo}<span style="vertical-align:middle;margin-left:8px;font-size:18px;font-weight:600;color:#09090b">Sertiva</span>
    </td></tr>
    <tr><td style="background:#ffffff;border:1px solid #e4e4e7;border-radius:16px;padding:32px">
      <h1 style="margin:0 0 16px;font-size:20px;line-height:28px;font-weight:600;color:#09090b">${escapeHtml(title)}</h1>
      <p style="margin:0 0 24px;font-size:15px;line-height:24px;color:#3f3f46;white-space:pre-line">${escapeHtml(message)}</p>
      <a href="${escapeHtml(link)}" style="display:inline-block;background:#09090b;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:12px 22px;border-radius:10px">Claim your certificate</a>
      <p style="margin:24px 0 0;font-size:13px;line-height:20px;color:#71717a">Or copy this link into your browser:<br><a href="${escapeHtml(link)}" style="color:#2563eb;word-break:break-all">${escapeHtml(link)}</a></p>
    </td></tr>
    <tr><td style="padding:16px 0 0">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fafafa;border:1px solid #e4e4e7;border-radius:16px">
        <tr><td style="padding:20px 24px">
          <p style="margin:0 0 4px;font-size:12px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:#16a34a">Free to use</p>
          <p style="margin:0 0 6px;font-size:15px;font-weight:600;color:#09090b">Make your own certificates with Sertiva</p>
          <p style="margin:0 0 12px;font-size:13px;line-height:20px;color:#52525b">Design a certificate once, share one link, and let every recipient make their own copy. No design skills or paid plan needed.</p>
          <a href="${escapeHtml(siteUrl)}" style="font-size:13px;font-weight:600;color:#09090b">Create yours for free &rarr;</a>
        </td></tr>
      </table>
    </td></tr>
    <tr><td style="padding:20px 4px 0;font-size:12px;line-height:18px;color:#a1a1aa">
      You received this email because your address was added to a certificate on Sertiva.
    </td></tr>
  </table>
</td></tr>
</table>
</body></html>`
}

// Sends one email per recipient so allowed addresses are never exposed to each other.
export async function sendInviteEmails(emails: InviteEmail[]) {
  const { user, transport } = createTransport()
  const logo = await loadLogo()
  const results = await Promise.allSettled(emails.map((email) => transport.sendMail({
    from: `Sertiva <${user}>`,
    to: email.to,
    subject: email.title,
    text: inviteText(email),
    html: inviteHtml(email, Boolean(logo)),
    attachments: logo ? [{ filename: "sertiva-logo.png", content: logo, cid: logoCid }] : [],
  })))

  return emails
    .filter((_, index) => results[index].status === "rejected")
    .map(({ to }) => to)
}
