"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { getBrowserSupabaseClient } from "@/lib/supabase";

export default function ReviewerLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Check for error parameter in URL
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const errorParam = urlParams.get("error");
    if (errorParam === "not_reviewer") {
      setError(
        "This account is not registered as a reviewer. Please sign up as a reviewer first."
      );
      // Clean up the URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = getBrowserSupabaseClient();

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        return;
      }

      // Check if user is a reviewer
      const { data: reviewerProfile } = await supabase
        .from("reviewers")
        .select("id")
        .eq("user_id", (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!reviewerProfile) {
        setError(
          "This account is not registered as a reviewer. Please sign up as a reviewer first."
        );
        await supabase.auth.signOut();
        return;
      }

      // Redirect to creator dashboard
      router.replace("/creator");
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email) {
      setError("Please enter your email address first.");
      return;
    }

    const supabase = getBrowserSupabaseClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo:
          typeof window !== "undefined"
            ? `${window.location.origin}/auth/callback?next=%2Fcreator`
            : undefined,
      },
    });

    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
  }

  function isValidEmail(value: string) {
    return /[^@\s]+@[^@\s]+\.[^@\s]+/.test(value);
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="text-center">
            <h1 className="text-2xl font-semibold mb-4">Check your email</h1>
            <p className="text-zinc-600 mb-6">
              We've sent a magic link to <strong>{email}</strong>. Click the
              link in the email to sign in to your reviewer account.
            </p>
            <button
              onClick={() => {
                setSent(false);
                setEmail("");
                setPassword("");
              }}
              className="text-sm text-zinc-600 hover:text-zinc-900 underline"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="mx-auto max-w-4xl px-6 py-6 flex items-center justify-between">
        <div className="flex items-center">
          <img
            src="/logo.png"
            alt="PaperWeight Logo"
            className="w-12 h-12 md:w-16 md:h-16 object-contain mix-blend-multiply"
          />
        </div>
        <div className="flex items-center gap-4">
          <a
            href="/become-reviewer-auth"
            className="text-sm text-zinc-600 hover:text-zinc-900 underline"
          >
            Create reviewer account
          </a>
          <a
            href="/login"
            className="text-sm text-zinc-600 hover:text-zinc-900 underline"
          >
            User login
          </a>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-md px-6 pb-20">
        <div className="rounded-3xl bg-white shadow-[0_1px_0_rgba(0,0,0,0.06)] ring-1 ring-zinc-100 p-6 md:p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mb-2">
              Reviewer Sign In
            </h1>
            <p className="text-sm text-zinc-600">
              Sign in to your reviewer account to access your dashboard
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
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
              <label className="text-sm font-medium text-zinc-900">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="mt-2 w-full rounded-xl border border-zinc-300 px-3 py-2 focus:outline-none focus:ring-4 focus:ring-black/5 focus:border-zinc-400 transition"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-zinc-900">
                Password
              </label>
              <div className="relative mt-2">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full rounded-xl border border-zinc-300 px-3 py-2 pr-10 focus:outline-none focus:ring-4 focus:ring-black/5 focus:border-zinc-400 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-700"
                >
                  {showPassword ? (
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
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                      />
                    </svg>
                  ) : (
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
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button
                type="submit"
                disabled={loading || !isValidEmail(email) || !password}
                className="w-full inline-flex items-center justify-center rounded-2xl bg-black text-white px-6 py-3 text-sm font-medium shadow-sm hover:bg-zinc-900 active:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                {loading ? (
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
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </button>

              <div className="text-center text-sm text-zinc-500">or</div>

              <button
                type="button"
                onClick={sendMagicLink}
                disabled={!isValidEmail(email)}
                className="w-full inline-flex items-center justify-center rounded-2xl border border-zinc-300 bg-white px-6 py-3 text-sm font-medium text-zinc-900 shadow-sm hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                Send Magic Link
              </button>
            </div>

            <div className="text-center">
              <p className="text-sm text-zinc-600">
                Forgot your password? Use the magic link option above.
              </p>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
