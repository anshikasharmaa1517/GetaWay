import { NextResponse } from "next/server";
import { getServerSupabaseClient } from "@/lib/supabase-server";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const supabase = await getServerSupabaseClient();
  const form = await request.formData();
  const status = String(form.get("status"));
  const scoreRaw = form.get("score");
  const notes = form.get("notes");
  const score = scoreRaw === null || scoreRaw === "" ? null : Number(scoreRaw);

  const { error } = await supabase
    .from("resumes")
    .update({ status, score, notes })
    .eq("id", params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Optional: send notification via RPC or external email service here

  return NextResponse.redirect(new URL("/admin", request.url));
}


