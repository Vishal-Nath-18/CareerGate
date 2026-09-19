import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifySession } from "@/lib/auth";

// ── PATCH /api/applications/[id] ─────────────────────────────────────
// Industry only: update application status (pending | accepted | rejected)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ── 1. Auth check — must be industry ─────────────────────────────
    const session = await verifySession(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.role !== "industry") {
      return NextResponse.json(
        { error: "Only industry accounts can update application status." },
        { status: 403 }
      );
    }

    // ── 2. Resolve params ─────────────────────────────────────────────
    const { id } = await params;

    // ── 3. Parse body ─────────────────────────────────────────────────
    const body = await request.json();
    const { status } = body;

    if (!["pending", "accepted", "rejected"].includes(status)) {
      return NextResponse.json(
        { error: "Status must be pending, accepted, or rejected." },
        { status: 400 }
      );
    }

    // ── 4. Find the application ───────────────────────────────────────
    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        job: { include: { industry: true } },
      },
    });

    if (!application) {
      return NextResponse.json(
        { error: "Application not found." },
        { status: 404 }
      );
    }

    // ── 5. Verify this job belongs to the requesting industry ─────────
    // Prevents one industry from updating another industry's applications
    const industry = await prisma.industry.findUnique({
      where: { userId: session.userId },
    });

    if (!industry || application.job.industryId !== industry.id) {
      return NextResponse.json(
        { error: "You are not authorized to update this application." },
        { status: 403 }
      );
    }

    // ── 6. Update status ──────────────────────────────────────────────
    const updated = await prisma.application.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({ success: true, application: updated });
  } catch (error) {
    console.error("[PATCH /api/applications/[id] ERROR]", error);
    return NextResponse.json(
      { error: "Failed to update application status." },
      { status: 500 }
    );
  }
}