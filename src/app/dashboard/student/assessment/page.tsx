"use client";

import { useEffect, useState } from "react";
import StudentNavbar from "@/components/StudentNavbar";

interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  userAnswer?: string | null;
  isCorrect?: boolean | null;
}

interface Assessment {
  id: string;
  title: string;
  score: number | null;
  total: number;
  status: string;
  createdAt: string;
  questions: Question[];
}

type Phase = "home" | "testing" | "result";

export default function AssessmentPage() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [activeAssessment, setActiveAssessment] = useState<Assessment | null>(null);
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [phase, setPhase] = useState<Phase>("home");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAssessments();
  }, []);

  async function fetchAssessments() {
    setLoading(true);
    try {
      const res = await fetch("/api/assessment");
      const data = await res.json();
      if (data.assessments) {
        setAssessments(
          data.assessments.map((a: any) => ({
            ...a,
            questions: a.questions.map((q: any) => ({
              ...q,
              options: JSON.parse(q.options),
            })),
          }))
        );
      }
    } catch {
      setError("Failed to load assessments.");
    } finally {
      setLoading(false);
    }
  }

  async function generateTest() {
    setGenerating(true);
    setError("");
    try {
      const res = await fetch("/api/assessment/generate", { method: "POST" });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        return;
      }
      const assessment: Assessment = {
        ...data.assessment,
        questions: data.assessment.questions.map((q: any) => ({
          ...q,
          options: JSON.parse(q.options),
        })),
      };
      setActiveAssessment(assessment);
      setAnswers({});
      setPhase("testing");
      await fetchAssessments();
    } catch {
      setError("Failed to generate test. Please try again.");
    } finally {
      setGenerating(false);
    }
  }

  async function submitTest() {
    if (!activeAssessment) return;
    const unanswered = activeAssessment.questions.filter((q) => !answers[q.id]);
    if (unanswered.length > 0) {
      setError(`Please answer all questions. ${unanswered.length} remaining.`);
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/assessment/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assessmentId: activeAssessment.id, answers }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        return;
      }
      const updated: Assessment = {
        ...data.assessment,
        questions: data.assessment.questions.map((q: any) => ({
          ...q,
          options: JSON.parse(q.options),
        })),
      };
      setActiveAssessment(updated);
      setPhase("result");
      await fetchAssessments();
    } catch {
      setError("Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function viewPastAssessment(a: Assessment) {
    setSelectedAssessment(a);
    setActiveAssessment(null);
    setPhase("result");
  }

  function getScoreColor(score: number, total: number) {
    const pct = (score / total) * 100;
    if (pct >= 80) return "text-cyan-400";
    if (pct >= 50) return "text-blue-400";
    return "text-violet-400";
  }

  function getScoreBorder(score: number, total: number) {
    const pct = (score / total) * 100;
    if (pct >= 80) return "border-cyan-500/30 bg-cyan-500/5";
    if (pct >= 50) return "border-blue-500/30 bg-blue-500/5";
    return "border-violet-500/30 bg-violet-500/5";
  }

  const displayAssessment =
    phase === "result"
      ? activeAssessment || selectedAssessment
      : activeAssessment;

  return (
    <div className="relative min-h-screen bg-[#050a1f] text-white overflow-hidden flex flex-col">
      {/* Background blobs */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute -top-32 left-1/4 h-96 w-96 rounded-full bg-cyan-500/20 blur-[120px]" />
        <div className="absolute top-1/3 -right-24 h-[28rem] w-[28rem] rounded-full bg-blue-600/20 blur-[140px]" />
        <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-purple-600/20 blur-[120px]" />
      </div>

      {/* Navbar */}
      <div className="relative z-50">
        <StudentNavbar currentPage="Assessment" />
      </div>

      {/* Body */}
      <div className="relative z-10 flex flex-1 overflow-hidden pt-16">
        {/* Sidebar */}
        <aside className="w-64 shrink-0 border-r border-white/10 bg-white/5 backdrop-blur-sm flex flex-col p-4 gap-3 overflow-y-auto">
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest mb-1">
            Past Tests
          </h2>

          {loading ? (
            <p className="text-zinc-500 text-xs">Loading...</p>
          ) : assessments.filter((a) => a.status === "completed").length === 0 ? (
            <p className="text-zinc-500 text-xs">No tests taken yet.</p>
          ) : (
            assessments
              .filter((a) => a.status === "completed")
              .map((a) => (
                <button
                  key={a.id}
                  onClick={() => viewPastAssessment(a)}
                  className={`w-full text-left p-3 rounded-xl border transition-all backdrop-blur-sm ${
                    (activeAssessment?.id === a.id ||
                      selectedAssessment?.id === a.id) &&
                    phase === "result"
                      ? "border-cyan-500/50 bg-cyan-500/10"
                      : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
                  }`}
                >
                  <p className="text-xs font-semibold text-white truncate leading-snug">
                    {a.title}
                  </p>
                  <p className={`text-sm font-black mt-1 ${getScoreColor(a.score!, a.total)}`}>
                    {a.score}/{a.total}
                  </p>
                  <p className="text-[10px] text-zinc-500 mt-0.5">
                    {new Date(a.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </button>
              ))
          )}
        </aside>

        {/* Main */}
        <main className="flex-1 overflow-y-auto p-8">
          {error && (
            <div className="mb-6 max-w-2xl mx-auto p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* HOME */}
          {phase === "home" && (
            <div className="flex flex-col items-center justify-center min-h-[65vh] gap-6 text-center">
              <div>
                <h1 className="text-5xl font-extrabold bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400 bg-clip-text text-transparent mb-4 pb-2 leading-normal">
                  Skill Assessment
                </h1>
                <p className="text-zinc-400 text-sm max-w-md mx-auto">
                  AI will analyze your profile, goals, and skill gaps to generate
                  a personalized 20-question test. Questions from previous tests
                  that you answered correctly won't repeat.
                </p>
              </div>

              <button
                onClick={generateTest}
                disabled={generating}
                className="relative px-8 py-3 rounded-xl font-semibold text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all
                  bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-500
                  hover:from-cyan-400 hover:via-blue-400 hover:to-violet-400
                  shadow-lg shadow-blue-500/30"
              >
                {generating ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Generating Test...
                  </span>
                ) : (
                  "Start New Test"
                )}
              </button>

              {generating && (
                <p className="text-zinc-500 text-xs animate-pulse">
                  AI is analyzing your profile and building your questions...
                </p>
              )}
            </div>
          )}

          {/* TESTING */}
          {phase === "testing" && activeAssessment && (
            <div className="max-w-2xl mx-auto">
              <div className="flex items-start justify-between mb-8">
                <div>
                  <h1 className="text-2xl font-extrabold bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400 bg-clip-text text-transparent leading-snug">
                    {activeAssessment.title}
                  </h1>
                  <p className="text-zinc-500 text-xs mt-1">
                    Answer all 20 questions, then submit.
                  </p>
                </div>
                <span className="text-xs text-zinc-400 bg-white/5 border border-white/10 px-3 py-1 rounded-full shrink-0 mt-1">
                  {Object.keys(answers).length} / {activeAssessment.questions.length}
                </span>
              </div>

              <div className="flex flex-col gap-5">
                {activeAssessment.questions.map((q, idx) => (
                  <div
                    key={q.id}
                    className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm"
                  >
                    <p className="text-sm font-medium text-white mb-4 leading-relaxed">
                      <span className="text-cyan-400 font-bold mr-2">Q{idx + 1}.</span>
                      {q.question}
                    </p>
                    <div className="flex flex-col gap-2">
                      {q.options.map((opt, oi) => (
                        <button
                          key={oi}
                          onClick={() =>
                            setAnswers((prev) => ({ ...prev, [q.id]: opt }))
                          }
                          className={`w-full text-left px-4 py-2.5 rounded-xl border text-sm transition-all ${
                            answers[q.id] === opt
                              ? "border-cyan-500/60 bg-cyan-500/10 text-white"
                              : "border-white/10 bg-white/5 text-zinc-300 hover:border-white/20 hover:bg-white/10"
                          }`}
                        >
                          <span className="font-semibold text-cyan-400 mr-2">
                            {["A", "B", "C", "D"][oi]}.
                          </span>
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  onClick={submitTest}
                  disabled={submitting}
                  className="px-8 py-3 rounded-xl font-semibold text-sm text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all
                    bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-500
                    hover:from-cyan-400 hover:via-blue-400 hover:to-violet-400
                    shadow-lg shadow-blue-500/20"
                >
                  {submitting ? "Submitting..." : "Submit Test"}
                </button>
              </div>
            </div>
          )}

          {/* RESULT */}
          {phase === "result" && displayAssessment && (
            <div className="max-w-2xl mx-auto">
              {/* Score card */}
              <div
                className={`rounded-2xl border p-8 mb-6 text-center backdrop-blur-sm ${getScoreBorder(
                  displayAssessment.score!,
                  displayAssessment.total
                )}`}
              >
                <h1 className="text-xl font-extrabold bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400 bg-clip-text text-transparent mb-1">
                  {displayAssessment.title}
                </h1>
                <p className="text-zinc-500 text-xs mb-5">
                  {new Date(displayAssessment.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
                <p
                  className={`text-7xl font-black mb-1 ${getScoreColor(
                    displayAssessment.score!,
                    displayAssessment.total
                  )}`}
                >
                  {displayAssessment.score}
                  <span className="text-3xl text-zinc-500">/{displayAssessment.total}</span>
                </p>
                <p className="text-zinc-400 text-sm mt-2">
                  {(
                    (displayAssessment.score! / displayAssessment.total) *
                    100
                  ).toFixed(0)}
                  % correct
                </p>
              </div>

              {/* Test again */}
              <div className="flex justify-center mb-8">
                <button
                  onClick={() => {
                    setPhase("home");
                    setSelectedAssessment(null);
                    setActiveAssessment(null);
                    setError("");
                  }}
                  className="px-6 py-2.5 rounded-xl font-semibold text-sm text-white transition-all
                    bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-500
                    hover:from-cyan-400 hover:via-blue-400 hover:to-violet-400
                    shadow-lg shadow-blue-500/20"
                >
                  Test Again
                </button>
              </div>

              {/* Question review */}
              <div className="flex flex-col gap-4">
                {displayAssessment.questions.map((q, idx) => (
                  <div
                    key={q.id}
                    className={`rounded-2xl border p-5 backdrop-blur-sm ${
                      q.isCorrect
                        ? "border-cyan-500/25 bg-cyan-500/5"
                        : "border-violet-500/25 bg-violet-500/5"
                    }`}
                  >
                    <p className="text-sm font-medium text-white mb-3 leading-relaxed">
                      <span
                        className={`font-bold mr-2 ${
                          q.isCorrect ? "text-cyan-400" : "text-violet-400"
                        }`}
                      >
                        Q{idx + 1}.
                      </span>
                      {q.question}
                    </p>
                    <div className="flex flex-col gap-1.5">
                      {q.options.map((opt, oi) => {
                        const isCorrect = opt === q.correctAnswer;
                        const isUserWrong = opt === q.userAnswer && !isCorrect;
                        return (
                          <div
                            key={oi}
                            className={`px-4 py-2 rounded-lg text-xs border ${
                              isCorrect
                                ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-300"
                                : isUserWrong
                                ? "border-violet-500/40 bg-violet-500/10 text-violet-300"
                                : "border-white/5 text-zinc-600"
                            }`}
                          >
                            <span className="font-semibold mr-2">
                              {["A", "B", "C", "D"][oi]}.
                            </span>
                            {opt}
                            {isCorrect && (
                              <span className="ml-2 text-cyan-400">✓</span>
                            )}
                            {isUserWrong && (
                              <span className="ml-2 text-violet-400">✗</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}