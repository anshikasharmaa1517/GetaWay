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
    <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900">Change password</h3>
        <p className="text-sm text-gray-600 mt-1">Used for email login</p>
      </div>
      <div className="px-6 py-6">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
          {message && (
            <div className="bg-green-50 border border-green-200 rounded-2xl px-4 py-3">
              <p className="text-sm text-green-600">{message}</p>
            </div>
          )}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              New password
            </label>
            <input
              type="password"
              className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              minLength={8}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Confirm password
            </label>
            <input
              type="password"
              className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
              minLength={8}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-2xl bg-gray-900 text-white px-6 py-3 text-sm font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            disabled={saving}
          >
            {saving ? "Saving..." : "Update password"}
          </button>
        </form>
      </div>
    </div>
  );
}
