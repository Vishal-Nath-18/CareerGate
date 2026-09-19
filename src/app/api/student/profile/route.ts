import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifySession } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

// ── GET /api/student/profile ─────────────────────────────────────────
// Returns the current student's full profile
export async function GET(request: NextRequest) {
  try {
    const session = await verifySession(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.role !== "student") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const student = await prisma.student.findUnique({
      where: { userId: session.userId },
      include: { user: true },
    });

    if (!student) {
      return NextResponse.json(
        { error: "Student profile not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      profile: {
        // User fields
        name:      student.user.name,
        email:     student.user.email,
        // Student fields
        college:   student.college,
        degree:    student.degree,
        year:      student.year,
        skills:    safeParseJSON(student.skills),
        goals:     safeParseJSON(student.goals),
        resumeUrl: student.resumeUrl,
      },
    });
  } catch (error) {
    console.error("[GET /api/student/profile ERROR]", error);
    return NextResponse.json(
      { error: "Failed to fetch profile." },
      { status: 500 }
    );
  }
}

// ── PATCH /api/student/profile ───────────────────────────────────────
// Updates college, degree, year, skills
export async function PATCH(request: NextRequest) {
  try {
    const session = await verifySession(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.role !== "student") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { college, degree, year, skills, goals } = body;

    // ── Validate year if provided ────────────────────────────────────
    if (year !== undefined && year !== null) {
      const yearNum = Number(year);
      if (isNaN(yearNum) || yearNum < 1 || yearNum > 6) {
        return NextResponse.json(
          { error: "Year must be between 1 and 6." },
          { status: 400 }
        );
      }
    }

    // ── Validate skills ──────────────────────────────────────────────
    if (skills !== undefined && !Array.isArray(skills)) {
      return NextResponse.json(
        { error: "Skills must be an array." },
        { status: 400 }
      );
    }

    const student = await prisma.student.findUnique({
      where: { userId: session.userId },
    });

    if (!student) {
      return NextResponse.json(
        { error: "Student profile not found." },
        { status: 404 }
      );
    }

    const updated = await prisma.student.update({
      where: { userId: session.userId },
      data: {
        ...(college  !== undefined ? { college:  college?.trim() || null } : {}),
        ...(degree   !== undefined ? { degree:   degree?.trim()  || null } : {}),
        ...(year     !== undefined ? { year:     year ? Number(year) : null } : {}),
        ...(skills   !== undefined ? { skills:   JSON.stringify(skills) } : {}),
        ...(goals    !== undefined ? { goals:    JSON.stringify(goals)  } : {}),
      },
    });

    return NextResponse.json({
      success: true,
      profile: {
        college:   updated.college,
        degree:    updated.degree,
        year:      updated.year,
        skills:    safeParseJSON(updated.skills),
        goals:     safeParseJSON(updated.goals),
        resumeUrl: updated.resumeUrl,
      },
    });
  } catch (error) {
    console.error("[PATCH /api/student/profile ERROR]", error);
    return NextResponse.json(
      { error: "Failed to update profile." },
      { status: 500 }
    );
  }
}

// ── POST /api/student/profile ────────────────────────────────────────
// Resume upload — accepts multipart/form-data with a "resume" file field
export async function POST(request: NextRequest) {
  try {
    const session = await verifySession(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.role !== "student") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const student = await prisma.student.findUnique({
      where: { userId: session.userId },
    });

    if (!student) {
      return NextResponse.json(
        { error: "Student profile not found." },
        { status: 404 }
      );
    }

    // ── Parse multipart form ─────────────────────────────────────────
    const formData = await request.formData();
    const file = formData.get("resume") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded." },
        { status: 400 }
      );
    }

    // ── Validate file type ───────────────────────────────────────────
    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Only PDF files are accepted." },
        { status: 400 }
      );
    }

    // ── Validate file size (max 5MB) ─────────────────────────────────
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File size must be under 5MB." },
        { status: 400 }
      );
    }

    // ── Save file to /public/resumes/ ────────────────────────────────
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Use studentId as filename to avoid conflicts and overwrite old resume
    const filename = `${student.id}.pdf`;
    const resumesDir = path.join(process.cwd(), "public", "resumes");

    // Create directory if it doesn't exist
    await mkdir(resumesDir, { recursive: true });

    const filePath = path.join(resumesDir, filename);
    await writeFile(filePath, buffer);

    // ── Save URL to database ─────────────────────────────────────────
    const resumeUrl = `/resumes/${filename}`;

    await prisma.student.update({
      where: { userId: session.userId },
      data: { resumeUrl },
    });

    return NextResponse.json({ success: true, resumeUrl });
  } catch (error) {
    console.error("[POST /api/student/profile ERROR]", error);
    return NextResponse.json(
      { error: "Failed to upload resume." },
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