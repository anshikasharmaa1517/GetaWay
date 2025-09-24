import { NextResponse } from "next/server";
import { getServerSupabaseClient } from "@/lib/supabase-server";

export async function GET() {
  try {
    const supabase = await getServerSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.log("GET /api/experiences - Auth error:", { user: user?.id, userError });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the reviewer record for this user
    const { data: reviewer } = await supabase
      .from("reviewers")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!reviewer) {
      return NextResponse.json({ experiences: [] });
    }

    // Get experiences for the current user
    const { data: experiences, error } = await supabase
      .from("experiences")
      .select("*")
      .eq("reviewer_id", reviewer.id)
      .order("start_date", { ascending: false });

    if (error) {
      console.error("Error fetching experiences:", error);
      return NextResponse.json({ error: "Failed to fetch experiences" }, { status: 500 });
    }

    return NextResponse.json({ experiences });
  } catch (error: any) {
    console.error("Error in experiences API:", error);
    return NextResponse.json(
      { error: error?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await getServerSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    console.log("POST /api/experiences - User:", { user: user?.id, userError });

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    console.log("POST /api/experiences - Body:", body);
    
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
      console.log("POST /api/experiences - Missing required fields");
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get the reviewer record for this user
    const { data: reviewer } = await supabase
      .from("reviewers")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!reviewer) {
      return NextResponse.json({ error: "Reviewer profile not found" }, { status: 404 });
    }

    const insertData = {
      reviewer_id: reviewer.id,
      title,
      company,
      employment_type,
      location,
      location_type,
      start_date,
      end_date: currently_working ? null : end_date,
      currently_working,
    };
    console.log("POST /api/experiences - Insert data:", insertData);

    // Create new experience
    const { data: experience, error } = await supabase
      .from("experiences")
      .insert(insertData)
      .select()
      .single();

    console.log("POST /api/experiences - Result:", { experience, error });

    if (error) {
      console.error("Error creating experience:", error);
      return NextResponse.json({ 
        error: "Failed to create experience", 
        details: error.message 
      }, { status: 500 });
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
