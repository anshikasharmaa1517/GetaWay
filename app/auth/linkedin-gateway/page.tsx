"use client";

import { useEffect } from "react";

export default function LinkedInGateway() {
  useEffect(() => {
    // If LinkedIn photo cookie is present, persist to localStorage and send to login
    try {
      const m = document.cookie.match(/(?:^|; )li_photo_url=([^;]+)/);
      if (m) {
        const val = decodeURIComponent(m[1]);
        localStorage.setItem("linkedin_photo_url", val);
      }
    } catch {}
    // Redirect to login with next=become-reviewer
    window.location.href = "/login?next=%2Fbecome-reviewer";
  }, []);

  return <div className="p-6 text-sm text-zinc-600">Finishing LinkedIn connection…</div>;
}


