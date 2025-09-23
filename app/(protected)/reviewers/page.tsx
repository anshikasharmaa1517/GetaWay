import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getServerSupabaseClient } from "@/lib/supabase-server";
import { AppBar } from "@/components/ui/AppBar";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { OnboardingModal } from "@/components/OnboardingModal";

type Reviewer = {
  id: string;
  name: string;
  role: string;
  company: string;
  headline: string;
  experienceYears: number;
  photoUrl: string;
  rating: number;
  reviews: number;
  slug?: string | null;
};

async function getReviewers(role?: string): Promise<Reviewer[]> {
  const hdrs = await headers();
  const host = hdrs.get("host");
  const protocol = process.env.VERCEL ? "https" : "http";
  const base = `${protocol}://${host}`;
  const qs = role ? `?role=${encodeURIComponent(role)}` : "";
  const res = await fetch(`${base}/api/reviewers${qs}`, { cache: "no-store" });
  if (!res.ok) return [];
  const json = (await res.json()) as { reviewers: Reviewer[] };
  return json.reviewers;
}

export default async function ReviewersPage() {
  const supabase = await getServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("desired_job_title")
    .eq("id", user.id)
    .single();

  const reviewers = await getReviewers(profile?.desired_job_title ?? undefined);

  return (
    <div>
      <AppBar />
      <OnboardingModal />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <Card>
          <CardHeader
            title="Top reviewers"
            subtitle={
              profile?.desired_job_title
                ? `For ${profile.desired_job_title}`
                : "Recommended"
            }
          />
          <CardBody>
            <div className="space-y-4">
              {reviewers.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between gap-4 p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={r.photoUrl}
                      alt={r.name}
                      className="h-14 w-14 rounded-full object-cover"
                    />
                    <div>
                      <div className="text-base font-medium">{r.name}</div>
                      <div className="text-sm text-zinc-600">
                        {r.role} · {r.company}
                      </div>
                      <div className="text-xs text-zinc-600">
                        {r.experienceYears} yrs exp · {r.rating.toFixed(1)}★ (
                        {r.reviews})
                      </div>
                      <div className="text-xs text-zinc-600 line-clamp-3">
                        {r.headline}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={r.slug ? `/r/${encodeURIComponent(r.slug)}` : `#`}
                      className="text-sm px-3 py-1 rounded-full border"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View
                    </a>
                    <form method="post" action="/api/follow">
                      <input type="hidden" name="slug" value={r.slug || ""} />
                      <input type="hidden" name="action" value="follow" />
                      <input type="hidden" name="next" value="/reviewers" />
                      <button
                        type="submit"
                        className="text-sm px-3 py-1 rounded-full bg-black text-white"
                      >
                        Follow
                      </button>
                    </form>
                  </div>
                </div>
              ))}
              {reviewers.length === 0 && (
                <p className="text-sm">No reviewers yet.</p>
              )}
            </div>
          </CardBody>
        </Card>
      </main>
    </div>
  );
}
