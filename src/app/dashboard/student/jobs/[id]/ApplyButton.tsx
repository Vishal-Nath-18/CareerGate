"use client";

import { useState } from "react";

export default function ApplyButton({ jobId }: { jobId: string }) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleApply() {
    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setMessage(data.error || "Something went wrong.");
        return;
      }

      setStatus("success");
      setMessage("Application submitted successfully!");
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  }

  // ── Already succeeded ────────────────────────────────────────────
  if (status === "success") {
    return (
      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-5 py-3 text-emerald-400 text-sm font-medium">
        ✅ {message}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleApply}
        disabled={status === "loading"}
        className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-semibold px-6 py-2.5 rounded-lg text-sm transition-colors"
      >
        {status === "loading" ? "Submitting…" : "Apply Now"}
      </button>
      {status === "error" && (
        <p className="text-red-400 text-xs">{message}</p>
      )}
    </div>
  );
}