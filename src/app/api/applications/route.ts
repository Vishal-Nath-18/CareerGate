import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifySession } from "@/lib/auth";

// ── POST /api/applications ───────────────────────────────────────────
// Student only: apply for a job
export async function POST(request: NextRequest) {
  try {
    // ── 1. Auth check — must be logged in as student ─────────────────
    const session = await verifySession(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.role !== "student") {
      return NextResponse.json(
        { error: "Only student accounts can apply for jobs." },
        { status: 403 }
      );
    }

    // ── 2. Parse body ────────────────────────────────────────────────
    const body = await request.json();
    const { jobId } = body;

    if (!jobId?.trim()) {
      return NextResponse.json(
        { error: "jobId is required." },
        { status: 400 }
      );
    }

    // ── 3. Find the student profile for this user ────────────────────
    const student = await prisma.student.findUnique({
      where: { userId: session.userId },
    });

    if (!student) {
      return NextResponse.json(
        { error: "Student profile not found." },
        { status: 404 }
      );
    }

    // ── 4. Check the job exists and is still open ────────────────────
    const job = await prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      return NextResponse.json(
        { error: "Job not found." },
        { status: 404 }
      );
    }

    if (!job.isOpen) {
      return NextResponse.json(
        { error: "This job is no longer accepting applications." },
        { status: 400 }
      );
    }

    // ── 5. Check for duplicate application ───────────────────────────
    const existing = await prisma.application.findFirst({
      where: {
        studentId: student.id,
        jobId:     jobId,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "You have already applied for this job." },
        { status: 409 }
      );
    }

    // ── 6. Create the application ────────────────────────────────────
    const application = await prisma.application.create({
      data: {
        studentId: student.id,
        jobId:     jobId,
        status:    "pending",
      },
      include: {
        job: true,
      },
    });

    return NextResponse.json({ success: true, application }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/applications ERROR]", error);
    return NextResponse.json(
      { error: "Failed to submit application." },
      { status: 500 }
    );
  }
}

// ── GET /api/applications ────────────────────────────────────────────
// Student → their own applications
// Industry → applications across all their jobs (supports ?jobId= filter)
export async function GET(request: NextRequest) {
  try {
    // ── 1. Auth check ────────────────────────────────────────────────
    const session = await verifySession(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get("jobId"); // optional filter for industry

    // ── 2. Student: return their own applications ────────────────────
    if (session.role === "student") {
      const student = await prisma.student.findUnique({
        where: { userId: session.userId },
      });

      if (!student) {
        return NextResponse.json(
          { error: "Student profile not found." },
          { status: 404 }
        );
      }

      const applications = await prisma.application.findMany({
        where: { studentId: student.id },
        orderBy: { createdAt: "desc" },
        include: {
          job: {
            include: {
              industry: {
                include: { user: true },
              },
            },
          },
        },
      });

      // Parse skillsNeeded on each job
      const parsed = applications.map((app) => ({
        ...app,
        job: {
          ...app.job,
          skillsNeeded: safeParseJSON(app.job.skillsNeeded),
        },
      }));

      return NextResponse.json({ applications: parsed });
    }

    // ── 3. Industry: return applications for their jobs ──────────────
    if (session.role === "industry") {
      const industry = await prisma.industry.findUnique({
        where: { userId: session.userId },
      });

      if (!industry) {
        return NextResponse.json(
          { error: "Industry profile not found." },
          { status: 404 }
        );
      }

      const applications = await prisma.application.findMany({
        where: {
          job: { industryId: industry.id },
          ...(jobId ? { jobId } : {}),
        },
        orderBy: { createdAt: "desc" },
        include: {
          job: true,
          student: {
            include: { user: true },
          },
        },
      });

      // Parse skillsNeeded on each job
      const parsed = applications.map((app) => ({
        ...app,
        job: {
          ...app.job,
          skillsNeeded: safeParseJSON(app.job.skillsNeeded),
        },
      }));

      return NextResponse.json({ applications: parsed });
    }

    // ── 4. Admin or unknown role ─────────────────────────────────────
    return NextResponse.json(
      { error: "Not authorized to view applications." },
      { status: 403 }
    );
  } catch (error) {
    console.error("[GET /api/applications ERROR]", error);
    return NextResponse.json(
      { error: "Failed to fetch applications." },
      { status: 500 }
    );
  }
}

// ── Utility ──────────────────────────────────────────────────────────
function safeParseJSON(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}