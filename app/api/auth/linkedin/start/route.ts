import { NextResponse } from "next/server";

function randomState(len = 24) {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let s = "";
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const redirect = url.searchParams.get("redirect") || "/become-reviewer";
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const redirectUri = process.env.LINKEDIN_REDIRECT_URI; // e.g. https://yourapp.com/api/auth/linkedin/callback

  if (!clientId || !redirectUri) {
    return new NextResponse("LinkedIn OAuth not configured", { status: 500 });
  }

  const state = randomState();
  const scope = "r_liteprofile";
  const authUrl = new URL("https://www.linkedin.com/oauth/v2/authorization");
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("scope", scope);

  const res = NextResponse.redirect(authUrl.toString());
  // Persist state and where to return
  res.cookies.set("li_oauth_state", state, { httpOnly: true, secure: true, sameSite: "lax", path: "/" });
  res.cookies.set("li_return_to", redirect, { httpOnly: true, secure: true, sameSite: "lax", path: "/" });
  return res;
}


