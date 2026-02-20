import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
    try {
        const { sessionId, questionId, clientId } = await req.json();

        if (!sessionId || !questionId || !clientId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Delete from responses/sessionId/questionId/clientId
        await adminDb.ref(`responses/${sessionId}/${questionId}/${clientId}`).remove();

        // Also check if we need to update results/sessionId/questionId
        // The frontend usually recalculates results from responses, but some parts might use the results node.
        // However, based on the current implementation, results are often updated by the submit route.
        // To be safe and simple, we'll let the frontend handle the live update via listeners on the responses node.
        // If results need to be strictly managed on server, we'd recalculate here.

        // For now, removing the response is enough as the Admin UI listens to the responses path.

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Delete response error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
