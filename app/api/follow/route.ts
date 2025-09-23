import { NextRequest } from "next/server";
import { getServerSupabaseClient } from "@/lib/supabase-server";

// Follows table schema (expected):
// create table public.follows (
//   follower_id uuid not null references auth.users(id) on delete cascade,
//   reviewer_id uuid not null references auth.users(id) on delete cascade,
//   created_at timestamptz default now(),
//   primary key (follower_id, reviewer_id)
// );

export async function GET(req: NextRequest) {
  const supabase = await getServerSupabaseClient();
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  if (!slug) return new Response("Missing slug", { status: 400 });

  const { data: reviewer } = await supabase
    .from("reviewers")
    .select("user_id")
    .eq("slug", slug)
    .single();
  if (!reviewer)
    return new Response(JSON.stringify({ following: false }), {
      headers: { "content-type": "application/json" },
    });

  const { data: follow } = await supabase
    .from("follows")
    .select("follower_id")
    .eq("follower_id", user.id)
    .eq("reviewer_id", reviewer.user_id)
    .maybeSingle();

  return new Response(JSON.stringify({ following: !!follow }), {
    headers: { "content-type": "application/json" },
  });
}

export async function POST(req: NextRequest) {
  const supabase = await getServerSupabaseClient();
  let slug: string | null = null;
  let action: string | null = null;
  let nextUrl: string | null = null;

  const ctype = req.headers.get("content-type") || "";
  try {
    if (ctype.includes("application/x-www-form-urlencoded")) {
      const form = await req.formData();
      slug = (form.get("slug") as string) || null;
      action = (form.get("action") as string) || null;
      nextUrl = (form.get("next") as string) || null;
    } else if (ctype.includes("application/json")) {
      const body = await req.json();
      slug = body.slug ?? null;
      action = body.action ?? null;
      nextUrl = body.next ?? null;
    } else {
      const { searchParams } = new URL(req.url);
      slug = searchParams.get("slug");
      action = searchParams.get("action");
      nextUrl = searchParams.get("next");
    }
  } catch {}
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  if (!slug || !action) return new Response("Bad request", { status: 400 });

  const { data: reviewer, error } = await supabase
    .from("reviewers")
    .select("user_id")
    .eq("slug", slug)
    .single();
  if (error || !reviewer) return new Response("Not found", { status: 404 });

  if (action === "follow") {
    await supabase
      .from("follows")
      .upsert({ follower_id: user.id, reviewer_id: reviewer.user_id });
    const acceptsHtml = (req.headers.get("accept") || "").includes("text/html");
    if (ctype.includes("application/x-www-form-urlencoded") || acceptsHtml) {
      const dest = nextUrl || `/r/${slug}`;
      return Response.redirect(new URL(dest, req.url), 303);
    }
    return new Response(JSON.stringify({ following: true }), {
      headers: { "content-type": "application/json" },
    });
  }
  if (action === "unfollow") {
    await supabase
      .from("follows")
      .delete()
      .eq("follower_id", user.id)
      .eq("reviewer_id", reviewer.user_id);
    const acceptsHtml = (req.headers.get("accept") || "").includes("text/html");
    if (ctype.includes("application/x-www-form-urlencoded") || acceptsHtml) {
      const dest = nextUrl || `/r/${slug}`;
      return Response.redirect(new URL(dest, req.url), 303);
    }
    return new Response(JSON.stringify({ following: false }), {
      headers: { "content-type": "application/json" },
    });
  }
  return new Response("Bad request", { status: 400 });
}
