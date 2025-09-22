import { NextRequest } from "next/server";

type Reviewer = {
  id: string;
  name: string;
  role: string;
  headline: string;
  company: string;
  experienceYears: number;
  photoUrl: string;
  rating: number;
  reviews: number;
};

const curatedByRole: Record<string, Reviewer[]> = {
  "software engineer": [
    {
      id: "se-1",
      name: "Ava Thompson",
      role: "Senior Software Engineer",
      company: "FAANG",
      headline: "Ex-FAANG, system design & backend focus",
      experienceYears: 9,
      photoUrl: "https://i.pravatar.cc/100?img=5",
      rating: 4.9,
      reviews: 182,
    },
    {
      id: "se-2",
      name: "Noah Patel",
      role: "Staff Engineer",
      company: "HyperScale",
      headline: "Data structures and practical code reviews",
      experienceYears: 11,
      photoUrl: "https://i.pravatar.cc/100?img=12",
      rating: 4.8,
      reviews: 137,
    },
  ],
  "product manager": [
    {
      id: "pm-1",
      name: "Maya Chen",
      role: "PM Lead",
      company: "Unicorn Inc.",
      headline: "Storytelling, metrics, and roadmap clarity",
      experienceYears: 8,
      photoUrl: "https://i.pravatar.cc/100?img=32",
      rating: 4.9,
      reviews: 96,
    },
  ],
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const role = (searchParams.get("role") || "").toLowerCase();
  let results: Reviewer[] = [];
  if (role) {
    // naive matching over curated map keys
    for (const key of Object.keys(curatedByRole)) {
      if (role.includes(key)) {
        results = curatedByRole[key];
        break;
      }
    }
  }
  if (results.length === 0) {
    // default fallback list
    results = [
      {
        id: "gen-1",
        name: "Alex Rivera",
        role: "Resume Coach",
        company: "Independent",
        headline: "Impact-driven bullets, ATS friendly formatting",
        experienceYears: 7,
        photoUrl: "https://i.pravatar.cc/100?img=22",
        rating: 4.8,
        reviews: 120,
      },
    ];
  }
  return new Response(JSON.stringify({ reviewers: results }), {
    headers: { "content-type": "application/json" },
  });
}


