"use client";

import { useState } from "react";
import { getBrowserSupabaseClient } from "@/lib/supabase";

export default function BecomeReviewerAuthPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignup, setIsSignup] = useState(true);

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const supabase = getBrowserSupabaseClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo:
          typeof window !== "undefined"
            ? `${window.location.origin}/auth/callback?next=%2Fbecome-reviewer`
            : undefined,
      },
    });
    if (error) setError(error.message);
    else setSent(true);
  }

  async function continueWithPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSent(false);
    const supabase = getBrowserSupabaseClient();
    setLoading(true);
    try {
      if (isSignup) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo:
              typeof window !== "undefined"
                ? `${window.location.origin}/auth/callback?next=%2Fbecome-reviewer`
                : undefined,
            data: { first_name: firstName, last_name: lastName },
          },
        });
        if (error) setError(error.message);
        else setSent(true);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) setError(error.message);
        else window.location.href = "/become-reviewer";
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-200 to-zinc-50">
      <header className="mx-auto max-w-4xl px-6 py-6 flex items-center justify-between">
        <div className="text-[15px] md:text-[17px] font-semibold tracking-tight text-zinc-900">
          PaperWeight
        </div>
        <a
          href="/reviewer-login"
          className="rounded-full border border-zinc-400 bg-white px-4 py-1.5 text-xs md:text-sm font-medium text-zinc-900 shadow-sm hover:bg-zinc-100 cursor-pointer"
        >
          Login
        </a>
      </header>

      <main className="mx-auto max-w-4xl px-6 pb-24">
        <div className="relative overflow-hidden rounded-[28px] bg-white/90 backdrop-blur ring-1 ring-zinc-300 shadow-[0_2px_0_rgba(0,0,0,0.08)]">
          <div className="absolute -top-28 -right-20 h-64 w-64 rounded-full bg-zinc-200" />
          <div className="absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-zinc-200" />

          <div className="relative p-8 md:p-12">
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-zinc-900">
              Sign up
            </h1>
            <p className="mt-2 text-[15px] text-zinc-700">
              Create your reviewer page in moments.
            </p>

            <form
              onSubmit={continueWithPassword}
              className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4"
            >
              <div>
                <label className="text-[13px] font-medium text-zinc-900">
                  First name
                </label>
                <input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-zinc-400 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-4 focus:ring-black/5"
                  placeholder="First name"
                  required={isSignup}
                />
              </div>
              <div>
                <label className="text-[13px] font-medium text-zinc-900">
                  Last name
                </label>
                <input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-zinc-400 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-4 focus:ring-black/5"
                  placeholder="Last name"
                  required={isSignup}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-[13px] font-medium text-zinc-900">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-2 w-full rounded-2xl border border-zinc-400 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-4 focus:ring-black/5"
                  placeholder="you@example.com"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-[13px] font-medium text-zinc-900">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="mt-2 w-full rounded-2xl border border-zinc-400 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-4 focus:ring-black/5"
                  placeholder="Password"
                />
              </div>
              {error && (
                <p className="sm:col-span-2 text-sm text-red-600">{error}</p>
              )}
              <div className="sm:col-span-2 flex items-center gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center justify-center rounded-full bg-black text-white px-5 py-3 text-sm font-medium shadow-sm hover:bg-black/90 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                >
                  {loading
                    ? "Working…"
                    : isSignup
                    ? "Create account"
                    : "Sign in"}
                </button>
                <button
                  type="button"
                  onClick={sendMagicLink}
                  className="inline-flex items-center justify-center rounded-full border border-zinc-400 bg-white px-5 py-3 text-sm font-medium text-zinc-900 shadow-sm hover:bg-zinc-100 cursor-pointer"
                >
                  Send magic link
                </button>
              </div>
            </form>

            <div className="mt-10">
              <div className="text-[13px] font-medium text-zinc-900">
                We respect your inbox
              </div>
              <div className="text-[13px] text-zinc-700 mt-1">
                We’ll only email you to sign in or about important account
                activity.
              </div>
            </div>

            <p className="mt-4 text-[12px] text-zinc-700">
              By signing up, you agree to our{" "}
              <a className="underline" href="#">
                Terms of Use
              </a>{" "}
              and
              <a className="underline ml-1" href="#">
                Privacy Policy
              </a>
              .
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
