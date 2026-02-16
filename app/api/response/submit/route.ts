import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { generateId } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const { sessionId, questionId, clientId, answer } = await request.json();

    if (!sessionId || !questionId || !clientId || answer === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check if user already responded to this question
    const responseRef = adminDb.ref(`responses/${sessionId}/${questionId}/${clientId}`);
    const snapshot = await responseRef.once("value");

    if (snapshot.exists()) {
      return NextResponse.json({ error: "Already responded" }, { status: 400 });
    }

    // Get question type to determine how to store result
    const questionRef = adminDb.ref(`questions/${sessionId}/${questionId}`);
    const questionSnapshot = await questionRef.once("value");
    const question = questionSnapshot.val();

    if (!question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    const updates: any = {};
    updates[`responses/${sessionId}/${questionId}/${clientId}`] = true; // Mark as responded

    if (question.type === "OPEN_ENDED") {
      const responseId = generateId();
      updates[`openEnded/${sessionId}/${questionId}/${responseId}`] = {
        text: answer,
        clientId,
        createdAt: Date.now(),
      };
    } else {
      // For MCQ/Poll, increment the count transactionally
      // Note: We can't do simple increment in multi-path update easily for deeply nested unknown keys without a transaction
      // But since we are using admin SDK, we can use a transaction on the specific count node
      const countRef = adminDb.ref(`results/${sessionId}/${questionId}/counts/${answer}`);
      await countRef.transaction((current) => (current || 0) + 1);

      const totalRef = adminDb.ref(`results/${sessionId}/${questionId}/totalResponses`);
      await totalRef.transaction((current) => (current || 0) + 1);
    }

    await adminDb.ref().update(updates);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error submitting response:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
