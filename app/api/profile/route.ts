import { NextResponse } from "next/server";
import { getServerSupabaseClient } from "@/lib/supabase-server";

export async function GET() {
  const supabase = await getServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ onboarded: false });
  const { data } = await supabase
    .from("profiles")
    .select(
      "onboarded, employment_status, student_university, student_degree, student_graduation_year, desired_job_title, desired_location, \"current_role\", years_experience, industry, looking_for"
    )
    .eq("id", user.id)
    .maybeSingle();
  return NextResponse.json(data || { onboarded: false });
}

export async function POST(request: Request) {
  const supabase = await getServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await request.json();
  const payload = {
    id: user.id,
    onboarded: true,
    employment_status: body?.employment_status ?? null,
    student_university: body?.student_university ?? null,
    student_degree: body?.student_degree ?? null,
    student_graduation_year: body?.student_graduation_year ?? null,
    desired_job_title: body?.desired_job_title ?? null,
    desired_location: body?.desired_location ?? null,
    "current_role": body?.current_role ?? null,
    years_experience: body?.years_experience ?? null,
    industry: body?.industry ?? null,
    looking_for: body?.looking_for ?? null,
  };
  const { error } = await supabase.from("profiles").upsert(payload);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
