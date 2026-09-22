import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifySession } from "@/lib/auth";
import { decrypt } from "@/lib/encryption";

// ── POST /api/applications/check-eligibility ─────────────────────────
// Student only: AI checks eligibility before applying
export async function POST(request: NextRequest) {
  try {
    // ── 1. Auth check ────────────────────────────────────────────────
    const session = await verifySession(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.role !== "student") {
      return NextResponse.json(
        { error: "Only students can check eligibility." },
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

    // ── 3. Fetch student profile ─────────────────────────────────────
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

    // ── 4. Fetch job details ─────────────────────────────────────────
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: { industry: true },
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

    // ── 5. Get user's API key ────────────────────────────────────────
    const userApiKey = await prisma.userApiKey.findUnique({
      where: { userId: session.userId },
    });

    if (!userApiKey) {
      return NextResponse.json(
        { error: "No API key found. Please add your API key in settings." },
        { status: 400 }
      );
    }

    const apiKey = decrypt(userApiKey.encrypted);
    const model = userApiKey.model;

    // ── 6. Parse skills ──────────────────────────────────────────────
    const studentSkills: string[] = safeParseJSON(student.skills);
    const studentGoals: string[] = safeParseJSON(student.goals);
    const jobSkills: string[] = safeParseJSON(job.skillsNeeded);

    // ── 7. Build AI prompt ───────────────────────────────────────────
    const prompt = `
You are a career eligibility analyzer. Analyze whether a student is eligible to apply for a job.

STUDENT PROFILE:
- Name: ${student.user.name}
- College: ${student.college || "Not specified"}
- Degree: ${student.degree || "Not specified"}
- Academic Year: ${student.year ? `Year ${student.year}` : "Not specified"}
- Skills: ${studentSkills.length > 0 ? studentSkills.join(", ") : "None listed"}
- Career Goals: ${studentGoals.length > 0 ? studentGoals.join(", ") : "None listed"}
- Resume: ${student.resumeUrl ? "Uploaded" : "Not uploaded"}

JOB DETAILS:
- Title: ${job.title}
- Company: ${job.industry.companyName}
- Type: ${job.type}
- Location: ${job.location || "Not specified"}
- Description: ${job.description}
- Required Skills: ${jobSkills.length > 0 ? jobSkills.join(", ") : "Not specified"}

TASK:
Analyze the student's profile against the job requirements and respond ONLY with a valid JSON object in this exact format, no extra text:

{
  "eligibilityStatus": "eligible" | "partial" | "ineligible",
  "matchScore": <number between 0 and 100>,
  "matchedSkills": ["skill1", "skill2"],
  "missingSkills": ["skill1", "skill2"],
  "recommendations": ["recommendation1", "recommendation2"],
  "summary": "A brief 1-2 sentence summary of the eligibility decision."
}

Rules:
- "eligible": student meets all or most required skills (matchScore >= 75)
- "partial": student meets some but not all skills (matchScore 40–74)
- "ineligible": student is missing most required skills (matchScore < 40)
- Be fair and constructive in recommendations
- If no skills are required for the job, give matchScore of 80 and status "eligible"
`;

    // ── 8. Call AI API ───────────────────────────────────────────────
    const aiResponse = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: model,
          messages: [{ role: "user", content: prompt }],
          max_tokens: 800,
          temperature: 0.3,
        }),
      }
    );

    if (!aiResponse.ok) {
      const err = await aiResponse.json();
      console.error("[AI API ERROR]", err);
      return NextResponse.json(
        { error: "AI service failed. Please try again." },
        { status: 502 }
      );
    }

    const aiData = await aiResponse.json();
    const rawContent = aiData.choices?.[0]?.message?.content || "";

    // ── 9. Parse AI response ─────────────────────────────────────────
    let eligibilityResult;
    try {
      const cleaned = rawContent
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
      eligibilityResult = JSON.parse(cleaned);
    } catch {
      console.error("[AI PARSE ERROR]", rawContent);
      return NextResponse.json(
        { error: "AI returned an invalid response. Please try again." },
        { status: 500 }
      );
    }

    // ── 10. Return result ────────────────────────────────────────────
    return NextResponse.json({
      success: true,
      jobId,
      ...eligibilityResult,
    });
  } catch (error) {
    console.error("[POST /api/applications/check-eligibility ERROR]", error);
    return NextResponse.json(
      { error: "Eligibility check failed." },
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