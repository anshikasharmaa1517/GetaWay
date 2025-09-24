import { getServerSupabaseClient } from "@/lib/supabase-server";

export default async function LeaderboardPage() {
  let data = null;
  
  try {
    const supabase = await getServerSupabaseClient();
    const result = await supabase.from("leaderboard").select("user_id, best_score").order("best_score", { ascending: false }).limit(50);
    data = result.data;
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    data = [];
  }

  return (
    <div className="mx-auto max-w-3xl py-10 px-4 space-y-6">
      <h1 className="text-2xl font-semibold">Leaderboard</h1>
      <div className="rounded border divide-y">
        {(data ?? []).map((row) => (
          <div key={row.user_id} className="flex items-center justify-between p-3">
            <span className="font-mono text-sm">{row.user_id}</span>
            <span className="font-semibold">{row.best_score ?? "-"}</span>
          </div>
        ))}
        {(!data || data.length === 0) && <p className="p-4 text-sm">No scores yet.</p>}
      </div>
    </div>
  );
}


