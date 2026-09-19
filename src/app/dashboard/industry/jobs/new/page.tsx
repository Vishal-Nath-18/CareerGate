"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import IndustryNavbar from "@/components/industry/IndustryNavbar";

const AYUSH_SKILLS = [
  "Ayurveda", "Yoga", "Naturopathy", "Unani", "Siddha", "Homeopathy",
  "Herbal Medicine", "Panchakarma", "Clinical Research", "Pharmacognosy",
  "Nutrition & Dietetics", "Medical Coding", "Healthcare Management",
  "Traditional Medicine", "Wellness Coaching", "Medical Transcription",
  "Quality Control", "Regulatory Affairs", "Plant Biology", "Biochemistry",
];

export default function PostJobPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const [form, setForm] = useState({
    title:       "",
    description: "",
    type:        "internship" as "internship" | "placement",
    location:    "",
  });

  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [customSkill, setCustomSkill]       = useState("");

  function toggleSkill(skill: string) {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  }

  function addCustomSkill() {
    const trimmed = customSkill.trim();
    if (trimmed && !selectedSkills.includes(trimmed)) {
      setSelectedSkills((prev) => [...prev, trimmed]);
    }
    setCustomSkill("");
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.title.trim()) { setError("Job title is required."); return; }
    if (!form.description.trim()) { setError("Job description is required."); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, skillsNeeded: JSON.stringify(selectedSkills) }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to post job."); return; }
      router.push("/dashboard/industry");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = `w-full rounded-lg border border-white/10 bg-white/5 backdrop-blur-sm px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 transition-colors`;
  const labelClass = "block text-sm font-medium text-zinc-300 mb-1.5";

  return (
    <div className="relative min-h-screen bg-[#050a1f] text-white overflow-hidden">

      {/* Background glow accents */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-1/4 h-96 w-96 rounded-full bg-cyan-500/20 blur-[120px]" />
        <div className="absolute top-1/3 -right-24 h-[28rem] w-[28rem] rounded-full bg-blue-600/20 blur-[140px]" />
        <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-purple-600/20 blur-[120px]" />
      </div>

      <IndustryNavbar />

      <main className="relative z-10 max-w-2xl mx-auto px-6 pt-28 pb-10">

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">Post a New Opportunity</h1>
          <p className="text-zinc-400 text-sm">
            Fill in the details below to connect with qualified students.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Job Title */}
          <div>
            <label className={labelClass}>Job Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Ayurveda Research Intern"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className={inputClass}
            />
          </div>

          {/* Type */}
          <div>
            <label className={labelClass}>Opportunity Type</label>
            <div className="flex rounded-lg border border-white/10 bg-white/5 p-1 gap-1">
              {(["internship", "placement"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm({ ...form, type: t })}
                  className={`flex-1 rounded-md py-2 text-sm font-medium capitalize transition-all duration-200 ${
                    form.type === t
                      ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  {t === "internship" ? "🎓 Internship" : "💼 Placement"}
                </button>
              ))}
            </div>
          </div>

          {/* Location */}
          <div>
            <label className={labelClass}>
              Location{" "}
              <span className="text-zinc-500 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Mumbai, Remote, Pan-India"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className={inputClass}
            />
          </div>

          {/* Description */}
          <div>
            <label className={labelClass}>Description</label>
            <textarea
              required
              rows={5}
              placeholder="Describe the role, responsibilities, and what the student will learn or contribute..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className={`${inputClass} resize-none`}
            />
          </div>

          {/* Skills needed */}
          <div>
            <label className={labelClass}>Skills Needed</label>
            <p className="text-zinc-500 text-xs mb-3">
              Select from common Ayush-sector skills or add your own.
            </p>

            {/* Preset skill chips */}
            <div className="flex flex-wrap gap-2 mb-3">
              {AYUSH_SKILLS.map((skill) => (
                <button
                  key={skill}
                  type="button"
                  onClick={() => toggleSkill(skill)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    selectedSkills.includes(skill)
                      ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-300"
                      : "bg-white/5 border-white/10 text-zinc-400 hover:border-white/20 hover:text-zinc-200"
                  }`}
                >
                  {selectedSkills.includes(skill) ? "✓ " : ""}{skill}
                </button>
              ))}
            </div>

            {/* Custom skill input */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add a custom skill..."
                value={customSkill}
                onChange={(e) => setCustomSkill(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomSkill(); } }}
                className={inputClass}
              />
              <button
                type="button"
                onClick={addCustomSkill}
                className="shrink-0 px-4 py-2.5 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 text-sm text-white transition-colors"
              >
                Add
              </button>
            </div>

            {/* Selected skills summary */}
            {selectedSkills.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedSkills.map((skill) => (
                  <span
                    key={skill}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => toggleSkill(skill)}
                      className="hover:text-white transition-colors"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold px-6 py-2.5 text-sm shadow-lg shadow-cyan-500/20 transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? "Posting…" : "Post Opportunity"}
            </button>
            <Link
              href="/dashboard/industry"
              className="px-6 py-2.5 rounded-full border border-white/10 hover:border-white/20 bg-white/5 text-sm text-zinc-400 hover:text-white transition-colors"
            >
              Cancel
            </Link>
          </div>

        </form>
      </main>
    </div>
  );
}