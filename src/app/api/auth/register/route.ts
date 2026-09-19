import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { createSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, role = "student", companyName, college, degree, year } = body;

    // ── 1. Input validation ──────────────────────────────────────────
    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: "Name, email, password and role are required." },
        { status: 400 }
      );
    }

    if (!["student", "industry"].includes(role)) {
      return NextResponse.json(
        { error: "Role must be either 'student' or 'industry'." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address." },
        { status: 400 }
      );
    }

    if (role === "industry" && !companyName) {
      return NextResponse.json(
        { error: "Company name is required for industry accounts." },
        { status: 400 }
      );
    }

    // ── 2. Check if email already exists ────────────────────────────
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    // ── 3. Hash the password ─────────────────────────────────────────
    // 12 rounds = secure enough for production, ~300ms per hash
    const hashedPassword = await bcrypt.hash(password, 12);

    // ── 4. Create User + profile in a transaction ────────────────────
    // A Prisma transaction ensures both records are created together.
    // If the Student/Industry insert fails, the User is also rolled back.
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name: name.trim(),
          email: email.toLowerCase().trim(),
          password: hashedPassword,
          role,
        },
      });

      if (role === "student") {
        await tx.student.create({
          data: {
            userId: newUser.id,
            college: college?.trim() || null,
            degree: degree?.trim() || null,
            year: year ? parseInt(year) : null,
          },
        });
      }

      if (role === "industry") {
        await tx.industry.create({
          data: {
            userId: newUser.id,
            companyName: companyName.trim(),
          },
        });
      }

      return newUser;
    });

    // ── 5. Create JWT session cookie ─────────────────────────────────
    await createSession(user.id, user.email, user.name, user.role);

    // ── 6. Return success (never return the password) ────────────────
    return NextResponse.json(
      {
        success: true,
        redirectPath: user.role === "student"
          ? "/dashboard/student"
          : "/dashboard/industry",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[REGISTER ERROR]", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}