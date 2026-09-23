"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { CSSProperties } from "react";

type Concept = { name: string; score: number | null; level: string; tested: boolean; evidence_quote: string; explanation: string; next_step: string; misconception_status: string };
type Report = { overall_mastery: number; concepts: Concept[]; strong: string[]; weak: string[]; misconception: string; recommendation: string; rubric_note: string };
type HistoryItem = { question: string; answer: string; evaluation?: { target_concept: string; answer_quality: number; understanding_level: string; explanation: string; evidence_quote: string; detected_issue: string; misconception_status: string } };

const statusLabels: Record<string, string> = { persists: "Persists", corrected: "Corrected after clarification", needs_check: "Needs another check", none: "No issue detected" };

export default function ReportClient() {
  const router = useRouter();
  const [report, setReport] = useState<Report | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const rawReport = sessionStorage.getItem("prooflearn-report");
    const rawSession = sessionStorage.getItem("prooflearn");
    if (!rawReport) { router.replace("/setup"); return; }
    try { setReport(JSON.parse(rawReport)); if (rawSession) setHistory(JSON.parse(rawSession).history || []); } catch { router.replace("/setup"); } finally { setReady(true); }
  }, [router]);

  function newVerification() { sessionStorage.removeItem("prooflearn"); sessionStorage.removeItem("prooflearn-report"); router.push("/setup"); }
  if (!ready || !report) return <div className="loading-block">Preparing your report…</div>;

  return <div className="report-wrap">
    <div className="report-actions"><button className="text-button" onClick={newVerification}>New verification</button></div>
    <p className="eyebrow">Verification complete</p>
    <h1>Verification<br /><em>Complete.</em></h1>
    <p className="report-intro">ProofLearn found evidence of approximately <strong>{report.overall_mastery}% mastery</strong> across the concepts tested during this verification.</p>
    <p className="rubric-note">{report.rubric_note || "Preliminary evidence from this defence. Final judgement remains with the teacher."}</p>
    <section className="score-panel"><div className="score-ring" style={{ "--score": `${report.overall_mastery * 3.6}deg` } as CSSProperties}><strong>{report.overall_mastery}<small>%</small></strong></div><div><p className="eyebrow">Overall understanding</p><p className="score-note">A preliminary score based only on concepts checked during this defence.</p></div></section>
    <section className="concept-section"><div className="section-heading"><p className="eyebrow">Concept mastery</p><span>{report.concepts.length} concepts in the rubric</span></div><div className="concept-list">{report.concepts.map(concept => <div className={`concept-row ${!concept.tested ? "untested" : ""}`} key={concept.name}><div className="concept-title"><strong>{concept.name}</strong><span className={`level ${concept.level.toLowerCase().replace(" ", "-")}`}>{concept.level}</span></div><div className="bar">{concept.score !== null && <i style={{ width: `${concept.score}%` }} />}</div><b>{concept.score === null ? "n/a" : `${concept.score}%`}</b><div className="concept-detail"><p><strong>Evidence</strong> {concept.evidence_quote ? <q>{concept.evidence_quote}</q> : "No direct evidence recorded."}</p><p><strong>Why</strong> {concept.explanation}</p><p><strong>Next</strong> {concept.next_step}</p>{concept.misconception_status !== "none" && <span className={`issue-status ${concept.misconception_status}`}>{statusLabels[concept.misconception_status] || concept.misconception_status}</span>}</div></div>)}</div></section>
    <div className="report-grid"><section><p className="eyebrow">Strong understanding</p><p>{report.strong.join(" · ") || "No concepts reached strong evidence yet."}</p></section><section><p className="eyebrow">Needs improvement</p><p>{report.weak.join(" · ") || "No immediate gaps identified."}</p></section></div>
    <section className="callout"><p className="eyebrow">Detected misconception</p><p>{report.misconception || "No clear misconception was identified during this defence."}</p></section>
    <section className="recommendation"><p className="eyebrow">Recommended next step</p><p>{report.recommendation}</p></section>
    <details className="answers-details"><summary>View answers <span>+</span></summary><div className="answer-list">{history.map((item, index) => <article key={`${item.question}-${index}`}><span>Question {index + 1}</span><h3>{item.question}</h3><p>{item.answer}</p>{item.evaluation && <small>{item.evaluation.understanding_level.replaceAll("_", " ")} · {item.evaluation.explanation}</small>}</article>)}</div></details>
  </div>;
}
