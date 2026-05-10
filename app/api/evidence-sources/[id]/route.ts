import { NextResponse } from "next/server";
import {
  EvidenceSourceRepository,
  getApiError
} from "@/lib/evidence-source-repository";
import type { EvidenceSourceStatus } from "@/lib/types";

const ALLOWED_STATUS: EvidenceSourceStatus[] = ["active", "inactive"];

function statusFromError(code: string): number {
  switch (code) {
    case "VALIDATION_ERROR":
      return 400;
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

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json(
        { code: "VALIDATION_ERROR", message: "id は必須です。", retryable: false },
        { status: 400 }
      );
    }

    const payload = (await request.json()) as { status?: EvidenceSourceStatus };
    if (!payload.status || !ALLOWED_STATUS.includes(payload.status)) {
      return NextResponse.json(
        {
          code: "VALIDATION_ERROR",
          message: "status は active または inactive を指定してください。",
          retryable: false
        },
        { status: 400 }
      );
    }

    const repository = new EvidenceSourceRepository();
    const source = await repository.updateStatus(id, payload.status);
    return NextResponse.json({ source });
  } catch (error) {
    const apiError = getApiError(error);
    return NextResponse.json(apiError, { status: statusFromError(apiError.code) });
  }
}
