"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
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

export default function SessionManage() {
    const { id } = useParams();
    const sessionId = Array.isArray(id) ? id[0] : (id || "");
    const { user, loading: authLoading } = useAuth();
    const { session, loading: sessionLoading } = useSession(sessionId);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [activeTab, setActiveTab] = useState<"questions" | "results">("questions");

    // New Question Form State
    const [qType, setQType] = useState<QuestionType>("MCQ");
    const [qText, setQText] = useState("");
    const [options, setOptions] = useState<string[]>(["", ""]);
    const [correctIdx, setCorrectIdx] = useState(0);
    const [addingQ, setAddingQ] = useState(false);

    const router = useRouter();

    useEffect(() => {
        if (!authLoading && !user) router.push("/admin/login");
    }, [authLoading, user, router]);

    useEffect(() => {
        if (!sessionId) return;
        console.log("Setting up questions listener for session:", sessionId);
        const qRef = ref(db, `questions/${sessionId}`);
        const handleValue = (snapshot: any) => {
            console.log("Questions snapshot received:", snapshot.val());
            const data = snapshot.val();
            if (data) {
                const questionsList = Object.values(data) as Question[];
                console.log("Questions list:", questionsList);
                setQuestions(questionsList);
            } else {
                console.log("No questions data");
                setQuestions([]);
            }
        };
        const handleError = (error: any) => {
            console.error("Firebase listener error:", error);
            alert(`Firebase Error: ${error.message}. Check if you've published the database rules!`);
        };
        onValue(qRef, handleValue, handleError);
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

            if (!res.ok) {
                const error = await res.json();
                console.error("API Error:", error);
                alert(`Failed to create question: ${error.error || 'Unknown error'}`);
                return;
            }

            const data = await res.json();
            console.log("Question created:", data);

            // Reset form
            setQText("");
            setOptions(["", ""]);
            setCorrectIdx(0);
        } catch (err) {
            console.error("Error creating question:", err);
            alert("Failed to create question. Check console for details.");
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

                <div className="mb-8 grid gap-6 md:grid-cols-2">
                    {/* Create Question Panel */}
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
                                                title="Mark as correct answer"
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

                    {/* Question List */}
                    <div className="rounded-xl bg-white p-6 shadow-sm text-black">
                        <h2 className="mb-4 text-lg font-semibold">Questions ({questions.length})</h2>
                        <div className="flex max-h-[600px] flex-col gap-3 overflow-y-auto">
                            {questions.length === 0 && <p className="text-gray-400">No questions yet.</p>}
                            {questions.map((q, idx) => (
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
                                    {(q.type === "MCQ" || q.type === "POLL") && (
                                        <div className="mt-2 text-xs text-gray-500">
                                            {q.options?.length} options
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Live Results Section Placeholder - To be implemented next step if needed, or inline here */}
                <div className="rounded-xl bg-white p-6 shadow-sm">
                    <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                        <BarChart2 size={20} />
                        Live Results
                    </h2>
                    {session.currentQuestionId && sessionId ? (
                        <LiveResults sessionId={sessionId} questionId={session.currentQuestionId} />
                    ) : (
                        <p className="text-gray-500">No active question.</p>
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

    useEffect(() => {
        const qRef = ref(db, `questions/${sessionId}/${questionId}`);
        onValue(qRef, (snap) => setQuestion(snap.val()));

        const rRef = ref(db, `results/${sessionId}/${questionId}`);
        onValue(rRef, (snap) => setResults(snap.val()));

        return () => { off(qRef); off(rRef); };
    }, [sessionId, questionId]);

    // Also listen for Open ended responses
    const [responses, setResponses] = useState<any[]>([]);
    useEffect(() => {
        if (question?.type !== "OPEN_ENDED") return;
        const respRef = ref(db, `openEnded/${sessionId}/${questionId}`);
        onValue(respRef, (snap) => {
            const data = snap.val();
            if (data) setResponses(Object.values(data).sort((a: any, b: any) => b.createdAt - a.createdAt));
            else setResponses([]);
        });
        return () => off(respRef);
    }, [sessionId, questionId, question?.type]);

    if (!question) return <div>Loading question...</div>;

    if (question.type === "OPEN_ENDED") {
        return (
            <div className="space-y-2">
                <p className="font-medium">{question.questionText}</p>
                <div className="max-h-60 overflow-y-auto rounded bg-gray-50 p-4">
                    {responses.length === 0 && <p className="text-gray-400">Waiting for responses...</p>}
                    {responses.map((r: any) => (
                        <div key={r.createdAt} className="mb-2 rounded border-b border-gray-100 bg-white p-3 shadow-sm last:border-0 hover:bg-gray-50">
                            {r.text}
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    const total = results?.totalResponses || 0;
    const counts = results?.counts || {};

    return (
        <div>
            <p className="mb-4 text-lg font-medium">{question.questionText}</p>
            <div className="space-y-3">
                {question.options?.map((opt, idx) => {
                    const count = counts[idx] || 0;
                    const percent = total > 0 ? Math.round((count / total) * 100) : 0;
                    return (
                        <div key={idx} className="relative">
                            <div className="mb-1 flex justify-between text-sm">
                                <span>{opt}</span>
                                <span className="font-bold">{percent}% ({count})</span>
                            </div>
                            <div className="h-4 w-full overflow-hidden rounded-full bg-gray-200">
                                <div
                                    className="h-full bg-indigo-500 transition-all duration-500 ease-out"
                                    style={{ width: `${percent}%` }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
            <p className="mt-4 text-sm text-gray-500">Total votes: {total}</p>
        </div>
    );
}

export const dynamic = 'force-dynamic'
