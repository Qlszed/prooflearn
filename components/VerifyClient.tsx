"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { t, useLanguage, type Language } from "@/lib/i18n";

type Evaluation = {
  target_concept: string;
  answer_quality: number;
  understanding_level: "not_demonstrated" | "partial" | "independent" | "applied";
  mastery_updates: Record<string, number>;
  evidence_quote: string;
  explanation: string;
  detected_issue: string;
  misconception_status: string;
  next_difficulty: string;
  next_question: string;
};

type HistoryItem = { question: string; answer: string; evaluation?: Evaluation };
type Session = {
  subject: string;
  language?: Language;
  assignment: string;
  submission: string;
  conceptMap: unknown;
  firstQuestion: string;
  currentQuestion: string;
  history: HistoryItem[];
  evaluations: Evaluation[];
  questionNumber: number;
  draftAnswer?: string;
};

const storageKey = "prooflearn";

export default function VerifyClient() {
  const router = useRouter();
  const language = useLanguage();
  const [data, setData] = useState<Session | null>(null);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const raw = sessionStorage.getItem(storageKey);
    if (!raw) {
      router.replace("/setup");
      return;
    }
    try {
      const parsed = JSON.parse(raw) as Partial<Session>;
      const restored = { ...parsed, currentQuestion: parsed.currentQuestion || parsed.firstQuestion, evaluations: parsed.evaluations || [] } as Session;
      setData(restored);
      setAnswer(restored.draftAnswer || "");
    } catch {
      sessionStorage.removeItem(storageKey);
      router.replace("/setup");
    } finally {
      setReady(true);
    }
  }, [router]);

  function saveSession(next: Session) {
    sessionStorage.setItem(storageKey, JSON.stringify(next));
    setData(next);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!answer.trim() || !data || loading) return;
    setLoading(true);
    setError("");
    const currentQuestion = data.currentQuestion || data.firstQuestion;
    try {
      const response = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: data.subject,
          assignment: data.assignment,
          submission: data.submission,
          conceptMap: data.conceptMap,
          history: data.history,
          latestAnswer: answer,
          currentQuestion,
          language,
        }),
      });
      const evaluation = await response.json() as Evaluation & { error?: string };
      if (!response.ok) throw new Error(evaluation.error || "Unable to evaluate answer");

      const history = [...data.history, { question: currentQuestion, answer, evaluation }];
      const evaluations = [...data.evaluations, evaluation];
      const next = {
        ...data,
        history,
        evaluations,
        questionNumber: data.questionNumber + 1,
        currentQuestion: evaluation.next_question,
        language,
        draftAnswer: "",
      };

      if (data.questionNumber >= 4) {
        const reportResponse = await fetch("/api/report", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ language, conceptMap: next.conceptMap, history, evaluations }),
        });
        const report = await reportResponse.json() as { error?: string };
        if (!reportResponse.ok) throw new Error(report.error || "Unable to create report");
        sessionStorage.setItem(storageKey, JSON.stringify(next));
        sessionStorage.setItem("prooflearn-report", JSON.stringify(report));
        router.push("/report");
        return;
      }

      saveSession(next);
      setAnswer("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (!ready || !data) return <div className="loading-block">{t(language, "restoring")}</div>;

  return <div className="verify-wrap">
    <div className="verify-meta">
      <p className="eyebrow">{t(language, "shortDefence")} / {data.subject}</p>
      <span>{t(language, "question")} {data.questionNumber} {t(language, "questionOf")}</span>
    </div>
    <div className="progress"><div style={{ width: `${Math.min(data.questionNumber / 4 * 100, 100)}%` }} /></div>
    <section className="question-area">
      <p className="question-label">{t(language, "yourQuestion")}</p>
      <h1>{data.currentQuestion || data.firstQuestion}</h1>
      <form onSubmit={submit}>
        <label>{t(language, "yourAnswer")}<textarea autoFocus required value={answer} onChange={event => { const value = event.target.value; setAnswer(value); if (data) sessionStorage.setItem(storageKey, JSON.stringify({ ...data, draftAnswer: value })); }} placeholder={t(language, "answerPlaceholder")} rows={7} /></label>
        {error && <p className="error">{error}</p>}
        <button className="button primary" disabled={loading}>{loading ? <><span className="dot" /> {t(language, "evaluating")}</> : <>{t(language, "submitAnswer")} <span>→</span></>}</button>
      </form>
    </section>
  </div>;
}
