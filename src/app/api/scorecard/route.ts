import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifySession } from "@/lib/auth";

function safeParseJSON(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await verifySession(request);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.role !== "student") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const student = await prisma.student.findUnique({
      where: { userId: session.userId },
      include: { user: true },
    });

    if (!student) return NextResponse.json({ error: "Student profile not found." }, { status: 404 });

    const skills = safeParseJSON(student.skills);
    const goals = safeParseJSON(student.goals);

    // Gate: need at least 1 goal and some skills/resume
    if (goals.length === 0) {
      return NextResponse.json({
        error: "no_goal",
        message: "Please add at least one career goal in your profile to generate your Scorecard.",
      }, { status: 400 });
    }

    if (skills.length === 0 && !student.resumeUrl) {
      return NextResponse.json({
        error: "no_skills",
        message: "Please add your skills or upload your resume in your profile first.",
      }, { status: 400 });
    }

    // Cache check (24h)
    const forceRefresh = new URL(request.url).searchParams.get("refresh") === "true";

    if (!forceRefresh) {
      const cached = await (prisma as any).scorecardReport.findFirst({
        where: { studentId: student.id },
        orderBy: { createdAt: "desc" },
      });

      if (cached) {
        const ageMs = Date.now() - new Date(cached.createdAt).getTime();
        if (ageMs < 24 * 60 * 60 * 1000) {
          return NextResponse.json({ report: JSON.parse(cached.report), cached: true, generatedAt: cached.createdAt });
        }
      }
    }

    // Build prompt
    const prompt = `
You are an expert career coach and technical mentor. A student wants to become: ${goals.join(" / ")}.

## Student Profile
- College: ${student.college || "Not specified"}
- Degree: ${student.degree || "Not specified"}
- Year of Study: ${student.year ? `Year ${student.year}` : "Not specified"}
- Current Skills: ${skills.length > 0 ? skills.join(", ") : "None listed"}
- Resume uploaded: ${student.resumeUrl ? "Yes" : "No"}

## Your Task
Evaluate how ready this student is to achieve their career goal(s) and provide a detailed scorecard.

Respond ONLY with a valid JSON object. No markdown, no backticks, no text outside the JSON.

{
  "score": 7,
  "scoreReason": "2-3 sentence explanation of why this exact score was given.",
  "missingSkills": ["skill1", "skill2", "skill3"],
  "projectsNeeded": 3,
  "projectIdeas": [
    { "title": "Project Title", "description": "What to build and why it helps toward the goal." },
    { "title": "Project Title", "description": "What to build and why it helps toward the goal." },
    { "title": "Project Title", "description": "What to build and why it helps toward the goal." }
  ],
  "recommendedCourses": [
    { "name": "Course or certification name", "platform": "Platform name e.g. Coursera, Udemy, YouTube", "why": "Why this course matters for the goal." }
  ],
  "languagesToLearn": [
    { "language": "Language name", "priority": "Must learn / Good to have", "reason": "Why this language matters for the goal." }
  ],
  "roadmap": [
    { "phase": "Phase 1 (Month 1-2)", "focus": "Short focus area", "tasks": ["task1", "task2", "task3"] },
    { "phase": "Phase 2 (Month 3-4)", "focus": "Short focus area", "tasks": ["task1", "task2", "task3"] },
    { "phase": "Phase 3 (Month 5-6)", "focus": "Short focus area", "tasks": ["task1", "task2", "task3"] }
  ]
}

Rules:
- score is an integer from 1 to 10 based on how well current skills/degree match the goal
- Be honest and strict — a student with no relevant skills should score 2-3, not 6-7
- missingSkills: top skills they MUST learn to reach the goal that they don't already have
- projectsNeeded: realistic number of projects needed to be job-ready (integer)
- projectIdeas: exactly 3 concrete project ideas relevant to the goal
- recommendedCourses: 3-5 specific courses/certifications
- languagesToLearn: only programming/query languages relevant to the goal
- roadmap: exactly 3 phases, each with 3-4 tasks
`;

    // Get API key
    const byokRecord = await prisma.userApiKey.findUnique({ where: { userId: session.userId } });
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

    if (!apiKey) return NextResponse.json({ error: "AI service not configured." }, { status: 503 });

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
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 3000,
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("[Scorecard OpenRouter ERROR]", errText);
      return NextResponse.json({ error: "AI service failed. Please try again." }, { status: 502 });
    }

    const aiData = await aiResponse.json();
    const rawContent = aiData.choices?.[0]?.message?.content;
    if (!rawContent) return NextResponse.json({ error: "AI returned empty response." }, { status: 502 });

    const cleaned = rawContent.replace(/```json/gi, "").replace(/```/g, "").trim();

    let report: object;
    try {
      report = JSON.parse(cleaned);
    } catch {
      console.error("[Scorecard JSON PARSE ERROR]", rawContent);
      return NextResponse.json({ error: "AI returned malformed data. Please try again." }, { status: 502 });
    }

    // Save to DB using raw SQL since Prisma client may not have the new model yet
    const { default: prismaClient } = await import("@/lib/prisma");
    await (prismaClient as any).$executeRawUnsafe(
      `INSERT INTO ScorecardReport (id, studentId, report, createdAt) VALUES (?, ?, ?, ?)`,
      crypto.randomUUID(),
      student.id,
      JSON.stringify(report),
      new Date().toISOString()
    );

    return NextResponse.json({ report, cached: false, generatedAt: new Date() });

  } catch (error) {
    console.error("[GET /api/scorecard ERROR]", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}