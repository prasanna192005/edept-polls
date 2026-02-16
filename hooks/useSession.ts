"use client";

import { useState, useEffect } from "react";
import { ref, onValue, off } from "firebase/database";
import { db } from "@/lib/firebase";

export interface Session {
    id: string;
    code: string;
    title: string;
    createdAt: number;
    isActive: boolean;
    currentQuestionId?: string | null;
}

export function useSession(sessionId: string) {
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!sessionId) return;

        const sessionRef = ref(db, `sessions/${sessionId}`);

        const handleValue = (snapshot: any) => {
            const data = snapshot.val();
            setSession(data);
            setLoading(false);
        };

        onValue(sessionRef, handleValue);

        return () => {
            off(sessionRef);
        };
    }, [sessionId]);

    return { session, loading };
}
