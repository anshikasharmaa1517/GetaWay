import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") || "/reviewers";

  console.log("Auth callback received:", { code: !!code, next, origin });

  if (!code) {
    console.log("No code provided, redirecting to login");
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const cookieStore = await cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: "", ...options });
        },
      },
    }
  );

  try {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    console.log("Exchange result:", { 
      user: !!data.user, 
      session: !!data.session,
      error: error?.message 
    });

    if (error) {
      console.log("Auth error:", error.message);
      return NextResponse.redirect(new URL("/login", request.url));
    }

    if (!data.user || !data.session) {
      console.log("No user or session after exchange");
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Create the redirect response
    const redirectUrl = new URL(next, request.url);
    console.log("Redirecting to:", redirectUrl.toString());
    
    const response = NextResponse.redirect(redirectUrl);
    
    // Set the session cookies manually to ensure they persist
    response.cookies.set('sb-access-token', data.session.access_token, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });
    
    response.cookies.set('sb-refresh-token', data.session.refresh_token, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30 // 30 days
    });

    return response;
  } catch (error) {
    console.log("Callback error:", error);
    return NextResponse.redirect(new URL("/login", request.url));
  }
}
