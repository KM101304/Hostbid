import "server-only";

import { getRequiredEnv } from "@/lib/env";

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildAuthEmailHtml({
  heading,
  intro,
  ctaLabel,
  actionUrl,
}: {
  heading: string;
  intro: string;
  ctaLabel: string;
  actionUrl: string;
}) {
  const safeHeading = escapeHtml(heading);
  const safeIntro = escapeHtml(intro);
  const safeCtaLabel = escapeHtml(ctaLabel);
  const safeActionUrl = escapeHtml(actionUrl);

  return `<!doctype html>
<html>
  <body style="margin:0;background:#f8fafc;font-family:Inter,Arial,sans-serif;color:#0f172a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8fafc;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;border:1px solid #e2e8f0;border-radius:18px;background:#ffffff;overflow:hidden;">
            <tr>
              <td style="padding:28px 28px 12px;">
                <div style="display:inline-block;border-radius:999px;background:#fdf2f8;color:#9d174d;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;padding:8px 12px;">HostBid</div>
                <h1 style="font-size:32px;line-height:1.08;margin:24px 0 12px;letter-spacing:-.04em;">${safeHeading}</h1>
                <p style="font-size:16px;line-height:1.7;margin:0;color:#475569;">${safeIntro}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 28px 8px;">
                <a href="${safeActionUrl}" style="display:inline-block;border-radius:10px;background:#0f172a;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 18px;">${safeCtaLabel}</a>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 28px 28px;">
                <p style="font-size:13px;line-height:1.6;margin:0;color:#64748b;">If the button does not open, paste this link into your browser:</p>
                <p style="font-size:13px;line-height:1.6;margin:8px 0 0;word-break:break-all;color:#334155;">${safeActionUrl}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export async function sendResendEmail({ to, subject, html, text }: SendEmailInput) {
  const apiKey = getRequiredEnv("RESEND_API_KEY");
  const from = getRequiredEnv("RESEND_FROM_EMAIL");
  const replyTo = process.env.RESEND_REPLY_TO_EMAIL;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      html,
      text,
      ...(replyTo ? { reply_to: replyTo } : {}),
    }),
  });

  if (!response.ok) {
    let message = "Resend could not send the email.";

    try {
      const payload = await response.json();
      if (payload && typeof payload.message === "string") {
        message = payload.message;
      }
    } catch {
      // Keep the generic message if Resend returns a non-JSON error.
    }

    throw new Error(message);
  }
}
