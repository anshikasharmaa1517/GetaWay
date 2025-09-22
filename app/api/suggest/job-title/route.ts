import { NextResponse } from "next/server";

// Public ESCO API for occupations: no auth required
// Docs: https://ec.europa.eu/esco/
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").trim();
  if (!q) return NextResponse.json([]);
  const url = `https://ec.europa.eu/esco/api/search?text=${encodeURIComponent(
    q
  )}&type=occupation&language=en`;
  try {
    const res = await fetch(url, { next: { revalidate: 0 } });
    if (!res.ok) return NextResponse.json([]);
    const data = (await res.json()) as any;
    const items: string[] = Array.isArray(data?.results)
      ? data.results
          .map((r: any) => r?.preferredLabel || r?.title || r?.label)
          .filter(Boolean)
      : [];
    // Return unique top results
    const unique = Array.from(new Set(items)).slice(0, 20);
    return NextResponse.json(unique);
  } catch {
    return NextResponse.json([]);
  }
}
