import OpenAI from "openai";
import type { AnalysisError } from "@/lib/types";

export class AnalysisServiceError extends Error {
  constructor(public readonly info: AnalysisError) {
    super(info.message);
    this.name = "AnalysisServiceError";
  }
}

export function toAnalysisError(error: unknown): AnalysisServiceError {
  if (error instanceof AnalysisServiceError) return error;

  if (error instanceof OpenAI.APIConnectionTimeoutError) {
    return new AnalysisServiceError({
      code: "TIMEOUT",
      message: "OpenAI API の応答がタイムアウトしました。時間をおいて再試行してください。",
      retryable: true,
      status: 504
    });
  }

  if (error instanceof OpenAI.RateLimitError) {
    return new AnalysisServiceError({
      code: "RATE_LIMITED",
      message: "リクエストが集中しています。少し待ってから再試行してください。",
      retryable: true,
      status: 429
    });
  }

  if (error instanceof OpenAI.APIError) {
    return new AnalysisServiceError({
      code: "UPSTREAM_ERROR",
      message: "分析サービス側で一時的な問題が発生しました。再試行してください。",
      retryable: true,
      status: 502,
      details: `${error.status ?? "unknown"}:${error.message}`
    });
  }

  if (error instanceof Error) {
    return new AnalysisServiceError({
      code: "UPSTREAM_ERROR",
      message: "分析中に予期しないエラーが発生しました。",
      retryable: false,
      status: 500,
      details: error.message
    });
  }

  return new AnalysisServiceError({
    code: "UPSTREAM_ERROR",
    message: "分析中に不明なエラーが発生しました。",
    retryable: false,
    status: 500
  });
}
