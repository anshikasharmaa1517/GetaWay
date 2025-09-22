export function StatusChip({ status }: { status: string }) {
  const s = status?.toLowerCase();
  const map: Record<string, string> = {
    approved: "text-emerald-700 bg-emerald-50",
    "needs revision": "text-amber-700 bg-amber-50",
    rejected: "text-rose-700 bg-rose-50",
    pending: "text-zinc-700 bg-zinc-100",
  };
  const cls = map[s] ?? map.pending;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${cls}`}>{status}</span>
  );
}


