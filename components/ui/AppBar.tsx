"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getBrowserSupabaseClient } from "@/lib/supabase";
import { UserRole, UserSession } from "@/lib/types";
import { useSession } from "@/components/RoleGuard";

export function AppBar() {
  const { session, loading } = useSession();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [initials, setInitials] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (!session?.user) return;

      try {
        const supabase = getBrowserSupabaseClient();
        // try to derive an avatar from reviewers or user metadata
        // first reviewers table by user id
        const { data: reviewer } = await supabase
          .from("reviewers")
          .select("photo_url")
          .eq("user_id", session.user.id)
          .maybeSingle();
        if (reviewer?.photo_url) {
          setAvatarUrl(reviewer.photo_url as string);
          return;
        }

        if (session.user.avatar_url) {
          setAvatarUrl(session.user.avatar_url);
        }

        const email = session.user.email || "";
        const name = email.split("@")[0];
        if (name) {
          const parts = name.trim().split(/\s+/);
          const ini =
            (parts[0]?.[0] || "").toUpperCase() +
            (parts[1]?.[0] || "").toUpperCase();
          if (ini) setInitials(ini);
        }
      } catch {}
    })();
  }, [session]);

  const getNavigationLinks = (role: UserRole) => {
    switch (role) {
      case "admin":
        return [
          { href: "/admin", label: "Admin" },
          { href: "/dashboard", label: "Dashboard" },
          { href: "/reviewers", label: "Manage Reviewers" },
        ];
      case "reviewer":
        return [
          { href: "/creator", label: "Creator Dashboard" },
          { href: "/creator/profile", label: "Edit Profile" },
          { href: "/creator/reviews", label: "My Reviews" },
        ];
      case "user":
      default:
        return [
          { href: "/dashboard", label: "Dashboard" },
          { href: "/reviewers", label: "Find Reviewers" },
          { href: "/settings/profile", label: "Profile" },
        ];
    }
  };

  if (loading) {
    return (
      <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/70 dark:bg-zinc-900/50 border-b border-zinc-200/60 dark:border-white/10">
        <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img
              src="/logo.png"
              alt="PaperWeight Logo"
              className="w-8 h-8 object-contain mix-blend-multiply"
            />
            <span className="text-sm font-medium tracking-tight">
              PaperWeight
            </span>
          </Link>
          <div className="animate-pulse bg-gray-200 h-8 w-8 rounded-full"></div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/70 dark:bg-zinc-900/50 border-b border-zinc-200/60 dark:border-white/10">
      <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <img
            src="/logo.png"
            alt="PaperWeight Logo"
            className="w-8 h-8 object-contain"
          />
        </Link>
        <nav className="flex items-center gap-2">
          {session?.isAuthenticated ? (
            <>
              {getNavigationLinks(session.role).map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-full px-3 py-1.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors duration-200"
                >
                  {link.label}
                </Link>
              ))}
              <form action="/auth/logout" method="post">
                <button
                  className="rounded-full px-3 py-1.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors duration-200"
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
                  href="/settings/profile"
                  title="Add profile photo"
                  className="ml-2 h-8 w-8 rounded-full border bg-zinc-200 text-xs font-semibold flex items-center justify-center text-zinc-700 hover:bg-zinc-300"
                >
                  {initials ?? "+"}
                </Link>
              )}
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-full px-3 py-1.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors duration-200"
            >
              Sign In
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
