"use client";

import { useEffect, useState } from "react";
import { getBrowserSupabaseClient } from "@/lib/supabase";

type Reviewer = {
  id: string;
  display_name: string | null;
  slug: string | null;
  country: string | null;
  expertise: string[];
  headline: string | null;
  social_link: string | null;
  photo_url: string | null;
};

export default function EditProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<Reviewer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const HEADLINE_WORD_LIMIT = 50;

  useEffect(() => {
    (async () => {
      setError(null);
      setLoading(true);
      const res = await fetch("/api/reviewers?me=1", { cache: "no-store" });
      if (!res.ok) {
        setError("Failed to load profile");
        setLoading(false);
        return;
      }
      const json = await res.json();
      setData(
        json.reviewer ?? {
          id: "",
          display_name: "",
          slug: "",
          country: "India",
          expertise: [],
          headline: "",
          social_link: "",
          photo_url: null,
        }
      );
      setLoading(false);
    })();
  }, []);

  async function save() {
    if (!data) return;
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/reviewers", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          display_name: data.display_name,
          slug: data.slug,
          country: data.country,
          company: data.company,
          expertise: data.expertise,
          headline: data.headline,
          social_link: data.social_link,
          photo_url: data.photo_url,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        if (errorData.error === "slug_taken") {
          setError(
            errorData.message ||
              "This page link is already taken. Please choose a different one."
          );
        } else if (errorData.error === "social_link_taken") {
          setError(
            "This LinkedIn profile is already registered by another reviewer. Please use a different LinkedIn profile or contact support if you believe this is an error."
          );
        } else {
          setError(errorData.error || "Failed to save changes");
        }
        return;
      }

      setSuccess("Changes saved successfully!");
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError("Failed to save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function uploadPhoto(file: File) {
    if (!file) return;
    try {
      setUploading(true);
      const supabase = getBrowserSupabaseClient();
      const bucket = "reviewer-photos";
      const ext = file.name.includes(".")
        ? file.name.split(".").pop() || "jpg"
        : "jpg";
      const slug = (data?.slug || "reviewer").toString();
      const path = `${slug}-profile-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from(bucket)
        .upload(path, file, { upsert: false, cacheControl: "3600" });
      if (upErr) {
        setError(upErr.message);
        return;
      }
      const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);
      setData((prev) => (prev ? { ...prev, photo_url: pub.publicUrl } : prev));
    } finally {
      setUploading(false);
    }
  }

  if (loading) {
    return <div className="p-6">Loading…</div>;
  }

  if (!data) return <div className="p-6">No profile yet.</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="h-16 border-b border-gray-200 bg-white/80 backdrop-blur-sm flex items-center justify-between px-6">
        <div className="text-lg font-semibold tracking-tight text-gray-900">
          GetAWay Creator
        </div>
        <div className="flex items-center gap-4">
          <a
            href="/creator"
            className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors duration-200"
          >
            Creator Dashboard
          </a>
          <a
            href="/creator/reviews"
            className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors duration-200"
          >
            My Reviews
          </a>
          {data?.slug && (
            <a
              href={`/r/${encodeURIComponent(data.slug)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-2xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors duration-200"
            >
              Preview
            </a>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-7xl grid grid-cols-12 gap-8 px-6 py-8">
        <aside className="col-span-12 lg:col-span-3">
          <nav className="rounded-3xl bg-white border border-gray-200 shadow-sm p-3">
            <a
              className="flex items-center px-4 py-3 rounded-2xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors duration-200"
              href="/creator"
            >
              <svg
                className="w-4 h-4 mr-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              Home
            </a>
            <a
              className="flex items-center px-4 py-3 rounded-2xl text-sm font-medium text-white bg-gray-900"
              href="/creator/profile"
            >
              <svg
                className="w-4 h-4 mr-3"
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
              Edit Profile
            </a>
            <a
              className="flex items-center px-4 py-3 rounded-2xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors duration-200"
              href="#"
            >
              <svg
                className="w-4 h-4 mr-3"
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
              Services
            </a>
            <a
              className="flex items-center px-4 py-3 rounded-2xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors duration-200"
              href="#"
            >
              <svg
                className="w-4 h-4 mr-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              Calendar
            </a>
            <a
              className="flex items-center px-4 py-3 rounded-2xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors duration-200"
              href="#"
            >
              <svg
                className="w-4 h-4 mr-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                />
              </svg>
              Payouts
            </a>
            <div className="my-3 h-px bg-gray-200"></div>
            <a
              className="flex items-center px-4 py-3 rounded-2xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors duration-200"
              href="#"
            >
              <svg
                className="w-4 h-4 mr-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              Analytics
            </a>
            <a
              className="flex items-center px-4 py-3 rounded-2xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors duration-200"
              href="#"
            >
              <svg
                className="w-4 h-4 mr-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                />
              </svg>
              Testimonials
            </a>
            <a
              className="flex items-center px-4 py-3 rounded-2xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors duration-200"
              href="#"
            >
              <svg
                className="w-4 h-4 mr-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              Settings
            </a>
          </nav>
        </aside>

        <main className="col-span-12 lg:col-span-9">
          <div className="rounded-3xl bg-white border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-100">
              <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
                Edit Profile
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Manage your public profile information
              </p>
            </div>

            <div className="p-8 space-y-8">
              {/* Profile Photo Section */}
              <div className="flex items-center gap-6">
                <img
                  src={data.photo_url || "/favicon.ico"}
                  alt="Profile"
                  className="h-20 w-20 rounded-3xl object-cover border border-gray-200 shadow-sm"
                />
                <div>
                  <label className="inline-flex items-center justify-center rounded-2xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 cursor-pointer transition-colors duration-200">
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
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    {uploading ? "Uploading…" : "Change photo"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) uploadPhoto(f);
                      }}
                    />
                  </label>
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 gap-8">
                {/* Page Link */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Your page link
                  </label>
                  <div className="flex items-center">
                    <span className="inline-flex items-center px-4 py-3 rounded-2xl border border-gray-300 bg-gray-50 text-sm font-medium text-gray-600">
                      getaway.io/
                    </span>
                    <input
                      value={data.slug ?? ""}
                      onChange={(e) =>
                        setData({ ...data, slug: e.target.value })
                      }
                      className="ml-3 flex-1 rounded-2xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                      placeholder="your_name"
                    />
                  </div>
                </div>

                {/* Display Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Display name
                  </label>
                  <input
                    value={data.display_name ?? ""}
                    onChange={(e) =>
                      setData({ ...data, display_name: e.target.value })
                    }
                    className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                    placeholder="Your name"
                  />
                </div>

                {/* Company */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Current company
                  </label>
                  <input
                    value={data.company ?? ""}
                    onChange={(e) =>
                      setData({ ...data, company: e.target.value })
                    }
                    className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                    placeholder="e.g., Google, Microsoft, Startup Inc."
                  />
                </div>

                {/* Headline */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Headline
                  </label>
                  <textarea
                    value={data.headline ?? ""}
                    onChange={(e) => {
                      const words = e.target.value.trim().split(/\s+/);
                      if (words.filter(Boolean).length <= HEADLINE_WORD_LIMIT) {
                        setData({ ...data, headline: e.target.value });
                      }
                    }}
                    rows={3}
                    className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 resize-none"
                    placeholder="Tell people what you do"
                  />
                  <div className="mt-2 text-xs font-medium text-gray-500">
                    {HEADLINE_WORD_LIMIT -
                      (data.headline?.trim().split(/\s+/).filter(Boolean)
                        .length || 0)}{" "}
                    words left
                  </div>
                </div>

                {/* Social Link */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Social link
                  </label>
                  <input
                    value={data.social_link ?? ""}
                    onChange={(e) =>
                      setData({ ...data, social_link: e.target.value })
                    }
                    className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                    placeholder="https://www.linkedin.com/in/your-profile"
                  />
                </div>
              </div>

              {/* Error/Success Messages */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3">
                  <p className="text-sm font-medium text-red-600">{error}</p>
                </div>
              )}
              {success && (
                <div className="bg-green-50 border border-green-200 rounded-2xl px-4 py-3">
                  <p className="text-sm font-medium text-green-600">
                    {success}
                  </p>
                </div>
              )}

              {/* Save Button */}
              <div className="pt-4">
                <button
                  onClick={save}
                  disabled={saving}
                  className="inline-flex items-center justify-center rounded-2xl bg-gray-900 text-white px-8 py-3 text-sm font-semibold shadow-sm hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  {saving ? (
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
                      Saving…
                    </>
                  ) : (
                    "Save changes"
                  )}
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
