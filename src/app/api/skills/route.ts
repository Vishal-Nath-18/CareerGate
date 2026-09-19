import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifySession } from "@/lib/auth";

// ── Minimum fields required to unlock AI analysis ────────────────────
function isProfileComplete(student: {
  college: string | null;
  degree: string | null;
  skills: string | null;
}): boolean {
  return !!(student.college && student.degree && student.skills);
}

// ── Parse JSON string safely ─────────────────────────────────────────
function safeParseJSON(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// ── GET /api/skills ──────────────────────────────────────────────────
// Student only: get AI skill gap analysis
// ?refresh=true to force regenerate even if cached
export async function GET(request: NextRequest) {
  try {
    // ── 1. Auth check ────────────────────────────────────────────────
    const session = await verifySession(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.role !== "student") {
      return NextResponse.json(
        { error: "Only students can access skill analysis." },
        { status: 403 }
      );
    }

    // ── 2. Fetch student profile ─────────────────────────────────────
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

    // ── 3. Profile completeness gate ─────────────────────────────────
    if (!isProfileComplete(student)) {
      return NextResponse.json(
        {
          error: "incomplete_profile",
          message:
            "Please complete your profile first. We need your college, degree, and at least one skill to generate a meaningful analysis.",
          missing: {
            college: !student.college,
            degree: !student.degree,
            skills: !student.skills,
          },
        },
        { status: 400 }
      );
    }

    // ── 4. Check cache (skip if ?refresh=true) ───────────────────────
    const forceRefresh = new URL(request.url).searchParams.get("refresh") === "true";

    if (!forceRefresh) {
      const cached = await prisma.skillGapReport.findFirst({
        where: { studentId: student.id },
        orderBy: { createdAt: "desc" },
      });

      if (cached) {
        const ageMs = Date.now() - new Date(cached.createdAt).getTime();
        const twentyFourHours = 24 * 60 * 60 * 1000;

        if (ageMs < twentyFourHours) {
          return NextResponse.json({
            report: JSON.parse(cached.report),
            cached: true,
            generatedAt: cached.createdAt,
          });
        }
      }
    }

    // ── 5. Fetch open jobs for industry demand context ───────────────
    const jobs = await prisma.job.findMany({
      where: { isOpen: true },
      include: { industry: { include: { user: true } } },
      orderBy: { createdAt: "desc" },
      take: 20, // cap at 20 to keep prompt size reasonable
    });

    const jobsForPrompt = jobs.map((job) => ({
      id: job.id,
      title: job.title,
      type: job.type,
      company: job.industry.companyName || job.industry.user.name,
      skillsNeeded: safeParseJSON(job.skillsNeeded),
      location: job.location,
    }));

    // ── 6. Build prompt ──────────────────────────────────────────────
    const studentSkills = safeParseJSON(student.skills);

    const prompt = `
You are an AI career counselor specializing in the Ayush sector (Ayurveda, Yoga, Naturopathy, Unani, Siddha, Homeopathy) and related industries in India.

Analyze the following student profile against current industry job openings and provide a detailed skill gap analysis.

## Student Profile
- Name: ${student.user.name}
- College: ${student.college}
- Degree: ${student.degree}
- Year of Study: ${student.year ? `Year ${student.year}` : "Not specified"}
- Current Skills: ${studentSkills.length > 0 ? studentSkills.join(", ") : "None listed"}

## Current Open Job Opportunities (${jobsForPrompt.length} listings)
${jobsForPrompt.map((job, i) => `
${i + 1}. ${job.title} (${job.type}) at ${job.company}
   - Required Skills: ${job.skillsNeeded.length > 0 ? job.skillsNeeded.join(", ") : "Not specified"}
   - Location: ${job.location || "Not specified"}
   - Job ID: ${job.id}
`).join("")}

## Instructions
Respond ONLY with a valid JSON object. No markdown, no backticks, no explanation outside the JSON.

The JSON must follow this exact structure:
{
  "summary": "A 2-3 sentence honest assessment of the student's current profile and market readiness in the Ayush sector.",
  "skillGaps": ["skill1", "skill2", "skill3"],
  "learningPath": [
    "Step 1: ...",
    "Step 2: ...",
    "Step 3: ..."
  ],
  "jobMatches": [
    {
      "jobId": "exact job id from the list above",
      "jobTitle": "exact job title",
      "company": "company name",
      "matchScore": 75,
      "matchReason": "Brief explanation of why this is a good match",
      "missingSkills": ["skill1", "skill2"]
    }
  ],
  "industryDemandInsights": "A 2-3 sentence paragraph about which skills are most in demand across the current job listings and emerging trends in the Ayush sector job market."
}

Rules:
- matchScore is an integer from 0 to 100
- skillGaps should list the most important missing skills based on what employers are asking for
- learningPath should be 3-5 actionable steps ordered by priority
- jobMatches should include ALL jobs from the list, sorted by matchScore descending
- missingSkills should only list skills the student does NOT currently have
- Be honest — do not inflate match scores
- If student skills are very different from job requirements, say so clearly in the summary
`;

    // ── 7. Call OpenRouter API ───────────────────────────────────────
    // Use student's own key if saved, otherwise fall back to platform key
    const byokRecord = await prisma.userApiKey.findUnique({
      where: { userId: session.userId },
    });

    let apiKey: string;
    let modelToUse: string;

    if (byokRecord) {
      const { decrypt } = await import("@/lib/encryption");
      apiKey = decrypt(byokRecord.encrypted);
      modelToUse = byokRecord.model;
    } else {
      apiKey = process.env.OPENROUTER_API_KEY || "";
      modelToUse = "google/gemma-4-31b-it:free";
    }

    if (!apiKey) {
      return NextResponse.json(
        { error: "AI service is not configured. Please contact support." },
        { status: 503 }
      );
    }

    const aiResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        "X-Title": "CareerGate",
      },
      body: JSON.stringify({
        model: modelToUse,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.3, // lower = more consistent, less creative
        max_tokens: 2000,
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("[OpenRouter ERROR]", errText);
      return NextResponse.json(
        { error: "AI service failed. Please try again later." },
        { status: 502 }
      );
    }

    const aiData = await aiResponse.json();
    const rawContent = aiData.choices?.[0]?.message?.content;

    if (!rawContent) {
      return NextResponse.json(
        { error: "AI returned an empty response. Please try again." },
        { status: 502 }
      );
    }

    // ── 8. Parse AI response ─────────────────────────────────────────
    // Strip markdown backticks if model adds them despite instructions
    const cleaned = rawContent
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    let report: object;
    try {
      report = JSON.parse(cleaned);
    } catch {
      console.error("[AI JSON PARSE ERROR] Raw content:", rawContent);
      return NextResponse.json(
        { error: "AI returned malformed data. Please try again." },
        { status: 502 }
      );
    }

    // ── 9. Save report to database ───────────────────────────────────
    await prisma.skillGapReport.create({
      data: {
        studentId: student.id,
        report: JSON.stringify(report),
      },
    });

    // ── 10. Return report ────────────────────────────────────────────
    return NextResponse.json({
      report,
      cached: false,
      generatedAt: new Date(),
    });

  } catch (error) {
    console.error("[GET /api/skills ERROR]", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}