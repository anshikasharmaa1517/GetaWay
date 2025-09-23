"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getBrowserSupabaseClient } from "@/lib/supabase";
import { AppBar } from "@/components/ui/AppBar";

interface SharedResume {
  id: string;
  file_url: string;
  status: string;
  score: number | null;
  notes: string | null;
  created_at: string;
  reviewer_slug: string | null;
  reviewer: {
    display_name: string;
    company: string | null;
    photo_url: string | null;
    slug: string;
  } | null;
}

export default function DashboardPage() {
  const [sharedResumes, setSharedResumes] = useState<SharedResume[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const router = useRouter();

  const toggleCardExpansion = (cardId: string) => {
    setExpandedCard(expandedCard === cardId ? null : cardId);
  };

  const isCardExpanded = (cardId: string) => expandedCard === cardId;

  useEffect(() => {
    async function loadSharedResumes() {
      try {
        const supabase = getBrowserSupabaseClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/login");
          return;
        }

        // Get resumes that have been shared with reviewers
        const { data: resumes, error } = await supabase
          .from("resumes")
          .select(
            `
            id,
            file_url,
            status,
            score,
            notes,
            created_at,
            reviewer_slug
          `
          )
          .eq("user_id", user.id)
          .not("reviewer_slug", "is", null)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching shared resumes:", error);
          return;
        }

        console.log("Found resumes:", resumes);

        // Get reviewer details for each resume
        const resumesWithReviewers = await Promise.all(
          (resumes || []).map(async (resume) => {
            if (!resume.reviewer_slug) return { ...resume, reviewer: null };

            const { data: reviewer } = await supabase
              .from("reviewers")
              .select("display_name, company, photo_url, slug")
              .eq("slug", resume.reviewer_slug)
              .single();

            return { ...resume, reviewer };
          })
        );

        console.log("Final resumes with reviewers:", resumesWithReviewers);
        setSharedResumes(resumesWithReviewers);
      } catch (error) {
        console.error("Error loading shared resumes:", error);
      } finally {
        setLoading(false);
      }
    }

    loadSharedResumes();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <AppBar />
        <main className="mx-auto max-w-4xl px-6 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-200 rounded w-1/4 mb-2"></div>
            <div className="h-5 bg-slate-200 rounded w-1/2 mb-8"></div>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl border border-slate-200 p-5"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-11 w-11 bg-slate-200 rounded-xl"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-slate-200 rounded w-1/3 mb-2"></div>
                      <div className="h-3 bg-slate-200 rounded w-1/4"></div>
                    </div>
                    <div className="h-6 bg-slate-200 rounded w-16"></div>
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
    <div className="min-h-screen bg-slate-50">
      <AppBar />
      <main className="mx-auto max-w-4xl px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">
            My Shared Resumes
          </h1>
          <p className="text-slate-600">
            Track which reviewers you've shared your resume with
          </p>
        </div>

        {/* Shared Resumes List */}
        <div className="space-y-3">
          {sharedResumes.length > 0 ? (
            sharedResumes.map((resume) => {
              const isExpanded = isCardExpanded(resume.id);
              const isViewed = resume.status !== "Pending";
              const isCompleted = resume.status === "Completed";

              return (
                <div
                  key={resume.id}
                  className={`bg-white rounded-2xl border transition-all duration-200 cursor-pointer hover:shadow-sm ${
                    isExpanded
                      ? "border-slate-300 shadow-sm"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                  onClick={() => toggleCardExpansion(resume.id)}
                >
                  <div className="p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {/* Reviewer Avatar with Status Indicator */}
                        <div className="relative">
                          <div className="h-11 w-11 rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center">
                            {resume.reviewer?.photo_url ? (
                              <img
                                src={resume.reviewer.photo_url}
                                alt={resume.reviewer.display_name || "Reviewer"}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full bg-slate-200 flex items-center justify-center">
                                <svg
                                  className="h-5 w-5 text-slate-500"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                  />
                                </svg>
                              </div>
                            )}
                          </div>
                          {/* Status Indicator */}
                          <div
                            className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                              isCompleted
                                ? "bg-emerald-500"
                                : isViewed
                                ? "bg-blue-500"
                                : "bg-amber-500"
                            }`}
                          ></div>
                        </div>

                        {/* Reviewer Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-semibold text-slate-900 truncate">
                              {resume.reviewer?.display_name ||
                                "Unknown Reviewer"}
                            </h3>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            {resume.reviewer?.company && (
                              <span className="text-sm text-slate-500">
                                {resume.reviewer.company}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right side with Status and Date */}
                      <div className="flex items-center gap-4">
                        {/* Status */}
                        <div
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                            resume.status === "Pending"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : resume.status === "Completed"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-slate-50 text-slate-700 border border-slate-200"
                          }`}
                        >
                          {resume.status}
                        </div>

                        {/* Date at extreme right */}
                        <p className="text-sm text-slate-500 whitespace-nowrap">
                          {new Date(resume.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Expandable Review Message */}
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-slate-100">
                        <div className="bg-slate-50 rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                            <h4 className="text-sm font-medium text-slate-700">
                              {isCompleted ? "Review Message" : "Status Update"}
                            </h4>
                          </div>
                          {resume.notes ? (
                            <div className="bg-white rounded-lg p-3 border border-slate-200">
                              <p className="text-sm text-slate-800 leading-relaxed">
                                {resume.notes}
                              </p>
                            </div>
                          ) : (
                            <div className="bg-white rounded-lg p-3 border border-slate-200">
                              <p className="text-sm text-slate-500 italic">
                                {isCompleted
                                  ? "No review message provided."
                                  : "Reviewer hasn't provided feedback yet."}
                              </p>
                            </div>
                          )}
                          {isCompleted && resume.score && (
                            <div className="mt-3 flex items-center gap-2">
                              <span className="text-sm font-medium text-slate-600">
                                Score:
                              </span>
                              <div className="flex items-center gap-1">
                                {[...Array(10)].map((_, i) => (
                                  <div
                                    key={i}
                                    className={`w-2 h-2 rounded-full ${
                                      i < resume.score!
                                        ? "bg-emerald-500"
                                        : "bg-slate-200"
                                    }`}
                                  ></div>
                                ))}
                                <span className="text-sm font-medium text-slate-700 ml-2">
                                  {resume.score}/10
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            /* Empty State */
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-6 h-6 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                No shared resumes yet
              </h3>
              <p className="text-slate-600 mb-6 max-w-sm mx-auto">
                You haven't shared any resumes with reviewers yet. Start by
                finding reviewers and sharing your resume.
              </p>
              <a
                href="/reviewers"
                className="inline-flex items-center justify-center rounded-xl bg-slate-900 text-white px-5 py-2.5 text-sm font-medium hover:bg-slate-800 transition-colors duration-200"
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
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                Find Reviewers
              </a>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
