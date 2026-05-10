import { NextResponse } from "next/server";
import { createAnalysis } from "@/lib/analysis";
import { AnalysisServiceError, toAnalysisError } from "@/lib/openai-analysis/errors";
import type { AnalysisRequest } from "@/lib/types";

export async function POST(request: Request) {
  const payload = (await request.json()) as Partial<AnalysisRequest>;

  if (!payload.body || !payload.topic || !payload.mediaType) {
    return NextResponse.json({ error: "body, topic, and mediaType are required." }, { status: 400 });
  }

  try {
    const analysis = await createAnalysis({
      title: payload.title ?? "",
      mediaType: payload.mediaType,
      topic: payload.topic,
      body: payload.body
    });

    return NextResponse.json(analysis);
  } catch (error) {
    const normalized = error instanceof AnalysisServiceError ? error : toAnalysisError(error);
    return NextResponse.json(
      {
        error: normalized.info.message,
        code: normalized.info.code,
        retryable: normalized.info.retryable
      },
      { status: normalized.info.status }
    );
  }
}
