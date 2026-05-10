import type {
  ClaimEvidenceLink,
  EvidenceRegistryEntry,
  GapAlert,
  GapAlertReason
} from "@/lib/types";

export type GapEvaluationInput = {
  claimId: string;
  claimText: string;
  links: ClaimEvidenceLink[];
};

const GUIDANCE_BY_REASON: Record<GapAlertReason, string> = {
  no_source:
    "関連資料候補が見つかりませんでした。一次情報の追加取材または資料登録を検討し、断定表現は避けてください。",
  low_confidence_only:
    "参照箇所が推定のみです。出典原文で該当箇所を必ず確認し、必要に応じて表現を緩和してください。",
  inactive_only:
    "有効な根拠資料がありません。無効化された資料以外の最新情報源を追加してください。"
};

const SEVERITY_PRIORITY: Record<GapAlert["severity"], number> = {
  high: 3,
  medium: 2,
  low: 1
};

export function evaluateGapForClaim(
  claim: GapEvaluationInput,
  registeredEntries: EvidenceRegistryEntry[]
): GapAlert | null {
  if (claim.links.length === 0) {
    const hasInactiveOnly = registeredEntries.some((entry) => entry.status === "inactive");
    const reason: GapAlertReason = hasInactiveOnly ? "inactive_only" : "no_source";
    return buildAlert(claim, reason, "high");
  }

  const allEstimated = claim.links.every((link) =>
    link.citations.length > 0 && link.citations.every((citation) => citation.estimated)
  );
  const hasNoCitation = claim.links.every((link) => link.citations.length === 0);

  if (hasNoCitation) {
    return buildAlert(claim, "low_confidence_only", "medium");
  }

  if (allEstimated) {
    return buildAlert(claim, "low_confidence_only", "medium");
  }

  return null;
}

export function evaluateEvidenceGaps(
  claims: GapEvaluationInput[],
  registeredEntries: EvidenceRegistryEntry[]
): GapAlert[] {
  const alerts = claims
    .map((claim) => evaluateGapForClaim(claim, registeredEntries))
    .filter((alert): alert is GapAlert => alert !== null);

  return alerts.sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority;
    return SEVERITY_PRIORITY[b.severity] - SEVERITY_PRIORITY[a.severity];
  });
}

function buildAlert(
  claim: GapEvaluationInput,
  reason: GapAlertReason,
  severity: GapAlert["severity"]
): GapAlert {
  return {
    claimId: claim.claimId,
    claimText: claim.claimText,
    severity,
    priority: SEVERITY_PRIORITY[severity],
    reason,
    guidance: GUIDANCE_BY_REASON[reason]
  };
}
