import { NextResponse } from "next/server";
import { createAnalysis } from "@/lib/analysis";
import { EvidenceSourceRepository } from "@/lib/evidence-source-repository";
import { AnalysisServiceError, toAnalysisError } from "@/lib/openai-analysis/errors";
import type {
  AnalysisRequest,
  EvidenceRegistryApiError,
  EvidenceRegistryEntry
} from "@/lib/types";

type AnalyzePayload = Partial<AnalysisRequest> & {
  registeredSources?: EvidenceRegistryEntry[];
};

async function resolveRegisteredSources(
  payload: AnalyzePayload
): Promise<EvidenceRegistryEntry[]> {
  if (Array.isArray(payload.registeredSources)) {
    return payload.registeredSources;
  }

  try {
    const repository = new EvidenceSourceRepository();
    return await repository.list();
  } catch (error) {
    const apiError = (error as { apiError?: EvidenceRegistryApiError }).apiError;
    if (apiError && (apiError.code === "CONFIG_MISSING" || apiError.code === "DB_UNAVAILABLE")) {
      return [];
    }
    throw error;
  }
}

export async function POST(request: Request) {
  const payload = (await request.json()) as AnalyzePayload;

  if (!payload.body || !payload.topic || !payload.mediaType) {
    return NextResponse.json({ error: "body, topic, and mediaType are required." }, { status: 400 });
  }

  try {
    const registeredSources = await resolveRegisteredSources(payload);

    const analysis = await createAnalysis(
      {
        title: payload.title ?? "",
        mediaType: payload.mediaType,
        topic: payload.topic,
        body: payload.body
      },
      { registeredSources }
    );

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
