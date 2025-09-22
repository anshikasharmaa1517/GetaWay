"use client";

import { useEffect, useState } from "react";

type Employment = "Yes" | "Not currently" | "Student";

export function OnboardingModal() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [employment, setEmployment] = useState<Employment | null>(null);
  // Student fields
  const [studentUniversity, setStudentUniversity] = useState("");
  const [studentDegree, setStudentDegree] = useState("");
  const [studentGradYear, setStudentGradYear] = useState<number | "">("");
  // Common discovery fields
  const [desiredJobTitle, setDesiredJobTitle] = useState("");
  const [desiredLocation, setDesiredLocation] = useState("");
  // Employed fields
  const [currentRole, setCurrentRole] = useState("");
  const [yearsExperience, setYearsExperience] = useState<number | "">("");
  const [industry, setIndustry] = useState("");
  const [lookingFor, setLookingFor] = useState("");

  // API-backed typeahead results
  const [collegeResults, setCollegeResults] = useState<string[]>([]);
  const [locationResults, setLocationResults] = useState<string[]>([]);

  useEffect(() => {
    async function check() {
      const res = await fetch("/api/profile");
      const data = await res.json();
      setOpen(!data.onboarded);
      setLoading(false);
    }
    check();
  }, []);

  // Smoothly reveal once mounted; also lock scroll while open
  useEffect(() => {
    if (!loading && open) {
      const frame = requestAnimationFrame(() => setVisible(true));
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        cancelAnimationFrame(frame);
        document.body.style.overflow = previousOverflow;
        setVisible(false);
      };
    }
  }, [loading, open]);

  function chooseEmployment(value: Employment) {
    setEmployment(value);
    setStep(2);
  }

  // Debounced remote suggestions
  useEffect(() => {
    const controller = new AbortController();
    const id = setTimeout(async () => {
      const q = studentUniversity.trim();
      if (!q) return setCollegeResults([]);
      try {
        const r = await fetch(
          `/api/suggest/university?q=${encodeURIComponent(q)}`,
          { signal: controller.signal }
        );
        if (!r.ok) return;
        setCollegeResults(await r.json());
      } catch {}
    }, 250);
    return () => {
      controller.abort();
      clearTimeout(id);
    };
  }, [studentUniversity]);

  useEffect(() => {
    const controller = new AbortController();
    const id = setTimeout(async () => {
      const q = desiredLocation.trim();
      if (!q) return setLocationResults([]);
      try {
        const r = await fetch(
          `/api/suggest/location?q=${encodeURIComponent(q)}`,
          { signal: controller.signal }
        );
        if (!r.ok) return;
        setLocationResults(await r.json());
      } catch {}
    }, 250);
    return () => {
      controller.abort();
      clearTimeout(id);
    };
  }, [desiredLocation]);

  async function save() {
    setSaving(true);
    const payload: any = {
      employment_status: employment,
      desired_job_title: desiredJobTitle || null,
      desired_location: desiredLocation || null,
    };
    if (employment === "Student") {
      payload.student_university = studentUniversity || null;
      payload.student_degree = studentDegree || null;
      payload.student_graduation_year = studentGradYear || null;
    } else if (employment === "Yes") {
      payload.current_role = currentRole || null;
      payload.years_experience = yearsExperience || null;
      payload.industry = industry || null;
      payload.looking_for = lookingFor || null;
    }
    await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    setOpen(false);
  }

  // Ensure the backdrop appears immediately on first paint to avoid exposing
  // the background before the client fetch completes.
  if (loading) {
    return <div className="fixed inset-0 z-50 bg-white/30 backdrop-blur-md" />;
  }
  if (!open) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-white/30 backdrop-blur-md transition-opacity duration-200 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`w-[90%] max-w-md rounded-2xl bg-white shadow-2xl p-6 transition-transform duration-200 ${
          visible ? "translate-y-0" : "translate-y-1"
        }`}
      >
        <div className="mx-auto mb-4 h-1 w-16 rounded-full bg-zinc-200" />
        <h2 className="text-xl font-semibold text-center">
          Set up your experience
        </h2>

        {step === 1 && (
          <>
            <p className="text-center text-sm text-zinc-600 mt-2">
              Are you employed?
            </p>
            <div className="mt-6 space-y-3">
              {(["Yes", "Not currently", "Student"] as Employment[]).map(
                (label) => (
                  <button
                    key={label}
                    onClick={() => chooseEmployment(label)}
                    disabled={saving}
                    className="w-full rounded-xl border border-zinc-300 py-3 text-sm hover:bg-zinc-50 disabled:opacity-50 cursor-pointer"
                  >
                    {label === "Student" ? "No, I'm a student" : label}
                  </button>
                )
              )}
            </div>
          </>
        )}

        {step === 2 && (
          <form
            className="mt-2 space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              save();
            }}
          >
            {employment === "Student" && (
              <>
                <p className="text-sm text-zinc-600">
                  Tell us about your studies
                </p>
                <div className="relative">
                  <input
                    value={studentUniversity}
                    onChange={(e) => setStudentUniversity(e.target.value)}
                    onBlur={() => setTimeout(() => setCollegeResults([]), 100)}
                    placeholder="Current university or college"
                    className="w-full rounded-xl border border-zinc-300 px-4 py-2 text-sm"
                  />
                  {collegeResults.length > 0 && (
                    <div className="absolute left-0 right-0 mt-1 max-h-56 overflow-auto rounded-xl border border-zinc-200 bg-white shadow-xl z-10">
                      {collegeResults.slice(0, 8).map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => {
                            setStudentUniversity(m);
                            setCollegeResults([]);
                          }}
                          className="block w-full text-left px-4 py-2 text-sm hover:bg-zinc-50 cursor-pointer"
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <input
                  value={studentDegree}
                  onChange={(e) => setStudentDegree(e.target.value)}
                  placeholder="Current degree/program"
                  className="w-full rounded-xl border border-zinc-300 px-4 py-2 text-sm"
                />
                <input
                  value={studentGradYear as any}
                  onChange={(e) =>
                    setStudentGradYear(
                      e.target.value ? Number(e.target.value) : ""
                    )
                  }
                  placeholder="Expected graduation year"
                  inputMode="numeric"
                  className="w-full rounded-xl border border-zinc-300 px-4 py-2 text-sm"
                />
              </>
            )}

            {employment === "Yes" && (
              <>
                <p className="text-sm text-zinc-600">Your current role</p>
                <input
                  value={currentRole}
                  onChange={(e) => setCurrentRole(e.target.value)}
                  placeholder="Current role/title"
                  className="w-full rounded-xl border border-zinc-300 px-4 py-2 text-sm"
                />
                <input
                  value={yearsExperience as any}
                  onChange={(e) =>
                    setYearsExperience(
                      e.target.value ? Number(e.target.value) : ""
                    )
                  }
                  placeholder="Years of experience"
                  inputMode="numeric"
                  className="w-full rounded-xl border border-zinc-300 px-4 py-2 text-sm"
                />
                <input
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  placeholder="Industry (e.g., Software, Finance)"
                  className="w-full rounded-xl border border-zinc-300 px-4 py-2 text-sm"
                />
                <input
                  value={lookingFor}
                  onChange={(e) => setLookingFor(e.target.value)}
                  placeholder="What are you looking for? (e.g., FAANG reviewer)"
                  className="w-full rounded-xl border border-zinc-300 px-4 py-2 text-sm"
                />
              </>
            )}

            {/* Common discovery fields */}
            <input
              value={desiredJobTitle}
              onChange={(e) => setDesiredJobTitle(e.target.value)}
              placeholder="Desired job title"
              className="w-full rounded-xl border border-zinc-300 px-4 py-2 text-sm"
            />
            <div className="relative">
              <input
                value={desiredLocation}
                onChange={(e) => setDesiredLocation(e.target.value)}
                onBlur={() => setTimeout(() => setLocationResults([]), 100)}
                placeholder="Desired location"
                className="w-full rounded-xl border border-zinc-300 px-4 py-2 text-sm"
              />
              {locationResults.length > 0 && (
                <div className="absolute left-0 right-0 mt-1 max-h-56 overflow-auto rounded-xl border border-zinc-200 bg-white shadow-xl z-10">
                  {locationResults.slice(0, 8).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => {
                        setDesiredLocation(m);
                        setLocationResults([]);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm hover:bg-zinc-50 cursor-pointer"
                    >
                      {m}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="rounded-xl border px-4 py-2 text-sm cursor-pointer"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-black text-white px-4 py-2 text-sm cursor-pointer disabled:opacity-50"
              >
                {saving ? "Saving…" : "Finish"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
