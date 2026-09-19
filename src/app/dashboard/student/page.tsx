import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Link from "next/link";
import StudentNavbar from "@/components/StudentNavbar";

export default async function StudentDashboard() {

  // ── 1. Auth guard ────────────────────────────────────────────────
  const session = await getSession();
  if (!session) redirect("/auth/login");
  if (session.role !== "student") redirect("/dashboard/industry");

  // ── 2. Fetch student profile ─────────────────────────────────────
  const student = await prisma.student.findUnique({
    where: { userId: session.userId },
  });

  // ── 3. Fetch recent jobs ─────────────────────────────────────────
  const jobs = await prisma.job.findMany({
    where: { isOpen: true },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: { industry: { include: { user: true } } },
  });

  // ── 4. Fetch student's applications ─────────────────────────────
  const applications = await prisma.application.findMany({
    where: { studentId: student?.id },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: { job: { include: { industry: { include: { user: true } } } } },
  });

  return (
    <div className="relative min-h-screen bg-[#050a1f] text-white overflow-hidden">

      {/* Background glow accents — matches homepage */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-1/4 h-96 w-96 rounded-full bg-cyan-500/20 blur-[120px]" />
        <div className="absolute top-1/3 -right-24 h-[28rem] w-[28rem] rounded-full bg-blue-600/20 blur-[140px]" />
        <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-purple-600/20 blur-[120px]" />
      </div>

      <StudentNavbar currentPage="Dashboard" />

      {/* Main content */}
      <main className="relative z-10 max-w-6xl mx-auto px-6 pt-28 pb-10">

        {/* Welcome header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-white mb-1">
            Welcome back, {session.name.split(" ")[0]} 👋
          </h1>
          <p className="text-zinc-400 text-sm">
            {student?.college ? `${student.college} · ` : ""}
            {student?.degree ? `${student.degree} · ` : ""}
            {student?.year ? `Year ${student.year}` : ""}
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <StatCard label="Applications Sent" value={applications.length} icon="📨" accent="cyan" />
          <StatCard label="Open Opportunities" value={jobs.length} icon="💼" accent="blue" />
          <StatCard label="Profile Completion" value={getProfileCompletion(student)} icon="✅" suffix="%" accent="violet" />
        </div>

        {/* Two column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Recent Jobs */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Recent Opportunities</h2>
              <Link href="/dashboard/student/jobs" className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors">
                View all →
              </Link>
            </div>

            {jobs.length === 0 ? (
              <EmptyState message="No open jobs yet. Check back soon." />
            ) : (
              <div className="space-y-3">
                {jobs.map((job) => (
                  <div
                    key={job.id}
                    className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-4 hover:border-cyan-500/30 hover:bg-white/8 transition-all duration-200"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-white text-sm">{job.title}</p>
                        <p className="text-zinc-400 text-xs mt-0.5">{job.industry.user.name}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
                        job.type === "internship"
                          ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                          : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                      }`}>
                        {job.type}
                      </span>
                    </div>
                    {job.location && (
                      <p className="text-zinc-500 text-xs mt-2">📍 {job.location}</p>
                    )}
                    <Link
                      href={`/dashboard/student/jobs/${job.id}`}
                      className="mt-3 inline-block text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                    >
                      View & Apply →
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* My Applications */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">My Applications</h2>
              <Link href="/dashboard/student/applications" className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors">
                View all →
              </Link>
            </div>

            {applications.length === 0 ? (
              <EmptyState message="You haven't applied to anything yet." />
            ) : (
              <div className="space-y-3">
                {applications.map((app) => (
                  <div key={app.id} className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-white text-sm">{app.job.title}</p>
                        <p className="text-zinc-400 text-xs mt-0.5">{app.job.industry.user.name}</p>
                      </div>
                      <StatusBadge status={app.status} />
                    </div>
                    <p className="text-zinc-500 text-xs mt-2">
                      Applied {new Date(app.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric", month: "short", year: "numeric"
                      })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>

        </div>

        {/* AI Skill Gap CTA */}
        <div className="mt-10 rounded-2xl border border-white/10 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-violet-500/10 backdrop-blur-sm p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-white mb-1">🧠 AI Skill Gap Analysis</h3>
            <p className="text-zinc-400 text-sm">
              Find out exactly which skills you need to land your target role in the Ayush sector.
            </p>
          </div>
          <Link
            href="/dashboard/student/skills"
            className="shrink-0 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 transition-all duration-300 hover:scale-105 hover:shadow-cyan-400/30"
          >
            Analyse My Skills
          </Link>
        </div>

      </main>
    </div>
  );
}

// ── Helper components ────────────────────────────────────────────────

function StatCard({
  label, value, icon, suffix = "", accent,
}: {
  label: string; value: number | string; icon: string; suffix?: string; accent: "cyan" | "blue" | "violet";
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
      <div className={`text-2xl font-bold ${valueColor[accent]}`}>{value}{suffix}</div>
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

function getProfileCompletion(student: {
  college: string | null;
  degree: string | null;
  year: number | null;
  skills: string | null;
  resumeUrl: string | null;
} | null): number {
  if (!student) return 0;
  const fields = [student.college, student.degree, student.year, student.skills, student.resumeUrl];
  const filled = fields.filter(Boolean).length;
  return Math.round((filled / fields.length) * 100);
}

function LogoutButton() {
  return (
    <form action="/api/auth/logout" method="POST">
      <button type="submit" className="text-sm text-zinc-400 hover:text-white transition-colors">
        Logout
      </button>
    </form>
  );
}