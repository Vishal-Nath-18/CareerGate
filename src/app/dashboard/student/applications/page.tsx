import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Link from "next/link";
import StudentNavbar from "@/components/StudentNavbar";

export default async function StudentApplicationsPage() {

  // ── 1. Auth guard ────────────────────────────────────────────────
  const session = await getSession();
  if (!session) redirect("/auth/login");
  if (session.role !== "student") redirect("/dashboard/industry");

  // ── 2. Fetch student profile ─────────────────────────────────────
  const student = await prisma.student.findUnique({
    where: { userId: session.userId },
  });

  if (!student) redirect("/auth/login");

  // ── 3. Fetch all applications ────────────────────────────────────
  const applications = await prisma.application.findMany({
    where: { studentId: student.id },
    orderBy: { createdAt: "desc" },
    include: {
      job: {
        include: {
          industry: { include: { user: true } },
        },
      },
    },
  });

  // ── 4. Parse skillsNeeded for each job ───────────────────────────
  const parsed = applications.map((app) => ({
    ...app,
    job: {
      ...app.job,
      skillsNeeded: safeParseJSON(app.job.skillsNeeded),
    },
  }));

  // ── 5. Counts by status ──────────────────────────────────────────
  const total    = parsed.length;
  const pending  = parsed.filter((a) => a.status === "pending").length;
  const accepted = parsed.filter((a) => a.status === "accepted").length;
  const rejected = parsed.filter((a) => a.status === "rejected").length;

  return (
    <div className="relative min-h-screen bg-[#050a1f] text-white overflow-hidden">

      {/* Background glow accents */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-1/4 h-96 w-96 rounded-full bg-cyan-500/20 blur-[120px]" />
        <div className="absolute top-1/3 -right-24 h-[28rem] w-[28rem] rounded-full bg-blue-600/20 blur-[140px]" />
        <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-purple-600/20 blur-[120px]" />
      </div>

      <StudentNavbar currentPage="Applications" />
      {/* Main content */}
      <main className="relative z-10 max-w-4xl mx-auto px-6 pt-28 pb-10">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">My Applications</h1>
          <p className="text-zinc-400 text-sm">
            Track the status of all your job and internship applications.
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
        {parsed.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-12 text-center">
            <p className="text-zinc-500 text-sm mb-4">You haven't applied to anything yet.</p>
            <Link
              href="/dashboard/student/jobs"
              className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              Browse open opportunities →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {parsed.map((app) => (
              <div
                key={app.id}
                className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-5 hover:border-cyan-500/30 transition-all duration-200"
              >
                {/* Top row */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-white">{app.job.title}</p>
                    <p className="text-zinc-400 text-sm mt-0.5">
                      {app.job.industry.user.name}
                      {app.job.industry.companyName ? ` · ${app.job.industry.companyName}` : ""}
                    </p>
                  </div>
                  <StatusBadge status={app.status} />
                </div>

                {/* Meta row */}
                <div className="flex flex-wrap items-center gap-4 mt-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${
                    app.job.type === "internship"
                      ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
                      : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                  }`}>
                    {app.job.type}
                  </span>
                  {app.job.location && (
                    <span className="text-zinc-500 text-xs">📍 {app.job.location}</span>
                  )}
                  <span className="text-zinc-500 text-xs">
                    Applied {new Date(app.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric", month: "short", year: "numeric",
                    })}
                  </span>
                </div>

                {/* Skills */}
                {app.job.skillsNeeded.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {app.job.skillsNeeded.slice(0, 5).map((skill) => (
                      <span
                        key={skill}
                        className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-zinc-400 border border-white/10"
                      >
                        {skill}
                      </span>
                    ))}
                    {app.job.skillsNeeded.length > 5 && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-zinc-500">
                        +{app.job.skillsNeeded.length - 5} more
                      </span>
                    )}
                  </div>
                )}

                {/* View job link */}
                <div className="mt-4">
                  <Link
                    href={`/dashboard/student/jobs/${app.job.id}`}
                    className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    View job →
                  </Link>
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

function safeParseJSON(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

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
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium border shrink-0 ${styles[status] ?? styles.pending}`}>
      {status}
    </span>
  );
}