import { Email } from "@convex-dev/auth/providers/Email";

function generateNumericCode(length: number) {
  const digits = "0123456789";
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += digits[bytes[i]! % digits.length];
  }
  return out;
}

async function sendResendEmail(params: {
  apiKey: string | undefined;
  from: string | undefined;
  to: string;
  subject: string;
  html: string;
}) {
  const { apiKey, from, to, subject, html } = params;
  if (!apiKey) {
    throw new Error("Missing RESEND_API_KEY");
  }
  if (!from) {
    throw new Error("Missing RESEND_FROM");
  }

  const res = await fetch("https://api.resend.com/emails", {
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
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Resend error: ${res.status} ${text}`);
  }
}

export const ResendOTPVerify = Email({
  id: "resend-otp-verify",
  maxAge: 60 * 10, // 10 minutes
  apiKey: process.env.RESEND_API_KEY,
  from: process.env.RESEND_FROM,
  async generateVerificationToken() {
    return generateNumericCode(6);
  },
  async sendVerificationRequest({ identifier: email, provider, token }) {
    await sendResendEmail({
      apiKey: (provider as any).apiKey,
      from: (provider as any).from,
      to: email,
      subject: "Verify your email",
      html: `<p>Your verification code is:</p><p style="font-size:20px;font-weight:700;letter-spacing:2px">${token}</p><p>This code expires in 10 minutes.</p>`,
    });
  },
});

export const ResendOTPPasswordReset = Email({
  id: "resend-otp-reset",
  maxAge: 60 * 15, // 15 minutes
  apiKey: process.env.RESEND_API_KEY,
  from: process.env.RESEND_FROM,
  async generateVerificationToken() {
    return generateNumericCode(6);
  },
  async sendVerificationRequest({ identifier: email, provider, token }) {
    await sendResendEmail({
      apiKey: (provider as any).apiKey,
      from: (provider as any).from,
      to: email,
      subject: "Reset your password",
      html: `<p>Your password reset code is:</p><p style="font-size:20px;font-weight:700;letter-spacing:2px">${token}</p><p>This code expires in 15 minutes.</p>`,
    });
  },
});


