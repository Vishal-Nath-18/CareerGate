import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { encrypt, decrypt } from "@/lib/encryption";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { apiKey, model } = await req.json();

  if (!model) {
    return NextResponse.json({ error: "Model is required" }, { status: 400 });
  }

  const existing = await prisma.userApiKey.findUnique({
    where: { userId: session.userId },
  });

  if (!existing && !apiKey) {
    return NextResponse.json({ error: "API key is required" }, { status: 400 });
  }

  if (existing) {
    await prisma.userApiKey.update({
      where: { userId: session.userId },
      data: apiKey ? { encrypted: encrypt(apiKey), model } : { model },
    });
  } else {
    await prisma.userApiKey.create({
      data: { userId: session.userId, encrypted: encrypt(apiKey), model },
    });
  }

  return NextResponse.json({ success: true });
}

export async function GET() {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const record = await prisma.userApiKey.findUnique({
    where: { userId: session.userId },
  });

  if (!record) {
    return NextResponse.json({ hasKey: false });
  }

  return NextResponse.json({ hasKey: true, model: record.model });
}