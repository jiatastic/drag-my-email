import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { to, from, subject, html } = await request.json();

    // Validate required fields
    if (!to || !from || !subject || !html) {
      return NextResponse.json(
        { error: "Missing required fields: to, from, subject, html" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return NextResponse.json(
        { error: "Invalid recipient email address" },
        { status: 400 }
      );
    }

    // Get Resend API key from environment
    const resendApiKey = process.env.RESEND_API_KEY;

    if (!resendApiKey) {
      // For development/demo, log the email and return success
      console.log("📧 Email would be sent (no RESEND_API_KEY configured):");
      console.log(`  To: ${to}`);
      console.log(`  From: ${from}`);
      console.log(`  Subject: ${subject}`);
      console.log(`  HTML length: ${html.length} characters`);
      
      return NextResponse.json({
        success: true,
        message: "Email logged (configure RESEND_API_KEY to actually send)",
        demo: true,
      });
    }

    // Send email using Resend
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Resend API error:", errorData);
      return NextResponse.json(
        { error: errorData.message || "Failed to send email" },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      messageId: data.id,
    });
  } catch (error) {
    console.error("Send email error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
