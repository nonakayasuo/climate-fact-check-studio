import { evidenceSources } from "@/data/evidence-sources";
import { analyzeWithOpenAI } from "@/lib/openai-analysis/adapter";
import { mapToAnalysisResult } from "@/lib/openai-analysis/mapper";
import type { AnalysisRequest, AnalysisResult } from "@/lib/types";

export async function createAnalysis(request: AnalysisRequest): Promise<AnalysisResult> {
  const sources = getRelevantSources(request.topic, request.body);
  const structured = await analyzeWithOpenAI(request, sources);
  const mapped = mapToAnalysisResult(request, structured, sources);

  if (mapped.claims.length) return mapped;

  const fallbackClaims = request.body
    .split(/[。！？\n]/)
    .map((sentence) => sentence.trim())
    .filter(Boolean)
    .slice(0, 3);

  return {
    ...mapped,
    claims: fallbackClaims
  };
}

function getRelevantSources(topic: AnalysisRequest["topic"], text: string) {
  return evidenceSources
    .filter((source) => source.themes.includes(topic) || source.themes.some((theme) => text.includes(theme)))
    .slice(0, 4);
}
