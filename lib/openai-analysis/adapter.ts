import OpenAI from "openai";
import type { AnalysisRequest, StructuredAnalysisOutput } from "@/lib/types";
import { createAnalysisPrompt } from "@/lib/prompts/analysis-prompt";
import { parseStructuredOutput, structuredAnalysisSchema } from "@/lib/openai-analysis/schema";
import { AnalysisServiceError, toAnalysisError } from "@/lib/openai-analysis/errors";
import type { EvidenceSource } from "@/lib/types";

const MAX_RETRIES = 2;

function getClient() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new AnalysisServiceError({
      code: "MISSING_API_KEY",
      message: "OPENAI_API_KEY が未設定です。環境変数を設定してください。",
      retryable: false,
      status: 500
    });
  }

  return new OpenAI({ apiKey });
}

export async function analyzeWithOpenAI(
  request: AnalysisRequest,
  sources: EvidenceSource[]
): Promise<StructuredAnalysisOutput> {
  const client = getClient();
  const input = createAnalysisPrompt(request, sources);

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      const response = await client.responses.create({
        model: "gpt-4.1-mini",
        input,
        text: {
          format: {
            type: "json_schema",
            name: "climate_factcheck_analysis",
            strict: true,
            schema: structuredAnalysisSchema
          }
        }
      });

      const outputText = response.output_text;
      if (!outputText) {
        throw new AnalysisServiceError({
          code: "INVALID_RESPONSE",
          message: "分析結果の形式が不正です。再試行してください。",
          retryable: true,
          status: 502
        });
      }

      const parsedJson = JSON.parse(outputText) as unknown;
      const parsed = parseStructuredOutput(parsedJson);

      if (!parsed) {
        throw new AnalysisServiceError({
          code: "INVALID_RESPONSE",
          message: "分析結果の形式が不正です。再試行してください。",
          retryable: true,
          status: 502
        });
      }

      return parsed;
    } catch (error) {
      const normalized = toAnalysisError(error);
      if (!normalized.info.retryable || attempt === MAX_RETRIES) {
        throw normalized;
      }
    }
  }

  throw new AnalysisServiceError({
    code: "UPSTREAM_ERROR",
    message: "分析に失敗しました。",
    retryable: false,
    status: 500
  });
}
