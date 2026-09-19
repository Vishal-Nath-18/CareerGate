"use client";

import { useState } from "react";

type Status = "pending" | "accepted" | "rejected";

interface Props {
  applicationId: string;
  currentStatus: Status;
}

export default function ApplicationActions({ applicationId, currentStatus }: Props) {
  const [status, setStatus] = useState<Status>(currentStatus);
  const [loading, setLoading] = useState<"accepted" | "rejected" | null>(null);
  const [error, setError] = useState("");

  async function updateStatus(newStatus: "accepted" | "rejected") {
    setLoading(newStatus);
    setError("");

    try {
      const res = await fetch(`/api/applications/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        setLoading(null);
        return;
      }

      setStatus(newStatus);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(null);
    }
  }

  // ── Already accepted ─────────────────────────────────────────────
  if (status === "accepted") {
    return (
      <div className="flex items-center gap-3">
        <span className="text-xs px-3 py-1 rounded-full font-medium border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
          accepted
        </span>
        <button
          onClick={() => updateStatus("rejected")}
          disabled={loading !== null}
          className="text-xs text-gray-500 hover:text-red-400 transition-colors disabled:opacity-50"
        >
          {loading === "rejected" ? "Updating…" : "Undo → Reject"}
        </button>
        {error && <p className="text-red-400 text-xs">{error}</p>}
      </div>
    );
  }

  // ── Already rejected ─────────────────────────────────────────────
  if (status === "rejected") {
    return (
      <div className="flex items-center gap-3">
        <span className="text-xs px-3 py-1 rounded-full font-medium border bg-red-500/10 text-red-400 border-red-500/20">
          rejected
        </span>
        <button
          onClick={() => updateStatus("accepted")}
          disabled={loading !== null}
          className="text-xs text-gray-500 hover:text-emerald-400 transition-colors disabled:opacity-50"
        >
          {loading === "accepted" ? "Updating…" : "Undo → Accept"}
        </button>
        {error && <p className="text-red-400 text-xs">{error}</p>}
      </div>
    );
  }

  // ── Pending — show both buttons ──────────────────────────────────
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => updateStatus("accepted")}
        disabled={loading !== null}
        className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-semibold transition-colors"
      >
        {loading === "accepted" ? "Updating…" : "Accept"}
      </button>
      <button
        onClick={() => updateStatus("rejected")}
        disabled={loading !== null}
        className="text-xs px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed text-red-400 border border-red-500/20 font-medium transition-colors"
      >
        {loading === "rejected" ? "Updating…" : "Reject"}
      </button>
      {error && <p className="text-red-400 text-xs ml-1">{error}</p>}
    </div>
  );
}