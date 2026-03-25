"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { ref, onValue, off } from "firebase/database";
import { db, auth } from "@/lib/firebase";
import { Session } from "@/hooks/useSession";
import { BarChart3, Plus, Trash2, LogOut, ExternalLink, Zap, Copy, QrCode } from "lucide-react";
import { toast } from "sonner";

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
                const sessionsList = Object.values(data) as Session[];
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
            toast.error("Failed to create session");
        } finally {
            setCreating(false);
        }
    };

    const handleDeleteSession = async (sessionId: string, sessionTitle: string, e: React.MouseEvent) => {
        e.stopPropagation();

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
        } catch (error) {
            console.error(error);
            toast.error("Failed to delete session");
        }
    };

    if (loading) return (
        <div className="flex min-h-screen items-center justify-center bg-white text-indigo-600">
            <Zap className="animate-pulse" size={32} fill="currentColor" />
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100">
            {/* Nav */}
            <nav className="fixed top-0 w-full bg-white border-b border-slate-200 z-50">
                <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm">
                            <Zap size={18} fill="currentColor" />
                        </div>
                        <span className="text-xl font-black tracking-tight text-slate-900">Pulse</span>
                        <span className="ml-2 px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-500">Admin</span>
                    </div>
                    <button
                        onClick={() => auth.signOut()}
                        className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-slate-500 hover:text-red-600 hover:bg-red-50 transition-all"
                    >
                        <LogOut size={16} />
                        <span className="hidden sm:inline">Logout</span>
                    </button>
                </div>
            </nav>

            <div className="mx-auto max-w-5xl px-6 pt-28 pb-20">
                <header className="mb-12">
                    <h1 className="text-4xl font-black tracking-tight text-slate-900 mb-2">Dashboard</h1>
                    <p className="text-slate-500 font-medium tracking-tight">Manage your live sessions and track engagement.</p>
                </header>

                {/* Create Session Section */}
                <div className="mb-12 rounded-[2rem] bg-indigo-600 p-8 sm:p-10 shadow-[0_20px_50px_rgba(79,70,229,0.1)] text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                        <Zap size={120} fill="currentColor" strokeWidth={1} />
                    </div>
                    <div className="relative z-10">
                        <h2 className="mb-6 text-2xl font-black tracking-tight">Create New Session</h2>
                        <form onSubmit={handleCreateSession} className="space-y-6">
                            <div className="flex flex-col sm:flex-row gap-4">
                                <input
                                    type="text"
                                    value={newSessionTitle}
                                    onChange={(e) => setNewSessionTitle(e.target.value)}
                                    placeholder="Enter session title..."
                                    className="flex-1 rounded-2xl border-none bg-white/10 px-6 py-4 text-lg font-bold placeholder-white/40 outline-none ring-2 ring-white/20 focus:ring-white focus:bg-white/20 transition-all text-white"
                                    required
                                />
                                <button
                                    type="submit"
                                    disabled={creating}
                                    className="rounded-2xl bg-white px-8 py-4 text-lg font-black text-indigo-600 hover:bg-slate-50 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-xl shadow-indigo-900/20"
                                >
                                    {creating ? <Loader2 className="animate-spin" size={20} /> : <><Plus size={20} strokeWidth={3} /> Create</>}
                                </button>
                            </div>
                            <label className="flex items-center gap-3 cursor-pointer w-fit group">
                                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${requireName ? "bg-white border-white" : "border-white/30 group-hover:border-white"}`}>
                                    {requireName && <div className="w-2.5 h-2.5 rounded-sm bg-indigo-600" />}
                                </div>
                                <input
                                    type="checkbox"
                                    checked={requireName}
                                    onChange={(e) => setRequireName(e.target.checked)}
                                    className="hidden"
                                />
                                <span className="text-sm font-bold tracking-tight text-white/80 group-hover:text-white transition-colors">Require participant names</span>
                            </label>
                        </form>
                    </div>
                </div>

                {/* Sessions List */}
                <div className="space-y-4">
                    <h3 className="text-sm font-black tracking-widest uppercase text-slate-400 mb-6">Recent Sessions</h3>
                    <div className="grid gap-4">
                        {sessions.map((session) => (
                            <div
                                key={session.id}
                                className="group relative rounded-3xl bg-white p-6 sm:p-8 border border-slate-200 border-b-4 hover:border-indigo-200 transition-all hover:-translate-y-0.5"
                            >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                                    <div
                                        onClick={() => router.push(`/admin/session/${session.id}`)}
                                        className="flex-1 cursor-pointer"
                                    >
                                        <div className="flex items-center gap-3 mb-1">
                                            <h3 className="text-xl font-black text-slate-900 tracking-tight group-hover:text-indigo-600 transition-colors uppercase">{session.title}</h3>
                                            <div className={`w-2 h-2 rounded-full ${session.isActive ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`} />
                                        </div>
                                        <div className="flex items-center gap-4 text-slate-400 font-bold">
                                            <div className="flex items-center gap-1.5 text-xs tracking-widest uppercase">
                                                Code <span className="text-indigo-600">{session.code}</span>
                                            </div>
                                            <div className="w-1 h-1 rounded-full bg-slate-200" />
                                            <div className="text-xs uppercase tracking-widest">
                                                {new Date(session.createdAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const url = `https://pulse19.vercel.app/join/${session.code}`;
                                                navigator.clipboard.writeText(url);
                                                toast.success("Link copied!");
                                            }}
                                            className="p-2.5 rounded-xl bg-slate-50 text-slate-400 hover:text-indigo-600 border border-slate-200 border-b-2 hover:border-indigo-100 transition-all font-bold"
                                            title="Copy Join Link"
                                        >
                                            <Copy size={18} />
                                        </button>
                                        <a
                                            href={`https://qr19.vercel.app/?url=https://pulse19.vercel.app/join/${session.code}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={(e) => e.stopPropagation()}
                                            className="p-2.5 rounded-xl bg-slate-50 text-slate-400 hover:text-indigo-600 border border-slate-200 border-b-2 hover:border-indigo-100 transition-all font-bold"
                                            title="Generate QR Code"
                                        >
                                            <QrCode size={18} />
                                        </a>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                router.push(`/admin/session/${session.id}?tab=results`);
                                            }}
                                            className="flex items-center justify-center gap-2 rounded-xl bg-slate-50 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-slate-900 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 border-b-2 hover:border-indigo-200 transition-all group/btn"
                                            title="View Results"
                                        >
                                            <BarChart3 size={14} className="group-hover/btn:scale-110 transition-transform" />
                                            Results
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                router.push(`/admin/session/${session.id}`);
                                            }}
                                            className="p-2.5 rounded-xl bg-slate-50 text-slate-400 hover:text-indigo-600 border border-slate-200 border-b-2 hover:border-indigo-200 transition-all"
                                            title="Manage session"
                                        >
                                            <ExternalLink size={18} />
                                        </button>
                                        <button
                                            onClick={(e) => handleDeleteSession(session.id, session.title, e)}
                                            className="p-2.5 rounded-xl bg-slate-50 text-slate-400 hover:text-red-600 border border-slate-200 border-b-2 hover:border-red-100 transition-all group/del"
                                            title="Delete session"
                                        >
                                            <Trash2 size={18} className="group-hover/del:scale-110 transition-transform" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {sessions.length === 0 && (
                            <div className="text-center py-20 rounded-[3rem] bg-slate-100/50 border-2 border-dashed border-slate-200">
                                <Plus size={40} className="mx-auto text-slate-300 mb-4" />
                                <p className="text-slate-500 font-bold tracking-tight uppercase text-xs tracking-[0.2em]">No sessions found</p>
                                <p className="text-slate-400 text-sm mt-1">Create your first poll session to get started.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function Loader2({ className, size }: { className?: string, size?: number }) {
    return <Zap className={`${className} animate-pulse`} size={size} fill="currentColor" />;
}
