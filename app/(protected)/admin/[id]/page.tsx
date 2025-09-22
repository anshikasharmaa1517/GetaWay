import { redirect } from "next/navigation";
import { getServerSupabaseClient } from "@/lib/supabase-server";

export default async function AdminEditPage({ params }: { params: { id: string } }) {
  const supabase = await getServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: resume } = await supabase
    .from("resumes")
    .select("id, user_id, status, score, notes, file_url")
    .eq("id", params.id)
    .single();

  if (!resume) redirect("/admin");

  return (
    <div className="mx-auto max-w-3xl py-10 px-4 space-y-6">
      <h1 className="text-2xl font-semibold">Edit resume</h1>
      <form action={`/api/resumes/${resume.id}`} method="post" className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Status</label>
          <select name="status" defaultValue={resume.status} className="w-full rounded border px-3 py-2">
            <option>Approved</option>
            <option>Needs Revision</option>
            <option>Rejected</option>
            <option>Pending</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Score</label>
          <input type="number" name="score" defaultValue={resume.score ?? ""} className="w-full rounded border px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Notes</label>
          <textarea name="notes" defaultValue={resume.notes ?? ""} className="w-full rounded border px-3 py-2" rows={4} />
        </div>
        <div className="flex items-center gap-3">
          <a href={resume.file_url} target="_blank" className="text-blue-600 underline">View PDF</a>
        </div>
        <button type="submit" className="rounded bg-black text-white px-4 py-2">Save</button>
      </form>
    </div>
  );
}


