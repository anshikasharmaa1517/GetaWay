import { NextResponse } from "next/server";
import { getServerSupabaseClient } from "@/lib/supabase-server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const resolvedParams = await params;
    const supabase = await getServerSupabaseClient();

    // First, get the reviewer by slug
    const { data: reviewer, error: reviewerError } = await supabase
      .from("reviewers")
      .select("id, user_id")
      .eq("slug", resolvedParams.slug)
      .single();

    if (reviewerError || !reviewer) {
      return NextResponse.json(
        { error: "Reviewer not found" },
        { status: 404 }
      );
    }

    // Get experiences for this reviewer - try both reviewer.id and user_id
    const { data: experiences, error } = await supabase
      .from("experiences")
      .select("*")
      .or(`reviewer_id.eq.${reviewer.id},reviewer_id.eq.${reviewer.user_id}`)
      .order("start_date", { ascending: false });

    if (error) {
      console.error("Error fetching experiences:", error);
      return NextResponse.json(
        { error: "Failed to fetch experiences", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ experiences: experiences || [] });
  } catch (error: any) {
    console.error("Error in experiences API:", error);
    return NextResponse.json(
      { error: error?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
