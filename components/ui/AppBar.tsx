"use client";

import Link from "next/link";

export function AppBar() {
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
        </nav>
      </div>
    </header>
  );
}
