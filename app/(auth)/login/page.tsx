"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getBrowserSupabaseClient } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const params =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search)
      : null;
  const nextPath = params?.get("next") || "/reviewers";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = getBrowserSupabaseClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${
        window.location.origin
      }/auth/callback?next=${encodeURIComponent(nextPath)}`,
    });

    if (error) {
      setError(error.message);
    } else {
      setMagicLinkSent(true);
    }
    setLoading(false);
  }

  // OAuth removed per requirements; keep email + password/magic link only

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = getBrowserSupabaseClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      // Determine user role and redirect accordingly
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", (await supabase.auth.getUser()).data.user?.id)
          .single();

        const role = profile?.role || "user";
        let redirectPath = nextPath;

        // Override default redirect based on role if no specific next path
        if (nextPath === "/reviewers") {
          if (role === "admin") {
            redirectPath = "/admin";
          } else if (role === "reviewer") {
            redirectPath = "/creator";
          } else {
            redirectPath = "/dashboard";
          }
        }

        router.replace(redirectPath);
      } catch {
        router.replace(nextPath);
      }
    }
    setLoading(false);
  }

  function isValidEmail(value: string) {
    return /[^@\s]+@[^@\s]+\.[^@\s]+/.test(value);
  }

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 relative">
      {/* Top bar */}
      <div className="absolute inset-x-0 top-0 flex items-center justify-end p-4 md:p-6">
        <a
          href="/become-reviewer-auth"
          className="rounded-full bg-black text-white px-5 md:px-6 py-2 md:py-2.5 text-xs md:text-sm font-medium shadow-sm hover:bg-zinc-900 active:bg-zinc-800 cursor-pointer"
        >
          Become reviewer
        </a>
      </div>
      <div className="hidden md:block relative bg-[#FAD7A1]">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-80 h-80 rounded-full bg-white/40 flex items-center justify-center">
            <img
              src="/logo.png"
              alt="PaperWeight Logo"
              className="w-75 h-75 object-contain mix-blend-multiply"
            />
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-10">
            <h1 className="text-4xl font-semibold leading-tight text-zinc-900">
              Welcome back
            </h1>
            <p className="text-zinc-600 mt-2">Sign in to your account</p>
          </div>

          {magicLinkSent ? (
            <div className="text-center">
              <p className="text-sm text-zinc-600">
                Check your email for a password reset link.
              </p>
              <button
                type="button"
                onClick={() => {
                  setMagicLinkSent(false);
                  setShowForgotPassword(false);
                  setError(null);
                }}
                className="mt-4 text-sm text-blue-600 hover:text-blue-800 underline cursor-pointer"
              >
                Back to login
              </button>
            </div>
          ) : showForgotPassword ? (
            <form onSubmit={sendMagicLink} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  Email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="w-full rounded-lg border border-zinc-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={loading || !isValidEmail(email)}
                  className="flex-1 rounded-lg bg-black text-white px-5 py-3 cursor-pointer transition-colors hover:bg-zinc-900 active:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Sending..." : "Send reset link"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setError(null);
                  }}
                  className="px-5 py-3 text-zinc-600 hover:text-zinc-900 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  Email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="w-full rounded-lg border border-zinc-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full rounded-lg border border-zinc-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-sm text-blue-600 hover:text-blue-800 underline cursor-pointer"
                >
                  Forgot your password?
                </button>
              </div>
              <button
                type="submit"
                disabled={loading || !isValidEmail(email) || !password}
                className="w-full rounded-lg bg-black text-white px-5 py-3 cursor-pointer transition-colors hover:bg-zinc-900 active:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </form>
          )}

          <div className="mt-8 text-center">
            <p className="text-sm text-zinc-600">
              Don't have an account?{" "}
              <a
                href="/become-reviewer-auth"
                className="text-blue-600 hover:text-blue-800 underline cursor-pointer"
              >
                Sign up here
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
