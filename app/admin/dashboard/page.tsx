"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { ref, onValue, off } from "firebase/database";
import { db, auth } from "@/lib/firebase";
import { Session } from "@/hooks/useSession";
import { generateId } from "@/lib/utils";
import { BarChart2 } from "lucide-react";

export default function AdminDashboard() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [sessions, setSessions] = useState<Session[]>([]);
    const [newSessionTitle, setNewSessionTitle] = useState("");
    const [requireName, setRequireName] = useState(false);
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        if (!loading && !user) {
            router.push("/admin/login");
        }
    }, [user, loading, router]);

    useEffect(() => {
        if (!user) return;

        const sessionsRef = ref(db, "sessions");
        const handleValue = (snapshot: any) => {
            const data = snapshot.val();
            if (data) {
                // Filter sessions by current admin ID if needed, or show all for now
                // Assuming single admin or shared dashboard for simplicity based on requirements
                const sessionsList = Object.values(data) as Session[];
                // Sort by createdAt desc
                sessionsList.sort((a, b) => b.createdAt - a.createdAt);
                setSessions(sessionsList);
            } else {
                setSessions([]);
            }
        };

        onValue(sessionsRef, handleValue);
        return () => off(sessionsRef);
    }, [user]);

    const handleCreateSession = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setCreating(true);

        try {
            const res = await fetch("/api/session/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: newSessionTitle,
                    adminId: user.uid,
                    requireName
                }),
            });

            if (!res.ok) throw new Error("Failed to create session");

            const { sessionId } = await res.json();
            setNewSessionTitle("");
            setRequireName(false);
            router.push(`/admin/session/${sessionId}`);
        } catch (error) {
            console.error(error);
            alert("Error creating session");
        } finally {
            setCreating(false);
        }
    };

    const handleDeleteSession = async (sessionId: string, sessionTitle: string, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent navigation when clicking delete

        if (!confirm(`Are you sure you want to delete "${sessionTitle}"? This will delete all questions, responses, and results. This action cannot be undone.`)) {
            return;
        }

        try {
            const res = await fetch("/api/admin/session/delete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sessionId }),
            });

            if (!res.ok) {
                throw new Error("Failed to delete session");
            }

            // Session will be removed automatically via the real-time listener
        } catch (error) {
            console.error(error);
            alert("Error deleting session");
        }
    };

    if (loading) return <div className="p-8 text-center">Loading...</div>;

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="mx-auto max-w-4xl">
                <div className="mb-8 flex items-center justify-between">
                    <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                    <button
                        onClick={() => auth.signOut()}
                        className="rounded px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                        Logout
                    </button>
                </div>

                <div className="mb-8 rounded-xl bg-white p-6 shadow-sm">
                    <h2 className="mb-4 text-xl font-semibold text-black">Create New Session</h2>
                    <form onSubmit={handleCreateSession} className="flex flex-col gap-4">
                        <div className="flex gap-4">
                            <input
                                type="text"
                                value={newSessionTitle}
                                onChange={(e) => setNewSessionTitle(e.target.value)}
                                placeholder="Session Title (e.g., General Knowledge Quiz)"
                                className="flex-1 rounded-md border border-gray-300 p-2 focus:border-indigo-500 focus:ring-indigo-500 text-black"
                                required
                            />
                            <button
                                type="submit"
                                disabled={creating}
                                className="rounded-md bg-indigo-600 px-6 py-2 text-white hover:bg-indigo-700 disabled:opacity-50"
                            >
                                {creating ? "Creating..." : "Create"}
                            </button>
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer w-fit text-black">
                            <input
                                type="checkbox"
                                checked={requireName}
                                onChange={(e) => setRequireName(e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="text-sm font-medium">Require participants to enter their name</span>
                        </label>
                    </form>
                </div>

                <div className="grid gap-4">
                    {sessions.map((session) => (
                        <div
                            key={session.id}
                            className="rounded-xl bg-white p-6 shadow-sm transition-all hover:shadow-md"
                        >
                            <div className="flex items-center justify-between">
                                <div
                                    onClick={() => router.push(`/admin/session/${session.id}`)}
                                    className="flex-1 cursor-pointer"
                                >
                                    <h3 className="text-xl font-bold text-gray-900">{session.title}</h3>
                                    <p className="text-sm text-gray-500">Code: <span className="font-mono font-bold text-indigo-600">{session.code}</span></p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="text-right">
                                        <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${session.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                                            {session.isActive ? "Active" : "Closed"}
                                        </span>
                                        <p className="mt-1 text-xs text-gray-400">
                                            {new Date(session.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            router.push(`/admin/session/${session.id}?tab=results`);
                                        }}
                                        className="flex items-center gap-1 rounded-lg bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100 transition-colors"
                                        title="View Results"
                                    >
                                        <BarChart2 size={16} />
                                        Results
                                    </button>
                                    <button
                                        onClick={(e) => handleDeleteSession(session.id, session.title, e)}
                                        className="rounded-lg bg-red-50 p-2 text-red-600 hover:bg-red-100 transition-colors"
                                        title="Delete session"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {sessions.length === 0 && (
                        <div className="text-center text-gray-500">No sessions found. Create one to get started.</div>
                    )}
                </div>
            </div>
        </div>
    );
}
