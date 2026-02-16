import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { generateId } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const { sessionId, type, questionText, options, correctOptionIndex } = await request.json();

    if (!sessionId || !type || !questionText) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const questionId = generateId();
    const now = Date.now();

    const questionData = {
      id: questionId,
      sessionId,
      type,
      questionText,
      options: options || [],
      correctOptionIndex: correctOptionIndex !== undefined ? correctOptionIndex : null,
      createdAt: now,
      isPublished: false,
    };

    await adminDb.ref(`questions/${sessionId}/${questionId}`).set(questionData);

    return NextResponse.json({ questionId });
  } catch (error) {
    console.error("Error adding question:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
