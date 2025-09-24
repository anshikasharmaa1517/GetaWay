import { NextRequest, NextResponse } from "next/server";
import { getServerSupabaseClient } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await getServerSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { reviewer_id, resume_id, rating, comment } = body;

    // Validate required fields
    if (!reviewer_id || !resume_id || !rating) {
      return NextResponse.json(
        { error: "Missing required fields: reviewer_id, resume_id, rating" },
        { status: 400 }
      );
    }

    // Validate rating range
    if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      return NextResponse.json(
        { error: "Rating must be an integer between 1 and 5" },
        { status: 400 }
      );
    }

    // Check if the user has received a review for this resume from this reviewer
    const { data: resumeData, error: resumeError } = await supabase
      .from("resumes")
      .select("id, user_id, reviewer_slug")
      .eq("id", resume_id)
      .eq("user_id", user.id)
      .single();

    if (resumeError || !resumeData) {
      return NextResponse.json(
        { error: "Resume not found or access denied" },
        { status: 404 }
      );
    }

    // Verify that the reviewer actually reviewed this resume
    const { data: reviewData, error: reviewError } = await supabase
      .from("resumes")
      .select("review_status, score")
      .eq("id", resume_id)
      .single();

    if (reviewError || !reviewData || !reviewData.review_status) {
      return NextResponse.json(
        { error: "No review found for this resume" },
        { status: 400 }
      );
    }

    // Get the reviewer record to ensure it exists
    const { data: reviewerData, error: reviewerError } = await supabase
      .from("reviewers")
      .select("id")
      .eq("id", reviewer_id)
      .single();

    if (reviewerError || !reviewerData) {
      return NextResponse.json(
        { error: "Reviewer not found" },
        { status: 404 }
      );
    }

    // Upsert the rating
    const { data, error } = await supabase
      .from("reviewer_ratings")
      .upsert(
        {
          user_id: user.id,
          reviewer_id: reviewer_id,
          resume_id: resume_id,
          rating: rating,
          comment: comment || null,
        },
        {
          onConflict: "user_id,reviewer_id,resume_id",
        }
      )
      .select()
      .single();

    if (error) {
      console.error("Error saving reviewer rating:", error);
      return NextResponse.json(
        { error: "Failed to save rating" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      rating: data,
      message: "Rating saved successfully",
    });
  } catch (error: any) {
    console.error("Error in reviewer ratings API:", error);
    return NextResponse.json(
      { error: error?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await getServerSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const resume_id = searchParams.get("resume_id");
    const reviewer_id = searchParams.get("reviewer_id");

    if (!resume_id || !reviewer_id) {
      return NextResponse.json(
        { error: "Missing resume_id or reviewer_id" },
        { status: 400 }
      );
    }

    // Get existing rating
    const { data, error } = await supabase
      .from("reviewer_ratings")
      .select("*")
      .eq("user_id", user.id)
      .eq("reviewer_id", reviewer_id)
      .eq("resume_id", resume_id)
      .maybeSingle();

    if (error) {
      console.error("Error fetching reviewer rating:", error);
      return NextResponse.json(
        { error: "Failed to fetch rating" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      rating: data,
    });
  } catch (error: any) {
    console.error("Error in reviewer ratings GET API:", error);
    return NextResponse.json(
      { error: error?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
