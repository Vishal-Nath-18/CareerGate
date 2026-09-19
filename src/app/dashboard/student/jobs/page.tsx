import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Link from "next/link";
import StudentNavbar from "@/components/StudentNavbar";

export default async function StudentJobsPage() {

  // ── 1. Auth guard ────────────────────────────────────────────────
  const session = await getSession();
  if (!session) redirect("/auth/login");
  if (session.role !== "student") redirect("/dashboard/industry");

  // ── 2. Fetch all open jobs ───────────────────────────────────────
  const jobs = await prisma.job.findMany({
    where: { isOpen: true },
    orderBy: { createdAt: "desc" },
    include: {
      industry: { include: { user: true } },
      _count: { select: { applications: true } },
    },
  });

  // ── 3. Parse skillsNeeded for each job ───────────────────────────
  const parsed = jobs.map((job) => ({
    ...job,
    skillsNeeded: safeParseJSON(job.skillsNeeded),
  }));

  return (
    <div className="relative min-h-screen bg-[#050a1f] text-white overflow-hidden">

      {/* Background glow accents */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-1/4 h-96 w-96 rounded-full bg-cyan-500/20 blur-[120px]" />
        <div className="absolute top-1/3 -right-24 h-[28rem] w-[28rem] rounded-full bg-blue-600/20 blur-[140px]" />
        <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-purple-600/20 blur-[120px]" />
      </div>

      <StudentNavbar currentPage="Browse Jobs" />
      {/* Main content */}
      <main className="relative z-10 max-w-6xl mx-auto px-6 pt-28 pb-10">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">Browse Opportunities</h1>
          <p className="text-zinc-400 text-sm">
            {parsed.length} open {parsed.length === 1 ? "opportunity" : "opportunities"} available
          </p>
        </div>

        {/* Jobs list */}
        {parsed.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-12 text-center">
            <p className="text-zinc-500 text-sm">No open jobs right now. Check back soon.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {parsed.map((job) => (
              <div
                key={job.id}
                className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-5 hover:border-cyan-500/30 transition-all duration-200"
              >
                {/* Top row */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-white">{job.title}</p>
                    <p className="text-zinc-400 text-sm mt-0.5">
                      {job.industry.user.name}
                      {job.industry.companyName ? ` · ${job.industry.companyName}` : ""}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium border shrink-0 ${
                    job.type === "internship"
                      ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
                      : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                  }`}>
                    {job.type}
                  </span>
                </div>

                {/* Location + applicant count */}
                <div className="flex items-center gap-4 mt-3">
                  {job.location && (
                    <span className="text-zinc-500 text-xs">📍 {job.location}</span>
                  )}
                  <span className="text-zinc-500 text-xs">
                    👥 {job._count.applications} applicant{job._count.applications !== 1 ? "s" : ""}
                  </span>
                  <span className="text-zinc-500 text-xs">
                    🗓 {new Date(job.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric", month: "short", year: "numeric",
                    })}
                  </span>
                </div>

                {/* Skills needed */}
                {job.skillsNeeded.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {job.skillsNeeded.slice(0, 6).map((skill) => (
                      <span
                        key={skill}
                        className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-zinc-300 border border-white/10"
                      >
                        {skill}
                      </span>
                    ))}
                    {job.skillsNeeded.length > 6 && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-zinc-500">
                        +{job.skillsNeeded.length - 6} more
                      </span>
                    )}
                  </div>
                )}

                {/* View & Apply link */}
                <div className="mt-4">
                  <Link
                    href={`/dashboard/student/jobs/${job.id}`}
                    className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors font-medium"
                  >
                    View & Apply →
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