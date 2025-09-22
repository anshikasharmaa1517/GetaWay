import { redirect } from "next/navigation";
import { getServerSupabaseClient } from "@/lib/supabase-server";
import { AppBar } from "@/components/ui/AppBar";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { StatusChip } from "@/components/ui/StatusChip";
import { ChangePasswordCard } from "@/components/ChangePasswordCard";
import Image from "next/image";
import { headers } from "next/headers";

export default async function DashboardPage() {
  const supabase = await getServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: resumes } = await supabase
    .from("resumes")
    .select("id, status, score, notes, created_at, file_url")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  // reviewers moved off dashboard

  return (
    <div>
      <AppBar />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <section className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">
            Welcome back
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">
            Upload your resume and track its review status.
          </p>
          <a
            className="mt-4 inline-block rounded-full bg-black text-white px-4 py-2"
            href="/upload"
          >
            Upload resume
          </a>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            <Card>
              <CardHeader title="Your submissions" />
              <CardBody>
                <div className="divide-y">
                  {(resumes ?? []).map((r) => (
                    <div
                      key={r.id}
                      className="py-4 flex items-center justify-between"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <StatusChip status={r.status} />
                          {typeof r.score === "number" && (
                            <span className="text-sm text-zinc-700 dark:text-zinc-300">
                              Score: {r.score}
                            </span>
                          )}
                        </div>
                        {r.notes && (
                          <p className="text-sm text-zinc-600 dark:text-zinc-400">
                            {r.notes}
                          </p>
                        )}
                      </div>
                      <a
                        className="text-sm text-blue-600 underline"
                        href={r.file_url}
                        target="_blank"
                      >
                        View PDF
                      </a>
                    </div>
                  ))}
                  {(!resumes || resumes.length === 0) && (
                    <p className="py-6 text-sm">No uploads yet.</p>
                  )}
                </div>
              </CardBody>
            </Card>

            {/* Reviewers moved to /reviewer */}
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader title="Profile" subtitle="Basic account info" />
              <CardBody>
                <div className="text-sm space-y-1">
                  <div>Email: {user.email}</div>
                  <div>
                    UID: <span className="font-mono text-xs">{user.id}</span>
                  </div>
                </div>
              </CardBody>
            </Card>
            <ChangePasswordCard />
            <Card>
              <CardHeader
                title="Notifications"
                subtitle="Get emails on status changes"
              />
              <CardBody>
                <form>
                  <label className="flex items-center gap-3 text-sm">
                    <input type="checkbox" className="h-4 w-4" defaultChecked />
                    Email me when my status changes
                  </label>
                </form>
              </CardBody>
            </Card>
            {/* Right column now only profile/notifications */}
          </div>
        </div>
      </main>
    </div>
  );
}
