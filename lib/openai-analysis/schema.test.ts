import { describe, expect, it } from "vitest";
import { parseStructuredOutput } from "./schema";

describe("parseStructuredOutput", () => {
  it("returns normalized structured output for valid payload", () => {
    const parsed = parseStructuredOutput({
      claims: ["A", "A", "B"],
      risks: [{ label: "断定が強い", reason: "断定語", suggestion: "緩和する" }],
      evidenceFocus: ["根拠1"],
      memo: "memo"
    });

    expect(parsed).not.toBeNull();
    expect(parsed?.claims).toEqual(["A", "A", "B"]);
    expect(parsed?.risks).toHaveLength(1);
  });

  it("returns null for invalid payload", () => {
    const parsed = parseStructuredOutput({
      claims: "not-array",
      risks: [],
      evidenceFocus: [],
      memo: "memo"
    });

    expect(parsed).toBeNull();
  });
});
