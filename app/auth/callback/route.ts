import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") || "/reviewers";

  if (!code) {
    // If next is /creator, redirect to reviewer-login instead of regular login
    const loginUrl = next === "/creator" ? "/reviewer-login" : "/login";
    return NextResponse.redirect(new URL(loginUrl, request.url));
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

    if (error || !data.user || !data.session) {
      // If next is /creator, redirect to reviewer-login instead of regular login
      const loginUrl = next === "/creator" ? "/reviewer-login" : "/login";
      return NextResponse.redirect(new URL(loginUrl, request.url));
    }

    // If redirecting to creator dashboard, verify user is a reviewer
    if (next === "/creator") {
      const { data: reviewerProfile } = await supabase
        .from("reviewers")
        .select("id")
        .eq("user_id", data.user.id)
        .single();

      if (!reviewerProfile) {
        // User is not a reviewer, redirect to reviewer login with error
        return NextResponse.redirect(new URL("/reviewer-login?error=not_reviewer", request.url));
      }
    }

    // Create the redirect response
    const redirectUrl = new URL(next, request.url);
    const response = NextResponse.redirect(redirectUrl);

    // Ensure cookies are properly set for the session
    return response;
  } catch (error) {
    // If next is /creator, redirect to reviewer-login instead of regular login
    const loginUrl = next === "/creator" ? "/reviewer-login" : "/login";
    return NextResponse.redirect(new URL(loginUrl, request.url));
  }
}
