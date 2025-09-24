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
    
    // Check if there's already a resume shared with this reviewer
    const { data: existingResumes, error: checkError } = await admin
      .from("resumes")
      .select("id, status")
      .eq("user_id", user.id)
      .eq("reviewer_slug", reviewer_slug)
      .order("created_at", { ascending: false });

    if (checkError) {
      return NextResponse.json({ error: checkError.message }, { status: 400 });
    }

    // Get the most recent resume if multiple exist
    const existingResume = existingResumes && existingResumes.length > 0 ? existingResumes[0] : null;

    if (existingResume) {
      // Update existing resume with new file
      const { error: updateError } = await admin
        .from("resumes")
        .update({
          file_url,
          status: "Pending", // Reset status when new resume is shared
          notes: null, // Clear previous notes
          score: null, // Clear previous score
          review_status: null, // Clear previous review status
        })
        .eq("id", existingResume.id);

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 400 });
      }

      return NextResponse.json({ 
        ok: true, 
        action: "updated",
        message: "Resume updated in existing conversation"
      });
    } else {
      // Create new resume entry for first-time interaction
      const { error } = await admin.from("resumes").insert({
        user_id: user.id,
        status,
        notes,
        score,
        file_url,
        reviewer_slug,
      });
      
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json({ 
        ok: true, 
        action: "created",
        message: "New conversation started"
      });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Unknown error" }, { status: 500 });
  }
}


