export default function CreatorDashboard() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="h-14 border-b bg-white/70 backdrop-blur flex items-center justify-between px-4">
        <div className="text-sm font-semibold tracking-tight">
          GetAWay Creator
        </div>
        <a
          href="/reviewer"
          className="text-sm text-zinc-600 hover:text-zinc-900 underline"
        >
          Public reviewers
        </a>
      </header>

      <div className="mx-auto max-w-6xl grid grid-cols-12 gap-6 px-4 py-6">
        <aside className="col-span-12 md:col-span-3">
          <nav className="rounded-2xl bg-white ring-1 ring-zinc-100 shadow-[0_1px_0_rgba(0,0,0,0.06)] p-2">
            <a
              className="block px-3 py-2 rounded-lg text-sm text-zinc-700 hover:bg-zinc-50"
              href="/creator/profile"
            >
              Edit Profile
            </a>
            <a
              className="block px-3 py-2 rounded-lg text-sm font-medium bg-zinc-900 text-white"
              href="#"
            >
              Priority DM
            </a>
            <a
              className="block px-3 py-2 rounded-lg text-sm text-zinc-700 hover:bg-zinc-50"
              href="#"
            >
              Services
            </a>
            <a
              className="block px-3 py-2 rounded-lg text-sm text-zinc-700 hover:bg-zinc-50"
              href="#"
            >
              Calendar
            </a>
            <a
              className="block px-3 py-2 rounded-lg text-sm text-zinc-700 hover:bg-zinc-50"
              href="#"
            >
              Payouts
            </a>
            <div className="mt-2 border-t" />
            <a
              className="block px-3 py-2 rounded-lg text-sm text-zinc-700 hover:bg-zinc-50"
              href="#"
            >
              Analytics
            </a>
            <a
              className="block px-3 py-2 rounded-lg text-sm text-zinc-700 hover:bg-zinc-50"
              href="#"
            >
              Testimonials
            </a>
            <a
              className="block px-3 py-2 rounded-lg text-sm text-zinc-700 hover:bg-zinc-50"
              href="#"
            >
              Settings
            </a>
          </nav>
        </aside>

        <main className="col-span-12 md:col-span-9">
          <div className="rounded-3xl bg-white ring-1 ring-zinc-100 shadow-[0_1px_0_rgba(0,0,0,0.06)] p-10 flex flex-col items-center text-center">
            <div className="h-28 w-28 rounded-2xl bg-zinc-50 border border-zinc-200 flex items-center justify-center mb-6">
              <div className="h-10 w-10 rounded-lg bg-zinc-200" />
            </div>
            <h2 className="text-xl font-semibold tracking-tight">
              Try Priority DM
            </h2>
            <p className="text-sm text-zinc-600 mt-2 max-w-md">
              Priority DM allows you to accept DM requests without revealing
              your information and reply seamlessly.
            </p>
            <button className="mt-6 rounded-xl bg-black text-white px-5 py-2 text-sm hover:bg-zinc-900">
              Add Priority DM
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
