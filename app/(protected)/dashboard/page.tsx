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
  const router = useRouter();

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
      <div className="min-h-screen bg-gray-50">
        <AppBar />
        <main className="mx-auto max-w-6xl px-6 py-12">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-3"></div>
            <div className="h-6 bg-gray-200 rounded w-1/2 mb-12"></div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-3xl p-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-gray-200 rounded-2xl"></div>
                    <div className="flex-1">
                      <div className="h-5 bg-gray-200 rounded w-1/3 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    </div>
                    <div className="h-8 bg-gray-200 rounded w-20"></div>
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
      <main className="mx-auto max-w-6xl px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-semibold tracking-tight text-gray-900 mb-3">
            My Shared Resumes
          </h1>
          <p className="text-lg text-gray-600">
            Track which reviewers you've shared your resume with
          </p>
        </div>

        {/* Shared Resumes List */}
        <div className="space-y-4">
          {sharedResumes.length > 0 ? (
            sharedResumes.map((resume) => (
              <div
                key={resume.id}
                className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Reviewer Photo */}
                    <img
                      src={resume.reviewer?.photo_url || "/favicon.ico"}
                      alt={resume.reviewer?.display_name || "Reviewer"}
                      className="h-12 w-12 rounded-2xl object-cover border border-gray-200"
                    />

                    {/* Reviewer Info */}
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {resume.reviewer?.display_name || "Unknown Reviewer"}
                      </h3>
                      {resume.reviewer?.company && (
                        <p className="text-sm text-gray-600">
                          {resume.reviewer.company}
                        </p>
                      )}
                      <p className="text-xs text-gray-500">
                        Shared on{" "}
                        {new Date(resume.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    {/* Status and Actions */}
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            resume.status === "Pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : resume.status === "Completed"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {resume.status}
                        </div>
                        {resume.score && (
                          <p className="text-sm text-gray-600 mt-1">
                            Score: {resume.score}/10
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <a
                          href={resume.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center rounded-2xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors duration-200"
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
                          View Resume
                        </a>

                        {resume.reviewer?.slug && (
                          <a
                            href={`/r/${encodeURIComponent(
                              resume.reviewer.slug
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center rounded-2xl bg-gray-900 text-white px-4 py-2 text-sm font-semibold shadow-sm hover:bg-gray-800 transition-colors duration-200"
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
                            View Reviewer
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Notes Section */}
                  {resume.notes && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-2xl">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">
                        Review Notes:
                      </h4>
                      <p className="text-sm text-gray-700">{resume.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            /* Empty State */
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
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No shared resumes yet
              </h3>
              <p className="text-gray-600 mb-6">
                You haven't shared any resumes with reviewers yet. Start by
                finding reviewers and sharing your resume.
              </p>
              <a
                href="/reviewers"
                className="inline-flex items-center justify-center rounded-2xl bg-gray-900 text-white px-6 py-3 text-sm font-semibold shadow-sm hover:bg-gray-800 transition-colors duration-200"
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
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
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
