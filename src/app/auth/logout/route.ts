import { NextResponse } from "next/server";
import { deleteSession } from "@/lib/auth";

export async function POST() {
  try {
    await deleteSession();
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("[LOGOUT ERROR]", error);
    return NextResponse.json(
      { error: "Logout failed" },
      { status: 500 }
    );
  }
}