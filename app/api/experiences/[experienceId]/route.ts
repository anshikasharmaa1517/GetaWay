import { NextResponse } from "next/server";
import { getServerSupabaseClient } from "@/lib/supabase-server";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ experienceId: string }> }
) {
  try {
    const resolvedParams = await params;
    const supabase = await getServerSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      company,
      employment_type,
      location,
      location_type,
      start_date,
      end_date,
      currently_working,
    } = body;

    // Validate required fields
    if (!title || !company || !employment_type || !start_date) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Update experience
    const { data: experience, error } = await supabase
      .from("experiences")
      .update({
        title,
        company,
        employment_type,
        location,
        location_type,
        start_date,
        end_date: currently_working ? null : end_date,
        currently_working,
      })
      .eq("id", resolvedParams.experienceId)
      .eq("reviewer_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating experience:", error);
      return NextResponse.json(
        { error: "Failed to update experience" },
        { status: 500 }
      );
    }

    if (!experience) {
      return NextResponse.json(
        { error: "Experience not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ experience });
  } catch (error: any) {
    console.error("Error in experiences API:", error);
    return NextResponse.json(
      { error: error?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ experienceId: string }> }
) {
  try {
    const resolvedParams = await params;
    const supabase = await getServerSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Delete experience
    const { error } = await supabase
      .from("experiences")
      .delete()
      .eq("id", resolvedParams.experienceId)
      .eq("reviewer_id", user.id);

    if (error) {
      console.error("Error deleting experience:", error);
      return NextResponse.json(
        { error: "Failed to delete experience" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error in experiences API:", error);
    return NextResponse.json(
      { error: error?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
