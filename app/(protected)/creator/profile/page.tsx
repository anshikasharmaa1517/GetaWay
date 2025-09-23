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
    await fetch("/api/reviewers", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        display_name: data.display_name,
        slug: data.slug,
        country: data.country,
        expertise: data.expertise,
        headline: data.headline,
        social_link: data.social_link,
        photo_url: data.photo_url,
      }),
    });
    setSaving(false);
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
    <div className="min-h-screen bg-zinc-50">
      <header className="h-14 border-b bg-white/70 backdrop-blur flex items-center justify-between px-4">
        <div className="text-sm font-semibold tracking-tight">
          GetAWay Creator
        </div>
        <div className="flex items-center gap-4">
          <a
            href="/reviewer"
            className="text-sm text-zinc-600 hover:text-zinc-900 underline"
          >
            Public reviewers
          </a>
          {data?.slug && (
            <a
              href={`/r/${encodeURIComponent(data.slug)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-800 shadow-sm hover:bg-zinc-50"
            >
              Preview
            </a>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-6xl grid grid-cols-12 gap-6 px-4 py-6">
        <aside className="col-span-12 md:col-span-3">
          <nav className="rounded-2xl bg-white ring-1 ring-zinc-100 shadow-[0_1px_0_rgba(0,0,0,0.06)] p-2">
            <a
              className="block px-3 py-2 rounded-lg text-sm text-zinc-700 hover:bg-zinc-50"
              href="/creator"
            >
              Home
            </a>
            <a
              className="block px-3 py-2 rounded-lg text-sm text-white bg-zinc-900"
              href="/creator/profile"
            >
              Edit Profile
            </a>
            <a
              className="block px-3 py-2 rounded-lg text-sm text-zinc-700 hover:bg-zinc-50"
              href="#"
            >
              Services
            </a>
            <a
              className="block px-3 py-2 rounded-lg text-sm text-zinc-700 hover:bg-zinc-50"
              href="#"
            >
              Calendar
            </a>
            <a
              className="block px-3 py-2 rounded-lg text-sm text-zinc-700 hover:bg-zinc-50"
              href="#"
            >
              Payouts
            </a>
            <div className="mt-2 border-t" />
            <a
              className="block px-3 py-2 rounded-lg text-sm text-zinc-700 hover:bg-zinc-50"
              href="#"
            >
              Analytics
            </a>
            <a
              className="block px-3 py-2 rounded-lg text-sm text-zinc-700 hover:bg-zinc-50"
              href="#"
            >
              Testimonials
            </a>
            <a
              className="block px-3 py-2 rounded-lg text-sm text-zinc-700 hover:bg-zinc-50"
              href="#"
            >
              Settings
            </a>
          </nav>
        </aside>

        <main className="col-span-12 md:col-span-9">
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 text-red-700 px-3 py-2 text-sm">
              {error}
            </div>
          )}
          <div className="rounded-3xl bg-white ring-1 ring-zinc-100 shadow-[0_1px_0_rgba(0,0,0,0.06)] p-6 space-y-6">
            <div className="flex items-center gap-4">
              {data?.photo_url ? (
                <img
                  src={data.photo_url}
                  alt="Profile"
                  className="h-16 w-16 rounded-full object-cover border"
                />
              ) : (
                <div className="h-16 w-16 rounded-full bg-zinc-200 border" />
              )}
              <label className="text-sm underline cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) uploadPhoto(f);
                  }}
                />
                {uploading ? "Uploading…" : "Change photo"}
              </label>
            </div>

            <div>
              <label className="text-sm font-medium">Your page link</label>
              <div className="mt-2 flex items-center gap-2">
                <span className="rounded-xl border border-zinc-300 px-3 py-2 text-sm text-zinc-600 bg-zinc-50">
                  getaway.io/
                </span>
                <input
                  value={data.slug ?? ""}
                  onChange={(e) => setData({ ...data, slug: e.target.value })}
                  className="flex-1 rounded-xl border border-zinc-300 px-3 py-2"
                  placeholder="your_name"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Display name</label>
              <input
                value={data.display_name ?? ""}
                onChange={(e) =>
                  setData({ ...data, display_name: e.target.value })
                }
                className="mt-2 w-full rounded-xl border border-zinc-300 px-3 py-2"
                placeholder="Your name"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Headline</label>
              <input
                value={data.headline ?? ""}
                onChange={(e) => {
                  const words = e.target.value.trim().split(/\s+/);
                  if (words.filter(Boolean).length <= HEADLINE_WORD_LIMIT) {
                    setData({ ...data, headline: e.target.value });
                  }
                }}
                className="mt-2 w-full rounded-xl border border-zinc-300 px-3 py-2"
                placeholder="Tell people what you do"
              />
              <div className="mt-1 text-xs text-zinc-600">
                {HEADLINE_WORD_LIMIT -
                  (data.headline?.trim().split(/\s+/).filter(Boolean).length ||
                    0)}{" "}
                words left
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Social link</label>
              <input
                value={data.social_link ?? ""}
                onChange={(e) =>
                  setData({ ...data, social_link: e.target.value })
                }
                className="mt-2 w-full rounded-xl border border-zinc-300 px-3 py-2"
                placeholder="https://www.linkedin.com/in/your-profile"
              />
            </div>

            <div className="pt-2">
              <button
                onClick={save}
                disabled={saving}
                className="rounded-xl bg-black text-white px-5 py-2 text-sm hover:bg-zinc-900 disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save changes"}
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
