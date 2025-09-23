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

  // Determine following state (server fetch; client cookies forwarded by Next)
  const followRes = await fetch(
    `${base}/api/follow?slug=${encodeURIComponent(params.slug)}`,
    { cache: "no-store" }
  );
  const followJson = followRes.ok
    ? await followRes.json()
    : { following: false };
  const following = !!followJson.following;

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

          <div className="mt-6">
            {following ? (
              <a
                href={`/upload?to=${encodeURIComponent(params.slug)}`}
                className="inline-flex items-center rounded-xl bg-black text-white px-4 py-2 text-sm hover:bg-zinc-900"
              >
                Share your resume
              </a>
            ) : (
              <form method="post" action="/api/follow" className="inline">
                <input type="hidden" name="slug" value={params.slug} />
                <input type="hidden" name="action" value="follow" />
                <input type="hidden" name="next" value={`/r/${params.slug}`} />
                <button
                  type="submit"
                  className="inline-flex items-center rounded-xl border px-4 py-2 text-sm hover:bg-zinc-50"
                >
                  Follow to share resume
                </button>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
