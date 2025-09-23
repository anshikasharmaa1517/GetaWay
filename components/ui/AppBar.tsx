"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getBrowserSupabaseClient } from "@/lib/supabase";

export function AppBar() {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [initials, setInitials] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const supabase = getBrowserSupabaseClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;
        // try to derive an avatar from reviewers or user metadata
        // first reviewers table by user id
        const { data: reviewer } = await supabase
          .from("reviewers")
          .select("photo_url")
          .eq("user_id", user.id)
          .maybeSingle();
        if (reviewer?.photo_url) {
          setAvatarUrl(reviewer.photo_url as string);
          return;
        }
        const meta = (user.user_metadata as any) || {};
        const anyAvatar = meta.avatar_url || meta.picture || null;
        if (anyAvatar) setAvatarUrl(anyAvatar);
        const fullName: string =
          meta.full_name || meta.name || user.email || "";
        if (fullName) {
          const parts = fullName.trim().split(/\s+/);
          const ini =
            (parts[0]?.[0] || "").toUpperCase() +
            (parts[1]?.[0] || "").toUpperCase();
          if (ini) setInitials(ini);
        }
      } catch {}
    })();
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/70 dark:bg-zinc-900/50 border-b border-zinc-200/60 dark:border-white/10">
      <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
        <Link href="/" className="text-sm font-medium tracking-tight">
          Resume Reviewer
        </Link>
        <nav className="flex items-center gap-2">
          <Link
            href="/dashboard"
            className="rounded-full px-3 py-1.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            Dashboard
          </Link>
          <Link
            href="/reviewer"
            className="rounded-full px-3 py-1.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            Reviewers
          </Link>
          <Link
            href="/upload"
            className="rounded-full px-3 py-1.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            Upload
          </Link>
          <form action="/auth/logout" method="post">
            <button
              className="rounded-full px-3 py-1.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
              type="submit"
            >
              Logout
            </button>
          </form>
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="me"
              className="ml-2 h-8 w-8 rounded-full object-cover border"
            />
          ) : (
            <Link
              href="/creator/profile"
              title="Add profile photo"
              className="ml-2 h-8 w-8 rounded-full border bg-zinc-200 text-xs font-semibold flex items-center justify-center text-zinc-700 hover:bg-zinc-300"
            >
              {initials ?? "+"}
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
