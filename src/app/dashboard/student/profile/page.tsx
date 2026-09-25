"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import StudentNavbar from "@/components/StudentNavbar";

const SUGGESTED_GOALS = [
  "AI Engineer", "Backend Developer", "Frontend Developer", "Full Stack Developer",
  "Data Scientist", "Machine Learning Engineer", "Game Developer", "DevOps Engineer",
  "Cybersecurity Analyst", "Cloud Architect", "Mobile App Developer", "UI/UX Designer",
  "Blockchain Developer", "Research Scientist", "Product Manager",
];

const SUGGESTED_SKILLS = [
  "Python", "R", "Data Analysis", "Machine Learning", "Excel",
  "Research", "Communication", "Statistics", "SQL", "PowerPoint",
  "Literature Review", "Lab Skills", "Report Writing", "Project Management",
  "Critical Thinking", "Team Collaboration", "Presentation", "SPSS",
  "Canva", "Content Writing",
];

function getCompletion(profile: {
  college: string;
  degree: string;
  year: string;
  skills: string[];
  resumeUrl: string | null;
}): { percent: number; unlocksAI: boolean } {
  const fields = [
    !!profile.college,
    !!profile.degree,
    !!profile.year,
    profile.skills.length > 0,
    !!profile.resumeUrl,
  ];
  const filled = fields.filter(Boolean).length;
  const percent = Math.round((filled / fields.length) * 100);
  const unlocksAI = !!profile.college && !!profile.degree && profile.skills.length > 0;
  return { percent, unlocksAI };
}

export default function StudentProfilePage() {
  const [form, setForm] = useState({ college: "", degree: "", year: "" });
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [goals, setGoals] = useState<string[]>([]);
  const [goalInput, setGoalInput] = useState("");
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [byokKey, setByokKey] = useState("");
  const [byokModel, setByokModel] = useState("google/gemma-4-31b-it:free");
  const [byokHasKey, setByokHasKey] = useState(false);
  const [byokRevealed, setByokRevealed] = useState("");
  const [byokShowKey, setByokShowKey] = useState(false);
  const [byokRevealLoading, setByokRevealLoading] = useState(false);
  const [byokSaving, setByokSaving] = useState(false);
  const [byokSuccess, setByokSuccess] = useState(false);
  const [byokError, setByokError] = useState("");
  const [byokUseCustom, setByokUseCustom] = useState(false);
  const [byokCustomModel, setByokCustomModel] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState("");
  const [resumeError, setResumeError] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/student/profile");
        const data = await res.json();
        if (res.ok) {
          setForm({
            college: data.profile.college || "",
            degree: data.profile.degree || "",
            year: data.profile.year?.toString() || "",
          });
          setSkills(data.profile.skills || []);
          setGoals(data.profile.goals || []);
          setResumeUrl(data.profile.resumeUrl || null);
        }
        const keyRes = await fetch("/api/user/api-key");
        const keyData = await keyRes.json();
        if (keyRes.ok && keyData.hasKey) {
          setByokHasKey(true);
          setByokModel(keyData.model || "google/gemma-4-31b-it:free");
        }
      } catch {
        setError("Failed to load profile.");
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  async function handleSave() {
    setSaving(true);
    setError("");
    setSaveSuccess(false);
    try {
      const res = await fetch("/api/student/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ college: form.college, degree: form.degree, year: form.year ? Number(form.year) : null, skills, goals }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to save."); return; }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function addGoal(goal: string) {
    const trimmed = goal.trim();
    if (trimmed && !goals.includes(trimmed) && goals.length < 2)
      setGoals((prev) => [...prev, trimmed]);
    setGoalInput("");
  }

  function removeGoal(goal: string) {
    setGoals((prev) => prev.filter((g) => g !== goal));
  }

  function toggleGoal(goal: string) {
    if (goals.includes(goal)) removeGoal(goal);
    else if (goals.length < 2) setGoals((prev) => [...prev, goal]);
  }

  function addSkill(skill: string) {
    const trimmed = skill.trim();
    if (trimmed && !skills.includes(trimmed)) setSkills((prev) => [...prev, trimmed]);
    setSkillInput("");
  }

  function removeSkill(skill: string) {
    setSkills((prev) => prev.filter((s) => s !== skill));
  }

  function toggleSuggested(skill: string) {
    if (skills.includes(skill)) removeSkill(skill);
    else setSkills((prev) => [...prev, skill]);
  }

  const POPULAR_MODELS = [
    { label: "Google: Gemma 4 31B (free)", value: "google/gemma-4-31b-it:free" },
    { label: "Thinking Machines: Inkling (free)", value: "thinkingmachines/inkling:free" },
    { label: "NVIDIA: Nemotron 3 Ultra (free)", value: "nvidia/nemotron-3-ultra-550b-a55b:free" },
    { label: "NVIDIA: Nemotron 3 Super (free)", value: "nvidia/nemotron-3-super-120b-a12b:free" },
    { label: "NVIDIA: Nemotron 3 Nano Omni (free)", value: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free" },
    { label: "Google: Gemma 4 26B A4B (free)", value: "google/gemma-4-26b-a4b-it:free" },
    { label: "NVIDIA: Nemotron 3.5 Lightning (free)", value: "nvidia/nemotron-3.5-lightning:free" },
    { label: "Fish Audio: S2.1 Pro Free (free)", value: "fish-audio/s2.1-pro-free:free" },
  ];

  async function handleToggleReveal() {
    if (byokShowKey) { setByokShowKey(false); return; }
    if (!byokRevealed) {
      setByokRevealLoading(true);
      try {
        const res = await fetch("/api/user/api-key/reveal");
        const data = await res.json();
        if (res.ok && data.apiKey) { setByokRevealed(data.apiKey); }
        else { setByokError(data.error || "Failed to load key"); setByokRevealLoading(false); return; }
      } catch { setByokError("Failed to load key"); setByokRevealLoading(false); return; }
      setByokRevealLoading(false);
    }
    setByokShowKey(true);
  }

  async function handleByokSave() {
    const selectedModel = byokUseCustom ? byokCustomModel.trim() : byokModel;
    if (!selectedModel) { setByokError("Please select or enter a model"); return; }
    if (!byokHasKey && !byokKey.trim()) { setByokError("API key is required"); return; }
    setByokSaving(true);
    setByokError("");
    setByokSuccess(false);
    try {
      const body: Record<string, string> = { model: selectedModel };
      if (byokKey.trim()) body.apiKey = byokKey.trim();
      const res = await fetch("/api/user/api-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      setByokHasKey(true);
      setByokKey("");
      setByokRevealed("");
      setByokShowKey(false);
      setByokSuccess(true);
      setTimeout(() => setByokSuccess(false), 3000);
    } catch (err: unknown) {
      setByokError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setByokSaving(false);
    }
  }

  async function handleResumeUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setResumeError("");
    setUploadingResume(true);
    const formData = new FormData();
    formData.append("resume", file);
    try {
      const res = await fetch("/api/student/profile", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) { setResumeError(data.error || "Upload failed."); return; }
      setResumeUrl(data.resumeUrl);
    } catch {
      setResumeError("Network error. Please try again.");
    } finally {
      setUploadingResume(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  const completion = getCompletion({ ...form, skills, resumeUrl });

  // ── Shared input styles — glass dark matching homepage card style
  const inputClass = `w-full rounded-lg border border-white/10 bg-white/5 backdrop-blur-sm px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 transition-colors`;
  const labelClass = "block text-sm font-medium text-zinc-300 mb-1.5";
  const cardClass  = "rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-6";

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050a1f] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#0a1628] text-white overflow-hidden">

      {/* Background glow accents */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-1/4 h-96 w-96 rounded-full bg-cyan-500/20 blur-[120px]" />
        <div className="absolute top-1/3 -right-24 h-[28rem] w-[28rem] rounded-full bg-blue-600/20 blur-[140px]" />
        <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-purple-600/20 blur-[120px]" />
      </div>

      <StudentNavbar currentPage="Profile" />

      <main className="relative z-10 max-w-2xl mx-auto px-6 pt-28 pb-10">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">My Profile</h1>
          <p className="text-zinc-400 text-sm">
            Keep your profile updated to get better job matches and skill insights.
          </p>
        </div>

        {/* Profile completeness bar */}
        <div className={`${cardClass} mb-8`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-white">Profile Completeness</span>
            <span className="text-sm font-semibold text-cyan-400">{completion.percent}%</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2 mb-3">
            <div
              className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${completion.percent}%` }}
            />
          </div>
          {completion.unlocksAI ? (
            <p className="text-cyan-400 text-xs">
              ✅ AI Skill Analysis is unlocked. Head to{" "}
              <Link href="/dashboard/student/skills" className="underline hover:text-cyan-300">
                Skill Analysis
              </Link>{" "}
              to get your report.
            </p>
          ) : (
            <p className="text-yellow-400 text-xs">
              ⚠️ Add your college, degree, and at least one skill to unlock AI Skill Analysis.
            </p>
          )}
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Success banner */}
        {saveSuccess && (
          <div className="mb-6 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-400">
            ✅ Profile saved successfully.
          </div>
        )}

        <div className="space-y-6">

          {/* Academic Info */}
          <section className={cardClass}>
            <h2 className="text-sm font-semibold text-white mb-5">Academic Information</h2>
            <div className="space-y-4">
              <div>
                <label className={labelClass}>College / Institution</label>
                <input
                  type="text"
                  placeholder="e.g. Delhi University"
                  value={form.college}
                  onChange={(e) => setForm({ ...form, college: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Degree / Programme</label>
                <input
                  type="text"
                  placeholder="e.g. B.Sc. Biotechnology"
                  value={form.degree}
                  onChange={(e) => setForm({ ...form, degree: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Year of Study</label>
                <select
                  value={form.year}
                  onChange={(e) => setForm({ ...form, year: e.target.value })}
                  className={`${inputClass} cursor-pointer`}
                >
                  <option value="" className="bg-[#0a1230]">Select year</option>
                  {[1, 2, 3, 4, 5, 6].map((y) => (
                    <option key={y} value={y} className="bg-[#0a1230]">Year {y}</option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* Goal / Aim */}
          <section className={cardClass}>
            <h2 className="text-sm font-semibold text-white mb-1">Goal / Aim</h2>
            <p className="text-zinc-500 text-xs mb-5">
              What do you want to become? Select up to 2 goals or type your own.
            </p>

            {/* Suggested goals */}
            <div className="mb-4">
              <p className="text-xs text-zinc-600 mb-2">Quick add:</p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_GOALS.map((goal) => (
                  <button
                    key={goal}
                    type="button"
                    onClick={() => toggleGoal(goal)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      goals.includes(goal)
                        ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-300"
                        : goals.length >= 2
                        ? "bg-white/5 border-white/10 text-zinc-600 cursor-not-allowed"
                        : "bg-white/5 border-white/10 text-zinc-400 hover:border-white/20 hover:text-zinc-200"
                    }`}
                  >
                    {goals.includes(goal) ? "✓ " : ""}{goal}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom goal input */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="Type your own goal and press Enter…"
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addGoal(goalInput); } }}
                disabled={goals.length >= 2}
                className={`${inputClass} ${goals.length >= 2 ? "opacity-50 cursor-not-allowed" : ""}`}
              />
              <button
                type="button"
                onClick={() => addGoal(goalInput)}
                disabled={goals.length >= 2}
                className="shrink-0 px-4 py-2.5 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 text-sm text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add
              </button>
            </div>

            {/* Selected goals */}
            {goals.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {goals.map((goal) => (
                  <span key={goal} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">
                    {goal}
                    <button type="button" onClick={() => removeGoal(goal)} className="hover:text-white transition-colors">×</button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-zinc-600 text-xs">No goal added yet.</p>
            )}

            {goals.length >= 2 && (
              <p className="text-yellow-400 text-xs mt-3">Maximum 2 goals selected.</p>
            )}
          </section>

          {/* Skills */}
          <section className={cardClass}>
            <h2 className="text-sm font-semibold text-white mb-1">Skills</h2>
            <p className="text-zinc-500 text-xs mb-5">
              Add skills you have. These are used to match you with opportunities and generate your skill analysis.
            </p>

            {/* Quick-add suggestions */}
            <div className="mb-4">
              <p className="text-xs text-zinc-600 mb-2">Quick add:</p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_SKILLS.map((skill) => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => toggleSuggested(skill)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      skills.includes(skill)
                        ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-300"
                        : "bg-white/5 border-white/10 text-zinc-400 hover:border-white/20 hover:text-zinc-200"
                    }`}
                  >
                    {skills.includes(skill) ? "✓ " : ""}{skill}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom skill input */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="Type any skill and press Enter…"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(skillInput); } }}
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => addSkill(skillInput)}
                className="shrink-0 px-4 py-2.5 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 text-sm text-white transition-colors"
              >
                Add
              </button>
            </div>

            {/* Selected skills */}
            {skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <span key={skill} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">
                    {skill}
                    <button type="button" onClick={() => removeSkill(skill)} className="hover:text-white transition-colors">×</button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-zinc-600 text-xs">No skills added yet.</p>
            )}
          </section>

          {/* Resume */}
          <section className={cardClass}>
            <h2 className="text-sm font-semibold text-white mb-1">Resume</h2>
            <p className="text-zinc-500 text-xs mb-5">Upload your resume as a PDF. Max 5MB.</p>

            {resumeUrl && (
              <div className="flex items-center gap-3 mb-4 bg-white/5 border border-white/10 rounded-lg px-4 py-3">
                <span className="text-cyan-400 text-sm">📄</span>
                <div className="flex-1 min-w-0">
                  <p className="text-zinc-300 text-xs font-medium">Resume uploaded</p>
                  <p className="text-zinc-500 text-xs truncate">{resumeUrl}</p>
                </div>
                <a href={resumeUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors shrink-0">
                  View →
                </a>
              </div>
            )}

            <div>
              <input ref={fileInputRef} type="file" accept=".pdf" onChange={handleResumeUpload} className="hidden" id="resume-upload" />
              <label
                htmlFor="resume-upload"
                className={`inline-block cursor-pointer px-4 py-2.5 rounded-lg border text-sm transition-colors ${
                  uploadingResume
                    ? "border-white/10 text-zinc-600 cursor-not-allowed"
                    : "border-white/10 hover:border-white/20 text-zinc-400 hover:text-white bg-white/5"
                }`}
              >
                {uploadingResume ? "Uploading…" : resumeUrl ? "Replace Resume" : "Upload Resume (PDF)"}
              </label>
            </div>

            {resumeError && <p className="text-red-400 text-xs mt-2">{resumeError}</p>}
          </section>

          {/* Save button */}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="w-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold px-6 py-3 text-sm shadow-lg shadow-cyan-500/20 transition-all duration-300 hover:scale-[1.02] hover:shadow-cyan-400/30"
          >
            {saving ? "Saving…" : "Save Profile"}
          </button>

          {/* BYOK / AI Settings */}
          <section className={cardClass}>
            <h2 className="text-sm font-semibold text-white mb-1">AI Settings (Optional)</h2>
            <p className="text-zinc-500 text-xs mb-5">
              By default, the platform's API key is used for AI analysis. You can bring your own{" "}
              <a href="https://openrouter.ai/keys" target="_blank" className="text-cyan-400 underline hover:text-cyan-300">
                OpenRouter API key
              </a>{" "}
              and choose any model.
            </p>

            <div className="space-y-4">
              {/* API Key */}
              <div>
                <label className={labelClass}>OpenRouter API Key</label>
                <div className="relative">
                  <input
  type={byokShowKey ? "text" : "password"}
  value={byokShowKey ? byokRevealed : byokKey}
  onChange={(e) => { setByokKey(e.target.value); setByokShowKey(false); }}
  placeholder={byokHasKey ? "******************** (saved — type to replace)" : "sk-or-..."}
  className={inputClass}
/>
                  {byokHasKey && !byokKey && (
                    <button
                      type="button"
                      onClick={handleToggleReveal}
                      disabled={byokRevealLoading}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors"
                    >
                      {byokRevealLoading ? (
                        <span className="text-xs">…</span>
                      ) : byokShowKey ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a18.5 18.5 0 0 1 5.06-5.94M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  )}
                </div>
                {byokHasKey && (
                  <p className="text-zinc-600 text-xs mt-1">A key is already saved. Enter a new one to replace it.</p>
                )}
              </div>

              {/* Model selector */}
              <div>
                <label className={labelClass}>Model</label>
                {!byokUseCustom ? (
                  <select
                    value={byokModel}
                    onChange={(e) => setByokModel(e.target.value)}
                    className={`${inputClass} cursor-pointer`}
                  >
                    {POPULAR_MODELS.map((m) => (
                      <option key={m.value} value={m.value} className="bg-[#0a1230]">{m.label}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={byokCustomModel}
                    onChange={(e) => setByokCustomModel(e.target.value)}
                    placeholder="e.g. mistralai/mistral-7b-instruct"
                    className={inputClass}
                  />
                )}
                <button
                  type="button"
                  onClick={() => setByokUseCustom(!byokUseCustom)}
                  className="text-cyan-400 text-xs mt-1.5 hover:underline"
                >
                  {byokUseCustom ? "← Choose from list" : "Enter custom model string →"}
                </button>
              </div>

              {byokError && <p className="text-red-400 text-sm">{byokError}</p>}
              {byokSuccess && <p className="text-cyan-400 text-sm">✅ AI settings saved.</p>}

              <button
                type="button"
                onClick={handleByokSave}
                disabled={byokSaving}
                className="w-full rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium px-6 py-2.5 text-sm transition-colors border border-white/10 hover:border-white/20"
              >
                {byokSaving ? "Saving…" : byokHasKey ? "Update AI Settings" : "Save AI Settings"}
              </button>
            </div>
          </section>

        </div>

        {/* Logout */}
        <div className="mt-10 pt-6 border-t border-white/10">
          <form action="/api/auth/logout" method="POST" onSubmit={() => localStorage.removeItem("isLoggedIn")}>
            <button
              type="submit"
              className="w-full rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm font-medium text-red-400 transition-colors hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-300"
            >
              Log Out
            </button>
          </form>
        </div>

      </main>
    </div>
  );
}