import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function POST(request: Request) {
  try {
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json({ error: "Session code is required" }, { status: 400 });
    }

    const uppercaseCode = code.toUpperCase();

    // Look up session ID by code
    const codeRef = adminDb.ref(`sessionsByCode/${uppercaseCode}`);
    const snapshot = await codeRef.once("value");
    const sessionId = snapshot.val();

    if (!sessionId) {
      return NextResponse.json({ error: "Invalid session code" }, { status: 404 });
    }

    // specific check if session exists and is active
    const sessionRef = adminDb.ref(`sessions/${sessionId}`);
    const sessionSnapshot = await sessionRef.once("value");
    const session = sessionSnapshot.val();

    if (!session || !session.isActive) {
      return NextResponse.json({ error: "Session is not active" }, { status: 404 });
    }

    return NextResponse.json({ sessionId, title: session.title });
  } catch (error) {
    console.error("Error joining session:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
