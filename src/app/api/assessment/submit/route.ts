import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "student") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { assessmentId, answers } = await req.json();
    // answers = { [questionId]: "selected option text" }

    if (!assessmentId || !answers) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    const student = await prisma.student.findUnique({
      where: { userId: session.userId },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: { questions: true },
    });

    if (!assessment || assessment.studentId !== student.id) {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
    }

    if (assessment.status === "completed") {
      return NextResponse.json({ error: "Assessment already submitted" }, { status: 400 });
    }

    // Check each answer and update question
    let score = 0;

    for (const question of assessment.questions) {
      const userAnswer = answers[question.id] || null;
      const isCorrect = userAnswer === question.correctAnswer;
      if (isCorrect) score++;

      await prisma.assessmentQuestion.update({
        where: { id: question.id },
        data: {
          userAnswer,
          isCorrect,
        },
      });
    }

    // Update assessment with score and mark completed
    const updated = await prisma.assessment.update({
      where: { id: assessmentId },
      data: {
        score,
        status: "completed",
      },
      include: { questions: true },
    });

    return NextResponse.json({ assessment: updated, score, total: 20 });
  } catch (error) {
    console.error("Assessment submit error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}