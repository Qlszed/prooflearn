import { NextResponse } from "next/server";
import { evaluateAnswer } from "@/lib/llm";

export async function POST(request: Request) {
  try {
    const input = await request.json();
    const evaluation = await evaluateAnswer(input);
    if (evaluation.evidence_quote && !input.latestAnswer.toLowerCase().includes(evaluation.evidence_quote.toLowerCase())) evaluation.evidence_quote = "";
    return NextResponse.json(evaluation);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to evaluate answer" }, { status: 500 });
  }
}
