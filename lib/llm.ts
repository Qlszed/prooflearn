type ChatMessage = { role: "system" | "user"; content: string };

const endpoint = process.env.LLM_BASE_URL || "https://api.openai.com/v1/chat/completions";
const model = process.env.LLM_MODEL || "gpt-4o-mini";

async function ask<T>(messages: ChatMessage[]): Promise<T> {
  if (!process.env.LLM_API_KEY) throw new Error("LLM_API_KEY is not configured");
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.LLM_API_KEY}` },
    body: JSON.stringify({ model, messages, temperature: 0.2, response_format: { type: "json_object" } }),
  });
  if (!response.ok) throw new Error(`LLM request failed (${response.status})`);
  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("LLM returned an empty response");
  return JSON.parse(content) as T;
}

export type ConceptMap = {
  concepts: { name: string; importance: string }[];
  claims: string[];
  expected_reasoning: string[];
  possible_misconceptions: string[];
  opening_question: string;
};

export type MisconceptionStatus = "persists" | "corrected" | "needs_check" | "none";

export type Evaluation = {
  target_concept: string;
  answer_quality: number;
  understanding_level: "not_demonstrated" | "partial" | "independent" | "applied";
  mastery_updates: Record<string, number>;
  evidence_quote: string;
  explanation: string;
  detected_issue: string;
  misconception_status: MisconceptionStatus;
  next_difficulty: string;
  next_question: string;
};

export type HistoryItem = { question: string; answer: string; evaluation?: Evaluation };

export type ReportConcept = {
  name: string;
  score: number | null;
  level: "Strong" | "Partial" | "Weak" | "Insufficient data";
  tested: boolean;
  evidence_quote: string;
  explanation: string;
  next_step: string;
  misconception_status: MisconceptionStatus;
};

export type Report = {
  overall_mastery: number;
  concepts: ReportConcept[];
  strong: string[];
  weak: string[];
  misconception: string;
  recommendation: string;
  rubric_note: string;
};

export async function structureSubmission(subject: string, assignment: string, submission: string) {
  return ask<ConceptMap>([
    { role: "system", content: "You are an assessment designer. Return strict JSON only. Given a subject, assignment prompt, and student's submitted answer, extract key concepts with importance (high, medium, low), the student's specific claims, expected reasoning, plausible misconceptions, and one opening_question. The opening question must reference a specific claim or phrase from the student's answer and use the language of the assignment. Use the exact keys concepts, claims, expected_reasoning, possible_misconceptions, opening_question. Never ask a generic question such as 'what is this concept?'" },
    { role: "user", content: JSON.stringify({ subject, assignment, submission }) },
  ]);
}

export async function evaluateAnswer(input: { subject: string; assignment: string; submission: string; conceptMap: ConceptMap; history: { question: string; answer: string }[]; latestAnswer: string; currentQuestion: string }) {
  return ask<Evaluation>([
    { role: "system", content: "You are conducting an adaptive academic defence. Return strict JSON only with target_concept, answer_quality (0-100), understanding_level (one of not_demonstrated, partial, independent, applied), mastery_updates, evidence_quote, explanation, detected_issue, misconception_status (one of persists, corrected, needs_check, none), next_difficulty, and next_question. Use this rubric: not_demonstrated means no usable explanation, partial means some correct reasoning with a gap, independent means a correct explanation without prompting, applied means correct reasoning in a new case. evidence_quote must be an exact short substring of the latest answer, or an empty string. If the answer is strong, increase difficulty and go deeper; if weak, ask a simpler clarifying question on the same concept. If an earlier misconception is corrected, mark it corrected rather than repeating it as a current conclusion. Address the student directly and use their words." },
    { role: "user", content: JSON.stringify(input) },
  ]);
}

export async function makeReport(input: { conceptMap: ConceptMap; history: HistoryItem[]; evaluations: Evaluation[] }) {
  return ask<Report>([
    { role: "system", content: "You are an assessment lead. Return strict JSON only with overall_mastery, concepts, strong, weak, misconception, recommendation, and rubric_note. For each concept return name, evidence_quote, explanation, next_step, misconception_status, tested, score, and level. If a concept was not tested, set tested false, score null, and level 'Insufficient data'. Do not invent evidence. Use the evaluation records to identify whether a misconception persists or was corrected. The final report must say that it is preliminary evidence from this defence and the teacher makes the final judgement." },
    { role: "user", content: JSON.stringify(input) },
  ]);
}

const levelScores = { not_demonstrated: 25, partial: 50, independent: 75, applied: 100 } as const;

function matchesConcept(name: string, target: string) {
  return name.trim().toLowerCase() === target.trim().toLowerCase() || name.toLowerCase().includes(target.toLowerCase()) || target.toLowerCase().includes(name.toLowerCase());
}

export function applyDeterministicScores(conceptMap: ConceptMap, evaluations: Evaluation[], report: Report): Report {
  const concepts = conceptMap.concepts.map((concept): ReportConcept => {
    const relevant = evaluations.filter((evaluation) => matchesConcept(concept.name, evaluation.target_concept));
    const latest = relevant[relevant.length - 1];
    if (!latest) return { name: concept.name, score: null, level: "Insufficient data", tested: false, evidence_quote: "", explanation: "This concept was not directly checked during the defence.", next_step: "Ask one focused question about this concept.", misconception_status: "none" };
    const score = Math.max(0, Math.min(100, Math.round(levelScores[latest.understanding_level] ?? latest.answer_quality)));
    const level = score >= 75 ? "Strong" : score >= 50 ? "Partial" : "Weak";
    return { name: concept.name, score, level, tested: true, evidence_quote: latest.evidence_quote, explanation: latest.explanation, next_step: latest.detected_issue || "Try one application question in a new context.", misconception_status: latest.misconception_status };
  });
  const tested = concepts.filter((concept) => concept.score !== null);
  const importance = (name: string) => conceptMap.concepts.find((concept) => concept.name === name)?.importance.toLowerCase() === "high" ? 2 : 1;
  const totalWeight = tested.reduce((sum, concept) => sum + importance(concept.name), 0);
  const overall = totalWeight ? Math.round(tested.reduce((sum, concept) => sum + (concept.score || 0) * importance(concept.name), 0) / totalWeight) : 0;
  return { ...report, overall_mastery: overall, concepts, strong: concepts.filter((concept) => concept.level === "Strong").map((concept) => concept.name), weak: concepts.filter((concept) => concept.level === "Weak").map((concept) => concept.name), rubric_note: "Preliminary evidence from this defence. Final judgement remains with the teacher." };
}
