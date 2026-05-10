import { NextResponse } from "next/server";
import { getApiError, ResearchLogRepository } from "@/lib/research-log-repository";
import type { ResearchLogInput } from "@/lib/types";

export async function GET() {
  try {
    const repository = new ResearchLogRepository();
    const logs = await repository.list();
    return NextResponse.json({ logs });
  } catch (error) {
    const apiError = getApiError(error);
    return NextResponse.json(apiError, { status: apiError.retryable ? 503 : 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as { log?: ResearchLogInput };
    if (!payload.log) {
      return NextResponse.json(
        { code: "VALIDATION_ERROR", message: "log は必須です。", retryable: false },
        { status: 400 }
      );
    }

    const repository = new ResearchLogRepository();
    const log = await repository.create(payload.log);
    return NextResponse.json({ log }, { status: 201 });
  } catch (error) {
    const apiError = getApiError(error);
    const status = apiError.code === "SCHEMA_MISMATCH" ? 422 : apiError.retryable ? 503 : 500;
    return NextResponse.json(apiError, { status });
  }
}

export async function DELETE(request: Request) {
  try {
    const payload = (await request.json()) as { confirmToken?: string };
    if (!payload.confirmToken) {
      return NextResponse.json(
        { code: "DELETE_CONFIRMATION_REQUIRED", message: "confirmToken は必須です。", retryable: false },
        { status: 400 }
      );
    }

    const repository = new ResearchLogRepository();
    const result = await repository.purgeAll(payload.confirmToken);
    return NextResponse.json(result);
  } catch (error) {
    const apiError = getApiError(error);
    const status = apiError.code === "DELETE_CONFIRMATION_REQUIRED" ? 400 : apiError.retryable ? 503 : 500;
    return NextResponse.json(apiError, { status });
  }
}

