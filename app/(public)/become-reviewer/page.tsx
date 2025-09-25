"use client";

import { useMemo, useState, useEffect } from "react";
import { getBrowserSupabaseClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";

const COUNTRIES = [
  "India",
  "United States",
  "United Kingdom",
  "Canada",
  "Germany",
  "Australia",
  "Singapore",
];

const EXPERTISE = [
  "Cybersecurity",
  "Law",
  "Content & Branding",
  "Others",
  "HR",
  "Software",
  "Product",
  "Study Abroad",
  "Finance",
  "Design",
  "Data",
  "Mental Health & Wellbeing",
  "Marketing",
];

export default function BecomeReviewerPage() {
  const router = useRouter();
  const [social, setSocial] = useState("");
  const [slug, setSlug] = useState("");
  const [country, setCountry] = useState("India");
  const [company, setCompany] = useState("");
  const [expertise, setExpertise] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [linkedinPhotoUrl, setLinkedinPhotoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const canNext = useMemo(
    () =>
      social.trim().length > 0 &&
      slug.trim().length >= 3 &&
      expertise.length > 0,
    [social, slug, expertise]
  );

  // Check authentication on page load
  useEffect(() => {
    async function checkAuth() {
      try {
        const supabase = getBrowserSupabaseClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          // User not authenticated, redirect to auth page
          router.push("/become-reviewer-auth");
          return;
        }

        setLoading(false);
      } catch (error) {
        console.error("Auth check error:", error);
        router.push("/become-reviewer-auth");
      }
    }

    checkAuth();
  }, [router]);

  function toggle(tag: string) {
    setExpertise((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  async function handleNext(e: React.FormEvent) {
    e.preventDefault();
    if (!canNext) return;
    setSaving(true);
    setError(null);
    try {
      // Get the session token for authentication
      const supabase = getBrowserSupabaseClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setError("You must be logged in to create a reviewer profile");
        return;
      }

      let photo_url: string | null = linkedinPhotoUrl;
      if (photoFile) {
        try {
          const bucket = "reviewer-photos";
          const ext = photoFile.name.includes(".")
            ? photoFile.name.split(".").pop() || "jpg"
            : "jpg";
          const path = `${slug || "reviewer"}-${Date.now()}.${ext}`;
          const { error: upErr } = await supabase.storage
            .from(bucket)
            .upload(path, photoFile, { upsert: false, cacheControl: "3600" });
          if (!upErr) {
            const { data } = supabase.storage.from(bucket).getPublicUrl(path);
            photo_url = data.publicUrl || null;
          }
        } catch {}
      }

      const res = await fetch("/api/reviewers", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          display_name: slug,
          country,
          company: company.trim() || null,
          expertise,
          slug,
          social_link: social,
          headline: expertise.length > 0 ? `${expertise[0]} expert` : null,
          photo_url,
        }),
      });

      console.log("API Response status:", res.status);

      if (res.status === 401) {
        console.log("401 Unauthorized - redirecting to login");
        window.location.href = "/login";
        return;
      }
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.log("API Error:", errorData);
        setError(errorData.error || "Failed to create reviewer profile");
        return;
      }

      console.log("Success! Redirecting to creator dashboard");

      // Refresh session
      const { error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) {
        console.error("Session refresh failed:", refreshError);
      }

      // Redirect using router
      router.push("/creator");
    } finally {
      setSaving(false);
    }
  }

  // Capture LinkedIn photo from localStorage (set in gateway after callback)
  if (typeof window !== "undefined") {
    if (!linkedinPhotoUrl) {
      const val = localStorage.getItem("linkedin_photo_url");
      if (val) setLinkedinPhotoUrl(val);
    }
  }

  // No authentication from social URL; we simply store it when saving

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-zinc-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="mx-auto max-w-4xl px-6 py-6 flex items-center justify-between">
        <div className="text-base md:text-lg font-semibold tracking-tight">
          PaperWeight
        </div>
        <a
          href="/login"
          className="text-sm text-zinc-600 hover:text-zinc-900 underline offset-2"
        >
          Back to sign in
        </a>
      </header>

      <main className="mx-auto max-w-4xl px-6 pb-20">
        <div className="rounded-3xl bg-white shadow-[0_1px_0_rgba(0,0,0,0.06)] ring-1 ring-zinc-100 p-6 md:p-8">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Hello there!
          </h1>
          <p className="text-sm text-zinc-600 mt-1">
            In a few moments you will be ready to share your expertise & time
          </p>

          <form onSubmit={handleNext} className="mt-6 space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-2xl">
                <div className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-red-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}
            <div>
              <label className="text-sm font-medium">Profile photo</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                className="mt-2 block w-full text-sm text-zinc-700 file:mr-3 file:rounded-lg file:border file:border-zinc-300 file:bg-white file:px-3 file:py-1.5 file:text-sm file:font-medium hover:file:bg-zinc-50"
              />
            </div>

            <div>
              <label className="text-sm font-medium">
                Connect your social account{" "}
                <span className="text-red-500">*</span>
              </label>
              <input
                value={social}
                onChange={(e) => setSocial(e.target.value)}
                placeholder="https://www.linkedin.com/in/your-profile"
                className="mt-2 w-full rounded-xl border border-zinc-300 px-3 py-2 focus:outline-none focus:ring-4 focus:ring-black/5 focus:border-zinc-400 transition"
              />
            </div>

            <div>
              <label className="text-sm font-medium">
                Your page link <span className="text-red-500">*</span>
              </label>
              <div className="mt-2 flex items-center gap-2">
                <span className="rounded-xl border border-zinc-300 px-3 py-2 text-sm text-zinc-600 bg-zinc-50">
                  getaway.io/
                </span>
                <input
                  value={slug}
                  onChange={(e) =>
                    setSlug(
                      e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9-_]/g, "")
                        .slice(0, 32)
                    )
                  }
                  placeholder="your_name"
                  className="flex-1 rounded-xl border border-zinc-300 px-3 py-2 focus:outline-none focus:ring-4 focus:ring-black/5 focus:border-zinc-400 transition"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Current company</label>
              <input
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g., Google, Microsoft, Startup Inc."
                className="mt-2 w-full rounded-xl border border-zinc-300 px-3 py-2 focus:outline-none focus:ring-4 focus:ring-black/5 focus:border-zinc-400 transition"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Country</label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-zinc-300 px-3 py-2 bg-white focus:outline-none focus:ring-4 focus:ring-black/5 focus:border-zinc-400"
                >
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="opacity-60">
                <label className="text-sm font-medium">Currency</label>
                <input
                  disabled
                  className="mt-2 w-full rounded-xl border border-zinc-200 px-3 py-2 bg-zinc-50"
                  placeholder="Coming soon"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">
                Select your expertise <span className="text-red-500">*</span>
              </label>
              <div className="mt-3 flex flex-wrap gap-2">
                {EXPERTISE.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggle(tag)}
                    className={
                      "rounded-full px-3 py-1.5 text-sm transition border " +
                      (expertise.includes(tag)
                        ? "bg-black text-white border-black shadow-sm"
                        : "border-zinc-300 hover:bg-zinc-50")
                    }
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={!canNext || saving}
                className="inline-flex items-center justify-center rounded-2xl bg-black text-white px-6 py-2.5 text-sm font-medium shadow-sm hover:bg-zinc-900 active:bg-zinc-800 disabled:opacity-50"
              >
                {saving ? "Saving…" : "Next"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
