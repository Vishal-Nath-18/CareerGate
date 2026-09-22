"use client";

import { useState } from "react";

type EligibilityStatus = "eligible" | "partial" | "ineligible";

interface EligibilityResult {
  eligibilityStatus: EligibilityStatus;
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  recommendations: string[];
  summary: string;
}

type Stage = "idle" | "checking" | "result" | "applying" | "success" | "error";

export default function ApplyButton({ jobId }: { jobId: string }) {
  const [stage, setStage] = useState<Stage>("idle");
  const [eligibility, setEligibility] = useState<EligibilityResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  // ── Step 1: Check eligibility ────────────────────────────────────
  async function handleCheckEligibility() {
    setStage("checking");
    setErrorMsg("");

    try {
      const res = await fetch("/api/applications/check-eligibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStage("error");
        setErrorMsg(data.error || "Eligibility check failed.");
        return;
      }

      setEligibility(data);
      setStage("result");
    } catch {
      setStage("error");
      setErrorMsg("Network error. Please try again.");
    }
  }

  // ── Step 2: Submit application ───────────────────────────────────
  async function handleApply() {
    if (!eligibility) return;
    setStage("applying");

    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId,
          matchScore: eligibility.matchScore,
          eligibilityStatus: eligibility.eligibilityStatus,
          aiReason: JSON.stringify({
            summary: eligibility.summary,
            matchedSkills: eligibility.matchedSkills,
            missingSkills: eligibility.missingSkills,
            recommendations: eligibility.recommendations,
          }),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStage("error");
        setErrorMsg(data.error || "Something went wrong.");
        return;
      }

      setStage("success");
    } catch {
      setStage("error");
      setErrorMsg("Network error. Please try again.");
    }
  }

  // ── Success state ────────────────────────────────────────────────
  if (stage === "success") {
    return (
      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-5 py-3 text-emerald-400 text-sm font-medium">
        ✅ Application submitted successfully!
      </div>
    );
  }

  // ── Idle: show check button ──────────────────────────────────────
  if (stage === "idle") {
    return (
      <button
        onClick={handleCheckEligibility}
        className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-6 py-2.5 rounded-lg text-sm transition-colors"
      >
        Check Eligibility & Apply
      </button>
    );
  }

  // ── Checking ─────────────────────────────────────────────────────
  if (stage === "checking") {
    return (
      <div className="flex items-center gap-2 text-zinc-400 text-sm">
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        AI is analyzing your profile…
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────
  if (stage === "error") {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-red-400 text-xs">{errorMsg}</p>
        <button
          onClick={() => setStage("idle")}
          className="text-zinc-400 hover:text-white text-xs underline"
        >
          Try again
        </button>
      </div>
    );
  }

  // ── Result ───────────────────────────────────────────────────────
  if (stage === "result" && eligibility) {
    const { eligibilityStatus, matchScore, matchedSkills, missingSkills, recommendations, summary } = eligibility;

    const statusConfig = {
      eligible: {
        color: "emerald",
        icon: "✅",
        label: "You're Eligible!",
        border: "border-emerald-500/30",
        bg: "bg-emerald-500/10",
        text: "text-emerald-400",
        badge: "bg-emerald-500/20 text-emerald-300",
      },
      partial: {
        color: "yellow",
        icon: "⚠️",
        label: "Partially Eligible",
        border: "border-yellow-500/30",
        bg: "bg-yellow-500/10",
        text: "text-yellow-400",
        badge: "bg-yellow-500/20 text-yellow-300",
      },
      ineligible: {
        color: "red",
        icon: "❌",
        label: "Not Eligible",
        border: "border-red-500/30",
        bg: "bg-red-500/10",
        text: "text-red-400",
        badge: "bg-red-500/20 text-red-300",
      },
    };

    const cfg = statusConfig[eligibilityStatus];

    return (
      <div className={`rounded-xl border ${cfg.border} ${cfg.bg} p-4 flex flex-col gap-4`}>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{cfg.icon}</span>
            <span className={`font-semibold text-sm ${cfg.text}`}>{cfg.label}</span>
          </div>
          {/* Match Score */}
          <div className={`text-xs font-bold px-3 py-1 rounded-full ${cfg.badge}`}>
            {matchScore}% Match
          </div>
        </div>

        {/* Summary */}
        <p className="text-zinc-300 text-xs leading-relaxed">{summary}</p>

        {/* Matched Skills */}
        {matchedSkills.length > 0 && (
          <div>
            <p className="text-zinc-500 text-xs mb-1.5 font-medium">✅ Matched Skills</p>
            <div className="flex flex-wrap gap-1.5">
              {matchedSkills.map((skill) => (
                <span key={skill} className="bg-emerald-500/15 text-emerald-300 text-xs px-2 py-0.5 rounded-full">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Missing Skills */}
        {missingSkills.length > 0 && (
          <div>
            <p className="text-zinc-500 text-xs mb-1.5 font-medium">❌ Missing Skills</p>
            <div className="flex flex-wrap gap-1.5">
              {missingSkills.map((skill) => (
                <span key={skill} className="bg-red-500/15 text-red-300 text-xs px-2 py-0.5 rounded-full">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div>
            <p className="text-zinc-500 text-xs mb-1.5 font-medium">💡 Recommendations</p>
            <ul className="flex flex-col gap-1">
              {recommendations.map((rec, i) => (
                <li key={i} className="text-zinc-400 text-xs flex gap-1.5">
                  <span className="text-zinc-600 mt-0.5">•</span>
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-1">
          {eligibilityStatus !== "ineligible" ? (
            <button
              onClick={handleApply}
              disabled={false}
              className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-semibold px-5 py-2 rounded-lg text-xs transition-colors"
            >
              {"Confirm & Apply"}
            </button>
          ) : null}

          <button
            onClick={() => setStage("idle")}
            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium px-5 py-2 rounded-lg text-xs transition-colors"
          >
            Go Back
          </button>
        </div>

        {/* Ineligible note */}
        {eligibilityStatus === "ineligible" && (
          <p className="text-red-400/70 text-xs">
            You don't meet the minimum requirements for this role. Build the missing skills and try again.
          </p>
        )}
      </div>
    );
  }

  return null;
}