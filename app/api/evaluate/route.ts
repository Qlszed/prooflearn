import { NextResponse } from "next/server";
import { evaluateAnswer } from "@/lib/llm";

export async function POST(request: Request) {
  try {
    const evaluation = await evaluateAnswer(await request.json());
    return NextResponse.json(evaluation);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to evaluate answer" }, { status: 500 });
  }
}
