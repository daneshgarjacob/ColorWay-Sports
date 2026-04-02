import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { email } = await request.json();

  if (!email || !email.includes("@")) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 400 }
    );
  }

  const API_KEY = process.env.MAILCHIMP_API_KEY;
  const LIST_ID = process.env.MAILCHIMP_LIST_ID;
  const SERVER = process.env.MAILCHIMP_SERVER_PREFIX;

  if (!API_KEY || !LIST_ID || !SERVER) {
    // Mailchimp not configured yet - still accept the email gracefully
    console.log(`[EmailCapture] New subscriber (Mailchimp not configured): ${email}`);
    return NextResponse.json({ success: true });
  }

  try {
    const res = await fetch(
      `https://${SERVER}.api.mailchimp.com/3.0/lists/${LIST_ID}/members`,
      {
        method: "POST",
        headers: {
          Authorization: `apikey ${API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email_address: email,
          status: "subscribed",
        }),
      }
    );

    const data = await res.json();

    if (res.ok) {
      return NextResponse.json({ success: true });
    }

    if (data.title === "Member Exists") {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: "Something went wrong. Try again." },
      { status: 500 }
    );
  } catch {
    return NextResponse.json(
      { error: "Something went wrong. Try again." },
      { status: 500 }
    );
  }
}
