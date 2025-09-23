type Props = { params: { slug: string } };

export default async function PublicReviewerPage({ params }: Props) {
  const base = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";
  const res = await fetch(
    `${base}/api/reviewers?slug=${encodeURIComponent(params.slug)}`,
    {
      cache: "no-store",
    }
  );
  if (!res.ok) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-xl font-semibold">Profile not found</h1>
      </div>
    );
  }
  const { reviewer } = await res.json();
  if (!reviewer) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-xl font-semibold">Profile not found</h1>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <main className="mx-auto max-w-3xl px-6 py-10">
        <div className="rounded-3xl bg-white ring-1 ring-zinc-100 shadow-[0_1px_0_rgba(0,0,0,0.06)] p-8">
          <div className="flex items-center gap-4">
            {reviewer.photo_url ? (
              <img
                src={reviewer.photo_url}
                alt={reviewer.display_name || reviewer.slug}
                className="h-20 w-20 rounded-full object-cover border"
              />
            ) : (
              <div className="h-20 w-20 rounded-full bg-zinc-200 border" />
            )}
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                {reviewer.display_name || reviewer.slug}
              </h1>
              {reviewer.headline && (
                <p className="text-sm text-zinc-600">{reviewer.headline}</p>
              )}
              {reviewer.company && (
                <p className="text-sm text-zinc-600">
                  Current: {reviewer.company}
                </p>
              )}
              {reviewer.social_link && (
                <a
                  href={reviewer.social_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-2 text-sm text-zinc-700 underline"
                >
                  View LinkedIn profile
                </a>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
