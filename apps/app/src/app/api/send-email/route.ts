import { NextRequest, NextResponse } from "next/server";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { api } from "../../../../convex/_generated/api";

/**
 * Sends a test of the email being edited — only to the signed-in user's own address, only
 * from our own sender, and within their daily quota. Everything that decides who gets mail
 * and who it's from is set here on the server; the request body only supplies content.
 */
const FROM = `drag.email <${process.env.RESEND_SEND_FROM || "mail@drag.email"}>`;
const MAX_HTML = 512 * 1024;

export async function POST(request: NextRequest) {
  try {
    const token = await convexAuthNextjsToken();
    if (!token) {
      return NextResponse.json({ error: "Please sign in to send a test email." }, { status: 401 });
    }

    const user = await fetchQuery(api.users.current, {}, { token });
    const own = user?.email?.trim().toLowerCase();
    if (!own) {
      return NextResponse.json({ error: "Please sign in to send a test email." }, { status: 401 });
    }

    const { to, subject, html } = await request.json();
    if (typeof subject !== "string" || typeof html !== "string" || !subject || !html) {
      return NextResponse.json({ error: "Missing subject or html" }, { status: 400 });
    }
    if (typeof to === "string" && to.trim().toLowerCase() !== own) {
      return NextResponse.json(
        { error: "Test emails can only be sent to your own email address." },
        { status: 403 },
      );
    }
    if (subject.length > 200 || html.length > MAX_HTML) {
      return NextResponse.json({ error: "Email is too large to send." }, { status: 413 });
    }

    // Counts against the user's daily email_send quota; throws when it's used up.
    try {
      await fetchMutation(api.rateLimits.consume, { action: "email_send" }, { token });
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Daily send limit reached." },
        { status: 429 },
      );
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      return NextResponse.json({ success: true, demo: true });
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: FROM,
        to: [own],
        subject: subject.replace(/[\r\n]+/g, " "),
        html,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Resend API error:", errorData);
      return NextResponse.json({ error: "Failed to send email" }, { status: 502 });
    }

    const data = await response.json();
    return NextResponse.json({ success: true, messageId: data.id });
  } catch (error) {
    console.error("Send email error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
