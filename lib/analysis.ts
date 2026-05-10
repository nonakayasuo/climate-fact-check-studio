import { evidenceSources } from "@/data/evidence-sources";
import { locateCitationCandidates } from "@/lib/citation-locator";
import { evaluateEvidenceGaps } from "@/lib/evidence-gap";
import { matchEvidenceForClaim, type MatcherInput } from "@/lib/evidence-matcher";
import { mergeActiveSources } from "@/lib/evidence-registry";
import { analyzeWithOpenAI } from "@/lib/openai-analysis/adapter";
import { appendEvidenceSummaryToMemo, mapToAnalysisResult } from "@/lib/openai-analysis/mapper";
import type {
  AnalysisRequest,
  AnalysisResult,
  ClaimEvidenceLink,
  EvidenceRegistryEntry,
  EvidenceSource,
  GapAlert
} from "@/lib/types";

export type CreateAnalysisOptions = {
  registeredSources?: EvidenceRegistryEntry[];
};

export async function createAnalysis(
  request: AnalysisRequest,
  options: CreateAnalysisOptions = {}
): Promise<AnalysisResult> {
  const registered = options.registeredSources ?? [];
  const seedRelevance = getRelevantSources(request.topic, request.body);
  const structured = await analyzeWithOpenAI(request, seedRelevance);
  const baseResult = mapToAnalysisResult(request, structured, seedRelevance);

  const claims = baseResult.claims.length
    ? baseResult.claims
    : fallbackClaims(request.body);

  const matcherCandidates = mergeActiveSources(evidenceSources, registered);
  const { claimEvidenceLinks, gapAlerts, prioritizedSources } = buildEvidenceContext(
    claims,
    request.topic,
    matcherCandidates,
    registered
  );

  const memo = appendEvidenceSummaryToMemo(baseResult.memo, claimEvidenceLinks, gapAlerts);

  return {
    ...baseResult,
    claims,
    sources: prioritizedSources.length ? prioritizedSources : baseResult.sources,
    memo,
    claimEvidenceLinks,
    gapAlerts
  };
}

function buildEvidenceContext(
  claims: string[],
  topic: AnalysisRequest["topic"],
  matcherCandidates: MatcherInput[],
  registered: EvidenceRegistryEntry[]
): {
  claimEvidenceLinks: ClaimEvidenceLink[];
  gapAlerts: GapAlert[];
  prioritizedSources: EvidenceSource[];
} {
  const claimEvidenceLinks: ClaimEvidenceLink[] = [];
  const gapInputs = claims.map((claimText, index) => {
    const claimId = `claim-${index + 1}`;
    const matches = matchEvidenceForClaim(claimText, topic, matcherCandidates);
    const links = matches.map<ClaimEvidenceLink>((match) => ({
      claimId,
      claimText,
      sourceId: match.sourceId,
      sourceTitle: match.source.name,
      sourceOwner: match.source.owner,
      sourceUrl: match.source.url,
      score: match.score,
      citations: locateCitationCandidates(claimText, match.source, match.matchedTokens)
    }));
    claimEvidenceLinks.push(...links);
    return { claimId, claimText, links };
  });

  const gapAlerts = evaluateEvidenceGaps(gapInputs, registered);

  const prioritizedSources = uniqueSources(
    claimEvidenceLinks.map((link) => ({
      name: link.sourceTitle,
      owner: link.sourceOwner,
      url: link.sourceUrl
    }))
  );

  return { claimEvidenceLinks, gapAlerts, prioritizedSources };
}

function uniqueSources(
  partials: Pick<EvidenceSource, "name" | "owner" | "url">[]
): EvidenceSource[] {
  const seen = new Set<string>();
  const result: EvidenceSource[] = [];
  for (const source of partials) {
    if (seen.has(source.url)) continue;
    seen.add(source.url);
    result.push({
      name: source.name,
      owner: source.owner,
      themes: [],
      note: "",
      url: source.url
    });
  }
  return result;
}

function fallbackClaims(body: string): string[] {
  return body
    .split(/[。！？\n]/)
    .map((sentence) => sentence.trim())
    .filter(Boolean)
    .slice(0, 3);
}

function getRelevantSources(topic: AnalysisRequest["topic"], text: string) {
  return evidenceSources
    .filter((source) => source.themes.includes(topic) || source.themes.some((theme) => text.includes(theme)))
    .slice(0, 4);
}
