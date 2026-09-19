import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Link from "next/link";
import ApplyButton from "./ApplyButton";

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // ── 1. Auth guard ────────────────────────────────────────────────
  const session = await getSession();
  if (!session) redirect("/auth/login");
  if (session.role !== "student") redirect("/dashboard/industry");

  // ── 2. Resolve params ────────────────────────────────────────────
  const { id } = await params;

  // ── 3. Fetch job ─────────────────────────────────────────────────
  const job = await prisma.job.findUnique({
    where: { id },
    include: {
      industry: { include: { user: true } },
      _count: { select: { applications: true } },
    },
  });

  if (!job) notFound();

  // ── 4. Fetch student profile ─────────────────────────────────────
  const student = await prisma.student.findUnique({
    where: { userId: session.userId },
  });

  // ── 5. Check if already applied ──────────────────────────────────
  const existingApplication = student
    ? await prisma.application.findFirst({
        where: {
          studentId: student.id,
          jobId: id,
        },
      })
    : null;

  // ── 6. Parse skills ──────────────────────────────────────────────
  const skillsNeeded = safeParseJSON(job.skillsNeeded);

  return (
    <div className="relative min-h-screen bg-gray-950 text-white">

      {/* Navbar */}
<nav className="absolute top-0 left-0 right-0 z-20 flex items-start justify-center py-0">
  <div className="w-full bg-gradient-to-r from-violet-500/40 via-white/10 to-blue-500/40 p-px shadow-[0_0_70px_-18px_rgba(124,58,237,0.55)]">
    <div
      className="flex items-center gap-3 bg-black/60 backdrop-blur-2xl"
      style={{
        minHeight: "48px",
        paddingTop: "12px",
        paddingBottom: "12px",
        paddingLeft: "40px",
        paddingRight: "12px",
      }}
    >

      {/* Logo */}
      <Link href="/" className="flex shrink-0 items-center gap-2 pr-2 pl-16">
        <span className="text-xl font-bold tracking-tight text-white">
          CareerGate
        </span>
      </Link>

      <span className="h-6 w-px shrink-0 bg-gradient-to-b from-transparent via-white/15 to-transparent" />

      {/* Navigation Links */}
      <div className="relative flex flex-1 items-center justify-center gap-10">

        <Link
          href="/dashboard/student"
          className="relative z-10 px-5 py-2 text-[11px] font-medium uppercase tracking-[0.15em] text-zinc-500 hover:text-zinc-200 transition-colors duration-300"
        >
          Dashboard
        </Link>

        {/* Active Browse Jobs */}
        <Link
          href="/dashboard/student/jobs"
          className="relative z-10 px-5 py-2 text-[11px] font-medium uppercase tracking-[0.15em] text-white transition-colors duration-300"
        >
          <span className="pointer-events-none absolute inset-0 -z-10 rounded-full bg-violet-400/10 blur-md" />

          Browse Jobs

          <span className="absolute -bottom-px left-1/2 h-px w-8 -translate-x-1/2 rounded-full bg-gradient-to-r from-transparent via-violet-300 to-transparent opacity-100 shadow-[0_0_8px_rgba(167,139,250,0.8)]" />
        </Link>

        <Link
          href="/dashboard/student/skills"
          className="relative z-10 px-5 py-2 text-[11px] font-medium uppercase tracking-[0.15em] text-zinc-500 hover:text-zinc-200 transition-colors duration-300"
        >
          Skills
        </Link>

        <Link
          href="/dashboard/student/applications"
          className="relative z-10 px-5 py-2 text-[11px] font-medium uppercase tracking-[0.15em] text-zinc-500 hover:text-zinc-200 transition-colors duration-300"
        >
          Applications
        </Link>

        <Link
          href="/dashboard/student/profile"
          className="relative z-10 px-5 py-2 text-[11px] font-medium uppercase tracking-[0.15em] text-zinc-500 hover:text-zinc-200 transition-colors duration-300"
        >
          Profile
        </Link>

      </div>

    </div>
  </div>
</nav>

      {/* Main content */}
      <main className="max-w-3xl mx-auto px-6 pt-28 pb-10">

        {/* Back link */}
        <Link
          href="/dashboard/student/jobs"
          className="text-sm text-gray-400 hover:text-white transition-colors mb-6 inline-block"
        >
          ← Back to Jobs
        </Link>

        {/* Job header */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-white">{job.title}</h1>
              <p className="text-gray-400 text-sm mt-1">
                {job.industry.user.name}
                {job.industry.companyName ? ` · ${job.industry.companyName}` : ""}
              </p>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium border shrink-0 ${
              job.type === "internship"
                ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
            }`}>
              {job.type}
            </span>
          </div>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-4 mt-4">
            {job.location && (
              <span className="text-gray-500 text-xs">📍 {job.location}</span>
            )}
            <span className="text-gray-500 text-xs">
              👥 {job._count.applications} applicant{job._count.applications !== 1 ? "s" : ""}
            </span>
            <span className="text-gray-500 text-xs">
              🗓 Posted {new Date(job.createdAt).toLocaleDateString("en-IN", {
                day: "numeric", month: "short", year: "numeric",
              })}
            </span>
            {!job.isOpen && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                Closed
              </span>
            )}
          </div>
        </div>

        {/* Skills needed */}
        {skillsNeeded.length > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
            <h2 className="text-sm font-semibold text-white mb-3">Skills Required</h2>
            <div className="flex flex-wrap gap-2">
              {skillsNeeded.map((skill) => (
                <span
                  key={skill}
                  className="text-xs px-3 py-1 rounded-full bg-gray-800 text-gray-300 border border-gray-700"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Description */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
          <h2 className="text-sm font-semibold text-white mb-3">About this Role</h2>
          <p className="text-gray-400 text-sm leading-relaxed whitespace-pre-wrap">
            {job.description}
          </p>
        </div>

        {/* Apply section */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-white mb-4">Apply for this Role</h2>

          {/* Job is closed */}
          {!job.isOpen && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-5 py-3 text-red-400 text-sm">
              This position is no longer accepting applications.
            </div>
          )}

          {/* Already applied */}
          {job.isOpen && existingApplication && (
            <div className="bg-gray-800 border border-gray-700 rounded-lg px-5 py-3">
              <p className="text-gray-300 text-sm font-medium mb-1">You have already applied.</p>
              <p className="text-gray-500 text-xs">
                Status:{" "}
                <StatusBadge status={existingApplication.status} />
              </p>
              <p className="text-gray-600 text-xs mt-1">
                Applied on {new Date(existingApplication.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric", month: "short", year: "numeric",
                })}
              </p>
            </div>
          )}

          {/* Can apply */}
          {job.isOpen && !existingApplication && (
            <ApplyButton jobId={job.id} />
          )}
        </div>

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

function LogoutButton() {
  return (
    <form action="/api/auth/logout" method="POST">
      <button type="submit" className="text-sm text-gray-400 hover:text-white transition-colors">
        Logout
      </button>
    </form>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending:  "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    accepted: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    rejected: "bg-red-500/10 text-red-400 border-red-500/20",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${styles[status] ?? styles.pending}`}>
      {status}
    </span>
  );
}