import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifySession } from "@/lib/auth";

// ── GET /api/jobs ────────────────────────────────────────────────────
// Public-ish: any logged in user can browse jobs
// Query params: ?type=internship|placement&open=true
export async function GET(request: NextRequest) {
  try {
    const session = await verifySession(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");   // internship | placement | null
    const open = searchParams.get("open");   // "true" | "false" | null

    const jobs = await prisma.job.findMany({
      where: {
        ...(type ? { type } : {}),
        ...(open !== null ? { isOpen: open === "true" } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: {
        industry: {
          include: { user: true },
        },
        _count: { select: { applications: true } },
      },
    });

    // Parse skillsNeeded from JSON string to array for each job
    const parsed = jobs.map((job) => ({
      ...job,
      skillsNeeded: safeParseJSON(job.skillsNeeded),
    }));

    return NextResponse.json({ jobs: parsed });
  } catch (error) {
    console.error("[GET /api/jobs ERROR]", error);
    return NextResponse.json(
      { error: "Failed to fetch jobs." },
      { status: 500 }
    );
  }
}

// ── POST /api/jobs ───────────────────────────────────────────────────
// Industry only: create a new job listing
export async function POST(request: NextRequest) {
  try {
    // ── 1. Auth check — must be logged in as industry ────────────────
    const session = await verifySession(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.role !== "industry") {
      return NextResponse.json(
        { error: "Only industry accounts can post jobs." },
        { status: 403 }
      );
    }

    // ── 2. Parse body ────────────────────────────────────────────────
    const body = await request.json();
    const { title, description, type, location, skillsNeeded } = body;

    // ── 3. Validate ──────────────────────────────────────────────────
    if (!title?.trim()) {
      return NextResponse.json(
        { error: "Job title is required." },
        { status: 400 }
      );
    }
    if (!description?.trim()) {
      return NextResponse.json(
        { error: "Job description is required." },
        { status: 400 }
      );
    }
    if (!["internship", "placement"].includes(type)) {
      return NextResponse.json(
        { error: "Type must be internship or placement." },
        { status: 400 }
      );
    }

    // ── 4. Find the industry profile for this user ───────────────────
    const industry = await prisma.industry.findUnique({
      where: { userId: session.userId },
    });

    if (!industry) {
      return NextResponse.json(
        { error: "Industry profile not found." },
        { status: 404 }
      );
    }

    // ── 5. Create the job ────────────────────────────────────────────
    const job = await prisma.job.create({
      data: {
        industryId:   industry.id,
        title:        title.trim(),
        description:  description.trim(),
        type:         type,
        location:     location?.trim() || null,
        skillsNeeded: skillsNeeded || null, // already a JSON string from the form
        isOpen:       true,
      },
    });

    return NextResponse.json({ success: true, job }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/jobs ERROR]", error);
    return NextResponse.json(
      { error: "Failed to create job." },
      { status: 500 }
    );
  }
}

// ── Utility ──────────────────────────────────────────────────────────
// skillsNeeded is stored as a JSON string in SQLite.
// This safely parses it back to an array without crashing.
function safeParseJSON(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}