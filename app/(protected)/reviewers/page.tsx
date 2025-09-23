"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getBrowserSupabaseClient } from "@/lib/supabase";
import { AppBar } from "@/components/ui/AppBar";
import { OnboardingModal } from "@/components/OnboardingModal";

type Reviewer = {
  id: string;
  user_id: string;
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

export default function ReviewersPage() {
  const [reviewers, setReviewers] = useState<Reviewer[]>([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState<Set<string>>(new Set());
  const [followingLoading, setFollowingLoading] = useState<Set<string>>(
    new Set()
  );
  const [profile, setProfile] = useState<{ desired_job_title?: string } | null>(
    null
  );
  const router = useRouter();

  useEffect(() => {
    console.log("useEffect triggered - loading reviewers");
    async function loadData() {
      try {
        console.log("loadData function called");
        const supabase = getBrowserSupabaseClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/login");
          return;
        }

        // Get user profile
        const { data: profileData } = await supabase
          .from("profiles")
          .select("desired_job_title")
          .eq("id", user.id)
          .single();

        setProfile(profileData);

        // Get reviewers
        const qs = profileData?.desired_job_title
          ? `?role=${encodeURIComponent(
              profileData.desired_job_title
            )}&t=${Date.now()}`
          : `?t=${Date.now()}`;
        const res = await fetch(`/api/reviewers${qs}`, {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache",
          },
        });
        console.log("API call made, status:", res.status);
        if (!res.ok) {
          console.log("API call failed:", res.status, res.statusText);
          return;
        }

        const json = (await res.json()) as { reviewers: Reviewer[] };
        console.log("Number of reviewers:", json.reviewers.length);
        if (json.reviewers.length > 0) {
          console.log("First reviewer company:", json.reviewers[0].company);
        }
        setReviewers(json.reviewers);

        // Get following status
        const { data: follows } = await supabase
          .from("follows")
          .select("reviewer_id")
          .eq("follower_id", user.id);

        if (follows) {
          setFollowing(new Set(follows.map((f) => f.reviewer_id)));
        }
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router]);

  async function handleFollow(
    reviewerId: string,
    userId: string,
    slug: string
  ) {
    if (followingLoading.has(reviewerId)) return;

    setFollowingLoading((prev) => new Set(prev).add(reviewerId));

    try {
      const isFollowing = following.has(userId);
      const action = isFollowing ? "unfollow" : "follow";

      const res = await fetch("/api/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, action }),
      });

      if (res.ok) {
        setFollowing((prev) => {
          const newSet = new Set(prev);
          if (isFollowing) {
            newSet.delete(userId);
          } else {
            newSet.add(userId);
          }
          return newSet;
        });
      }
    } catch (error) {
      console.error("Error following/unfollowing:", error);
    } finally {
      setFollowingLoading((prev) => {
        const newSet = new Set(prev);
        newSet.delete(reviewerId);
        return newSet;
      });
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppBar />
        <main className="mx-auto max-w-6xl px-6 py-12">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-3"></div>
            <div className="h-6 bg-gray-200 rounded w-1/2 mb-12"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white rounded-3xl p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="h-16 w-16 bg-gray-200 rounded-2xl"></div>
                    <div className="flex-1">
                      <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2 mb-1"></div>
                      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  </div>
                  <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-6"></div>
                  <div className="flex gap-3">
                    <div className="h-10 bg-gray-200 rounded-2xl flex-1"></div>
                    <div className="h-10 bg-gray-200 rounded-2xl flex-1"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppBar />
      <OnboardingModal />
      <main className="mx-auto max-w-6xl px-6 py-12">
        {/* Hero Section */}
        <div className="mb-12">
          <h1 className="text-4xl font-semibold tracking-tight text-gray-900 mb-3">
            Find Reviewers
          </h1>
          <p className="text-lg text-gray-600">
            {profile?.desired_job_title
              ? `Top reviewers for ${profile.desired_job_title}`
              : "Discover expert reviewers to help improve your resume"}
          </p>
        </div>

        {/* Reviewers Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {reviewers.map((r) => (
            <div
              key={r.id}
              className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200 flex flex-col h-full"
            >
              {/* Profile Header */}
              <div className="p-6 pb-4">
                <div className="flex items-start gap-4">
                  <img
                    src={r.photoUrl}
                    alt={r.name}
                    className="h-16 w-16 rounded-2xl object-cover border border-gray-200 shadow-sm"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {r.name}
                    </h3>
                    <p className="text-sm font-medium text-gray-600 truncate">
                      {r.role}
                    </p>
                    {r.company && (
                      <p className="text-sm text-gray-500 truncate">
                        {r.company}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="px-6 pb-4">
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <svg
                      className="w-4 h-4 text-yellow-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="font-medium">{r.rating.toFixed(1)}</span>
                    <span>({r.reviews} reviews)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <svg
                      className="w-4 h-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span>{r.experienceYears} years exp</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="px-6 pb-4 flex-1">
                <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">
                  {r.headline ||
                    "Experienced professional ready to help improve your resume with expert feedback and industry insights."}
                </p>
              </div>

              {/* Actions */}
              <div className="px-6 pb-6 pt-2 mt-auto">
                <div className="flex items-center gap-3">
                  <a
                    href={r.slug ? `/r/${encodeURIComponent(r.slug)}` : `#`}
                    className="flex-1 inline-flex items-center justify-center rounded-2xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors duration-200"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                    View Profile
                  </a>
                  <button
                    onClick={() =>
                      r.slug && handleFollow(r.id, r.user_id, r.slug)
                    }
                    disabled={followingLoading.has(r.id)}
                    className="w-full inline-flex items-center justify-center rounded-2xl bg-gray-900 text-white px-4 py-2.5 text-sm font-semibold shadow-sm hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors duration-200"
                  >
                    {followingLoading.has(r.id) ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                    ) : following.has(r.user_id) ? (
                      <>
                        <svg
                          className="w-4 h-4 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        Following
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-4 h-4 mr-2"
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
                        Follow
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {reviewers.length === 0 && (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No reviewers found
            </h3>
            <p className="text-gray-600">
              We're working on adding more reviewers. Check back soon!
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
