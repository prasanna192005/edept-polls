"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ref, onValue, off } from "firebase/database";
import { db } from "@/lib/firebase";
import { generateId } from "@/lib/utils";
import { Loader2, CheckCircle, Send } from "lucide-react";

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
  const [session, setSession] = useState<Session | null>(null);
  const [question, setQuestion] = useState<Question | null>(null);
  const [clientId, setClientId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Clean Form State
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [textAnswer, setTextAnswer] = useState("");

  // Initialize Client ID
  useEffect(() => {
    let id = localStorage.getItem("poll_client_id");
    if (!id) {
      id = generateId();
      localStorage.setItem("poll_client_id", id);
    }
    setClientId(id);
  }, []);

  // Resolve Session Code to ID
  useEffect(() => {
    if (!sessionCode) return;
    // We need to fetch the session ID from the code first.
    // Since we don't have a specific API for just getting ID without joining (though join does it),
    // we can reuse the join endpoint or just assume the join page passed it. 
    // BUT, the URL is /join/[code], so we might not have the ID yet if they came directly.
    // So let's use the join API to "re-join" or validale and get ID.

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

  // Listen to Session Data
  useEffect(() => {
    if (!sessionId) return;
    const sessionRef = ref(db, `sessions/${sessionId}`);
    const handleSession = (snapshot: any) => {
      const data = snapshot.val();
      if (data) {
        setSession(data);
        if (!data.isActive) {
          alert("Session has ended.");
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
          answer
        })
      });

      if (!res.ok) {
        const err = await res.json();
        if (err.error === "Already responded") {
          setSubmitted(true);
          localStorage.setItem(`answered_${question.id}`, "true");
        } else {
          alert("Failed to submit: " + err.error);
        }
      } else {
        setSubmitted(true);
        localStorage.setItem(`answered_${question.id}`, "true");
      }
    } catch (err) {
      console.error(err);
      alert("Error submitting response");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 text-indigo-600">
      <Loader2 className="animate-spin" size={48} />
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <header className="bg-white p-4 text-center shadow-sm">
        <h1 className="text-lg font-bold text-gray-800">{session?.title}</h1>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center p-4">
        {!question ? (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
              <Loader2 size={40} className="animate-spin" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Waiting for next question...</h2>
            <p className="text-gray-500">Stay tuned!</p>
          </div>
        ) : submitted ? (
          <div className="animate-in fade-in zoom-in duration-300 text-center">
            <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-green-100 text-green-600">
              <CheckCircle size={48} />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Answer Submitted!</h2>
            <p className="text-gray-500">Wait for the next question.</p>
          </div>
        ) : (
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl transition-all">
            <span className="mb-2 inline-block rounded bg-indigo-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-indigo-700">
              {question.type === "OPEN_ENDED" ? "Open Ended" : question.type}
            </span>
            <h2 className="mb-6 text-2xl font-bold text-gray-900">{question.questionText}</h2>

            {question.type === "OPEN_ENDED" ? (
              <textarea
                value={textAnswer}
                onChange={(e) => setTextAnswer(e.target.value)}
                placeholder="Type your answer here..."
                className="mb-4 min-h-[150px] w-full rounded-lg border-gray-300 bg-gray-50 p-4 text-lg focus:border-indigo-500 focus:ring-indigo-500"
              />
            ) : (
              <div className="mb-6 space-y-3">
                {question.options?.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedOption(idx)}
                    className={`w-full rounded-xl border-2 p-4 text-left transition-all ${selectedOption === idx
                      ? "border-indigo-600 bg-indigo-50 text-indigo-700 shadow-md"
                      : "border-gray-200 bg-white hover:border-indigo-300 hover:bg-gray-50"
                      }`}
                  >
                    <span className="font-medium">{opt}</span>
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={submitting || (question.type === "OPEN_ENDED" ? !textAnswer.trim() : selectedOption === null)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-4 text-lg font-bold text-white shadow-lg transition-transform hover:bg-indigo-700 active:scale-95 disabled:opacity-50"
            >
              {submitting ? <Loader2 className="animate-spin" /> : <>Submit Answer <Send size={20} /></>}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
