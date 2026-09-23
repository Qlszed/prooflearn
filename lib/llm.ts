type ChatMessage = { role: "system" | "user"; content: string };

const endpoint = process.env.LLM_BASE_URL || "https://api.openai.com/v1/chat/completions";
const model = process.env.LLM_MODEL || "gpt-4o-mini";

function languageName(language: string) {
  return language === "ru" ? "Russian" : language === "kk" ? "Kazakh" : "English";
}

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

export async function structureSubmission(subject: string, assignment: string, submission: string, language = "en") {
  return ask<ConceptMap>([
    { role: "system", content: `You are an assessment designer. Return strict JSON only. Given a subject, assignment prompt, and student's submitted answer, extract key concepts with importance (high, medium, low), the student's specific claims, expected reasoning, plausible misconceptions, and one opening_question. The opening question must reference a specific claim or phrase from the student's answer and use the language of the assignment. All concept names, claims, reasoning, misconceptions, and the opening question must be written in ${languageName(language)}. Use the exact keys concepts, claims, expected_reasoning, possible_misconceptions, opening_question. Never ask a generic question such as 'what is this concept?'` },
    { role: "user", content: JSON.stringify({ subject, assignment, submission }) },
  ]);
}

export async function evaluateAnswer(input: { subject: string; assignment: string; submission: string; language?: string; conceptMap: ConceptMap; history: { question: string; answer: string }[]; latestAnswer: string; currentQuestion: string }) {
  return ask<Evaluation>([
    { role: "system", content: `You are conducting an adaptive academic defence. Return strict JSON only with target_concept, answer_quality (0-100), understanding_level (one of not_demonstrated, partial, independent, applied), mastery_updates, evidence_quote, explanation, detected_issue, misconception_status (one of persists, corrected, needs_check, none), next_difficulty, and next_question. Write all human-readable output in ${languageName(input.language || "en")}. target_concept must be exactly one of the concept names from conceptMap, and mastery_updates must use those exact names. Use this rubric: not_demonstrated means no usable explanation, partial means some correct reasoning with a gap, independent means a correct explanation without prompting, applied means correct reasoning in a new case. evidence_quote must be an exact short substring of the latest answer, or an empty string. If the answer is strong, increase difficulty and go deeper; if weak, ask a simpler clarifying question on the same concept. If an earlier misconception is corrected, mark it corrected rather than repeating it as a current conclusion. Address the student directly and use their words.` },
    { role: "user", content: JSON.stringify(input) },
  ]);
}

export async function makeReport(input: { language?: string; conceptMap: ConceptMap; history: HistoryItem[]; evaluations: Evaluation[] }) {
  return ask<Report>([
    { role: "system", content: `You are an assessment lead. Return strict JSON only with overall_mastery, concepts, strong, weak, misconception, recommendation, and rubric_note. Write all human-readable output in ${languageName(input.language || "en")}. For each concept return name, evidence_quote, explanation, next_step, misconception_status, tested, score, and level. If a concept was not tested, set tested false, score null, and level 'Insufficient data'. Do not invent evidence. Use the evaluation records to identify whether a misconception persists or was corrected. The final report must say that it is preliminary evidence from this defence and the teacher makes the final judgement.` },
    { role: "user", content: JSON.stringify(input) },
  ]);
}

const levelScores = { not_demonstrated: 25, partial: 50, independent: 75, applied: 100 } as const;

function matchesConcept(name: string, target: string) {
  const normalize = (value: string) => value.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();
  const left = normalize(name);
  const right = normalize(target);
  if (!left || !right) return false;
  if (left === right || left.includes(right) || right.includes(left)) return true;
  const leftWords = new Set(left.split(" ").filter((word) => word.length > 3));
  const shared = right.split(" ").filter((word) => word.length > 3 && leftWords.has(word));
  return shared.length > 0;
}

function displayConceptName(name: string) {
  return name.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim().replace(/(^|\s)\S/g, (letter) => letter.toUpperCase());
}

function isNoIssue(value: string) {
  return ["none", "no issue", "no issue detected", "нет", "нет.", "жоқ", "жоқ.", "none detected"].includes(value.toLowerCase().trim());
}

function fallbackNextStep(language: string) {
  if (language === "ru") return "Попросите ученика применить эту идею к новому примеру.";
  if (language === "kk") return "Оқушыдан осы түсінікті жаңа мысалға қолдануды сұраңыз.";
  return "Ask the student to apply this idea to a new example.";
}

export function applyDeterministicScores(conceptMap: ConceptMap, evaluations: Evaluation[] = [], report: Report, language = "en"): Report {
  const sourceConceptsRaw = Array.isArray(conceptMap?.concepts) ? conceptMap.concepts : [];
  const sourceConcepts = Array.from(new Map(sourceConceptsRaw.map((concept) => [concept.name.toLowerCase().trim(), concept])).values());
  const validEvaluations = evaluations.filter((evaluation) => evaluation && (evaluation.target_concept || Object.keys(evaluation.mastery_updates || {}).length));
  const relevantFor = (concept: { name: string }) => validEvaluations.filter((evaluation) => {
    if (evaluation.target_concept && matchesConcept(concept.name, evaluation.target_concept)) return true;
    return Object.keys(evaluation.mastery_updates || {}).some((name) => matchesConcept(concept.name, name));
  });
  const scoreFor = (evaluation: Evaluation) => {
    const level = String(evaluation.understanding_level || "").toLowerCase().trim() as keyof typeof levelScores;
    const raw = levelScores[level] ?? Number(evaluation.answer_quality);
    return Math.max(0, Math.min(100, Math.round(Number.isFinite(raw) ? raw : 0)));
  };
  let concepts = sourceConcepts.map((concept): ReportConcept => {
    const relevant = relevantFor(concept);
    const latest = relevant[relevant.length - 1];
    if (!latest) return { name: displayConceptName(concept.name), score: null, level: "Insufficient data", tested: false, evidence_quote: "", explanation: "This concept was not directly checked during the defence.", next_step: "Ask one focused question about this concept.", misconception_status: "none" };
    const score = scoreFor(latest);
    const level = score >= 75 ? "Strong" : score >= 50 ? "Partial" : "Weak";
    const nextStep = latest.detected_issue && !isNoIssue(latest.detected_issue) ? latest.detected_issue : fallbackNextStep(language);
    return { name: displayConceptName(concept.name), score, level, tested: true, evidence_quote: latest.evidence_quote, explanation: latest.explanation, next_step: nextStep, misconception_status: latest.misconception_status };
  });
  if (!concepts.some((concept) => concept.score !== null) && validEvaluations.length) {
    const latestByConcept = new Map<string, Evaluation>();
    validEvaluations.forEach((evaluation, index) => {
      const rawName = evaluation.target_concept || Object.keys(evaluation.mastery_updates || {})[0] || `Checked concept ${index + 1}`;
      latestByConcept.set(rawName.toLowerCase().trim(), evaluation);
    });
    concepts = Array.from(latestByConcept.values()).map((evaluation, index) => {
      const score = scoreFor(evaluation);
      const nextStep = evaluation.detected_issue && !isNoIssue(evaluation.detected_issue) ? evaluation.detected_issue : fallbackNextStep(language);
      return { name: displayConceptName(evaluation.target_concept || Object.keys(evaluation.mastery_updates || {})[0] || `Checked concept ${index + 1}`), score, level: score >= 75 ? "Strong" : score >= 50 ? "Partial" : "Weak", tested: true, evidence_quote: evaluation.evidence_quote || "", explanation: evaluation.explanation || "This concept was checked during the defence.", next_step: nextStep, misconception_status: evaluation.misconception_status || "none" };
    });
  }
  const tested = concepts.filter((concept) => concept.score !== null);
  const importance = (name: string) => sourceConcepts.find((concept) => concept.name === name)?.importance.toLowerCase() === "high" ? 2 : 1;
  const totalWeight = tested.reduce((sum, concept) => sum + importance(concept.name), 0);
  const overall = totalWeight
    ? Math.round(tested.reduce((sum, concept) => sum + (concept.score || 0) * importance(concept.name), 0) / totalWeight)
    : validEvaluations.length ? Math.round(validEvaluations.reduce((sum, evaluation) => sum + scoreFor(evaluation), 0) / validEvaluations.length) : 0;
  return { ...report, overall_mastery: overall, concepts, strong: concepts.filter((concept) => concept.level === "Strong").map((concept) => concept.name), weak: concepts.filter((concept) => concept.level === "Weak").map((concept) => concept.name), rubric_note: "Preliminary evidence from this defence. Final judgement remains with the teacher." };
}
