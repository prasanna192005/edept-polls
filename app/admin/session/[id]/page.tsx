"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { useSession } from "@/hooks/useSession";
import { ref, onValue, off } from "firebase/database";
import { db } from "@/lib/firebase";
import { Trash2, Play, BarChart3, ArrowLeft, Plus, Users, Zap, ExternalLink, Settings, Layout, CheckCircle, Copy, QrCode } from "lucide-react";

type QuestionType = "MCQ" | "POLL" | "OPEN_ENDED";

interface Question {
    id: string;
    type: QuestionType;
    questionText: string;
    options?: string[];
    correctOptionIndex?: number;
    isPublished: boolean;
}

import { Suspense } from "react";
import { toast } from "sonner";

export default function SessionManage() {
    return (
        <Suspense fallback={<div className="p-8 text-center">Loading session results...</div>}>
            <SessionManageContent />
        </Suspense>
    );
}

function SessionManageContent() {
    const { id } = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();

    const sessionId = Array.isArray(id) ? id[0] : (id || "");
    const { user, loading: authLoading } = useAuth();
    const { session, loading: sessionLoading } = useSession(sessionId);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [activeTab, setActiveTab] = useState<"questions" | "results">("questions");

    // Initialize tab from query param
    useEffect(() => {
        const tab = searchParams.get("tab");
        if (tab === "results") setActiveTab("results");
        else setActiveTab("questions");
    }, [searchParams]);

    // New Question Form State
    const [qType, setQType] = useState<QuestionType>("MCQ");
    const [qText, setQText] = useState("");
    const [options, setOptions] = useState<string[]>(["", ""]);
    const [correctIdx, setCorrectIdx] = useState(0);
    const [addingQ, setAddingQ] = useState(false);

    useEffect(() => {
        if (!authLoading && !user) router.push("/admin/login");
    }, [authLoading, user, router]);

    useEffect(() => {
        if (!sessionId) return;
        const qRef = ref(db, `questions/${sessionId}`);
        const handleValue = (snapshot: any) => {
            const data = snapshot.val();
            if (data) {
                setQuestions(Object.values(data) as Question[]);
            } else {
                setQuestions([]);
            }
        };
        onValue(qRef, handleValue);
        return () => off(qRef);
    }, [sessionId]);

    const handleAddOption = () => setOptions([...options, ""]);
    const handleOptionChange = (idx: number, val: string) => {
        const newOpts = [...options];
        newOpts[idx] = val;
        setOptions(newOpts);
    };
    const handleRemoveOption = (idx: number) => {
        setOptions(options.filter((_, i) => i !== idx));
    };

    const handleCreateQuestion = async (e: React.FormEvent) => {
        e.preventDefault();
        setAddingQ(true);
        try {
            const payload: any = {
                sessionId,
                type: qType,
                questionText: qText,
            };
            if (qType === "MCQ" || qType === "POLL") {
                payload.options = options.filter(o => o.trim() !== "");
            }
            if (qType === "MCQ") {
                payload.correctOptionIndex = correctIdx;
            }

            const res = await fetch("/api/admin/question/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error("Failed to create question");

            setQText("");
            setOptions(["", ""]);
            setCorrectIdx(0);
        } catch (err) {
            console.error(err);
            toast.error("Failed to create question");
        } finally {
            setAddingQ(false);
        }
    };

    const handlePublish = async (qId: string) => {
        await fetch("/api/admin/question/publish", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId, questionId: qId }),
        });
    };

    if (authLoading || sessionLoading) return (
        <div className="flex min-h-screen items-center justify-center bg-white text-indigo-600">
            <Zap className="animate-pulse" size={32} fill="currentColor" />
        </div>
    );
    if (!session) return <div className="p-20 text-center font-bold text-slate-400 uppercase tracking-widest">Session not found</div>;

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100">
            {/* Nav */}
            <nav className="fixed top-0 w-full bg-white border-b border-slate-200 z-50">
                <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => router.push("/admin/dashboard")}
                            className="flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-colors"
                        >
                            <ArrowLeft size={18} />
                        </button>
                        <div className="w-px h-4 bg-slate-200 mx-2" />
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-black tracking-widest uppercase text-indigo-600">{session.code}</span>
                            <span className="text-sm font-bold text-slate-400 truncate max-w-[150px] sm:max-w-[300px]">{session.title}</span>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="mx-auto max-w-5xl px-6 pt-24 pb-20">
                {/* Header Info */}
                <div className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                    <div>
                        <div className="mb-2 inline-flex items-center rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-black tracking-wider uppercase text-indigo-600 border border-indigo-100/50">
                            Live Session
                        </div>
                        <h1 className="text-4xl font-black tracking-tight text-slate-900 mb-2">{session.title}</h1>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                            <p className="text-slate-500 font-medium tracking-tight flex items-center gap-2">
                                Participants join at <span className="text-slate-900 font-bold underline decoration-indigo-300">pulse19.vercel.app</span> with code <span className="text-indigo-600 font-black tracking-widest">{session.code}</span>
                            </p>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => {
                                        const url = `https://pulse19.vercel.app/join/${session.code}`;
                                        navigator.clipboard.writeText(url);
                                        toast.success("Link copied!");
                                    }}
                                    className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-black uppercase tracking-wider text-slate-600 border border-slate-200 hover:border-indigo-200 hover:text-indigo-600 transition-all shadow-sm"
                                    title="Copy Join Link"
                                >
                                    <Copy size={14} />
                                    Copy Link
                                </button>
                                <a
                                    href={`https://qr19.vercel.app/?url=https://pulse19.vercel.app/join/${session.code}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-black uppercase tracking-wider text-slate-600 border border-slate-200 hover:border-indigo-200 hover:text-indigo-600 transition-all shadow-sm"
                                    title="Generate QR Code"
                                >
                                    <QrCode size={14} />
                                    QR Code
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                {/* TAB SWITCHER */}
                <div className="mb-10 flex gap-1 p-1 bg-slate-200/50 rounded-2xl w-fit border border-slate-200/50">
                    <button
                        onClick={() => setActiveTab("questions")}
                        className={`flex items-center gap-2.5 px-6 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === "questions" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-900"}`}
                    >
                        <Layout size={16} strokeWidth={activeTab === "questions" ? 3 : 2} />
                        Control Center
                    </button>
                    <button
                        onClick={() => setActiveTab("results")}
                        className={`flex items-center gap-2.5 px-6 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === "results" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-900"}`}
                    >
                        <BarChart3 size={16} strokeWidth={activeTab === "results" ? 3 : 2} />
                        Analytics
                    </button>
                </div>

                <div className="mt-8">
                    {activeTab === "questions" ? (
                        <>
                            <div className="mb-12 grid gap-8 lg:grid-cols-5 items-start">
                                {/* NEW QUESTION FORM */}
                                <div className="lg:col-span-2 rounded-[2rem] bg-indigo-600 p-8 shadow-xl shadow-indigo-100/50 text-white border border-indigo-500/50">
                                    <h2 className="mb-6 text-xl font-black tracking-tight flex items-center gap-2">
                                        <Plus className="text-white/60" size={20} strokeWidth={3} />
                                        Add Question
                                    </h2>
                                    <form onSubmit={handleCreateQuestion} className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-white/60">Question Type</label>
                                            <select
                                                value={qType}
                                                onChange={(e) => setQType(e.target.value as QuestionType)}
                                                className="w-full rounded-2xl border-none bg-white/10 px-4 py-3 text-sm font-bold text-white outline-none ring-2 ring-white/20 focus:ring-white transition-all appearance-none cursor-pointer"
                                            >
                                                <option value="MCQ" className="text-slate-900">Multiple Choice</option>
                                                <option value="POLL" className="text-slate-900">Poll (No correct answer)</option>
                                                <option value="OPEN_ENDED" className="text-slate-900">Open Ended</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-white/60">Question Text</label>
                                            <textarea
                                                value={qText}
                                                onChange={(e) => setQText(e.target.value)}
                                                className="w-full rounded-2xl border-none bg-white/10 px-4 py-3 text-sm font-bold text-white outline-none ring-2 ring-white/20 focus:ring-white transition-all placeholder-white/30"
                                                rows={2}
                                                placeholder="What's on your mind?"
                                                required
                                            />
                                        </div>

                                        {(qType === "MCQ" || qType === "POLL") && (
                                            <div className="space-y-4">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-white/60">Options</label>
                                                <div className="space-y-2">
                                                {options.map((opt, idx) => (
                                                    <div key={idx} className="flex items-center gap-3 group/opt">
                                                        {qType === "MCQ" && (
                                                            <button
                                                                type="button"
                                                                onClick={() => setCorrectIdx(idx)}
                                                                className={`w-6 h-6 rounded-lg flex items-center justify-center border-2 transition-all shrink-0 ${correctIdx === idx ? "bg-white border-white text-indigo-600" : "border-white/20 hover:border-white/50 text-white/50"}`}
                                                            >
                                                                {correctIdx === idx && <CheckCircle size={14} strokeWidth={3} />}
                                                            </button>
                                                        )}
                                                        <input
                                                            type="text"
                                                            value={opt}
                                                            onChange={(e) => handleOptionChange(idx, e.target.value)}
                                                            className="flex-1 rounded-xl border-none bg-white/10 px-4 py-2.5 text-xs font-bold text-white outline-none ring-1 ring-white/10 focus:ring-white/40 transition-all placeholder-white/20"
                                                            placeholder={`Option ${idx + 1}`}
                                                            required
                                                        />
                                                        {options.length > 2 && (
                                                            <button type="button" onClick={() => handleRemoveOption(idx)} className="text-white/40 hover:text-white transition-colors">
                                                                <Trash2 size={14} />
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                                </div>
                                                <button type="button" onClick={handleAddOption} className="text-[10px] font-black tracking-widest uppercase text-white hover:underline underline-offset-4 decoration-2">
                                                    + Add Option
                                                </button>
                                            </div>
                                        )}

                                        <button
                                            type="submit"
                                            disabled={addingQ}
                                            className="w-full rounded-2xl bg-white py-4 text-xs font-black uppercase tracking-widest text-indigo-600 shadow-xl shadow-indigo-900/10 transition-all hover:bg-slate-50 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            {addingQ ? <Loader2 size={16} /> : "Add to Library"}
                                        </button>
                                    </form>
                                </div>

                                {/* QUESTION LIST */}
                                <div className="lg:col-span-3">
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-sm font-black tracking-widest uppercase text-slate-400">Library ({questions.length})</h2>
                                    </div>
                                    <div className="space-y-3">
                                        {questions.length === 0 && (
                                            <div className="py-20 text-center rounded-[2rem] bg-slate-100/50 border-2 border-dashed border-slate-200">
                                                <p className="text-slate-400 text-xs font-black uppercase tracking-widest">No questions created</p>
                                            </div>
                                        )}
                                        {questions.map((q) => (
                                            <div key={q.id} className={`group relative rounded-2xl border transition-all ${q.id === session.currentQuestionId ? "bg-white border-indigo-200 border-b-4 shadow-sm" : "bg-white border-slate-200 hover:border-slate-300"}`}>
                                                <div className="p-5 flex items-start justify-between gap-4">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1.5">
                                                            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400">{q.type}</span>
                                                            {q.id === session.currentQuestionId && (
                                                                <span className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-[0.15em] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                                                                    <div className="w-1 h-1 rounded-full bg-indigo-600 animate-pulse" />
                                                                    Live
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className={`font-bold text-sm tracking-tight truncate ${q.id === session.currentQuestionId ? "text-indigo-900" : "text-slate-900"}`}>{q.questionText}</p>
                                                    </div>
                                                    {q.id !== session.currentQuestionId && (
                                                        <button
                                                            onClick={() => handlePublish(q.id)}
                                                            className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-[10px] font-black tracking-widest uppercase text-white transition-all hover:bg-slate-800 active:scale-[0.98]"
                                                        >
                                                            <Play size={12} fill="currentColor" /> 
                                                            Present
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-16 bg-white rounded-[2.5rem] p-10 border border-slate-200 shadow-sm ring-1 ring-slate-100">
                                <h2 className="mb-10 flex items-center gap-3 text-xl font-black tracking-tight text-slate-900">
                                    <BarChart3 className="text-indigo-600" size={24} strokeWidth={3} />
                                    Live Interaction
                                </h2>
                                {session.currentQuestionId && sessionId ? (
                                    <LiveResults sessionId={sessionId} questionId={session.currentQuestionId} />
                                ) : (
                                    <div className="py-20 text-center flex flex-col items-center">
                                        <Zap className="text-slate-200 mb-4" size={48} />
                                        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">No active presentation</p>
                                        <p className="text-slate-300 text-sm mt-1">Select a question to start the live experience.</p>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="bg-white rounded-[2.5rem] p-10 border border-slate-200 shadow-sm ring-1 ring-slate-100">
                            <h2 className="mb-10 flex items-center gap-3 text-xl font-black tracking-tight text-slate-900">
                                <BarChart3 className="text-indigo-600" size={24} strokeWidth={3} />
                                Session Analytics
                            </h2>
                            <SessionResults sessionId={sessionId} questions={questions} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function Loader2({ className, size }: { className?: string, size?: number }) {
    return <Zap className={`${className} animate-pulse`} size={size} fill="currentColor" />;
}

// Inline Results Component for simplicity
function LiveResults({ sessionId, questionId }: { sessionId: string, questionId: string }) {
    const [results, setResults] = useState<any>(null);
    const [question, setQuestion] = useState<Question | null>(null);
    const [responses, setResponses] = useState<any[]>([]);

    useEffect(() => {
        const qRef = ref(db, `questions/${sessionId}/${questionId}`);
        onValue(qRef, (snap) => setQuestion(snap.val()));

        const rRef = ref(db, `results/${sessionId}/${questionId}`);
        onValue(rRef, (snap) => setResults(snap.val()));

        const respRef = ref(db, `responses/${sessionId}/${questionId}`);
        onValue(respRef, (snap) => {
            const data = snap.val();
            if (data) {
                setResponses(Object.entries(data).map(([clientId, val]: [string, any]) => ({
                    clientId,
                    ...val
                })).sort((a: any, b: any) => b.createdAt - a.createdAt));
            } else {
                setResponses([]);
            }
        });

        return () => { off(qRef); off(rRef); off(respRef); };
    }, [sessionId, questionId]);

    const handleDeleteResponse = async (clientId: string) => {
        if (!confirm("Are you sure you want to delete this response?")) return;

        try {
            const res = await fetch("/api/admin/response/delete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sessionId, questionId, clientId }),
            });

            if (!res.ok) throw new Error("Failed to delete response");
        } catch (error) {
            console.error(error);
            toast.error("Error deleting response");
        }
    };

    if (!question) return (
        <div className="flex items-center justify-center p-12">
            <Loader2 className="animate-spin text-indigo-600" size={32} />
        </div>
    );

    const total = responses.length;

    if (question.type === "OPEN_ENDED") {
        return (
            <div className="space-y-6">
                <p className="font-black text-xl tracking-tight text-slate-900 border-b border-slate-100 pb-4">{question.questionText}</p>
                <div className="grid gap-4 sm:grid-cols-2">
                    {responses.length === 0 && <p className="text-slate-400 text-xs font-bold uppercase tracking-widest text-center py-10 w-full col-span-full">Waiting for contributions...</p>}
                    {responses.map((r: any) => (
                        <div key={r.clientId} className="group relative rounded-[1.5rem] border border-slate-100 bg-slate-50 p-6 transition-all hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 hover:border-indigo-100 flex flex-col h-full">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-indigo-600" />
                                    <span className="font-black text-[10px] uppercase tracking-widest text-indigo-600">{r.userName || "Anonymous"}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    <button
                                        onClick={() => handleDeleteResponse(r.clientId)}
                                        className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity"
                                        title="Delete response"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                            <p className="text-slate-700 text-sm font-bold leading-relaxed whitespace-pre-wrap flex-1 italic">"{r.answer}"</p>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    const counts: Record<number, number> = {};
    responses.forEach(r => {
        if (r.answer !== undefined) {
            counts[r.answer] = (counts[r.answer] || 0) + 1;
        }
    });

    return (
        <div className="space-y-6">
            <p className="mb-4 text-xl font-medium">{question.questionText}</p>

            <div className="space-y-6">
                {question.options?.map((opt, idx) => {
                    const count = counts[idx] || 0;
                    const percent = total > 0 ? Math.round((count / total) * 100) : 0;
                    const isCorrect = question.type === "MCQ" && question.correctOptionIndex === idx;

                    return (
                        <div key={idx} className="relative">
                            <div className="mb-2 flex justify-between items-end">
                                <div className="flex items-center gap-3">
                                    <span className={`text-sm font-black tracking-tight ${isCorrect ? "text-emerald-600" : "text-slate-900"}`}>{opt}</span>
                                    {isCorrect && <span className="text-[8px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-black uppercase tracking-widest border border-emerald-200">Pick</span>}
                                </div>
                                <span className="text-xs font-black tracking-widest text-slate-400">{percent}%</span>
                            </div>
                            <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200/50">
                                <div
                                    className={`h-full transition-all duration-1000 cubic-bezier(0.4, 0, 0.2, 1) ${isCorrect ? "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.3)]" : "bg-indigo-600 shadow-[0_0_12px_rgba(79,70,229,0.3)]"}`}
                                    style={{ width: `${percent}%` }}
                                />
                            </div>

                            <div className="mt-3 flex flex-wrap gap-1.5 min-h-[1.5rem]">
                                {responses.filter(r => r.answer === idx).map(r => (
                                    <span key={r.clientId} className={`text-[9px] font-bold px-2 py-0.5 rounded-md border tracking-tight ${isCorrect ? "bg-emerald-50 border-emerald-100 text-emerald-700" : "bg-slate-50 border-slate-100 text-slate-500"}`}>
                                        {r.userName || "Anonymous"}
                                    </span>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-12 pt-8 border-t border-slate-100">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6 flex items-center gap-2">
                    <Users size={14} /> Participant Breakdown
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {responses.map((r: any) => {
                        const isCorrect = question.type === "MCQ" && r.answer === question.correctOptionIndex;
                        const isWrong = question.type === "MCQ" && r.answer !== question.correctOptionIndex;

                        return (
                            <div key={r.clientId} className={`group flex items-center justify-between p-4 rounded-2xl border text-xs transition-all hover:bg-white h-12 ${isCorrect ? "bg-emerald-50/50 border-emerald-100/50 shadow-sm shadow-emerald-100/20" : isWrong ? "bg-rose-50/50 border-rose-100/50 shadow-sm shadow-rose-100/20" : "bg-slate-50/50 border-slate-100/50"}`}>
                                <div className="flex items-center gap-3 overflow-hidden">
                                     <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${isCorrect ? "bg-emerald-500" : isWrong ? "bg-rose-500" : "bg-indigo-400"}`} />
                                     <span className="font-bold text-slate-900 truncate">{r.userName || "Anonymous"}</span>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                    <span className="text-slate-400 font-black tracking-widest text-[9px] uppercase">{question.type === "OPEN_ENDED" ? "Replied" : `Opt ${r.answer + 1}`}</span>
                                    {question.type === "MCQ" && (
                                        <span className={`text-[10px] font-black rounded-lg w-5 h-5 flex items-center justify-center ${isCorrect ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"}`}>
                                            {isCorrect ? "✓" : "✗"}
                                        </span>
                                    )}
                                    <button
                                        onClick={() => handleDeleteResponse(r.clientId)}
                                        className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-600 transition-all"
                                        title="Delete response"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <p className="mt-8 text-[10px] font-black uppercase tracking-widest text-slate-300">Total interactions: {total}</p>
        </div >
    );
}

// Cumulative Results / Leaderboard Component
function SessionResults({ sessionId, questions }: { sessionId: string, questions: Question[] }) {
    const [allResponses, setAllResponses] = useState<Record<string, Record<string, any>>>({});

    useEffect(() => {
        const respRef = ref(db, `responses/${sessionId}`);
        onValue(respRef, (snap) => {
            const data = snap.val();
            if (data) setAllResponses(data);
            else setAllResponses({});
        });
        return () => off(respRef);
    }, [sessionId]);

    const handleDeleteResponse = async (qId: string, clientId: string) => {
        if (!confirm("Are you sure you want to delete this particular response?")) return;

        try {
            const res = await fetch("/api/admin/response/delete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sessionId, questionId: qId, clientId }),
            });

            if (!res.ok) throw new Error("Failed to delete response");
        } catch (error) {
            console.error(error);
            toast.error("Error deleting response");
        }
    };

    const userStats: Record<string, { userName: string, correct: number, total: number, answers: any }> = {};

    Object.entries(allResponses).forEach(([qId, qResponses]) => {
        const question = questions.find(q => q.id === qId);
        if (!question) return;

        Object.entries(qResponses).forEach(([clientId, resp]: [string, any]) => {
            if (!userStats[clientId]) {
                userStats[clientId] = { userName: resp.userName || "Anonymous", correct: 0, total: 0, answers: {} };
            }

            userStats[clientId].total += 1;
            userStats[clientId].answers[qId] = resp.answer;

            if (question.type === "MCQ" && resp.answer === question.correctOptionIndex) {
                userStats[clientId].correct += 1;
            }
        });
    });

    const sortedUsers = Object.entries(userStats).sort((a, b) => b[1].correct - a[1].correct);

    if (questions.length === 0) return <div className="text-slate-400 font-bold text-xs uppercase tracking-widest py-10 text-center">No questions created yet.</div>;
    if (Object.keys(userStats).length === 0) return <div className="text-slate-400 font-bold text-xs uppercase tracking-widest py-10 text-center">No responses recorded yet.</div>;

    return (
        <div className="overflow-x-auto -mx-10 px-10">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="border-b border-slate-100">
                        <th className="pb-6 pr-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Participant</th>
                        <th className="pb-6 px-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">Score</th>
                        {questions.map((q, i) => (
                            <th key={q.id} className="pb-6 px-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center min-w-[80px]" title={q.questionText}>
                                Q{i + 1}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {sortedUsers.map(([clientId, stats]) => (
                        <tr key={clientId} className="group hover:bg-slate-50/50 transition-colors">
                            <td className="py-5 pr-6">
                                <span className="font-black text-sm tracking-tight text-slate-900">{stats.userName}</span>
                            </td>
                            <td className="py-5 px-6 text-center">
                                <span className="inline-flex h-8 px-3 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 text-xs font-black tracking-tighter border border-indigo-100">
                                    {stats.correct}<span className="text-[10px] text-indigo-300 mx-0.5">/</span>{questions.filter(q => q.type === "MCQ").length}
                                </span>
                            </td>
                            {questions.map(q => {
                                const ans = stats.answers[q.id];
                                const isCorrect = q.type === "MCQ" && ans === q.correctOptionIndex;
                                const isWrong = q.type === "MCQ" && ans !== undefined && ans !== q.correctOptionIndex;

                                return (
                                    <td key={q.id} className="py-5 px-6 text-center whitespace-nowrap relative">
                                        <div className="flex items-center justify-center gap-2">
                                            {ans === undefined ? (
                                                <span className="text-slate-200"></span>
                                            ) : q.type === "OPEN_ENDED" ? (
                                                <div className="max-w-[100px] truncate text-[10px] font-bold text-slate-400 italic" title={ans as string}>"{ans}"</div>
                                            ) : (
                                                <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black tracking-tighter ${isCorrect ? "bg-emerald-100 text-emerald-600" : isWrong ? "bg-rose-100 text-rose-600" : "bg-slate-100 text-slate-400"}`}>
                                                    {isCorrect ? "✓" : isWrong ? "✗" : ans + 1}
                                                </div>
                                            )}

                                            {ans !== undefined && (
                                                <button
                                                    onClick={() => handleDeleteResponse(q.id, clientId)}
                                                    className="absolute -right-1 opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-600 transition-all"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export const dynamic = 'force-dynamic'
