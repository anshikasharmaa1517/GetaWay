"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { getBrowserSupabaseClient } from "@/lib/supabase";
import { AppBar } from "@/components/ui/AppBar";

interface ReviewData {
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

export default function ReviewPage() {
  const [reviewData, setReviewData] = useState<ReviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [score, setScore] = useState<number>(0);
  const [feedback, setFeedback] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const router = useRouter();
  const params = useParams();
  const resumeId = params.id as string;

  useEffect(() => {
    async function loadReviewData() {
      console.log("Review page loading with resumeId:", resumeId);
      try {
        const supabase = getBrowserSupabaseClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        console.log("User in review page:", user?.id);

        if (!user) {
          console.log("No user, redirecting to login");
          router.push("/login");
          return;
        }

        // Get resume data
        console.log("Fetching resume data from API...");
        const response = await fetch(`/api/creator/resumes/${resumeId}`);
        console.log("API response status:", response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error("API error:", errorText);
          setError("Resume not found");
          return;
        }

        const { resume } = await response.json();
        console.log("Received resume data:", resume);
        setReviewData(resume);
        setScore(resume.score || 0);
        setFeedback(resume.notes || "");
      } catch (error) {
        console.error("Error loading review data:", error);
        setError("Failed to load resume");
      } finally {
        setLoading(false);
      }
    }

    if (resumeId) {
      loadReviewData();
    }
  }, [resumeId, router]);

  const handleSaveReview = async () => {
    if (!reviewData || score === 0 || !feedback.trim()) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/creator/reviews/${resumeId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          score,
          feedback: feedback.trim(),
          status: "Completed",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save review");
      }

      // Update local state
      setReviewData({
        ...reviewData,
        score,
        notes: feedback.trim(),
        status: "Completed",
      });

      // Show success message
      setSaveMessage("Review saved successfully!");
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      console.error("Error saving review:", error);
      setSaveMessage("Failed to save review");
      setTimeout(() => setSaveMessage(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50">
        <AppBar />
        <main className="mx-auto max-w-4xl px-6 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-zinc-200 rounded w-1/4 mb-4"></div>
            <div className="bg-white rounded-2xl p-6">
              <div className="h-4 bg-zinc-200 rounded w-1/2 mb-4"></div>
              <div className="h-64 bg-zinc-200 rounded"></div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !reviewData) {
    return (
      <div className="min-h-screen bg-zinc-50">
        <AppBar />
        <main className="mx-auto max-w-4xl px-6 py-8">
          <div className="bg-white rounded-2xl p-8 text-center">
            <h1 className="text-2xl font-semibold text-zinc-900 mb-2">
              Resume Not Found
            </h1>
            <p className="text-zinc-600 mb-6">{error}</p>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800"
            >
              Go Back
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <AppBar />
      <main className="mx-auto max-w-4xl px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-zinc-100 rounded-lg transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900">
              Review Resume
            </h1>
            <p className="text-zinc-600">
              From {reviewData.user?.full_name || "User"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Resume Preview */}
          <div className="bg-white rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full border-2 border-white flex items-center justify-center overflow-hidden shadow-sm">
                {reviewData.user?.avatar_url ? (
                  <img
                    src={reviewData.user.avatar_url}
                    alt={reviewData.user.full_name || "User"}
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
              <div>
                <h3 className="font-semibold text-zinc-900">
                  {reviewData.user?.full_name || "User"}
                </h3>
                <p className="text-sm text-zinc-500">
                  {new Date(reviewData.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="border-2 border-dashed border-zinc-200 rounded-xl p-8 text-center">
              <svg
                className="w-12 h-12 text-zinc-400 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="text-zinc-600 mb-4">Resume PDF</p>
              <a
                href={reviewData.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors"
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
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
                Open Resume
              </a>
            </div>
          </div>

          {/* Review Form */}
          <div className="bg-white rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-zinc-900 mb-4">
              Your Review
            </h2>

            {/* Score */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-zinc-700 mb-3">
                Score (1-10)
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                  <button
                    key={num}
                    onClick={() => setScore(num)}
                    className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center text-sm font-medium transition-colors ${
                      score === num
                        ? "border-zinc-900 bg-zinc-900 text-white"
                        : "border-zinc-200 hover:border-zinc-300"
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            {/* Feedback */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-zinc-700 mb-3">
                Feedback
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Write your detailed feedback here..."
                className="w-full h-32 px-4 py-3 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent resize-none"
              />
            </div>

            {/* Save Button */}
            <div className="space-y-3">
              <button
                onClick={handleSaveReview}
                disabled={saving || score === 0 || !feedback.trim()}
                className="w-full px-6 py-3 bg-zinc-900 text-white rounded-xl font-medium hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? "Saving..." : "Save Review"}
              </button>

              {/* Save Message */}
              {saveMessage && (
                <div
                  className={`text-sm text-center px-4 py-2 rounded-lg transition-all duration-300 ${
                    saveMessage.includes("successfully")
                      ? "bg-green-50 text-green-700 border border-green-200"
                      : "bg-red-50 text-red-700 border border-red-200"
                  }`}
                >
                  {saveMessage}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
