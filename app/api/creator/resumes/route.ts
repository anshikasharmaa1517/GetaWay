import { NextResponse } from "next/server";
import { getServerSupabaseClient } from "@/lib/supabase-server";
import { getAdminSupabaseClient } from "@/lib/supabase-admin";

export async function GET() {
  try {
    const supabase = await getServerSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError)
      return NextResponse.json({ error: userError.message }, { status: 401 });
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Get reviewer profile to get the slug
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

    // Use admin client to bypass RLS and get resumes shared with this reviewer
    const admin = getAdminSupabaseClient();
    const { data: resumes, error: resumesError } = await admin
      .from("resumes")
      .select(
        `
        id,
        file_url,
        status,
        score,
        notes,
        created_at,
        user_id
      `
      )
      .eq("reviewer_slug", reviewerProfile.slug)
      .order("created_at", { ascending: false });

    if (resumesError) {
      console.error("Error fetching resumes:", resumesError);
      return NextResponse.json(
        { error: resumesError.message },
        { status: 500 }
      );
    }

    // Get user details for each resume using admin client
    const resumesWithUsers = await Promise.all(
      (resumes || []).map(async (resume) => {
        // Get user data from auth.users table
        const { data: authUser, error: authError } =
          await admin.auth.admin.getUserById(resume.user_id);

        console.log(
          `Auth user for ${resume.user_id}:`,
          {
            email: authUser?.user?.email,
            full_name: authUser?.user?.user_metadata?.full_name,
            name: authUser?.user?.user_metadata?.name,
            display_name: authUser?.user?.user_metadata?.display_name,
            first_name: authUser?.user?.user_metadata?.first_name,
            last_name: authUser?.user?.user_metadata?.last_name,
            all_metadata: authUser?.user?.user_metadata,
          },
          "Error:",
          authError
        );

        // Try to get the best available name
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

        return {
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
      })
    );

    return NextResponse.json({ resumes: resumesWithUsers });
  } catch (error: any) {
    console.error("Error in creator resumes API:", error);
    return NextResponse.json(
      { error: error?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
