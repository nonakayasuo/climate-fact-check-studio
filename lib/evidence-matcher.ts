import type { EvidenceSource, Topic } from "@/lib/types";

export type ScoredEvidence = {
  sourceId: string;
  source: EvidenceSource;
  score: number;
  matchedTokens: string[];
};

const STOP_WORDS = new Set([
  "の",
  "が",
  "は",
  "を",
  "に",
  "へ",
  "と",
  "で",
  "や",
  "も",
  "から",
  "まで",
  "より",
  "this",
  "that",
  "the",
  "and",
  "or",
  "for",
  "of",
  "in",
  "to"
]);

const TOKEN_REGEX = /[\p{Script=Han}\p{Script=Katakana}A-Za-z0-9]{2,}/gu;

export function tokenize(text: string): string[] {
  if (!text) return [];
  const matches = text.match(TOKEN_REGEX) ?? [];
  return matches.map((token) => token.toLowerCase()).filter((token) => !STOP_WORDS.has(token));
}

function intersect(left: string[], right: Set<string>): string[] {
  const seen = new Set<string>();
  const overlap: string[] = [];
  for (const token of left) {
    if (right.has(token) && !seen.has(token)) {
      seen.add(token);
      overlap.push(token);
    }
  }
  return overlap;
}

function scoreThemeOverlap(claimText: string, themes: Topic[]): number {
  let score = 0;
  for (const theme of themes) {
    if (claimText.includes(theme)) score += 1;
  }
  return score;
}

export type MatcherInput = {
  source: EvidenceSource;
  sourceId: string;
};

export function matchEvidenceForClaim(
  claimText: string,
  topic: Topic,
  candidates: MatcherInput[],
  options?: { topN?: number }
): ScoredEvidence[] {
  const topN = options?.topN ?? 3;
  const claimTokens = tokenize(claimText);
  const claimTokenSet = new Set(claimTokens);

  const scored = candidates.map<ScoredEvidence>(({ source, sourceId }) => {
    const sourceText = `${source.name} ${source.note}`;
    const sourceTokens = tokenize(sourceText);
    const matchedTokens = intersect(sourceTokens, claimTokenSet);
    const tokenScore = matchedTokens.length;
    const themeBonus = source.themes.includes(topic) ? 2 : 0;
    const themeMentionBonus = scoreThemeOverlap(claimText, source.themes);
    return {
      sourceId,
      source,
      score: tokenScore + themeBonus + themeMentionBonus,
      matchedTokens
    };
  });

  return scored
    .filter((entry) => entry.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.source.name.localeCompare(b.source.name);
    })
    .slice(0, topN);
}
