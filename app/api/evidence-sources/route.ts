import { NextResponse } from "next/server";
import {
  EvidenceSourceRepository,
  getApiError
} from "@/lib/evidence-source-repository";
import type { EvidenceRegistryInput } from "@/lib/types";

function statusFromError(code: string): number {
  switch (code) {
    case "VALIDATION_ERROR":
    case "EVIDENCE_INVALID_URL":
      return 400;
    case "EVIDENCE_DUPLICATE":
      return 409;
    case "EVIDENCE_NOT_FOUND":
      return 404;
    case "SCHEMA_MISMATCH":
      return 422;
    case "DB_UNAVAILABLE":
      return 503;
    default:
      return 500;
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const includeInactive = url.searchParams.get("includeInactive") === "1";
    const repository = new EvidenceSourceRepository();
    const sources = await repository.list({ includeInactive });
    return NextResponse.json({ sources });
  } catch (error) {
    const apiError = getApiError(error);
    return NextResponse.json(apiError, { status: statusFromError(apiError.code) });
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as { source?: EvidenceRegistryInput };
    if (!payload.source) {
      return NextResponse.json(
        { code: "VALIDATION_ERROR", message: "source は必須です。", retryable: false },
        { status: 400 }
      );
    }

    const repository = new EvidenceSourceRepository();
    const source = await repository.create(payload.source);
    return NextResponse.json({ source }, { status: 201 });
  } catch (error) {
    const apiError = getApiError(error);
    return NextResponse.json(apiError, { status: statusFromError(apiError.code) });
  }
}
