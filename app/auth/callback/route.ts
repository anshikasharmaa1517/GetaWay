import { NextResponse } from "next/server";
import { getServerSupabaseClient } from "@/lib/supabase-server";
import { getDefaultRedirectPath } from "@/lib/roles";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");

  if (code) {
    const supabase = await getServerSupabaseClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.exchangeCodeForSession(code);

    if (error || !user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Determine user role and redirect accordingly
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      const role = profile?.role || "user";
      const redirectPath = next || getDefaultRedirectPath(role as any);

      return NextResponse.redirect(new URL(redirectPath, request.url));
    } catch {
      // Fallback to requested path or dashboard
      const fallbackPath = next || "/dashboard";
      return NextResponse.redirect(new URL(fallbackPath, request.url));
    }
  }

  return NextResponse.redirect(new URL("/login", request.url));
}
