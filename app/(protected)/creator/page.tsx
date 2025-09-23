"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getBrowserSupabaseClient } from "@/lib/supabase";
import { AppBar } from "@/components/ui/AppBar";

interface ReceivedResume {
  id: string;
  file_url: string;
  status: string;
  score: number | null;
  notes: string | null;
  created_at: string;
  user_id: string;
  user: {
    email: string;
    full_name?: string;
    avatar_url?: string;
  } | null;
}

export default function CreatorDashboard() {
  const [receivedResumes, setReceivedResumes] = useState<ReceivedResume[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewerSlug, setReviewerSlug] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function loadReceivedResumes() {
      try {
        const supabase = getBrowserSupabaseClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/login");
          return;
        }

        console.log("Current user ID:", user.id);

        // Use API route to get resumes with user details
        const response = await fetch("/api/creator/resumes");
        if (!response.ok) {
          console.error("Error fetching resumes:", response.statusText);
          return;
        }

        const { resumes } = await response.json();
        console.log("Found received resumes:", resumes);
        console.log("Number of resumes found:", resumes?.length || 0);

        // Debug each resume's user data
        resumes?.forEach((resume: any, index: number) => {
          console.log(`Resume ${index + 1} user data:`, resume.user);
        });

        setReceivedResumes(resumes || []);
      } catch (error) {
        console.error("Error loading received resumes:", error);
      } finally {
        setLoading(false);
      }
    }

    loadReceivedResumes();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50">
        <AppBar />
        <div className="mx-auto max-w-6xl grid grid-cols-12 gap-6 px-4 py-6">
          <aside className="col-span-12 md:col-span-3">
            <nav className="rounded-2xl bg-white ring-1 ring-zinc-100 shadow-[0_1px_0_rgba(0,0,0,0.06)] p-2">
              <a
                className="block px-3 py-2 rounded-lg text-sm text-zinc-700 hover:bg-zinc-50"
                href="/creator/profile"
              >
                Edit Profile
              </a>
              <a
                className="block px-3 py-2 rounded-lg text-sm font-medium bg-zinc-900 text-white"
                href="#"
              >
                Resume Received
              </a>
              <a
                className="block px-3 py-2 rounded-lg text-sm text-zinc-700 hover:bg-zinc-50"
                href="/creator/reviews"
              >
                My Reviews
              </a>
            </nav>
          </aside>
          <main className="col-span-12 md:col-span-9">
            <div className="animate-pulse">
              <div className="h-8 bg-zinc-200 rounded w-1/4 mb-4"></div>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-2xl p-6">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 bg-zinc-200 rounded-xl"></div>
                      <div className="flex-1">
                        <div className="h-5 bg-zinc-200 rounded w-1/3 mb-2"></div>
                        <div className="h-4 bg-zinc-200 rounded w-1/4"></div>
                      </div>
                      <div className="h-8 bg-zinc-200 rounded w-20"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <AppBar />
      <div className="mx-auto max-w-6xl grid grid-cols-12 gap-6 px-4 py-6">
        <aside className="col-span-12 md:col-span-3">
          <nav className="rounded-2xl bg-white ring-1 ring-zinc-100 shadow-[0_1px_0_rgba(0,0,0,0.06)] p-2">
            <a
              className="block px-3 py-2 rounded-lg text-sm text-zinc-700 hover:bg-zinc-50"
              href="/creator/profile"
            >
              Edit Profile
            </a>
            <a
              className="block px-3 py-2 rounded-lg text-sm font-medium bg-zinc-900 text-white"
              href="#"
            >
              Resume Received
            </a>
            <a
              className="block px-3 py-2 rounded-lg text-sm text-zinc-700 hover:bg-zinc-50"
              href="/creator/reviews"
            >
              My Reviews
            </a>
          </nav>
        </aside>

        <main className="col-span-12 md:col-span-9">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 mb-2">
              Resume Received
            </h1>
            <p className="text-sm text-zinc-600">
              Resumes shared with you by users
            </p>
          </div>

          {receivedResumes.length > 0 ? (
            <div className="space-y-3">
              {receivedResumes.map((resume) => {
                const isViewed = resume.status !== "Pending";
                const isCompleted = resume.status === "Completed";

                return (
                  <div
                    key={resume.id}
                    className={`rounded-2xl p-4 transition-all duration-200 cursor-pointer hover:shadow-md select-none ${
                      isViewed
                        ? "bg-zinc-50 border border-zinc-200"
                        : "bg-blue-50 border border-blue-200 shadow-sm"
                    }`}
                    style={{ cursor: "pointer" }}
                    onClick={async (e) => {
                      e.preventDefault();
                      console.log("Clicked resume:", resume.id);
                      console.log("Router object:", router);
                      try {
                        console.log(
                          "Attempting navigation to:",
                          `/creator/review/${resume.id}`
                        );
                        // Try using window.location instead of router.push
                        window.location.href = `/creator/review/${resume.id}`;
                        console.log("Navigation completed successfully");
                      } catch (error) {
                        console.error("Navigation error:", error);
                      }
                    }}
                  >
                    <div className="flex items-center gap-3">
                      {/* User Avatar */}
                      <div className="h-10 w-10 rounded-full border-2 border-white flex items-center justify-center overflow-hidden shadow-sm">
                        {resume.user?.avatar_url ? (
                          <img
                            src={resume.user.avatar_url}
                            alt={resume.user.full_name || "User"}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full bg-zinc-200 flex items-center justify-center">
                            <svg
                              className="h-5 w-5 text-zinc-500"
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

                      {/* Message Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-semibold text-zinc-900 truncate">
                            {resume.user?.full_name ||
                              resume.user?.email?.split("@")[0] ||
                              "Anonymous User"}
                          </h3>
                          {!isViewed && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                          {isCompleted && (
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          )}
                        </div>
                        <p className="text-sm text-zinc-600">
                          {isViewed
                            ? isCompleted
                              ? `Reviewed • Score: ${resume.score || "N/A"}/10`
                              : "Resume viewed"
                            : "New resume shared"}
                        </p>
                      </div>

                      {/* Time */}
                      <div className="text-xs text-zinc-500">
                        {new Date(resume.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Empty State */
            <div className="rounded-3xl bg-white ring-1 ring-zinc-100 shadow-[0_1px_0_rgba(0,0,0,0.06)] p-10 flex flex-col items-center text-center">
              <div className="h-28 w-28 rounded-2xl bg-zinc-50 border border-zinc-200 flex items-center justify-center mb-6">
                <svg
                  className="h-10 w-10 text-zinc-400"
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
              <h2 className="text-xl font-semibold tracking-tight">
                No resumes received yet
              </h2>
              <p className="text-sm text-zinc-600 mt-2 max-w-md">
                Users will be able to share their resumes with you once they
                follow your profile. Make sure your profile is complete and
                visible to users.
              </p>
              <a
                href="/creator/profile"
                className="mt-6 inline-flex items-center justify-center rounded-xl bg-zinc-900 text-white px-5 py-2 text-sm font-semibold shadow-sm hover:bg-zinc-800 transition-colors duration-200"
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
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                Complete Profile
              </a>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
