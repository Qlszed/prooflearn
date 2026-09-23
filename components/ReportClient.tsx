"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { CSSProperties } from "react";
import { t, useLanguage } from "@/lib/i18n";

type Concept = { name: string; score: number | null; level: string; tested: boolean; evidence_quote: string; explanation: string; next_step: string; misconception_status: string };
type Report = { overall_mastery: number; concepts: Concept[]; strong: string[]; weak: string[]; misconception: string; recommendation: string; rubric_note: string };
type HistoryItem = { question: string; answer: string; evaluation?: { target_concept: string; answer_quality: number; understanding_level: string; explanation: string; evidence_quote: string; detected_issue: string; misconception_status: string } };

export default function ReportClient() {
  const router = useRouter();
  const language = useLanguage();
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
  if (!ready || !report) return <div className="loading-block">{t(language, "loadingReport")}</div>;
  const concepts = Array.isArray(report.concepts) ? report.concepts : [];
  const strong = Array.isArray(report.strong) ? report.strong : [];
  const weak = Array.isArray(report.weak) ? report.weak : [];
  const statusLabel = (status: string) => status === "persists" ? t(language, "persists") : status === "corrected" ? t(language, "corrected") : status === "needs_check" ? t(language, "needsCheck") : t(language, "noIssue");

  return <div className="report-wrap">
    <div className="report-actions"><button className="text-button" onClick={newVerification}>{t(language, "newVerification")}</button></div>
    <p className="eyebrow">{t(language, "complete")}</p>
    <h1>{t(language, "completeTitle").split("|")[0]}<br /><em>{t(language, "completeTitle").split("|")[1]}</em></h1>
    <p className="report-intro">{t(language, "reportFraming").replace("{score}", String(report.overall_mastery))}</p>
    <p className="rubric-note">{report.rubric_note || t(language, "rubricNote")}</p>
    <section className="score-panel"><div className="score-ring" style={{ "--score": `${report.overall_mastery * 3.6}deg` } as CSSProperties}><strong>{report.overall_mastery}<small>%</small></strong></div><div><p className="eyebrow">{t(language, "overall")}</p><p className="score-note">{t(language, "preliminary")}</p></div></section>
    <section className="concept-section"><div className="section-heading"><p className="eyebrow">{t(language, "conceptMastery")}</p><span>{concepts.length} {t(language, "conceptsRubric")}</span></div><div className="concept-list">{concepts.map(concept => <div className={`concept-row ${!concept.tested ? "untested" : ""}`} key={concept.name}><div className="concept-title"><strong>{concept.name}</strong><span className={`level ${concept.level.toLowerCase().replace(" ", "-")}`}>{concept.tested ? concept.level : t(language, "insufficient")}</span></div><div className="bar">{concept.score !== null && <i style={{ width: `${concept.score}%` }} />}</div><b>{concept.score === null ? "n/a" : `${concept.score}%`}</b><div className="concept-detail"><p><strong>{t(language, "evidence")}</strong> {concept.evidence_quote ? <q>{concept.evidence_quote}</q> : t(language, "noEvidence")}</p><p><strong>{t(language, "why")}</strong> {concept.explanation}</p><p><strong>{t(language, "next")}</strong> {concept.next_step}</p>{concept.misconception_status !== "none" && <span className={`issue-status ${concept.misconception_status}`}>{statusLabel(concept.misconception_status)}</span>}</div></div>)}</div></section>
    <div className="report-grid"><section><p className="eyebrow">{t(language, "strong")}</p><p>{strong.join(" · ") || t(language, "noStrong")}</p></section><section><p className="eyebrow">{t(language, "improvement")}</p><p>{weak.join(" · ") || t(language, "noWeak")}</p></section></div>
    <section className="callout"><p className="eyebrow">{t(language, "misconception")}</p><p>{report.misconception || t(language, "noMisconception")}</p></section>
    <section className="recommendation"><p className="eyebrow">{t(language, "nextStep")}</p><p>{report.recommendation}</p></section>
    <details className="answers-details"><summary>{t(language, "viewAnswers")} <span>+</span></summary><div className="answer-list">{history.map((item, index) => <article key={`${item.question}-${index}`}><span>{t(language, "answerLabel")} {index + 1}</span><h3>{item.question}</h3><p>{item.answer}</p>{item.evaluation && <small>{item.evaluation.understanding_level.replaceAll("_", " ")} · {item.evaluation.explanation}</small>}</article>)}</div></details>
  </div>;
}
