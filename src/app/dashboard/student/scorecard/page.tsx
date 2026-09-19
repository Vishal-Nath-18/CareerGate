"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import StudentNavbar from "@/components/StudentNavbar";

// ── Types ────────────────────────────────────────────────────────────

interface ProjectIdea {
  title: string;
  description: string;
}

interface Course {
  name: string;
  platform: string;
  why: string;
}

interface Language {
  language: string;
  priority: string;
  reason: string;
}

interface RoadmapPhase {
  phase: string;
  focus: string;
  tasks: string[];
}

interface ScorecardReport {
  score: number;
  scoreReason: string;
  missingSkills: string[];
  projectsNeeded: number;
  projectIdeas: ProjectIdea[];
  recommendedCourses: Course[];
  languagesToLearn: Language[];
  roadmap: RoadmapPhase[];
}

type PageState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "no_goal"; message: string }
  | { status: "no_skills"; message: string }
  | { status: "success"; report: ScorecardReport; cached: boolean; generatedAt: string }
  | { status: "error"; message: string };

// ── Page ─────────────────────────────────────────────────────────────

export default function ScorecardPage() {
  const [state, setState] = useState<PageState>({ status: "idle" });

  useEffect(() => {
    fetchScorecard(false);
  }, []);

  async function fetchScorecard(forceRefresh: boolean) {
    setState({ status: "loading" });
    try {
      const url = forceRefresh ? "/api/scorecard?refresh=true" : "/api/scorecard";
      const res = await fetch(url);
      const data = await res.json();

      if (data.error === "no_goal") { setState({ status: "no_goal", message: data.message }); return; }
      if (data.error === "no_skills") { setState({ status: "no_skills", message: data.message }); return; }
      if (!res.ok) { setState({ status: "error", message: data.error || "Something went wrong." }); return; }

      setState({ status: "success", report: data.report, cached: data.cached, generatedAt: data.generatedAt });
    } catch {
      setState({ status: "error", message: "Network error. Please try again." });
    }
  }

  const cardClass = "rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm";

  return (
    <div className="relative min-h-screen bg-[#050a1f] text-white overflow-hidden">

      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-1/4 h-96 w-96 rounded-full bg-cyan-500/20 blur-[120px]" />
        <div className="absolute top-1/3 -right-24 h-[28rem] w-[28rem] rounded-full bg-blue-600/20 blur-[140px]" />
        <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-purple-600/20 blur-[120px]" />
      </div>

      <StudentNavbar currentPage="Scorecard" />

      <main className="relative z-10 max-w-4xl mx-auto px-6 pt-28 pb-10">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">🏆 Career Scorecard</h1>
            <p className="text-zinc-400 text-sm">
              AI-powered analysis of how ready you are to achieve your career goal.
            </p>
          </div>
          {state.status === "success" && (
            <button
              onClick={() => fetchScorecard(true)}
              className="shrink-0 text-xs text-zinc-400 hover:text-white border border-white/10 hover:border-white/20 bg-white/5 px-3 py-1.5 rounded-lg transition-colors"
            >
              🔄 Refresh
            </button>
          )}
        </div>

        {/* Loading */}
        {state.status === "loading" && (
          <div className={`${cardClass} p-12 text-center`}>
            <div className="inline-block w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-zinc-400 text-sm">Generating your career scorecard…</p>
            <p className="text-zinc-600 text-xs mt-1">This may take 15–25 seconds</p>
          </div>
        )}

        {/* No goal */}
        {(state.status === "no_goal" || state.status === "no_skills") && (
          <div className={`${cardClass} border-yellow-500/20 p-8`}>
            <h2 className="text-yellow-400 font-semibold mb-2">⚠️ Profile Incomplete</h2>
            <p className="text-zinc-400 text-sm mb-5">{state.message}</p>
            <Link
              href="/dashboard/student/profile"
              className="inline-block rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 transition-all hover:scale-105"
            >
              Update My Profile →
            </Link>
          </div>
        )}

        {/* Error */}
        {state.status === "error" && (
          <div className={`${cardClass} border-red-500/20 p-8 text-center`}>
            <p className="text-red-400 text-sm mb-4">{state.message}</p>
            <button onClick={() => fetchScorecard(false)} className="text-sm text-cyan-400 hover:text-cyan-300">
              Try again →
            </button>
          </div>
        )}

        {/* Success */}
        {state.status === "success" && (
          <div className="space-y-6">

            {/* Cache notice */}
            {state.cached && (
              <div className={`${cardClass} px-4 py-2 flex items-center justify-between`}>
                <p className="text-zinc-500 text-xs">
                  📋 Cached report from {new Date(state.generatedAt).toLocaleDateString("en-IN", {
                    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
                  })}
                </p>
                <button onClick={() => fetchScorecard(true)} className="text-xs text-cyan-400 hover:text-cyan-300">
                  Generate fresh →
                </button>
              </div>
            )}

            {/* Score */}
            <div className="rounded-xl border border-cyan-500/30 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-violet-500/10 backdrop-blur-sm p-8 flex flex-col items-center text-center gap-3">
              <p className="text-zinc-400 text-sm uppercase tracking-widest font-semibold">Career Readiness Score</p>
              <div className="relative flex items-center justify-center w-32 h-32">
                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                  <circle
                    cx="50" cy="50" r="44" fill="none"
                    stroke="url(#scoreGrad)" strokeWidth="8"
                    strokeDasharray={`${(state.report.score / 10) * 276.46} 276.46`}
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#06b6d4" />
                      <stop offset="100%" stopColor="#6366f1" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="flex flex-col items-center">
                  <span className="text-4xl font-black text-white">{state.report.score}</span>
                  <span className="text-zinc-400 text-xs">/10</span>
                </div>
              </div>
              <p className="text-zinc-300 text-sm max-w-lg leading-relaxed">{state.report.scoreReason}</p>
            </div>

            {/* Missing Skills */}
            {state.report.missingSkills?.length > 0 && (
              <div className={`${cardClass} p-6`}>
                <h2 className="text-sm font-semibold text-white mb-3">🚨 Skills You Need to Learn</h2>
                <div className="flex flex-wrap gap-2">
                  {state.report.missingSkills.map((skill) => (
                    <span key={skill} className="text-xs px-3 py-1.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Projects */}
            <div className={`${cardClass} p-6`}>
              <h2 className="text-sm font-semibold text-white mb-1">🛠️ Projects Needed</h2>
              <p className="text-zinc-500 text-xs mb-4">
                You need approximately <span className="text-cyan-400 font-bold">{state.report.projectsNeeded} projects</span> to become job-ready for your goal.
              </p>
              <div className="space-y-3">
                {state.report.projectIdeas?.map((project, i) => (
                  <div key={i} className="rounded-lg border border-white/5 bg-white/5 px-4 py-3">
                    <p className="text-white text-sm font-medium mb-1">💡 {project.title}</p>
                    <p className="text-zinc-400 text-xs leading-relaxed">{project.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Courses */}
            <div className={`${cardClass} p-6`}>
              <h2 className="text-sm font-semibold text-white mb-4">📚 Recommended Courses</h2>
              <div className="space-y-3">
                {state.report.recommendedCourses?.map((course, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="shrink-0 w-6 h-6 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs flex items-center justify-center font-semibold">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-white text-sm font-medium">{course.name}</p>
                      <p className="text-cyan-400 text-xs">{course.platform}</p>
                      <p className="text-zinc-500 text-xs mt-0.5">{course.why}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Languages */}
            {state.report.languagesToLearn?.length > 0 && (
              <div className={`${cardClass} p-6`}>
                <h2 className="text-sm font-semibold text-white mb-4">💻 Languages to Learn</h2>
                <div className="space-y-3">
                  {state.report.languagesToLearn.map((lang, i) => (
                    <div key={i} className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-white text-sm font-medium">{lang.language}</p>
                        <p className="text-zinc-500 text-xs mt-0.5">{lang.reason}</p>
                      </div>
                      <span className={`shrink-0 text-xs px-2.5 py-1 rounded-full border font-medium ${
                        lang.priority === "Must learn"
                          ? "bg-red-500/10 text-red-400 border-red-500/20"
                          : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                      }`}>
                        {lang.priority}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Roadmap */}
            <div className={`${cardClass} p-6`}>
              <h2 className="text-sm font-semibold text-white mb-4">🗺️ Your Learning Roadmap</h2>
              <div className="space-y-4">
                {state.report.roadmap?.map((phase, i) => (
                  <div key={i} className="relative pl-8">
                    {/* Timeline line */}
                    {i < state.report.roadmap.length - 1 && (
                      <div className="absolute left-[11px] top-6 bottom-0 w-px bg-white/10" />
                    )}
                    {/* Timeline dot */}
                    <div className="absolute left-0 top-1 w-5 h-5 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-xs font-bold text-white">
                      {i + 1}
                    </div>
                    <div className="rounded-lg border border-white/5 bg-white/5 px-4 py-3">
                      <p className="text-cyan-400 text-xs font-semibold mb-0.5">{phase.phase}</p>
                      <p className="text-white text-sm font-medium mb-2">{phase.focus}</p>
                      <ul className="space-y-1">
                        {phase.tasks.map((task, j) => (
                          <li key={j} className="text-zinc-400 text-xs flex items-start gap-2">
                            <span className="text-cyan-500 mt-0.5">→</span>
                            {task}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

      </main>
    </div>
  );
}