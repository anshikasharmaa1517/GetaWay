import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").trim();
  if (!q) return NextResponse.json([]);
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&addressdetails=1&limit=6`;
  const res = await fetch(url, {
    headers: {
      // Provide a contact per Nominatim usage policy
      "User-Agent": "resume-reviewer/1.0 (contact: hello@example.com)",
    },
    // Avoid caching to keep results fresh while typing
    next: { revalidate: 0 },
  });
  if (!res.ok) return NextResponse.json([]);
  const data = (await res.json()) as Array<{ display_name?: string }>;
  const items = data
    .map((d) => d.display_name)
    .filter(Boolean)
    .slice(0, 6);
  return NextResponse.json(items);
}


