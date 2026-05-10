import { describe, expect, it } from "vitest";
import { evaluateEvidenceGaps, evaluateGapForClaim } from "./evidence-gap";
import type { ClaimEvidenceLink, EvidenceRegistryEntry } from "./types";

const sampleLink: ClaimEvidenceLink = {
  claimId: "claim-1",
  claimText: "主張",
  sourceId: "registry:abc",
  sourceTitle: "資料",
  sourceOwner: "出典",
  sourceUrl: "https://example.org",
  score: 5,
  citations: [{ text: "根拠文", confidence: 0.8, estimated: false }]
};

const inactiveOnlyRegistry: EvidenceRegistryEntry[] = [
  {
    id: "x",
    title: "停止中資料",
    owner: "出典",
    url: "https://example.org/inactive",
    source_type: "url",
    themes: ["猛暑"],
    note: "",
    status: "inactive",
    registered_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z"
  }
];

describe("evaluateGapForClaim", () => {
  it("flags no_source when no links exist and no inactive registry", () => {
    const alert = evaluateGapForClaim({ claimId: "c", claimText: "x", links: [] }, []);
    expect(alert?.reason).toBe("no_source");
    expect(alert?.severity).toBe("high");
  });

  it("flags inactive_only when registry has only inactive entries", () => {
    const alert = evaluateGapForClaim(
      { claimId: "c", claimText: "x", links: [] },
      inactiveOnlyRegistry
    );
    expect(alert?.reason).toBe("inactive_only");
  });

  it("flags low_confidence_only when only estimated citations exist", () => {
    const alert = evaluateGapForClaim(
      {
        claimId: "c",
        claimText: "x",
        links: [
          {
            ...sampleLink,
            citations: [{ text: "曖昧", confidence: 0.2, estimated: true }]
          }
        ]
      },
      []
    );
    expect(alert?.reason).toBe("low_confidence_only");
    expect(alert?.severity).toBe("medium");
  });

  it("returns null when at least one citation is high-confidence", () => {
    const alert = evaluateGapForClaim(
      { claimId: "c", claimText: "x", links: [sampleLink] },
      []
    );
    expect(alert).toBeNull();
  });
});

describe("evaluateEvidenceGaps", () => {
  it("orders alerts by severity and priority desc", () => {
    const alerts = evaluateEvidenceGaps(
      [
        { claimId: "c1", claimText: "low", links: [] },
        {
          claimId: "c2",
          claimText: "medium",
          links: [
            {
              ...sampleLink,
              claimId: "c2",
              citations: [{ text: "ぼんやり", confidence: 0.1, estimated: true }]
            }
          ]
        }
      ],
      []
    );
    expect(alerts[0]?.claimText).toBe("low");
    expect(alerts[1]?.claimText).toBe("medium");
  });

  it("never returns severity that hints at verdict", () => {
    const alerts = evaluateEvidenceGaps([{ claimId: "c", claimText: "x", links: [] }], []);
    expect(alerts.every((alert) => ["low", "medium", "high"].includes(alert.severity))).toBe(true);
  });
});
