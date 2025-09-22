import { NextRequest } from "next/server";
import { getServerSupabaseClient } from "@/lib/supabase-server";

async function tryFetchOpenGraphImage(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "user-agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
        accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      cache: "no-store",
    });
    clearTimeout(timeoutId);
    if (!res.ok) return null;
    const html = await res.text();
    const matchMeta = (name: string) =>
      html.match(
        new RegExp(
          `<meta[^>]+property=["']${name}["'][^>]+content=["']([^"']+)["']`,
          "i"
        )
      ) ||
      html.match(
        new RegExp(
          `<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']+)["']`,
          "i"
        )
      );
    const og = matchMeta("og:image");
    if (og && og[1]) return og[1];
    const tw = matchMeta("twitter:image");
    if (tw && tw[1]) return tw[1];
  } catch {}
  return null;
}

export async function GET(req: NextRequest) {
  const supabase = await getServerSupabaseClient();
  const { searchParams } = new URL(req.url);
  const role = (searchParams.get("role") || "").toLowerCase();

  async function fetchAll(limit = 50) {
    return await supabase
      .from("reviewers")
      .select(
        "id, user_id, display_name, photo_url, company, experience_years, headline, country, expertise, rating, reviews"
      )
      .order("rating", { ascending: false })
      .order("reviews", { ascending: false })
      .limit(limit);
  }

  let data: any[] | null = null;
  let error: any = null;

  if (role) {
    // Try headline match first
    const attempt = await supabase
      .from("reviewers")
      .select(
        "id, user_id, display_name, photo_url, company, experience_years, headline, country, expertise, rating, reviews"
      )
      .ilike("headline", `%${role}%`)
      .order("rating", { ascending: false })
      .order("reviews", { ascending: false })
      .limit(50);
    data = attempt.data;
    error = attempt.error;

    // Fallback: if no headline matches, return general top reviewers
    if (!error && (data == null || data.length === 0)) {
      const fallback = await fetchAll();
      data = fallback.data;
      error = fallback.error;
    }
  } else {
    const all = await fetchAll();
    data = all.data;
    error = all.error;
  }

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }

  const transformed = (data ?? []).map((r) => ({
    id: r.id,
    name: r.display_name ?? "",
    role:
      r.headline ??
      (Array.isArray(r.expertise) && r.expertise.length > 0
        ? r.expertise[0]
        : ""),
    company: r.company ?? "",
    headline: r.headline ?? "",
    experienceYears: r.experience_years ?? 0,
    photoUrl: r.photo_url ?? "https://i.pravatar.cc/100?img=1",
    rating: typeof r.rating === "number" ? r.rating : 0,
    reviews: typeof r.reviews === "number" ? r.reviews : 0,
  }));

  return new Response(JSON.stringify({ reviewers: transformed }), {
    headers: { "content-type": "application/json" },
  });
}

export async function POST(req: NextRequest) {
  const supabase = await getServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new Response(JSON.stringify({ error: "not_authenticated" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }

  const body = await req.json().catch(() => ({}));
  let photoUrl: string | null = body.photo_url ?? null;
  const social: string | null = body.social_link ?? null;

  if (
    !photoUrl &&
    typeof social === "string" &&
    social.includes("linkedin.com")
  ) {
    const img = await tryFetchOpenGraphImage(social);
    if (img) photoUrl = img;
  }

  if (!photoUrl) {
    const seed = encodeURIComponent(body.display_name ?? "Reviewer");
    photoUrl = `https://ui-avatars.com/api/?name=${seed}&background=EEE&color=555&rounded=true&size=128`;
  }
  const payload = {
    user_id: user.id,
    display_name: body.display_name ?? null,
    photo_url: photoUrl,
    company: body.company ?? null,
    experience_years: body.experience_years ?? null,
    headline: body.headline ?? null,
    country: body.country ?? null,
    expertise: Array.isArray(body.expertise) ? body.expertise : [],
    slug: body.slug ?? null,
    social_link: body.social_link ?? null,
  };

  const { data, error } = await supabase
    .from("reviewers")
    .upsert(payload, { onConflict: "slug" })
    .select()
    .single();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }
  return new Response(JSON.stringify({ reviewer: data }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}
