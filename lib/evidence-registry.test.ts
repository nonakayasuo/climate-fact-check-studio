import { describe, expect, it } from "vitest";
import {
  findDuplicate,
  mergeActiveSources,
  normalizeUrl,
  validateRegistryInput
} from "./evidence-registry";
import type { EvidenceRegistryEntry, EvidenceSource } from "./types";

const baseEntry: EvidenceRegistryEntry = {
  id: "entry-1",
  title: "気象庁 観測データ",
  owner: "気象庁",
  url: "https://www.data.jma.go.jp/cpdinfo/ccj/index.html?utm_source=test",
  source_type: "report",
  themes: ["猛暑"],
  note: "観測値",
  status: "active",
  registered_at: "2026-05-10T00:00:00Z",
  updated_at: "2026-05-10T00:00:00Z"
};

describe("normalizeUrl", () => {
  it("strips tracking parameters and lowercases hostname", () => {
    expect(normalizeUrl("https://Example.org/path/?utm_source=x&kept=1")).toBe(
      "https://example.org/path/?kept=1"
    );
  });

  it("returns null for non-http URLs", () => {
    expect(normalizeUrl("ftp://example.org/")).toBeNull();
    expect(normalizeUrl("not a url")).toBeNull();
  });
});

describe("validateRegistryInput", () => {
  it("rejects missing required fields", () => {
    const result = validateRegistryInput({
      title: "",
      owner: "気象庁",
      url: "https://example.org",
      source_type: "url",
      themes: ["猛暑"],
      note: ""
    });
    expect(result.ok).toBe(false);
  });

  it("rejects invalid URL", () => {
    const result = validateRegistryInput({
      title: "テスト",
      owner: "気象庁",
      url: "not-a-url",
      source_type: "url",
      themes: ["猛暑"],
      note: ""
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("EVIDENCE_INVALID_URL");
  });

  it("accepts valid input and exposes normalized url", () => {
    const result = validateRegistryInput({
      title: "テスト",
      owner: "気象庁",
      url: "https://Example.org/?utm_source=x",
      source_type: "url",
      themes: ["猛暑"],
      note: ""
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.normalized_url).toBe("https://example.org/");
  });
});

describe("findDuplicate", () => {
  it("matches against normalized URL", () => {
    const duplicate = findDuplicate([baseEntry], "https://www.data.jma.go.jp/cpdinfo/ccj/index.html");
    expect(duplicate?.id).toBe("entry-1");
  });

  it("ignores entry by id when provided", () => {
    const duplicate = findDuplicate(
      [baseEntry],
      "https://www.data.jma.go.jp/cpdinfo/ccj/index.html",
      "entry-1"
    );
    expect(duplicate).toBeNull();
  });
});

describe("mergeActiveSources", () => {
  const seed: EvidenceSource[] = [
    {
      name: "Seed",
      owner: "Owner",
      themes: ["猛暑"],
      note: "note",
      url: "https://seed.example.org"
    }
  ];

  it("includes only active registered entries", () => {
    const merged = mergeActiveSources(seed, [
      baseEntry,
      { ...baseEntry, id: "entry-2", status: "inactive", url: "https://other.example.org" }
    ]);
    const ids = merged.map((item) => item.sourceId);
    expect(ids).toEqual([
      "seed:0:https://seed.example.org",
      "registry:entry-1"
    ]);
  });
});
