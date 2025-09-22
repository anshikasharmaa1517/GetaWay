import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").trim();
  if (!q) return NextResponse.json([]);
  const url = `https://universities.hipolabs.com/search?name=${encodeURIComponent(q)}`;
  const res = await fetch(url, { next: { revalidate: 0 } });
  if (!res.ok) return NextResponse.json([]);
  const data = (await res.json()) as Array<{ name?: string; country?: string }>;
  const items = data
    .filter((d) => !!d.name)
    .map((d) => (d.country ? `${d.name}, ${d.country}` : d.name!))
    .slice(0, 8);
  return NextResponse.json(items);
}


