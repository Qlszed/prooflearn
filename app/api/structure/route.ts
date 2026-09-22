import { NextResponse } from "next/server";
import { structureSubmission } from "@/lib/llm";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const conceptMap = await structureSubmission(body.subject, body.assignment, body.submission);
    const firstConcept = conceptMap.concepts?.[0]?.name || "the central idea";
    return NextResponse.json({ conceptMap, firstQuestion: `In your answer, you mention ${firstConcept}. Explain how it works and why it matters here.` });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to analyse submission" }, { status: 500 });
  }
}
