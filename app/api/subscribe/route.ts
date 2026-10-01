import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { email } = await request.json();

  if (!email || !email.includes("@")) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 400 }
    );
  }

  // beehiiv is the newsletter platform from 2026-09-29. When its two env vars
  // are set in Vercel, new signups go there;
  // until then the Mailchimp path below keeps working unchanged.
  const BEEHIIV_KEY = process.env.BEEHIIV_API_KEY;
  const BEEHIIV_PUB = process.env.BEEHIIV_PUBLICATION_ID;

  if (BEEHIIV_KEY && BEEHIIV_PUB) {
    try {
      const res = await fetch(
        `https://api.beehiiv.com/v2/publications/${BEEHIIV_PUB}/subscriptions`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${BEEHIIV_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            reactivate_existing: false,
            send_welcome_email: true, // beehiiv welcome email (Jake's text + logo signature), on since 9/30
            utm_source: "colorwaysports.com",
            referring_site: "https://www.colorwaysports.com",
          }),
        }
      );

      if (res.ok) {
        return NextResponse.json({ success: true });
      }

      const data = await res.json().catch(() => ({}));
      console.log(`[EmailCapture] beehiiv error for ${email}: ${res.status} ${JSON.stringify(data)}`);

      if (res.status === 400) {
        return NextResponse.json(
          {
            error:
              "That address was not accepted. Check the spelling, or email contact@colorwaysports.com and we will add you by hand.",
          },
          { status: 400 }
        );
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

    // Mailchimp refuses to re-add an address that was deleted, archived or
    // marked as cleaned/compliance through the API, and the generic error we
    // used to return made that look like a broken form. Say what happened and
    // give the reader a way through.
    const title = typeof data.title === "string" ? data.title : "";

    // "Invalid Resource" is Mailchimp saying the address itself looks fake or
    // undeliverable, which is a different problem from an address it refuses
    // to re-add, and it deserves a different sentence.
    if (/invalid resource/i.test(title)) {
      console.log(`[EmailCapture] Mailchimp rejected ${email}: ${data.detail}`);
      return NextResponse.json(
        {
          error:
            "Mailchimp would not accept that address. Check the spelling, or email contact@colorwaysports.com and we will add you by hand.",
        },
        { status: 400 }
      );
    }

    const needsManualAdd = /forgotten|compliance/i.test(title);

    if (needsManualAdd) {
      console.log(`[EmailCapture] Mailchimp refused ${email}: ${title}`);
      return NextResponse.json(
        {
          error:
            "This address was on the list before and Mailchimp will not add it back automatically. Email contact@colorwaysports.com and we will add you by hand.",
        },
        { status: 409 }
      );
    }

    console.log(
      `[EmailCapture] Mailchimp error for ${email}: ${title} / ${data.detail}`
    );

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
