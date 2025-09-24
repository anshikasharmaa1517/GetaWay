"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getBrowserSupabaseClient } from "@/lib/supabase";
import { AppBar } from "@/components/ui/AppBar";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { StatusChip } from "@/components/ui/StatusChip";
import { ChangePasswordCard } from "@/components/ChangePasswordCard";

interface Resume {
  id: string;
  status: string;
  score: number | null;
  notes: string | null;
  created_at: string;
  file_url: string;
}

interface User {
  id: string;
  email?: string;
  user_metadata: {
    avatar_url?: string;
    picture?: string;
    full_name?: string;
    name?: string;
    display_name?: string;
    first_name?: string;
    last_name?: string;
  };
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [userName, setUserName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const router = useRouter();

  // Function to get the best available name
  const getUserName = (user: User | null) => {
    if (!user) return "User";
    const metadata = user.user_metadata;
    if (metadata?.full_name) return metadata.full_name;
    if (metadata?.name) return metadata.name;
    if (metadata?.display_name) return metadata.display_name;
    if (metadata?.first_name && metadata?.last_name) {
      return `${metadata.first_name} ${metadata.last_name}`;
    }
    if (metadata?.first_name) return metadata.first_name;
    if (metadata?.last_name) return metadata.last_name;
    return user.email?.split("@")[0] || "User";
  };

  // Function to save the user's name
  const saveName = async () => {
    if (!user || !userName.trim()) return;

    setSavingName(true);
    setError(null);

    try {
      const supabase = getBrowserSupabaseClient();
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: userName.trim(),
          name: userName.trim(),
        },
      });

      if (error) {
        setError(error.message);
        return;
      }

      // Update local user state
      setUser({
        ...user,
        user_metadata: {
          ...user.user_metadata,
          full_name: userName.trim(),
          name: userName.trim(),
        },
      });

      setEditingName(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSavingName(false);
    }
  };

  useEffect(() => {
    async function loadData() {
      const supabase = getBrowserSupabaseClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setUser(user);
      setUserName(getUserName(user));

      // Load avatar URL
      const avatarUrl =
        (user.user_metadata as any)?.avatar_url ||
        (user.user_metadata as any)?.picture ||
        null;
      setAvatarUrl(avatarUrl);

      // Load resumes
      const { data: resumes } = await supabase
        .from("resumes")
        .select("id, status, score, notes, created_at, file_url")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      setResumes(resumes || []);
      setLoading(false);
    }

    loadData();
  }, [router]);

  async function uploadPhoto(file: File) {
    if (!file) return;
    try {
      setUploading(true);
      setError(null);
      const supabase = getBrowserSupabaseClient();
      const bucket = "avatars";
      const ext = file.name.includes(".")
        ? file.name.split(".").pop() || "jpg"
        : "jpg";
      const fileName = `avatar-${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });
      if (error) {
        setError(error.message);
        return;
      }
      const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
      if (data.publicUrl) {
        const { error: updateError } = await supabase.auth.updateUser({
          data: { avatar_url: data.publicUrl },
        });
        if (updateError) setError(updateError.message);
        else setAvatarUrl(data.publicUrl);
      }
    } finally {
      setUploading(false);
    }
  }

  if (loading) {
    return (
      <div>
        <AppBar />
        <main className="mx-auto max-w-6xl px-4 py-10">
          <div className="text-center">Loading...</div>
        </main>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <AppBar />
      <main className="mx-auto max-w-7xl px-6 py-12">
        {/* Hero Section */}
        <section className="mb-12">
          <h1 className="text-4xl font-semibold tracking-tight text-gray-900 mb-3">
            Welcome back
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Upload your resume and track its review status.
          </p>
          <a
            className="inline-flex items-center justify-center rounded-2xl bg-gray-900 text-white px-8 py-4 text-base font-medium shadow-sm hover:bg-gray-800 transition-colors duration-200"
            href="/upload"
          >
            Upload resume
          </a>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-8 py-6 border-b border-gray-100">
                <h2 className="text-xl font-semibold text-gray-900">
                  Your resumes
                </h2>
              </div>
              <div className="divide-y divide-gray-100">
                {resumes.map((r) => (
                  <div
                    key={r.id}
                    className="px-8 py-6 hover:bg-gray-50 transition-colors duration-150"
                  >
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <h3 className="text-base font-medium text-gray-900">
                            {r.file_url
                              .split("/")
                              .pop()
                              ?.split("-")
                              .slice(1)
                              .join("-") || "Resume"}
                          </h3>
                          {typeof r.score === "number" && (
                            <span className="text-sm font-medium text-gray-700 bg-gray-100 px-3 py-1 rounded-full">
                              Score: {r.score}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          Uploaded on{" "}
                          {new Date(r.created_at).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                        {r.notes && (
                          <p className="text-sm text-gray-600 leading-relaxed">
                            {r.notes}
                          </p>
                        )}
                      </div>
                      <a
                        className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors duration-150"
                        href={r.file_url}
                        target="_blank"
                      >
                        View PDF
                      </a>
                    </div>
                  </div>
                ))}
                {resumes.length === 0 && (
                  <div className="px-8 py-12 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <svg
                        className="w-8 h-8 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <p className="text-gray-500 text-base">No uploads yet</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Upload your first resume to get started
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Profile Card */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">Profile</h3>
                <p className="text-sm text-gray-600 mt-1">Basic account info</p>
              </div>
              <div className="px-6 py-6">
                <div className="flex items-center gap-4 mb-6">
                  <img
                    src={avatarUrl || "/favicon.ico"}
                    alt="Profile"
                    className="h-12 w-12 rounded-2xl object-cover border border-gray-200"
                  />
                  <div className="flex-1">
                    <label className="text-sm font-medium text-blue-600 hover:text-blue-700 cursor-pointer transition-colors duration-150">
                      Change photo
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) uploadPhoto(file);
                        }}
                        className="hidden"
                        disabled={uploading}
                      />
                    </label>
                    {uploading && (
                      <p className="text-xs text-gray-500 mt-1">Uploading...</p>
                    )}
                    {error && (
                      <p className="text-xs text-red-500 mt-1">{error}</p>
                    )}
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Name
                      </p>
                      {!editingName && (
                        <button
                          onClick={() => setEditingName(true)}
                          className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Edit
                        </button>
                      )}
                    </div>
                    {editingName ? (
                      <div className="mt-2 space-y-2">
                        <input
                          type="text"
                          value={userName}
                          onChange={(e) => setUserName(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter your name"
                          disabled={savingName}
                        />
                        <div className="flex items-center gap-2">
                          <button
                            onClick={saveName}
                            disabled={savingName || !userName.trim()}
                            className="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {savingName ? "Saving..." : "Save"}
                          </button>
                          <button
                            onClick={() => {
                              setEditingName(false);
                              setUserName(getUserName(user));
                            }}
                            disabled={savingName}
                            className="px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-900 mt-1">
                        {getUserName(user)}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Email
                    </p>
                    <p className="text-sm text-gray-900 mt-1">
                      {user.email || "Not provided"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      User ID
                    </p>
                    <p className="text-xs font-mono text-gray-600 mt-1 break-all">
                      {user.id}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Change Password Card */}
            <ChangePasswordCard />

            {/* Notifications Card */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">
                  Notifications
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Get emails on status changes
                </p>
              </div>
              <div className="px-6 py-6">
                <label className="flex items-center gap-3 text-sm">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    defaultChecked
                  />
                  <span className="text-gray-700">
                    Email me when my status changes
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
