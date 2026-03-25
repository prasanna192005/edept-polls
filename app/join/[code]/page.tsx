"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ref, onValue, off } from "firebase/database";
import { db } from "@/lib/firebase";
import { generateId } from "@/lib/utils";
import { Loader2, CheckCircle, Send, ArrowLeft, Zap } from "lucide-react";
import { toast } from "sonner";

interface Session {
  id: string;
  title: string;
  currentQuestionId?: string | null;
  isActive: boolean;
}

interface Question {
  id: string;
  type: "MCQ" | "POLL" | "OPEN_ENDED";
  questionText: string;
  options?: string[];
}

export default function ParticipantView() {
  const { code } = useParams();
  const sessionCode = Array.isArray(code) ? code[0] : code;
  const router = useRouter();

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [session, setSession] = useState<Session & { requireName?: boolean } | null>(null);
  const [question, setQuestion] = useState<Question | null>(null);
  const [clientId, setClientId] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [tempName, setTempName] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Clean Form State
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [textAnswer, setTextAnswer] = useState("");

  // Initialize Client ID and User Name
  useEffect(() => {
    let id = localStorage.getItem("poll_client_id");
    if (!id) {
      id = generateId();
      localStorage.setItem("poll_client_id", id);
    }
    setClientId(id);

    const storedName = localStorage.getItem("poll_user_name");
    if (storedName) {
      setUserName(storedName);
    }
  }, []);

  // Resolve Session Code to ID
  useEffect(() => {
    if (!sessionCode) return;

    const fetchSessionId = async () => {
      try {
        const res = await fetch("/api/session/join", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: sessionCode }),
        });
        if (!res.ok) {
          router.push("/");
          return;
        }
        const data = await res.json();
        setSessionId(data.sessionId);
      } catch (err) {
        router.push("/");
      }
    };
    fetchSessionId();
  }, [sessionCode, router]);

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempName.trim()) {
      localStorage.setItem("poll_user_name", tempName.trim());
      setUserName(tempName.trim());
    }
  };

  // Listen to Session Data
  useEffect(() => {
    if (!sessionId) return;
    const sessionRef = ref(db, `sessions/${sessionId}`);
    const handleSession = (snapshot: any) => {
      const data = snapshot.val();
      if (data) {
        setSession(data);
        if (!data.isActive) {
          toast.info("Session has ended.");
          router.push("/");
        }
      } else {
        router.push("/");
      }
      setLoading(false);
    };
    onValue(sessionRef, handleSession);
    return () => off(sessionRef, 'value', handleSession);
  }, [sessionId, router]);

  // Listen to Current Question
  useEffect(() => {
    if (!sessionId || !session?.currentQuestionId) {
      setQuestion(null);
      setSubmitted(false); // Reset submitted state if no question
      return;
    }

    const qRef = ref(db, `questions/${sessionId}/${session.currentQuestionId}`);
    const handleQuestion = (snapshot: any) => {
      const data = snapshot.val();
      setQuestion(data);

      // Check if already answered this specific question
      const alreadyAnswered = localStorage.getItem(`answered_${data.id}`);
      if (alreadyAnswered) {
        setSubmitted(true);
      } else {
        setSubmitted(false);
        setSelectedOption(null);
        setTextAnswer("");
      }
    };
    onValue(qRef, handleQuestion);
    return () => off(qRef, 'value', handleQuestion);

  }, [sessionId, session?.currentQuestionId]);

  const handleSubmit = async () => {
    if (!sessionId || !question || !clientId) return;

    // Validate
    if (question.type !== "OPEN_ENDED" && selectedOption === null) return;
    if (question.type === "OPEN_ENDED" && !textAnswer.trim()) return;

    setSubmitting(true);
    try {
      const answer = question.type === "OPEN_ENDED" ? textAnswer : selectedOption;

      const res = await fetch("/api/response/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          questionId: question.id,
          clientId,
          answer,
          userName: userName || null
        })
      });

      if (!res.ok) {
        // ... handled by catch
      } else {
        setSubmitted(true);
        localStorage.setItem(`answered_${question.id}`, "true");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error submitting response");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-white text-indigo-600">
      <Loader2 className="animate-spin" size={40} strokeWidth={2.5} />
    </div>
  );

  // If name is required and not yet provided, show name entry screen
  if (session?.requireName && !userName) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50 items-center justify-center p-6">
        <div className="w-full max-w-md rounded-[2.5rem] bg-white p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-100 border border-slate-100 text-slate-900">
          <div className="mb-8 overflow-hidden rounded-2xl bg-indigo-50 border border-indigo-100/50 p-4 inline-flex">
            <Zap className="text-indigo-600" size={24} fill="currentColor" />
          </div>
          <h2 className="mb-2 text-3xl font-black tracking-tight text-slate-900">Welcome!</h2>
          <p className="mb-8 text-slate-500 font-medium leading-relaxed">
            Please enter your name to join <strong className="text-slate-900 font-bold">{session?.title}</strong>
          </p>
          <form onSubmit={handleNameSubmit} className="space-y-4">
            <input
              type="text"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              placeholder="Your Name"
              className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 px-6 py-4 text-lg font-bold placeholder-slate-300 outline-none transition-all focus:border-indigo-600 focus:bg-white focus:ring-8 focus:ring-indigo-100/30"
              required
              autoFocus
            />
            <button
              type="submit"
              className="w-full rounded-2xl bg-slate-900 py-4 text-lg font-bold text-white shadow-lg transition-all hover:bg-slate-800 active:scale-[0.98]"
            >
              Join Session
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <header className="fixed top-0 w-full bg-white border-b border-slate-100 z-50">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
          <button 
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft size={18} />
            <span className="text-sm font-bold tracking-tight sr-only sm:not-sr-only">Exit</span>
          </button>
          <h1 className="text-sm font-black tracking-widest uppercase text-slate-400 truncate max-w-[50%]">
            {session?.title}
          </h1>
          <div className="flex items-center gap-2">
            {userName && (
              <div className="flex items-center gap-2 px-3 py-1 bg-indigo-50 rounded-full border border-indigo-100/50">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
                <span className="text-[10px] sm:text-xs font-black text-indigo-600 uppercase tracking-wider">{userName}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center p-6 pt-24">
        {!question ? (
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-slate-50 border border-slate-100">
              <Loader2 size={40} className="animate-spin text-slate-300" strokeWidth={2.5} />
            </div>
            <h2 className="text-2xl font-black tracking-tight text-slate-900 mb-2">Waiting for next question...</h2>
            <p className="text-slate-500 font-medium tracking-tight">Stay tuned for updates from the host.</p>
          </div>
        ) : submitted ? (
          <div className="animate-in fade-in zoom-in duration-500 text-center max-w-sm">
            <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-[2.5rem] bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm shadow-emerald-100/50 ring-8 ring-emerald-50/50">
              <CheckCircle size={48} strokeWidth={2.5} />
            </div>
            <h2 className="text-3xl font-black tracking-tight text-slate-900 mb-3">Response Sent!</h2>
            <p className="text-slate-500 font-medium">Your answer has been registered. You can relax now!</p>
          </div>
        ) : (
          <div className="w-full max-w-xl bg-white rounded-[2.5rem] border border-slate-200 p-1 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-100">
            <div className="p-8 sm:p-10">
              <div className="mb-4 inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-[10px] font-black tracking-wider uppercase text-indigo-600 border border-indigo-100/50">
                {question.type === "OPEN_ENDED" ? "Open Response" : question.type}
              </div>
              <h2 className="mb-10 text-3xl font-black tracking-tight text-slate-900 leading-[1.15]">
                {question.questionText}
              </h2>

              {question.type === "OPEN_ENDED" ? (
                <textarea
                  value={textAnswer}
                  onChange={(e) => setTextAnswer(e.target.value)}
                  placeholder="Share your thoughts..."
                  className="mb-8 min-h-[180px] w-full rounded-2xl border-2 border-slate-100 bg-slate-50 p-6 text-lg font-bold text-slate-900 placeholder-slate-200 outline-none transition-all focus:border-indigo-600 focus:bg-white focus:ring-8 focus:ring-indigo-100/30"
                />
              ) : (
                <div className="mb-10 space-y-3.5">
                  {question.options?.map((opt, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedOption(idx)}
                      className={`group w-full rounded-2xl border-2 px-6 py-5 text-left transition-all relative overflow-hidden ${selectedOption === idx
                        ? "border-indigo-600 bg-indigo-50/50 text-indigo-900 shadow-sm shadow-indigo-100/50 ring-4 ring-indigo-50/50"
                        : "border-slate-100 bg-slate-50 text-slate-600 hover:border-slate-200 hover:hover:bg-slate-100/50 active:scale-[0.99]"
                        }`}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <span className={`text-lg font-black tracking-tight ${selectedOption === idx ? "text-indigo-900" : "text-slate-600"}`}>
                          {opt}
                        </span>
                        {selectedOption === idx && (
                          <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-sm shadow-indigo-200">
                            <CheckCircle size={14} strokeWidth={3} />
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={submitting || (question.type === "OPEN_ENDED" ? !textAnswer.trim() : selectedOption === null)}
                className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-2xl bg-slate-900 px-6 py-5 text-lg font-extrabold text-white transition-all hover:bg-slate-800 active:scale-[0.98] disabled:opacity-30"
              >
                {submitting ? (
                  <Loader2 className="animate-spin" strokeWidth={3} />
                ) : (
                  <>
                    <span>Submit</span>
                    <Send size={18} className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-0.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
