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

function normalizeLinkedInUrl(input: string | null | undefined): string | null {
  if (!input) return null;
  try {
    const u = new URL(input);
    if (!u.hostname.includes("linkedin.com")) return input.trim();
    // Keep scheme-agnostic, store host + pathname only, lowercase, trim trailing slash
    let normalized = `${u.hostname}${u.pathname}`.toLowerCase();
    if (normalized.endsWith("/")) normalized = normalized.slice(0, -1);
    return normalized;
  } catch {
    return input.trim();
  }
}

function limitWords(
  s: string | null | undefined,
  maxWords = 50
): string | null {
  if (!s) return s ?? null;
  const words = s.trim().split(/\s+/);
  if (words.length <= maxWords) return s;
  return words.slice(0, maxWords).join(" ");
}

export async function GET(req: NextRequest) {
  const supabase = await getServerSupabaseClient();
  const { searchParams } = new URL(req.url);
  const role = (searchParams.get("role") || "").toLowerCase();
  const slug = searchParams.get("slug");
  const id = searchParams.get("id");
  const me = searchParams.get("me") === "1";

  if (me) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "not_authenticated" }), {
        status: 401,
        headers: { "content-type": "application/json" },
      });
    }
    const { data, error } = await supabase
      .from("reviewers")
      .select(
        "id, user_id, display_name, photo_url, company, experience_years, headline, country, expertise, rating, reviews, slug, social_link"
      )
      .eq("user_id", user.id)
      .single();
    if (error && error.code !== "PGRST116") {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "content-type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ reviewer: data ?? null }), {
      headers: { "content-type": "application/json" },
    });
  }

  if (slug) {
    console.log("Looking for reviewer with slug:", slug);
    const { data, error } = await supabase
      .from("reviewers")
      .select(
        "id, user_id, display_name, photo_url, company, experience_years, headline, country, expertise, rating, reviews, slug, social_link"
      )
      .eq("slug", slug)
      .single();

    console.log("Database query result:", { data, error });

    if (error && error.code !== "PGRST116") {
      console.log("Database error:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 404,
        headers: { "content-type": "application/json" },
      });
    }

    if (!data) {
      console.log("No reviewer found with slug:", slug);
      return new Response(JSON.stringify({ reviewer: null }), {
        status: 404,
        headers: { "content-type": "application/json" },
      });
    }

    // Get follower count
    let followerCount = 0;
    if (data) {
      const { count } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("reviewer_id", data.user_id);
      followerCount = count || 0;
    }

    const reviewerWithStats = data
      ? {
          ...data,
          follower_count: followerCount,
        }
      : null;

    return new Response(JSON.stringify({ reviewer: reviewerWithStats }), {
      headers: { "content-type": "application/json" },
    });
  }

  // Handle ID-based lookup as fallback
  if (id) {
    console.log("Looking for reviewer with ID:", id);
    const { data, error } = await supabase
      .from("reviewers")
      .select(
        "id, user_id, display_name, photo_url, company, experience_years, headline, country, expertise, rating, reviews, slug, social_link"
      )
      .eq("id", id)
      .single();

    console.log("Database query result by ID:", { data, error });

    if (error && error.code !== "PGRST116") {
      console.log("Database error:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 404,
        headers: { "content-type": "application/json" },
      });
    }

    if (!data) {
      console.log("No reviewer found with ID:", id);
      return new Response(JSON.stringify({ reviewer: null }), {
        status: 404,
        headers: { "content-type": "application/json" },
      });
    }

    // Get follower count
    let followerCount = 0;
    if (data) {
      const { count } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("reviewer_id", data.user_id);
      followerCount = count || 0;
    }

    const reviewerWithStats = data
      ? {
          ...data,
          follower_count: followerCount,
        }
      : null;

    return new Response(JSON.stringify({ reviewer: reviewerWithStats }), {
      headers: { "content-type": "application/json" },
    });
  }

  async function fetchAll(limit = 50) {
    return await supabase
      .from("reviewers")
      .select(
        "id, user_id, display_name, photo_url, company, experience_years, headline, country, expertise, rating, reviews, slug"
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
        "id, user_id, display_name, photo_url, company, experience_years, headline, country, expertise, rating, reviews, slug"
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

  const transformed = (data ?? []).map((r) => {
    console.log("Raw reviewer from DB:", {
      display_name: r.display_name,
      company: r.company,
      slug: r.slug,
    });
    return {
      id: r.id,
      user_id: r.user_id, // Add user_id for follow status
      name: r.display_name ?? "",
      role:
        Array.isArray(r.expertise) && r.expertise.length > 0
          ? r.expertise[0]
          : "",
      company: r.company || "", // Use || instead of ?? to handle empty strings
      headline: r.headline ?? "",
      experienceYears: r.experience_years ?? 0,
      photoUrl: r.photo_url ?? "https://i.pravatar.cc/100?img=1",
      rating: typeof r.rating === "number" ? r.rating : 0,
      reviews: typeof r.reviews === "number" ? r.reviews : 0,
      slug: r.slug ?? null,
    };
  });

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
  const socialRaw: string | null = body.social_link ?? null;
  const social: string | null = normalizeLinkedInUrl(socialRaw);

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
  // Enforce unique LinkedIn/social link across reviewers
  if (social) {
    const { data: existing, error: existingErr } = await supabase
      .from("reviewers")
      .select("id,user_id,social_link")
      .eq("social_link", social)
      .maybeSingle();
    if (!existingErr && existing && existing.user_id !== user.id) {
      return new Response(
        JSON.stringify({
          error: "social_link_taken",
          message:
            "This LinkedIn profile is already registered by another reviewer.",
        }),
        { status: 409, headers: { "content-type": "application/json" } }
      );
    }
  }

  const payload = {
    user_id: user.id,
    display_name: body.display_name ?? null,
    photo_url: photoUrl,
    company: body.company ?? null,
    experience_years: body.experience_years ?? null,
    headline: limitWords(body.headline, 50),
    country: body.country ?? null,
    expertise: Array.isArray(body.expertise) ? body.expertise : [],
    slug: body.slug ?? null,
    social_link: social,
  };

  // Try to find existing reviewer by user_id first
  const { data: existing } = await supabase
    .from("reviewers")
    .select("id, slug")
    .eq("user_id", user.id)
    .maybeSingle();

  console.log("Existing reviewer for user:", existing);
  console.log("Payload slug:", payload.slug);

  let data, error;

  if (existing) {
    // Update existing reviewer
    const result = await supabase
      .from("reviewers")
      .update(payload)
      .eq("user_id", user.id)
      .select()
      .single();
    data = result.data;
    error = result.error;
  } else {
    // Check if slug is already taken by another user, generate unique one if needed
    if (payload.slug) {
      let finalSlug = payload.slug;
      let counter = 1;

      console.log("Checking slug conflicts for:", finalSlug);

      while (true) {
        const { data: slugExists } = await supabase
          .from("reviewers")
          .select("id, user_id")
          .eq("slug", finalSlug)
          .maybeSingle();

        console.log("Slug check result:", slugExists);

        // If no slug exists, or if it exists but belongs to the same user, we can use it
        if (!slugExists || slugExists.user_id === user.id) {
          console.log("Slug is available or belongs to same user");
          break;
        }

        // Generate alternative slug
        finalSlug = `${payload.slug}-${counter}`;
        counter++;
        console.log("Trying alternative slug:", finalSlug);

        // Prevent infinite loop
        if (counter > 100) {
          return new Response(
            JSON.stringify({
              error: "slug_generation_failed",
              message:
                "Unable to generate a unique page link. Please try a different one.",
            }),
            {
              status: 400,
              headers: { "content-type": "application/json" },
            }
          );
        }
      }

      console.log("Final slug:", finalSlug);
      payload.slug = finalSlug;
    }

    // Insert new reviewer
    const result = await supabase
      .from("reviewers")
      .insert(payload)
      .select()
      .single();
    data = result.data;
    error = result.error;

    // If reviewer creation was successful, update user's role to 'reviewer'
    if (!error && data) {
      console.log(
        "Reviewer created successfully, updating user role to 'reviewer' for user:",
        user.id
      );

      // Simple profile update using the same pattern as user profiles
      const { error: profileError } = await supabase.from("profiles").upsert({
        id: user.id,
        role: "reviewer",
        onboarded: true,
      });

      if (profileError) {
        console.error("Error updating user profile:", profileError);
        return new Response(
          JSON.stringify({ error: "Failed to update user profile" }),
          {
            status: 500,
            headers: { "content-type": "application/json" },
          }
        );
      }

      console.log("User profile updated successfully with reviewer role");
    }
  }

  if (error) {
    console.error("Reviewers API error:", error);
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
