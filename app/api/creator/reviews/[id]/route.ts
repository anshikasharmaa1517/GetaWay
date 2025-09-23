import { NextResponse } from "next/server";
import { getServerSupabaseClient } from "@/lib/supabase-server";
import { getAdminSupabaseClient } from "@/lib/supabase-admin";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const supabase = await getServerSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError)
      return NextResponse.json({ error: userError.message }, { status: 401 });
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { score, feedback, status } = body;

    if (!score || !feedback || !status) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get reviewer profile
    const { data: reviewerProfile } = await supabase
      .from("reviewers")
      .select("id, user_id")
      .eq("user_id", user.id)
      .single();

    if (!reviewerProfile) {
      return NextResponse.json(
        { error: "No reviewer profile found" },
        { status: 404 }
      );
    }

    // Use admin client to update the resume
    const admin = getAdminSupabaseClient();

    // Update the resume with score and notes
    const { error: updateError } = await admin
      .from("resumes")
      .update({
        score: parseInt(score),
        notes: feedback,
        status: status,
      })
      .eq("id", resolvedParams.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Create or update review record
    const { error: reviewError } = await admin.from("reviews").upsert(
      {
        reviewer_id: reviewerProfile.user_id,
        resume_id: resolvedParams.id,
        score: parseInt(score),
        feedback: feedback,
      },
      {
        onConflict: "reviewer_id,resume_id",
      }
    );

    if (reviewError) {
      console.error("Error creating review record:", reviewError);
      // Don't fail the request if review record creation fails
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error in creator review API:", error);
    return NextResponse.json(
      { error: error?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
