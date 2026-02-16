import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function POST(request: Request) {
  try {
    const { sessionId, questionId } = await request.json();

    if (!sessionId || !questionId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Update session's currentQuestionId and mark question as published
    const updates: any = {};
    updates[`sessions/${sessionId}/currentQuestionId`] = questionId;
    updates[`questions/${sessionId}/${questionId}/isPublished`] = true;

    await adminDb.ref().update(updates);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error publishing question:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
