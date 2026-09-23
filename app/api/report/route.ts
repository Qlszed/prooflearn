import { NextResponse } from "next/server";
import { applyDeterministicScores, makeReport } from "@/lib/llm";

export async function POST(request: Request) {
  try {
    const input = await request.json();
    const report = await makeReport(input);
    return NextResponse.json(applyDeterministicScores(input.conceptMap, input.evaluations, report));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to create report" }, { status: 500 });
  }
}
