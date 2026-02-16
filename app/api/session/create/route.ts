import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { generateSessionCode, generateId } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const { title, adminId } = await request.json();

    if (!title || !adminId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const sessionId = generateId();
    const sessionCode = generateSessionCode();
    const now = Date.now();

    const sessionData = {
      id: sessionId,
      code: sessionCode,
      title,
      adminId,
      createdAt: now,
      isActive: true,
      currentQuestionId: null,
    };

    // Use a multi-path update for atomicity
    const updates: any = {};
    updates[`sessions/${sessionId}`] = sessionData;
    updates[`sessionsByCode/${sessionCode}`] = sessionId;

    await adminDb.ref().update(updates);

    return NextResponse.json({ sessionId, sessionCode });
  } catch (error) {
    console.error("Error creating session:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
