"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import StudentNavbar from "@/components/StudentNavbar";

// ── Types ────────────────────────────────────────────────────────────

interface JobMatch {
  jobId: string;
  jobTitle: string;
  company: string;
  matchScore: number;
  matchReason: string;
  missingSkills: string[];
}

interface SkillReport {
  summary: string;
  skillGaps: string[];
  learningPath: string[];
  jobMatches: JobMatch[];
  industryDemandInsights: string;
}

interface IncompleteProfileError {
  error: "incomplete_profile";
  message: string;
  missing: {
    college: boolean;
    degree: boolean;
    skills: boolean;
  };
}

type PageState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "incomplete"; data: IncompleteProfileError }
  | { status: "success"; report: SkillReport; cached: boolean; generatedAt: string }
  | { status: "error"; message: string };

// ── Page ─────────────────────────────────────────────────────────────

export default function StudentSkillsPage() {
  const [state, setState] = useState<PageState>({ status: "idle" });

  useEffect(() => {
    fetchReport(false);
  }, []);

  async function fetchReport(forceRefresh: boolean) {
    setState({ status: "loading" });
    try {
      const url = forceRefresh ? "/api/skills?refresh=true" : "/api/skills";
      const res = await fetch(url);
      const data = await res.json();

      if (data.error === "incomplete_profile") {
        setState({ status: "incomplete", data });
        return;
      }
      if (!res.ok) {
        setState({ status: "error", message: data.error || "Something went wrong." });
        return;
      }
      setState({ status: "success", report: data.report, cached: data.cached, generatedAt: data.generatedAt });
    } catch {
      setState({ status: "error", message: "Network error. Please try again." });
    }
  }

  const cardClass = "rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm";

  return (
    <div className="relative min-h-screen bg-[#050a1f] text-white overflow-hidden">

      {/* Background glow accents */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-1/4 h-96 w-96 rounded-full bg-cyan-500/20 blur-[120px]" />
        <div className="absolute top-1/3 -right-24 h-[28rem] w-[28rem] rounded-full bg-blue-600/20 blur-[140px]" />
        <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-purple-600/20 blur-[120px]" />
      </div>

      <StudentNavbar currentPage="Skills" />
      {/* Main content */}
      <main className="relative z-10 max-w-4xl mx-auto px-6 pt-28 pb-10">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">🧠 AI Skill Gap Analysis</h1>
            <p className="text-zinc-400 text-sm">
              Personalized insights based on your profile and current industry demand.
            </p>
          </div>
          {state.status === "success" && (
            <button
              onClick={() => fetchReport(true)}
              className="shrink-0 text-xs text-zinc-400 hover:text-white border border-white/10 hover:border-white/20 bg-white/5 px-3 py-1.5 rounded-lg transition-colors"
            >
              🔄 Refresh
            </button>
          )}
        </div>

        {/* ── Loading ─────────────────────────────────────────────── */}
        {state.status === "loading" && (
          <div className={`${cardClass} p-12 text-center`}>
            <div className="inline-block w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-zinc-400 text-sm">Analysing your profile against industry demand…</p>
            <p className="text-zinc-600 text-xs mt-1">This may take 10–20 seconds</p>
          </div>
        )}

        {/* ── Incomplete profile ───────────────────────────────────── */}
        {state.status === "incomplete" && (
          <div className={`${cardClass} border-yellow-500/20 p-8`}>
            <h2 className="text-yellow-400 font-semibold mb-2">⚠️ Complete Your Profile First</h2>
            <p className="text-zinc-400 text-sm mb-5">{state.data.message}</p>

            <div className="space-y-2 mb-6">
              <ProfileFieldStatus label="College / Institution" filled={!state.data.missing.college} />
              <ProfileFieldStatus label="Degree / Programme"    filled={!state.data.missing.degree} />
              <ProfileFieldStatus label="Skills"                filled={!state.data.missing.skills} />
            </div>

            <Link
              href="/dashboard/student/profile"
              className="inline-block rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 transition-all duration-300 hover:scale-105"
            >
              Complete My Profile →
            </Link>
          </div>
        )}

        {/* ── Error ───────────────────────────────────────────────── */}
        {state.status === "error" && (
          <div className={`${cardClass} border-red-500/20 p-8 text-center`}>
            <p className="text-red-400 text-sm mb-4">{state.message}</p>
            <button
              onClick={() => fetchReport(false)}
              className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              Try again →
            </button>
          </div>
        )}

        {/* ── Success: Report ──────────────────────────────────────── */}
        {state.status === "success" && (
          <div className="space-y-6">

            {/* Cache notice */}
            {state.cached && (
              <div className={`${cardClass} px-4 py-2 flex items-center justify-between`}>
                <p className="text-zinc-500 text-xs">
                  📋 Showing cached report from {new Date(state.generatedAt).toLocaleDateString("en-IN", {
                    day: "numeric", month: "short", year: "numeric",
                    hour: "2-digit", minute: "2-digit",
                  })}
                </p>
                <button
                  onClick={() => fetchReport(true)}
                  className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  Generate fresh →
                </button>
              </div>
            )}

            {/* Summary */}
            <div className={`${cardClass} p-6`}>
              <h2 className="text-sm font-semibold text-white mb-3">📊 Profile Summary</h2>
              <p className="text-zinc-400 text-sm leading-relaxed">{state.report.summary}</p>
            </div>

            {/* Skill gaps */}
            {state.report.skillGaps.length > 0 && (
              <div className={`${cardClass} p-6`}>
                <h2 className="text-sm font-semibold text-white mb-3">🚨 Skill Gaps</h2>
                <p className="text-zinc-500 text-xs mb-3">
                  Skills employers are asking for that you currently don't have.
                </p>
                <div className="flex flex-wrap gap-2">
                  {state.report.skillGaps.map((skill) => (
                    <span key={skill} className="text-xs px-3 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Learning path */}
            {state.report.learningPath.length > 0 && (
              <div className={`${cardClass} p-6`}>
                <h2 className="text-sm font-semibold text-white mb-3">🗺️ Your Learning Path</h2>
                <p className="text-zinc-500 text-xs mb-4">
                  Prioritised steps to make you more competitive in the Ayush job market.
                </p>
                <div className="space-y-3">
                  {state.report.learningPath.map((step, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <span className="shrink-0 w-6 h-6 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs flex items-center justify-center font-semibold">
                        {index + 1}
                      </span>
                      <p className="text-zinc-400 text-sm leading-relaxed">{step}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Industry demand insights */}
            <div className="rounded-xl border border-cyan-500/20 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-violet-500/10 backdrop-blur-sm p-6">
              <h2 className="text-sm font-semibold text-white mb-3">📈 Industry Demand Insights</h2>
              <p className="text-zinc-400 text-sm leading-relaxed">{state.report.industryDemandInsights}</p>
            </div>

            {/* Job matches */}
            {state.report.jobMatches.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-white mb-4">💼 Job Matches</h2>
                <div className="space-y-4">
                  {state.report.jobMatches.map((match) => (
                    <div
                      key={match.jobId}
                      className={`${cardClass} p-5 hover:border-cyan-500/30 transition-all duration-200`}
                    >
                      {/* Top row */}
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-semibold text-white text-sm">{match.jobTitle}</p>
                          <p className="text-zinc-400 text-xs mt-0.5">{match.company}</p>
                        </div>
                        <MatchScoreBadge score={match.matchScore} />
                      </div>

                      {/* Match reason */}
                      <p className="text-zinc-500 text-xs mt-3 leading-relaxed">{match.matchReason}</p>

                      {/* Missing skills */}
                      {match.missingSkills.length > 0 && (
                        <div className="mt-3">
                          <p className="text-zinc-600 text-xs mb-1.5">Missing skills:</p>
                          <div className="flex flex-wrap gap-1.5">
                            {match.missingSkills.map((skill) => (
                              <span key={skill} className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* View job link */}
                      <div className="mt-4">
                        <Link
                          href={`/dashboard/student/jobs/${match.jobId}`}
                          className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                        >
                          View & Apply →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

      </main>
    </div>
  );
}

// ── Helper components ────────────────────────────────────────────────

function MatchScoreBadge({ score }: { score: number }) {
  const color =
    score >= 70
      ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
      : score >= 40
      ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
      : "bg-red-500/10 text-red-400 border-red-500/20";

  return (
    <span className={`shrink-0 text-xs px-3 py-1 rounded-full font-semibold border ${color}`}>
      {score}% match
    </span>
  );
}

function ProfileFieldStatus({ label, filled }: { label: string; filled: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`text-sm ${filled ? "text-cyan-400" : "text-red-400"}`}>
        {filled ? "✅" : "❌"}
      </span>
      <span className="text-zinc-400 text-sm">{label}</span>
    </div>
  );
}