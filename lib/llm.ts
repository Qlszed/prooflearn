type ChatMessage = { role: "system" | "user"; content: string };

const endpoint = process.env.LLM_BASE_URL || "https://api.openai.com/v1/chat/completions";
const model = process.env.LLM_MODEL || "gpt-5.6-luna";

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
};

export type Evaluation = {
  answer_quality: number;
  mastery_updates: Record<string, number>;
  detected_issue: string;
  next_difficulty: string;
  next_question: string;
};

export type Report = {
  overall_mastery: number;
  concepts: { name: string; score: number; level: string }[];
  strong: string[];
  weak: string[];
  misconception: string;
  recommendation: string;
};

export async function structureSubmission(subject: string, assignment: string, submission: string) {
  return ask<ConceptMap>([
    { role: "system", content: "You are an assessment designer. Return strict JSON only. Given a subject, assignment prompt, and student's submitted answer, extract key concepts with importance (high, medium, low), the student's specific claims, expected reasoning, and plausible misconceptions. Use the exact keys concepts, claims, expected_reasoning, possible_misconceptions." },
    { role: "user", content: JSON.stringify({ subject, assignment, submission }) },
  ]);
}

export async function evaluateAnswer(input: { subject: string; assignment: string; submission: string; conceptMap: ConceptMap; history: { question: string; answer: string }[]; latestAnswer: string; currentQuestion: string }) {
  return ask<Evaluation>([
    { role: "system", content: "You are conducting an adaptive academic defence. Return strict JSON only with answer_quality (0-100), mastery_updates (concept name to score), detected_issue, next_difficulty, and next_question. Evaluate the latest answer against the targeted concept. If the answer is strong, increase difficulty and go deeper; if weak, ask a simpler clarifying question on the same concept. Address the student directly and refer to their words when useful." },
    { role: "user", content: JSON.stringify(input) },
  ]);
}

export async function makeReport(input: { conceptMap: ConceptMap; history: { question: string; answer: string }[]; updates: Record<string, number>[] }) {
  return ask<Report>([
    { role: "system", content: "You are an assessment lead. Return strict JSON only with overall_mastery (0-100), concepts (name, score, level Strong/Partial/Weak), strong, weak, misconception, and recommendation. Aggregate scores weighted by importance and describe one clearest misconception." },
    { role: "user", content: JSON.stringify(input) },
  ]);
}
