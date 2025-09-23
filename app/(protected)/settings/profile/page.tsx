"use client";

import { useEffect, useState } from "react";
import { getBrowserSupabaseClient } from "@/lib/supabase";
import { AppBar } from "@/components/ui/AppBar";

export default function UserProfilePhotoPage() {
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const supabase = getBrowserSupabaseClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setEmail(user.email || null);
      const meta: any = user.user_metadata || {};
      setAvatarUrl(meta.avatar_url || meta.picture || null);
    })();
  }, []);

  async function uploadAvatar(file: File) {
    const supabase = getBrowserSupabaseClient();
    setUploading(true);
    try {
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
      if (error) return;
      const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
      const publicUrl = data.publicUrl;
      await supabase.auth.updateUser({ data: { avatar_url: publicUrl } });
      setAvatarUrl(publicUrl);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <AppBar />
      <main className="mx-auto max-w-xl px-6 py-10">
        <h1 className="text-2xl font-semibold tracking-tight">Profile photo</h1>
        <p className="text-sm text-zinc-600 mt-1">
          This avatar shows on the top-right across the app.
        </p>

        <div className="mt-6 flex items-center gap-4">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="avatar"
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
                if (f) uploadAvatar(f);
              }}
            />
            {uploading ? "Uploading…" : "Change photo"}
          </label>
        </div>

        {email && (
          <p className="mt-4 text-sm text-zinc-600">Signed in as {email}</p>
        )}
      </main>
    </div>
  );
}
