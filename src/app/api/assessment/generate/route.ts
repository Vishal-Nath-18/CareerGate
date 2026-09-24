import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "student") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const student = await prisma.student.findUnique({
      where: { userId: session.userId },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Get user's API key
    const userApiKey = await prisma.userApiKey.findUnique({
      where: { userId: session.userId },
    });

    if (!userApiKey) {
      return NextResponse.json(
        { error: "No API key found. Please add your API key in settings." },
        { status: 400 }
      );
    }

    // Decrypt API key
    const { decrypt } = await import("@/lib/encryption");
    const apiKey = decrypt(userApiKey.encrypted);

    // Get past assessments to avoid repeating correctly answered questions
    const pastAssessments = await prisma.assessment.findMany({
      where: { studentId: student.id },
      include: { questions: true },
    });

    const correctlyAnsweredQuestions = pastAssessments
      .flatMap((a) => a.questions)
      .filter((q) => q.isCorrect === true)
      .map((q) => q.question);

    const skills = student.skills ? JSON.parse(student.skills) : [];
    const goals = student.goals ? JSON.parse(student.goals) : [];

    const prompt = `
You are an expert career assessment AI. Analyze this student profile and generate a skill-gap assessment test.

Student Profile:
- Goals: ${goals.join(", ") || "Not specified"}
- Current Skills: ${skills.join(", ") || "None listed"}
- Degree: ${student.degree || "Not specified"}
- Year: ${student.year || "Not specified"}

Your task:
1. Identify skills the student LACKS based on their goals vs current skills
2. Generate exactly 20 MCQ questions testing those missing skills
3. Each question must have exactly 4 options (A, B, C, D)
4. Avoid these already correctly answered questions: ${correctlyAnsweredQuestions.length > 0 ? correctlyAnsweredQuestions.slice(0, 10).join(" | ") : "None"}

Respond ONLY with a valid JSON object, no markdown, no explanation:
{
  "title": "Assessment title based on skills being tested",
  "questions": [
    {
      "question": "Question text here",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "The correct option text exactly as written in options"
    }
  ]
}

Generate all 20 questions. Make them practical and relevant to the student's goal gaps.
`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: userApiKey.model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return NextResponse.json({ error: "AI API error: " + err }, { status: 500 });
    }

    const aiData = await response.json();
    const rawContent = aiData.choices?.[0]?.message?.content || "";

    let parsed;
    try {
      const clean = rawContent.replace(/```json|```/g, "").trim();
      parsed = JSON.parse(clean);
    } catch {
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
    }

    // Save assessment to DB
    const assessment = await prisma.assessment.create({
      data: {
        id: crypto.randomUUID(),
        studentId: student.id,
        title: parsed.title,
        status: "pending",
        total: 20,
        questions: {
          create: parsed.questions.map((q: any) => ({
            id: crypto.randomUUID(),
            question: q.question,
            options: JSON.stringify(q.options),
            correctAnswer: q.correctAnswer,
          })),
        },
      },
      include: { questions: true },
    });

    return NextResponse.json({ assessment });
  } catch (error) {
    console.error("Assessment generate error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}