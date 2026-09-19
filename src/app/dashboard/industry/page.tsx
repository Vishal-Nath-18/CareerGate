import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Link from "next/link";
import IndustryNavbar from "@/components/industry/IndustryNavbar";
import LogoutButton from "@/components/industry/LogoutButton";

export default async function IndustryDashboard() {

  // ── 1. Auth guard ────────────────────────────────────────────────
  const session = await getSession();
  if (!session) redirect("/auth/login");
  if (session.role !== "industry") redirect("/dashboard/student");

  // ── 2. Fetch industry profile ────────────────────────────────────
  const industry = await prisma.industry.findUnique({
    where: { userId: session.userId },
    include: { user: true },
  });

  if (!industry) redirect("/auth/login");

  // ── 3. Fetch this company's jobs ─────────────────────────────────
  const jobs = await prisma.job.findMany({
    where: { industryId: industry.id },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { applications: true } },
    },
  });

  // ── 4. Fetch recent applications across all their jobs ───────────
  const applications = await prisma.application.findMany({
    where: { job: { industryId: industry.id } },
    orderBy: { createdAt: "desc" },
    take: 6,
    include: {
      student: { include: { user: true } },
      job: true,
    },
  });

  const totalApplications = jobs.reduce((sum, job) => sum + job._count.applications, 0);
  const openJobs = jobs.filter((j) => j.isOpen).length;

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
      <main className="relative z-10 max-w-6xl mx-auto px-6 pt-28 pb-10">

        {/* Welcome header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-white mb-1">
            {industry.companyName}
          </h1>
          <p className="text-zinc-400 text-sm">
            {industry.sector ? `${industry.sector} · ` : ""}
            {industry.website ?? ""}
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <StatCard label="Jobs Posted"        value={jobs.length}       icon="📋" accent="cyan"   />
          <StatCard label="Open Positions"     value={openJobs}          icon="🟢" accent="blue"   />
          <StatCard label="Total Applications" value={totalApplications} icon="👥" accent="violet" />
        </div>

        {/* Two column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Jobs posted */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Your Job Listings</h2>
              <Link
                href="/dashboard/industry/jobs/new"
                className="text-xs rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold px-3 py-1.5 transition-all duration-200 hover:scale-105"
              >
                + Post New
              </Link>
            </div>

            {jobs.length === 0 ? (
              <EmptyState message="You haven't posted any jobs yet. Post your first opportunity." />
            ) : (
              <div className="space-y-3">
                {jobs.map((job) => (
                  <div
                    key={job.id}
                    className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-4 hover:border-cyan-500/30 transition-all duration-200"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-white text-sm">{job.title}</p>
                        <p className="text-zinc-400 text-xs mt-0.5">
                          {job._count.applications} application{job._count.applications !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${
                          job.type === "internship"
                            ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
                            : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                        }`}>
                          {job.type}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${
                          job.isOpen
                            ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
                            : "bg-white/5 text-zinc-400 border-white/10"
                        }`}>
                          {job.isOpen ? "Open" : "Closed"}
                        </span>
                      </div>
                    </div>
                    {job.location && (
                      <p className="text-zinc-500 text-xs mt-2">📍 {job.location}</p>
                    )}
                    <Link
                      href={`/dashboard/industry/jobs/${job.id}`}
                      className="mt-3 inline-block text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                    >
                      Manage →
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Recent applications */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Recent Applications</h2>
              <Link
                href="/dashboard/industry/applications"
                className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                View all →
              </Link>
            </div>

            {applications.length === 0 ? (
              <EmptyState message="No applications received yet." />
            ) : (
              <div className="space-y-3">
                {applications.map((app) => (
                  <div
                    key={app.id}
                    className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-4"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-white text-sm">{app.student.user.name}</p>
                        <p className="text-zinc-400 text-xs mt-0.5">Applied for: {app.job.title}</p>
                      </div>
                      <StatusBadge status={app.status} />
                    </div>
                    <p className="text-zinc-500 text-xs mt-2">
                      {new Date(app.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>

        </div>

        {/* Skill demand CTA */}
        <div className="mt-10 rounded-2xl border border-cyan-500/20 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-violet-500/10 backdrop-blur-sm p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-white mb-1">📊 Post Skill Requirements</h3>
            <p className="text-zinc-400 text-sm">
              Tell students exactly what skills your company needs. Help bridge the gap between academia and industry.
            </p>
          </div>
          <Link
            href="/dashboard/industry/jobs/new"
            className="shrink-0 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold px-5 py-2.5 text-sm shadow-lg shadow-cyan-500/20 transition-all duration-300 hover:scale-105"
          >
            Post a Job
          </Link>
        </div>

        {/* Logout */}
        <div className="mt-10 flex justify-center">
          <LogoutButton />
        </div>

      </main>
    </div>
  );
}

// ── Helper components ────────────────────────────────────────────────

function StatCard({
  label, value, icon, accent,
}: {
  label: string; value: number; icon: string; accent: "cyan" | "blue" | "violet";
}) {
  const border: Record<string, string> = {
    cyan:   "border-cyan-500/20 hover:border-cyan-500/40",
    blue:   "border-blue-500/20 hover:border-blue-500/40",
    violet: "border-violet-500/20 hover:border-violet-500/40",
  };
  const valueColor: Record<string, string> = {
    cyan:   "text-cyan-300",
    blue:   "text-blue-300",
    violet: "text-violet-300",
  };
  return (
    <div className={`rounded-xl border bg-white/5 backdrop-blur-sm p-5 transition-all duration-200 ${border[accent]}`}>
      <div className="text-2xl mb-2">{icon}</div>
      <div className={`text-2xl font-bold ${valueColor[accent]}`}>{value}</div>
      <div className="text-zinc-400 text-sm mt-0.5">{label}</div>
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

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-8 text-center">
      <p className="text-zinc-500 text-sm">{message}</p>
    </div>
  );
}