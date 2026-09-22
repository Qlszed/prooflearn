import { NextResponse } from "next/server";
import { makeReport } from "@/lib/llm";

export async function POST(request: Request) {
  try {
    return NextResponse.json(await makeReport(await request.json()));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to create report" }, { status: 500 });
  }
}
