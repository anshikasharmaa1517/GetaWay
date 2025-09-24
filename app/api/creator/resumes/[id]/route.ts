import { NextResponse } from "next/server";
import { getServerSupabaseClient } from "@/lib/supabase-server";
import { getAdminSupabaseClient } from "@/lib/supabase-admin";

export async function GET(
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

    // Get reviewer profile to verify access
    const { data: reviewerProfile } = await supabase
      .from("reviewers")
      .select("slug")
      .eq("user_id", user.id)
      .single();

    if (!reviewerProfile?.slug) {
      return NextResponse.json(
        { error: "No reviewer profile found" },
        { status: 404 }
      );
    }

    // Use admin client to get the specific resume
    const admin = getAdminSupabaseClient();
    const { data: resume, error: resumeError } = await admin
      .from("resumes")
      .select(
        `
        id,
        file_url,
        status,
        review_status,
        score,
        notes,
        created_at,
        user_id
      `
      )
      .eq("id", resolvedParams.id)
      .eq("reviewer_slug", reviewerProfile.slug)
      .single();

    if (resumeError || !resume) {
      return NextResponse.json({ error: "Resume not found" }, { status: 404 });
    }

    // Get user details
    const { data: authUser, error: authError } =
      await admin.auth.admin.getUserById(resume.user_id);

    if (authError) {
      return NextResponse.json(
        { error: "Failed to fetch user data" },
        { status: 500 }
      );
    }

    // Get the best available name
    const getName = () => {
      const metadata = authUser?.user?.user_metadata;
      if (metadata?.full_name) return metadata.full_name;
      if (metadata?.name) return metadata.name;
      if (metadata?.display_name) return metadata.display_name;
      if (metadata?.first_name && metadata?.last_name) {
        return `${metadata.first_name} ${metadata.last_name}`;
      }
      if (metadata?.first_name) return metadata.first_name;
      if (metadata?.last_name) return metadata.last_name;
      return null;
    };

    const userName = getName();

    const resumeWithUser = {
      ...resume,
      user: {
        email: authUser?.user?.email || "No Email",
        full_name: userName || "User",
        avatar_url:
          authUser?.user?.user_metadata?.avatar_url ||
          authUser?.user?.user_metadata?.picture ||
          null,
      },
    };

    return NextResponse.json({ resume: resumeWithUser });
  } catch (error: any) {
    console.error("Error in creator resume API:", error);
    return NextResponse.json(
      { error: error?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
