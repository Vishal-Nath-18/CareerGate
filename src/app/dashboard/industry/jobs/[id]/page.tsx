import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Link from "next/link";
import ApplicationActions from "./ApplicationActions";
import IndustryNavbar from "@/components/industry/IndustryNavbar";

export default async function IndustryJobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // ── 1. Auth guard ────────────────────────────────────────────────
  const session = await getSession();
  if (!session) redirect("/auth/login");
  if (session.role !== "industry") redirect("/dashboard/student");

  // ── 2. Resolve params ────────────────────────────────────────────
  const { id } = await params;

  // ── 3. Find industry profile ─────────────────────────────────────
  const industry = await prisma.industry.findUnique({
    where: { userId: session.userId },
  });

  if (!industry) redirect("/auth/login");

  // ── 4. Fetch job — must belong to this industry ──────────────────
  const job = await prisma.job.findUnique({
    where: { id },
    include: {
      _count: { select: { applications: true } },
    },
  });

  if (!job) notFound();

  // Prevent industry from viewing another industry's job
  if (job.industryId !== industry.id) notFound();

  // ── 5. Fetch all applications for this job ───────────────────────
  const applications = await prisma.application.findMany({
    where: { jobId: id },
    orderBy: { createdAt: "desc" },
    include: {
      student: {
        include: { user: true },
      },
    },
  });

  // ── 6. Parse skills ──────────────────────────────────────────────
  const skillsNeeded = safeParseJSON(job.skillsNeeded);

  // ── 7. Counts by status ──────────────────────────────────────────
  const pending  = applications.filter((a) => a.status === "pending").length;
  const accepted = applications.filter((a) => a.status === "accepted").length;
  const rejected = applications.filter((a) => a.status === "rejected").length;

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      <IndustryNavbar />

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-6 pt-28 pb-10">

        {/* Back link */}
        <Link
          href="/dashboard/industry"
          className="text-sm text-gray-400 hover:text-white transition-colors mb-6 inline-block"
        >
          ← Back to Dashboard
        </Link>

        {/* Job header */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-white">{job.title}</h1>
              <p className="text-gray-400 text-sm mt-1">
                {job.location ? `📍 ${job.location}` : "No location specified"}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${
                job.type === "internship"
                  ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                  : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
              }`}>
                {job.type}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${
                job.isOpen
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : "bg-red-500/10 text-red-400 border-red-500/20"
              }`}>
                {job.isOpen ? "Open" : "Closed"}
              </span>
            </div>
          </div>

          <p className="text-gray-500 text-xs mt-3">
            Posted {new Date(job.createdAt).toLocaleDateString("en-IN", {
              day: "numeric", month: "short", year: "numeric",
            })}
          </p>

          {/* Skills */}
          {skillsNeeded.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-4">
              {skillsNeeded.map((skill) => (
                <span
                  key={skill}
                  className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-300 border border-gray-700"
                >
                  {skill}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Application stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <StatCard label="Total" value={applications.length} color="text-white" />
          <StatCard label="Pending" value={pending} color="text-yellow-400" />
          <StatCard label="Accepted" value={accepted} color="text-emerald-400" />
          <StatCard label="Rejected" value={rejected} color="text-red-400" />
        </div>

        {/* Applicants list */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">Applicants</h2>

          {applications.length === 0 ? (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
              <p className="text-gray-500 text-sm">No applications yet for this job.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {applications.map((app) => (
                <div
                  key={app.id}
                  className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Student info */}
                    <div>
                      <p className="font-semibold text-white text-sm">
                        {app.student.user.name}
                      </p>
                      <p className="text-gray-400 text-xs mt-0.5">
                        {app.student.user.email}
                      </p>
                      <div className="flex flex-wrap gap-3 mt-2">
                        {app.student.college && (
                          <span className="text-gray-500 text-xs">
                            🎓 {app.student.college}
                          </span>
                        )}
                        {app.student.degree && (
                          <span className="text-gray-500 text-xs">
                            📚 {app.student.degree}
                          </span>
                        )}
                        {app.student.year && (
                          <span className="text-gray-500 text-xs">
                            Year {app.student.year}
                          </span>
                        )}
                      </div>

                      {/* Student skills */}
                      {app.student.skills && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {safeParseJSON(app.student.skills).slice(0, 5).map((skill) => (
                            <span
                              key={skill}
                              className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 border border-gray-700"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}

                      <p className="text-gray-600 text-xs mt-2">
                        Applied {new Date(app.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric", month: "short", year: "numeric",
                        })}
                      </p>
                    </div>

                    {/* Accept / Reject actions */}
                    <div className="shrink-0">
                      <ApplicationActions
                        applicationId={app.id}
                        currentStatus={app.status as "pending" | "accepted" | "rejected"}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
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

function StatCard({
  label, value, color,
}: {
  label: string; value: number; color: string;
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-gray-500 text-xs mt-0.5">{label}</div>
    </div>
  );
}