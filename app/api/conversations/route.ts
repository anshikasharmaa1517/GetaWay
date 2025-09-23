import { NextResponse } from "next/server";
import { getServerSupabaseClient } from "@/lib/supabase-server";

export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const resumeId = searchParams.get("resume_id");

    if (!resumeId) {
      return NextResponse.json({ error: "Resume ID required" }, { status: 400 });
    }

    // Get conversation for this resume
    const { data: conversation, error: convError } = await supabase
      .from("conversations")
      .select(`
        id,
        resume_id,
        user_id,
        reviewer_id,
        created_at,
        updated_at
      `)
      .eq("resume_id", resumeId)
      .single();

    if (convError && convError.code !== "PGRST116") {
      return NextResponse.json({ error: convError.message }, { status: 500 });
    }

    // If no conversation exists, create one
    if (!conversation) {
      // Get resume details to find user and reviewer
      const { data: resume, error: resumeError } = await supabase
        .from("resumes")
        .select("user_id, reviewer_slug")
        .eq("id", resumeId)
        .single();

      if (resumeError) {
        return NextResponse.json({ error: resumeError.message }, { status: 500 });
      }

      // Get reviewer user_id from slug
      const { data: reviewer, error: reviewerError } = await supabase
        .from("reviewers")
        .select("user_id")
        .eq("slug", resume.reviewer_slug)
        .single();

      if (reviewerError) {
        return NextResponse.json({ error: reviewerError.message }, { status: 500 });
      }

      // Create conversation
      const { data: newConversation, error: createError } = await supabase
        .from("conversations")
        .insert({
          resume_id: resumeId,
          user_id: resume.user_id,
          reviewer_id: reviewer.user_id,
        })
        .select()
        .single();

      if (createError) {
        return NextResponse.json({ error: createError.message }, { status: 500 });
      }

      return NextResponse.json({ conversation: newConversation, messages: [] });
    }

    // Get messages for this conversation
    const { data: messages, error: messagesError } = await supabase
      .from("messages")
      .select(`
        id,
        sender_id,
        message,
        message_type,
        created_at
      `)
      .eq("conversation_id", conversation.id)
      .order("created_at", { ascending: true });

    if (messagesError) {
      return NextResponse.json({ error: messagesError.message }, { status: 500 });
    }

    return NextResponse.json({ conversation, messages: messages || [] });
  } catch (error: any) {
    console.error("Error in conversations API:", error);
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

    if (userError)
      return NextResponse.json({ error: userError.message }, { status: 401 });
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { conversation_id, message, message_type = "text" } = body;

    if (!conversation_id || !message) {
      return NextResponse.json(
        { error: "Conversation ID and message required" },
        { status: 400 }
      );
    }

    // Send message
    const { data: newMessage, error: messageError } = await supabase
      .from("messages")
      .insert({
        conversation_id,
        sender_id: user.id,
        message,
        message_type,
      })
      .select()
      .single();

    if (messageError) {
      return NextResponse.json({ error: messageError.message }, { status: 500 });
    }

    return NextResponse.json({ message: newMessage });
  } catch (error: any) {
    console.error("Error in conversations POST API:", error);
    return NextResponse.json(
      { error: error?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
