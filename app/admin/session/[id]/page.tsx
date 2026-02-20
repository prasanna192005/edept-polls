"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { useSession } from "@/hooks/useSession";
import { ref, onValue, off } from "firebase/database";
import { db } from "@/lib/firebase";
import { Trash2, Play, BarChart2 } from "lucide-react";

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
            alert("Failed to create question");
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

    if (authLoading || sessionLoading) return <div className="p-8 text-center">Loading...</div>;
    if (!session) return <div className="p-8 text-center">Session not found</div>;

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            <div className="mx-auto max-w-5xl">
                <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{session.title}</h1>
                        <p className="text-gray-500">Code: <span className="font-mono text-xl font-bold text-indigo-600">{session.code}</span></p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => router.push("/admin/dashboard")} className="rounded bg-gray-200 px-4 py-2 text-sm hover:bg-gray-300">Back</button>
                    </div>
                </div>

                {/* TAB SWITCHER */}
                <div className="mb-8 flex border-b border-gray-200">
                    <button
                        onClick={() => setActiveTab("questions")}
                        className={`flex items-center gap-2 border-b-2 px-6 py-3 text-sm font-bold transition-all ${activeTab === "questions" ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
                    >
                        <Play size={18} fill={activeTab === "questions" ? "currentColor" : "none"} />
                        Questions & Live
                    </button>
                    <button
                        onClick={() => setActiveTab("results")}
                        className={`flex items-center gap-2 border-b-2 px-6 py-3 text-sm font-bold transition-all ${activeTab === "results" ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
                    >
                        <BarChart2 size={18} />
                        Session Results
                    </button>
                </div>

                <div className="mt-8">
                    {activeTab === "questions" ? (
                        <>
                            <div className="mb-8 grid gap-6 md:grid-cols-2">
                                <div className="rounded-xl bg-white p-6 shadow-sm text-black">
                                    <h2 className="mb-4 text-lg font-semibold">Add New Question</h2>
                                    <form onSubmit={handleCreateQuestion} className="space-y-4">
                                        <div>
                                            <label className="mb-1 block text-sm font-medium">Type</label>
                                            <select
                                                value={qType}
                                                onChange={(e) => setQType(e.target.value as QuestionType)}
                                                className="w-full rounded border p-2"
                                            >
                                                <option value="MCQ">Multiple Choice</option>
                                                <option value="POLL">Poll</option>
                                                <option value="OPEN_ENDED">Open Ended</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-sm font-medium">Question Text</label>
                                            <textarea
                                                value={qText}
                                                onChange={(e) => setQText(e.target.value)}
                                                className="w-full rounded border p-2"
                                                rows={2}
                                                required
                                            />
                                        </div>

                                        {(qType === "MCQ" || qType === "POLL") && (
                                            <div>
                                                <label className="mb-1 block text-sm font-medium">Options</label>
                                                {options.map((opt, idx) => (
                                                    <div key={idx} className="mb-2 flex items-center gap-2">
                                                        <input
                                                            type="radio"
                                                            name="correct"
                                                            checked={correctIdx === idx}
                                                            onChange={() => setCorrectIdx(idx)}
                                                            className={qType === "MCQ" ? "block" : "hidden"}
                                                        />
                                                        <input
                                                            type="text"
                                                            value={opt}
                                                            onChange={(e) => handleOptionChange(idx, e.target.value)}
                                                            className="flex-1 rounded border p-2"
                                                            placeholder={`Option ${idx + 1}`}
                                                            required
                                                        />
                                                        {options.length > 2 && (
                                                            <button type="button" onClick={() => handleRemoveOption(idx)} className="text-red-500 hover:text-red-700">
                                                                <Trash2 size={16} />
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                                <button type="button" onClick={handleAddOption} className="text-sm text-indigo-600 hover:text-indigo-800">
                                                    + Add Option
                                                </button>
                                            </div>
                                        )}

                                        <button
                                            type="submit"
                                            disabled={addingQ}
                                            className="w-full rounded bg-indigo-600 py-2 text-white hover:bg-indigo-700 disabled:opacity-50"
                                        >
                                            {addingQ ? "Adding..." : "Add Question"}
                                        </button>
                                    </form>
                                </div>

                                <div className="rounded-xl bg-white p-6 shadow-sm text-black">
                                    <h2 className="mb-4 text-lg font-semibold">Questions ({questions.length})</h2>
                                    <div className="flex max-h-[600px] flex-col gap-3 overflow-y-auto">
                                        {questions.length === 0 && <p className="text-gray-400">No questions yet.</p>}
                                        {questions.map((q) => (
                                            <div key={q.id} className={`border-l-4 p-4 ${q.id === session.currentQuestionId ? "border-green-500 bg-green-50" : "border-gray-200 bg-gray-50"}`}>
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <span className="mb-1 inline-block rounded text-[10px] font-bold uppercase tracking-wider text-gray-500">{q.type}</span>
                                                        <p className="font-medium">{q.questionText}</p>
                                                    </div>
                                                    {q.id !== session.currentQuestionId && (
                                                        <button
                                                            onClick={() => handlePublish(q.id)}
                                                            className="flex items-center gap-1 rounded bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-700 hover:bg-indigo-200"
                                                        >
                                                            <Play size={12} /> Present
                                                        </button>
                                                    )}
                                                    {q.id === session.currentQuestionId && (
                                                        <span className="flex items-center gap-1 rounded bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                                                            Live
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-xl bg-white p-6 shadow-sm text-black">
                                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                                    <BarChart2 size={20} />
                                    Live Results (Active Question)
                                </h2>
                                {session.currentQuestionId && sessionId ? (
                                    <LiveResults sessionId={sessionId} questionId={session.currentQuestionId} />
                                ) : (
                                    <p className="text-gray-500">No active question.</p>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="rounded-xl bg-white p-6 shadow-sm text-black">
                            <h2 className="mb-6 flex items-center gap-2 text-xl font-bold">
                                <BarChart2 size={24} className="text-indigo-600" />
                                Overall Session Results
                            </h2>
                            <SessionResults sessionId={sessionId} questions={questions} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
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
            alert("Error deleting response");
        }
    };

    if (!question) return <div>Loading question...</div>;

    const total = responses.length;

    if (question.type === "OPEN_ENDED") {
        return (
            <div className="space-y-4">
                <p className="font-medium text-lg">{question.questionText}</p>
                <div className="grid gap-3">
                    {responses.length === 0 && <p className="text-gray-400">Waiting for responses...</p>}
                    {responses.map((r: any) => (
                        <div key={r.clientId} className="group relative rounded-xl border border-gray-100 bg-gray-50 p-4 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-2">
                                <span className="font-bold text-indigo-600">{r.userName || "Anonymous"}</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-gray-400">{new Date(r.createdAt).toLocaleTimeString()}</span>
                                    <button
                                        onClick={() => handleDeleteResponse(r.clientId)}
                                        className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-opacity"
                                        title="Delete response"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                            <p className="text-gray-800 whitespace-pre-wrap">{r.answer}</p>
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

            <div className="space-y-4">
                {question.options?.map((opt, idx) => {
                    const count = counts[idx] || 0;
                    const percent = total > 0 ? Math.round((count / total) * 100) : 0;
                    const isCorrect = question.type === "MCQ" && question.correctOptionIndex === idx;

                    return (
                        <div key={idx} className="relative">
                            <div className="mb-1 flex justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    <span className={isCorrect ? "font-bold text-green-600" : ""}>{opt}</span>
                                    {isCorrect && <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-bold uppercase">Correct</span>}
                                </div>
                                <span className="font-bold">{percent}% ({count})</span>
                            </div>
                            <div className="h-4 w-full overflow-hidden rounded-full bg-gray-100">
                                <div
                                    className={`h-full transition-all duration-500 ease-out ${isCorrect ? "bg-green-500" : "bg-indigo-500"}`}
                                    style={{ width: `${percent}%` }}
                                />
                            </div>

                            <div className="mt-2 flex flex-wrap gap-1.5">
                                {responses.filter(r => r.answer === idx).map(r => (
                                    <span key={r.clientId} className={`text-[10px] px-2 py-0.5 rounded-full border ${isCorrect ? "bg-green-50 border-green-200 text-green-700" : "bg-gray-50 border-gray-200 text-gray-600"}`}>
                                        {r.userName || "Anonymous"}
                                    </span>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-8 border-t pt-6">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4">Participant Breakdown</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {responses.map((r: any) => {
                        const isCorrect = question.type === "MCQ" && r.answer === question.correctOptionIndex;
                        const isWrong = question.type === "MCQ" && r.answer !== question.correctOptionIndex;

                        return (
                            <div key={r.clientId} className={`group flex items-center justify-between p-2 rounded-lg border text-sm hover:bg-white transition-colors h-10 ${isCorrect ? "bg-green-50 border-green-100" : isWrong ? "bg-red-50 border-red-100" : "bg-gray-50 border-gray-100"}`}>
                                <span className="font-medium truncate max-w-[120px]">{r.userName || "Anonymous"}</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-400 text-[10px]">Option {r.answer + 1}</span>
                                    {question.type === "MCQ" && (
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${isCorrect ? "text-green-600" : "text-red-600"}`}>
                                            {isCorrect ? "✓" : "✗"}
                                        </span>
                                    )}
                                    <button
                                        onClick={() => handleDeleteResponse(r.clientId)}
                                        className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity"
                                        title="Delete response"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <p className="mt-4 text-xs text-gray-400">Total responses: {total}</p>
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
            alert("Error deleting response");
        }
    };

    // Group responses by user
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

    if (questions.length === 0) return <div className="text-gray-500">No questions in this session yet.</div>;
    if (Object.keys(userStats).length === 0) return <div className="text-gray-500">No responses recorded yet.</div>;

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
                <thead className="border-b bg-gray-50 text-gray-500">
                    <tr>
                        <th className="p-4 font-bold">Participant</th>
                        <th className="p-4 font-bold text-center">Score</th>
                        {questions.map((q, i) => (
                            <th key={q.id} className="p-4 font-bold text-center border-l bg-indigo-50/30" title={q.questionText}>
                                Q{i + 1}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {sortedUsers.map(([clientId, stats]) => (
                        <tr key={clientId} className="hover:bg-gray-50">
                            <td className="p-4 font-medium text-gray-900">{stats.userName}</td>
                            <td className="p-4 text-center">
                                <span className="rounded-full bg-indigo-100 px-3 py-1 font-bold text-indigo-700">
                                    {stats.correct}/{questions.filter(q => q.type === "MCQ").length}
                                </span>
                            </td>
                            {questions.map(q => {
                                const ans = stats.answers[q.id];
                                const isCorrect = q.type === "MCQ" && ans === q.correctOptionIndex;
                                const isWrong = q.type === "MCQ" && ans !== undefined && ans !== q.correctOptionIndex;

                                return (
                                    <td key={q.id} className="group p-4 text-center border-l whitespace-nowrap relative">
                                        <div className="flex items-center justify-center gap-1">
                                            {ans === undefined ? (
                                                <span className="text-gray-300">-</span>
                                            ) : q.type === "OPEN_ENDED" ? (
                                                <div className="max-w-[120px] truncate text-[10px]" title={ans as string}>{ans as string}</div>
                                            ) : (
                                                <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${isCorrect ? "bg-green-100 text-green-700" : isWrong ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-500"}`}>
                                                    {isCorrect ? "✓" : isWrong ? "✗" : ans + 1}
                                                </span>
                                            )}

                                            {ans !== undefined && (
                                                <button
                                                    onClick={() => handleDeleteResponse(q.id, clientId)}
                                                    className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity ml-1"
                                                    title="Delete this response"
                                                >
                                                    <Trash2 size={10} />
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
