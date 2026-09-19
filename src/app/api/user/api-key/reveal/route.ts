import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { decrypt } from "@/lib/encryption";

export async function GET() {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const record = await prisma.userApiKey.findUnique({
    where: { userId: session.userId },
  });

  if (!record) {
    return NextResponse.json({ error: "No API key found" }, { status: 404 });
  }

  try {
    const decrypted = decrypt(record.encrypted);
    return NextResponse.json({ apiKey: decrypted });
  } catch {
    return NextResponse.json({ error: "Failed to decrypt API key" }, { status: 500 });
  }
}