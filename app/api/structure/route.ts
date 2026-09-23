import { NextResponse } from "next/server";
import { structureSubmission } from "@/lib/llm";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const conceptMap = await structureSubmission(body.subject, body.assignment, body.submission);
    const firstConcept = conceptMap.concepts?.[0]?.name || "the central idea";
    const claim = conceptMap.claims?.[0];
    const fallback = claim ? `You wrote, "${claim}". Explain what this means in the context of the assignment.` : `In the assignment, what does ${firstConcept} mean in your own words?`;
    return NextResponse.json({ conceptMap, firstQuestion: conceptMap.opening_question || fallback });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to analyse submission" }, { status: 500 });
  }
}
