import { redirect } from "next/navigation";
import { getServerSupabaseClient } from "@/lib/supabase-server";

function isAdmin(email: string | null): boolean {
  const allow = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  return !!email && allow.includes(email.toLowerCase());
}

export default async function AdminPage() {
  const supabase = await getServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!isAdmin(user.email)) redirect("/dashboard");

  const { data: resumes } = await supabase
    .from("resumes")
    .select("id, user_id, status, score, notes, created_at, file_url")
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-5xl py-10 px-4 space-y-6">
      <h1 className="text-2xl font-semibold">Admin - Review resumes</h1>
      <div className="overflow-x-auto rounded border">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-2">User</th>
              <th className="text-left p-2">Status</th>
              <th className="text-left p-2">Score</th>
              <th className="text-left p-2">Notes</th>
              <th className="text-left p-2">PDF</th>
              <th className="text-left p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(resumes ?? []).map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-2 text-gray-700">{r.user_id}</td>
                <td className="p-2">{r.status}</td>
                <td className="p-2">{typeof r.score === "number" ? r.score : "-"}</td>
                <td className="p-2 max-w-xs truncate" title={r.notes ?? undefined}>{r.notes ?? ""}</td>
                <td className="p-2"><a className="text-blue-600 underline" href={r.file_url} target="_blank">View</a></td>
                <td className="p-2"><a className="text-blue-600 underline" href={`/admin/${r.id}`}>Edit</a></td>
              </tr>
            ))}
          </tbody>
        </table>
        {(!resumes || resumes.length === 0) && <p className="p-4 text-sm">No resumes yet.</p>}
      </div>
    </div>
  );
}


