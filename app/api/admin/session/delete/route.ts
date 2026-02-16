import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function POST(request: Request) {
    try {
        const { sessionId } = await request.json();

        if (!sessionId) {
            return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
        }

        // Get session to find the code
        const sessionRef = adminDb.ref(`sessions/${sessionId}`);
        const sessionSnapshot = await sessionRef.once("value");
        const session = sessionSnapshot.val();

        if (!session) {
            return NextResponse.json({ error: "Session not found" }, { status: 404 });
        }

        // Delete all related data
        const updates: any = {};
        updates[`sessions/${sessionId}`] = null;
        updates[`sessionsByCode/${session.code}`] = null;
        updates[`questions/${sessionId}`] = null;
        updates[`responses/${sessionId}`] = null;
        updates[`results/${sessionId}`] = null;
        updates[`openEnded/${sessionId}`] = null;

        await adminDb.ref().update(updates);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting session:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
