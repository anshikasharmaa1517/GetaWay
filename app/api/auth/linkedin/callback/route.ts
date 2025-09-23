import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  const cookies = (await import("next/headers")).cookies;
  const cookieStore = await cookies();
  const savedState = cookieStore.get("li_oauth_state")?.value;
  const returnTo = cookieStore.get("li_return_to")?.value || "/become-reviewer";

  if (!code || !state || !savedState || state !== savedState) {
    return NextResponse.redirect(new URL(`${returnTo}?linkedin=error_state`, req.url));
  }

  const clientId = process.env.LINKEDIN_CLIENT_ID!;
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET!;
  const redirectUri = process.env.LINKEDIN_REDIRECT_URI!;

  try {
    const tokenRes = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
      }),
    });
    if (!tokenRes.ok) throw new Error("token_error");
    const tokenJson = (await tokenRes.json()) as { access_token: string };

    const meRes = await fetch(
      "https://api.linkedin.com/v2/me?projection=(id,profilePicture(displayImage~:playableStreams))",
      {
        headers: { Authorization: `Bearer ${tokenJson.access_token}` },
      }
    );
    if (!meRes.ok) throw new Error("me_error");
    const me = await meRes.json();
    let image: string | null = null;
    try {
      const elems = me?.profilePicture?.["displayImage~"]?.elements || [];
      const last = elems[elems.length - 1];
      image = last?.identifiers?.[0]?.identifier || null;
    } catch {}

    const res = NextResponse.redirect(new URL(`${returnTo}?linkedin=success`, req.url));
    if (image) {
      res.cookies.set("li_photo_url", image, {
        httpOnly: false,
        secure: true,
        sameSite: "lax",
        maxAge: 60 * 10,
        path: "/",
      });
      res.cookies.set("li_connected", "1", { httpOnly: false, secure: true, sameSite: "lax", maxAge: 60 * 10, path: "/" });
    }
    // Clear state cookie
    res.cookies.set("li_oauth_state", "", { path: "/", maxAge: 0 });
    return res;
  } catch (e) {
    return NextResponse.redirect(new URL(`${returnTo}?linkedin=error`, req.url));
  }
}


