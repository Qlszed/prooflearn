"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SetupForm() {
  const router = useRouter(); const [subject, setSubject] = useState(""); const [assignment, setAssignment] = useState(""); const [submission, setSubmission] = useState(""); const [loading, setLoading] = useState(false); const [error, setError] = useState("");
  async function submit(event: React.FormEvent) { event.preventDefault(); setLoading(true); setError(""); try { const response = await fetch("/api/structure", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subject, assignment, submission }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error); sessionStorage.setItem("prooflearn", JSON.stringify({ subject, assignment, submission, ...data, history: [], updates: [], questionNumber: 1 })); router.push("/verify"); } catch (e) { setError(e instanceof Error ? e.message : "Something went wrong"); setLoading(false); } }
  return <form className="setup-form" onSubmit={submit}><label>Subject<input required value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. Biology" /></label><label>Assignment<textarea required value={assignment} onChange={e => setAssignment(e.target.value)} placeholder="The question or prompt given to the student…" rows={4} /></label><label>Student submission<textarea required value={submission} onChange={e => setSubmission(e.target.value)} placeholder="Paste the student's answer here…" rows={7} /></label>{error && <p className="error">{error}</p>}<button className="button primary" disabled={loading}>{loading ? <><span className="dot" /> Analysing submission…</> : <>Generate Verification <span>→</span></>}</button></form>;
}
