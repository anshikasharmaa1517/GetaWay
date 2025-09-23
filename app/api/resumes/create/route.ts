import { NextResponse } from "next/server";
import { getServerSupabaseClient } from "@/lib/supabase-server";
import { getAdminSupabaseClient } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  try {
    const supabase = await getServerSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError) return NextResponse.json({ error: userError.message }, { status: 401 });
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const file_url: string | undefined = body?.file_url;
    const status: string = body?.status ?? "Pending";
    const notes: string | undefined = body?.notes;
    const score: number | undefined = body?.score;
    const reviewer_slug: string | undefined = body?.reviewer_slug;
    if (!file_url) return NextResponse.json({ error: "file_url is required" }, { status: 400 });

    const admin = getAdminSupabaseClient();
    const { error } = await admin.from("resumes").insert({
      user_id: user.id,
      status,
      notes,
      score,
      file_url,
      reviewer_slug,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Unknown error" }, { status: 500 });
  }
}


