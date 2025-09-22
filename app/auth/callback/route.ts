import { NextResponse } from "next/server";
import { getServerSupabaseClient } from "@/lib/supabase-server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/creator";

  if (code) {
    const supabase = await getServerSupabaseClient();
    await supabase.auth.exchangeCodeForSession(code);
    return NextResponse.redirect(new URL(next, request.url));
  }
  return NextResponse.redirect(new URL("/login", request.url));
}
