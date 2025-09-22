"use client";

import { useState } from "react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";

export function ChangePasswordCard() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    setMessage(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setSaving(false);
    if (!res.ok) {
      try {
        const data = await res.json();
        setError(data?.error || "Failed to update password");
      } catch {
        setError("Failed to update password");
      }
      return;
    }
    setPassword("");
    setConfirm("");
    setMessage("Password updated");
  }

  return (
    <Card>
      <CardHeader title="Change password" subtitle="Used for email login" />
      <CardBody>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          {error && <p className="text-sm text-red-600">{error}</p>}
          {message && <p className="text-sm text-green-600">{message}</p>}
          <div className="space-y-1">
            <label className="text-sm">New password</label>
            <input
              type="password"
              className="w-full rounded-md border px-3 py-2"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              minLength={8}
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm">Confirm password</label>
            <input
              type="password"
              className="w-full rounded-md border px-3 py-2"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
              minLength={8}
              required
            />
          </div>
          <button
            type="submit"
            className="rounded-full bg-black text-white px-4 py-2 disabled:opacity-50 cursor-pointer"
            disabled={saving}
          >
            {saving ? "Saving..." : "Update password"}
          </button>
        </form>
      </CardBody>
    </Card>
  );
}


