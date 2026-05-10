import type { CitationCandidate, EvidenceSource } from "@/lib/types";
import { tokenize } from "@/lib/evidence-matcher";

const CONFIDENCE_HIGH_THRESHOLD = 0.4;
const MAX_CANDIDATES = 2;

export function splitSentences(text: string): string[] {
  if (!text) return [];
  return text
    .split(/(?<=[。！？!?\n])/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

export function locateCitationCandidates(
  claimText: string,
  source: EvidenceSource,
  matchedTokens: string[]
): CitationCandidate[] {
  const sentencePool = [
    ...splitSentences(source.note),
    source.name,
    `${source.owner} の公開情報`
  ].filter(Boolean);

  const claimTokens = new Set(tokenize(claimText));
  const tokenWeight = matchedTokens.length || 1;

  const scored = sentencePool.map((sentence) => {
    const sentenceTokens = tokenize(sentence);
    const overlap = sentenceTokens.filter((token) => claimTokens.has(token));
    const matchRatio = sentenceTokens.length === 0 ? 0 : overlap.length / sentenceTokens.length;
    const matchedTokenRatio = overlap.length / tokenWeight;
    const confidence = clamp01(matchRatio * 0.6 + matchedTokenRatio * 0.4);
    return { sentence, confidence };
  });

  return scored
    .filter((candidate) => candidate.sentence.length > 0)
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, MAX_CANDIDATES)
    .map(({ sentence, confidence }) => ({
      text: sentence,
      confidence: Number(confidence.toFixed(2)),
      estimated: confidence < CONFIDENCE_HIGH_THRESHOLD
    }));
}

function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}
