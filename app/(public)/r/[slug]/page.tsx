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
  experience_years?: number;
  social_link?: string;
  photo_url?: string;
  follower_count?: number;
  rating?: number;
  review_count?: number;
};

type Experience = {
  id: string;
  title: string;
  company: string;
  employment_type: string;
  location?: string;
  location_type?: string;
  start_date: string;
  end_date?: string;
  currently_working: boolean;
  created_at: string;
  updated_at: string;
};

export default function PublicReviewerPage({ params }: Props) {
  const resolvedParams = use(params);
  const [reviewer, setReviewer] = useState<Reviewer | null>(null);
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [experiences, setExperiences] = useState<Experience[]>([]);
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

        // Get experiences
        const expRes = await fetch(
          `/api/reviewer-experiences/${encodeURIComponent(resolvedParams.slug)}`
        );
        if (expRes.ok) {
          const expJson = await expRes.json();
          setExperiences(expJson.experiences || []);
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
    <div className="min-h-screen bg-gray-50">
      <main className="mx-auto max-w-4xl px-6 py-12">
        {/* Hero Profile Card */}
        <div className="rounded-3xl bg-white shadow-sm border border-gray-200 overflow-hidden">
          {/* Header with gradient background */}
          <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 px-8 pt-8 pb-6">
            <div className="flex items-start gap-6">
              {reviewer.photo_url ? (
                <img
                  src={reviewer.photo_url}
                  alt={reviewer.display_name || reviewer.slug}
                  className="h-24 w-24 rounded-2xl object-cover shadow-lg ring-4 ring-white"
                />
              ) : (
                <div className="h-24 w-24 rounded-2xl bg-gray-200 shadow-lg ring-4 ring-white" />
              )}
              <div className="flex-1 pt-1">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">
                  {reviewer.display_name || reviewer.slug}
                </h1>

                {/* Professional Info */}
                <div className="space-y-1 mb-4">
                  {reviewer.company && (
                    <div className="flex items-center gap-2">
                      <svg
                        className="w-4 h-4 text-gray-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h4M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                        />
                      </svg>
                      <span className="text-sm font-medium text-gray-700">
                        {reviewer.company}
                      </span>
                    </div>
                  )}
                  {reviewer.experience_years && (
                    <div className="flex items-center gap-2">
                      <svg
                        className="w-4 h-4 text-gray-500"
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
                      <span className="text-sm font-medium text-gray-700">
                        {reviewer.experience_years} years experience
                      </span>
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-1.5 bg-white/80 backdrop-blur-sm rounded-lg px-3 py-1.5 shadow-sm">
                    <svg
                      className="w-4 h-4 text-amber-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="text-sm font-semibold text-gray-900">
                      {reviewer.rating && reviewer.rating > 0
                        ? reviewer.rating.toFixed(1)
                        : "New"}
                    </span>
                    <span className="text-xs text-gray-600">
                      ({reviewer.reviews || 0}{" "}
                      {reviewer.reviews === 1 ? "review" : "reviews"})
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 bg-white/80 backdrop-blur-sm rounded-lg px-3 py-1.5 shadow-sm">
                    <svg
                      className="w-4 h-4 text-gray-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                    <span className="text-sm font-semibold text-gray-900">
                      {reviewer.follower_count || 0}
                    </span>
                    <span className="text-xs text-gray-600">followers</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="px-8 py-6">
            {reviewer.headline && (
              <div className="mb-6">
                <p className="text-gray-700 leading-relaxed">
                  {reviewer.headline}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              {following ? (
                <a
                  href={`/upload?to=${encodeURIComponent(resolvedParams.slug)}`}
                  className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 text-white px-6 py-3 text-sm font-semibold hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  Share Resume
                </a>
              ) : (
                <button
                  onClick={handleFollow}
                  disabled={followLoading}
                  className="inline-flex items-center gap-2 rounded-2xl border-2 border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-700 hover:border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  {followLoading ? (
                    <>
                      <svg
                        className="animate-spin w-4 h-4"
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
                    <>
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                      Follow to Share Resume
                    </>
                  )}
                </button>
              )}

              {reviewer.social_link && (
                <a
                  href={reviewer.social_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-600 hover:text-gray-800 hover:border-gray-300 transition-all duration-200"
                >
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                  LinkedIn
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Experience Section */}
        {experiences.length > 0 && (
          <div className="mt-8 rounded-3xl bg-white shadow-sm border border-gray-200 p-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-blue-50 rounded-xl">
                <svg
                  className="w-5 h-5 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-gray-900">
                Experience
              </h2>
            </div>

            <div className="space-y-8">
              {experiences.map((exp, index) => (
                <div key={exp.id} className="relative">
                  {/* Timeline line */}
                  {index !== experiences.length - 1 && (
                    <div className="absolute left-6 top-16 w-0.5 h-16 bg-gray-200"></div>
                  )}

                  <div className="flex items-start gap-6">
                    {/* Timeline dot */}
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl flex items-center justify-center border-2 border-white shadow-sm">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="bg-gray-50 rounded-2xl p-6">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                              {exp.title}
                            </h3>
                            <p className="text-base font-medium text-blue-600 mb-2">
                              {exp.company}
                            </p>
                          </div>
                          {exp.employment_type && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 ml-4">
                              {exp.employment_type}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                          <div className="flex items-center gap-1.5">
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
                                d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0V6a2 2 0 012-2h4a2 2 0 012 2v1m-6 0h6m-6 0v10a2 2 0 002 2h4a2 2 0 002-2V7m-6 0V6a2 2 0 012-2h4a2 2 0 012 2v1"
                              />
                            </svg>
                            <span className="font-medium">
                              {new Date(exp.start_date).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  year: "numeric",
                                }
                              )}{" "}
                              -{" "}
                              {exp.currently_working
                                ? "Present"
                                : exp.end_date
                                ? new Date(exp.end_date).toLocaleDateString(
                                    "en-US",
                                    {
                                      month: "short",
                                      year: "numeric",
                                    }
                                  )
                                : "Present"}
                            </span>
                          </div>
                          {exp.location && (
                            <div className="flex items-center gap-1.5">
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
                                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                              </svg>
                              <span>{exp.location}</span>
                              {exp.location_type && (
                                <span className="text-gray-400">
                                  • {exp.location_type}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
