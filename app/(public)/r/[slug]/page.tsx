"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { getBrowserSupabaseClient } from "@/lib/supabase";

type Props = { params: Promise<{ slug: string }> };

type Reviewer = {
  id: string;
  display_name?: string;
  slug: string;
  headline?: string;
  company?: string;
  social_link?: string;
  photo_url?: string;
  follower_count?: number;
  rating?: number;
  review_count?: number;
};

export default function PublicReviewerPage({ params }: Props) {
  const resolvedParams = use(params);
  const [reviewer, setReviewer] = useState<Reviewer | null>(null);
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function loadData() {
      try {
        const supabase = getBrowserSupabaseClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/login");
          return;
        }

        // Get reviewer data
        const res = await fetch(
          `/api/reviewers?slug=${encodeURIComponent(resolvedParams.slug)}`
        );
        if (!res.ok) {
          setReviewer(null);
          return;
        }
        const { reviewer: reviewerData } = await res.json();
        setReviewer(reviewerData);

        // Get following status
        const followRes = await fetch(
          `/api/follow?slug=${encodeURIComponent(resolvedParams.slug)}`
        );
        if (followRes.ok) {
          const followJson = await followRes.json();
          setFollowing(!!followJson.following);
        }
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [resolvedParams.slug, router]);

  async function handleFollow() {
    if (followLoading || !reviewer) return;

    setFollowLoading(true);

    try {
      const action = following ? "unfollow" : "follow";

      const res = await fetch("/api/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: reviewer.slug, action }),
      });

      if (res.ok) {
        setFollowing(!following);
      }
    } catch (error) {
      console.error("Error following/unfollowing:", error);
    } finally {
      setFollowLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50">
        <main className="mx-auto max-w-3xl px-6 py-10">
          <div className="animate-pulse">
            <div className="rounded-3xl bg-white ring-1 ring-zinc-100 shadow-[0_1px_0_rgba(0,0,0,0.06)] p-8">
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 rounded-full bg-zinc-200"></div>
                <div className="flex-1">
                  <div className="h-6 bg-zinc-200 rounded w-1/3 mb-2"></div>
                  <div className="h-4 bg-zinc-200 rounded w-1/2 mb-1"></div>
                  <div className="h-4 bg-zinc-200 rounded w-2/3"></div>
                </div>
              </div>
              <div className="mt-6">
                <div className="h-10 bg-zinc-200 rounded-xl w-40"></div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!reviewer) {
    return (
      <div className="min-h-screen bg-zinc-50">
        <main className="mx-auto max-w-3xl px-6 py-10">
          <h1 className="text-xl font-semibold">Profile not found</h1>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <main className="mx-auto max-w-3xl px-6 py-10">
        <div className="rounded-3xl bg-white ring-1 ring-zinc-100 shadow-[0_1px_0_rgba(0,0,0,0.06)] p-8">
          <div className="flex items-center gap-4">
            {reviewer.photo_url ? (
              <img
                src={reviewer.photo_url}
                alt={reviewer.display_name || reviewer.slug}
                className="h-20 w-20 rounded-full object-cover border"
              />
            ) : (
              <div className="h-20 w-20 rounded-full bg-zinc-200 border" />
            )}
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                {reviewer.display_name || reviewer.slug}
              </h1>
              {reviewer.headline && (
                <p className="text-sm text-zinc-600">{reviewer.headline}</p>
              )}
              {reviewer.company && (
                <p className="text-sm text-zinc-600">
                  Current: {reviewer.company}
                </p>
              )}

              {/* Stats */}
              <div className="flex items-center gap-6 mt-3">
                {reviewer.rating && (
                  <div className="flex items-center gap-1">
                    <svg
                      className="w-4 h-4 text-yellow-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="text-sm font-medium text-zinc-700">
                      {reviewer.rating.toFixed(1)}
                    </span>
                    <span className="text-xs text-zinc-500">
                      ({reviewer.review_count || 0} reviews)
                    </span>
                  </div>
                )}

                {reviewer.follower_count !== undefined && (
                  <div className="flex items-center gap-1">
                    <svg
                      className="w-4 h-4 text-zinc-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                      />
                    </svg>
                    <span className="text-sm font-medium text-zinc-700">
                      {reviewer.follower_count} followers
                    </span>
                  </div>
                )}
              </div>

              {reviewer.social_link && (
                <a
                  href={reviewer.social_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-2 text-sm text-zinc-700 underline"
                >
                  View LinkedIn profile
                </a>
              )}
            </div>
          </div>

          <div className="mt-6">
            {following ? (
              <a
                href={`/upload?to=${encodeURIComponent(resolvedParams.slug)}`}
                className="inline-flex items-center rounded-xl bg-black text-white px-4 py-2 text-sm hover:bg-zinc-900 transition-colors duration-200"
              >
                Share your resume
              </a>
            ) : (
              <button
                onClick={handleFollow}
                disabled={followLoading}
                className="inline-flex items-center rounded-xl border px-4 py-2 text-sm hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors duration-200"
              >
                {followLoading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Following...
                  </>
                ) : (
                  "Follow to share resume"
                )}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
