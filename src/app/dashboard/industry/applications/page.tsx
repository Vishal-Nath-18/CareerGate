import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Link from "next/link";
import IndustryNavbar from "@/components/industry/IndustryNavbar";

export default async function IndustryApplicationsPage() {

  // ── 1. Auth guard ────────────────────────────────────────────────
  const session = await getSession();
  if (!session) redirect("/auth/login");
  if (session.role !== "industry") redirect("/dashboard/student");

  // ── 2. Find industry profile ─────────────────────────────────────
  const industry = await prisma.industry.findUnique({
    where: { userId: session.userId },
  });

  if (!industry) redirect("/auth/login");

  // ── 3. Fetch all applications across all jobs ────────────────────
  const applications = await prisma.application.findMany({
    where: {
      job: { industryId: industry.id },
    },
    orderBy: { createdAt: "desc" },
    include: {
      job: true,
      student: {
        include: { user: true },
      },
    },
  });

  // ── 4. Counts by status ──────────────────────────────────────────
  const total    = applications.length;
  const pending  = applications.filter((a) => a.status === "pending").length;
  const accepted = applications.filter((a) => a.status === "accepted").length;
  const rejected = applications.filter((a) => a.status === "rejected").length;

  return (
    <div className="relative min-h-screen bg-[#050a1f] text-white overflow-hidden">

      {/* Background glow accents */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-1/4 h-96 w-96 rounded-full bg-cyan-500/20 blur-[120px]" />
        <div className="absolute top-1/3 -right-24 h-[28rem] w-[28rem] rounded-full bg-blue-600/20 blur-[140px]" />
        <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-purple-600/20 blur-[120px]" />
      </div>

      <IndustryNavbar />

      {/* Main content */}
      <main className="relative z-10 max-w-5xl mx-auto px-6 pt-28 pb-10">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">All Applications</h1>
          <p className="text-zinc-400 text-sm">
            Every application received across all your job listings.
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total"    value={total}    accent="white"  />
          <StatCard label="Pending"  value={pending}  accent="yellow" />
          <StatCard label="Accepted" value={accepted} accent="cyan"   />
          <StatCard label="Rejected" value={rejected} accent="red"    />
        </div>

        {/* Applications list */}
        {applications.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-12 text-center">
            <p className="text-zinc-500 text-sm mb-4">No applications received yet.</p>
            <Link
              href="/dashboard/industry/jobs/new"
              className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              Post a job to get started →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => (
              <div
                key={app.id}
                className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-5 hover:border-cyan-500/30 transition-all duration-200"
              >
                <div className="flex items-start justify-between gap-4">

                  {/* Left: student + job info */}
                  <div className="flex-1 min-w-0">

                    {/* Student name + email */}
                    <p className="font-semibold text-white text-sm">
                      {app.student.user.name}
                    </p>
                    <p className="text-zinc-400 text-xs mt-0.5">
                      {app.student.user.email}
                    </p>

                    {/* Student details */}
                    <div className="flex flex-wrap gap-3 mt-2">
                      {app.student.college && (
                        <span className="text-zinc-500 text-xs">🎓 {app.student.college}</span>
                      )}
                      {app.student.degree && (
                        <span className="text-zinc-500 text-xs">📚 {app.student.degree}</span>
                      )}
                      {app.student.year && (
                        <span className="text-zinc-500 text-xs">Year {app.student.year}</span>
                      )}
                    </div>

                    {/* Which job they applied to */}
                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-zinc-600 text-xs">Applied for:</span>
                      <Link
                        href={`/dashboard/industry/jobs/${app.job.id}`}
                        className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors font-medium"
                      >
                        {app.job.title} →
                      </Link>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${
                        app.job.type === "internship"
                          ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
                          : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                      }`}>
                        {app.job.type}
                      </span>
                    </div>

                    {/* Applied date */}
                    <p className="text-zinc-600 text-xs mt-2">
                      Applied {new Date(app.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </p>
                  </div>

                  {/* Right: status badge + manage link */}
                  <div className="shrink-0 flex flex-col items-end gap-3">
                    <StatusBadge status={app.status} />
                    <Link
                      href={`/dashboard/industry/jobs/${app.job.id}`}
                      className="text-xs text-zinc-500 hover:text-white transition-colors"
                    >
                      Manage →
                    </Link>
                  </div>

                </div>
              </div>
            ))}
          </div>
        )}

      </main>
    </div>
  );
}

// ── Utilities ────────────────────────────────────────────────────────

function StatCard({
  label, value, accent,
}: {
  label: string; value: number; accent: "white" | "yellow" | "cyan" | "red";
}) {
  const valueColor: Record<string, string> = {
    white:  "text-white",
    yellow: "text-yellow-400",
    cyan:   "text-cyan-400",
    red:    "text-red-400",
  };
  const borderColor: Record<string, string> = {
    white:  "border-white/10",
    yellow: "border-yellow-500/20",
    cyan:   "border-cyan-500/20",
    red:    "border-red-500/20",
  };
  return (
    <div className={`rounded-xl border bg-white/5 backdrop-blur-sm p-4 text-center ${borderColor[accent]}`}>
      <div className={`text-2xl font-bold ${valueColor[accent]}`}>{value}</div>
      <div className="text-zinc-500 text-xs mt-0.5">{label}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending:  "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    accepted: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    rejected: "bg-red-500/10 text-red-400 border-red-500/20",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${
      styles[status] ?? styles.pending
    }`}>
      {status}
    </span>
  );
}